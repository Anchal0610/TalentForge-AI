import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ocrService } from '@/lib/ocr';
import { imagekitService } from '@/lib/imagekit';
import { mistralService } from '@/lib/mistral';
import { dbManager } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const jobDescription = formData.get('jobDescription') as string | null;
    const email = formData.get('email') as string | null;

    if (!file || !jobDescription) {
      return NextResponse.json({ error: 'Missing file or job description' }, { status: 400 });
    }

    // 1. Create a temp file path and write buffer
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempFilePath = path.join(tempDir, file.name);
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(tempFilePath, fileBuffer);

    let rawText = '';
    let fileUrl = null;

    try {
      // 2. Local OCR/Text Extraction
      rawText = await ocrService.extractText(tempFilePath);
      
      // 3. Optional ImageKit Upload
      if (imagekitService.isEnabled()) {
        const url = await imagekitService.uploadPdf(fileBuffer, file.name);
        if (url) fileUrl = url;
      }
    } finally {
      // 4. Always cleanup temp file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }

    // 5. Keyword Overlap scoring
    const resLower = rawText.toLowerCase();
    const jdLower = jobDescription.toLowerCase();
    
    const wordRegex = /\b[a-zA-Z]{4,15}\b/g;
    const jdWords = new Set(jdLower.match(wordRegex) || []);
    const resWords = new Set(resLower.match(wordRegex) || []);

    const stopwords = new Set([
      'about', 'above', 'after', 'again', 'against', 'along', 'already', 'also', 
      'their', 'there', 'these', 'those', 'which', 'while', 'would', 'should', 'could'
    ]);

    // Subtract stopwords from JD keywords
    const jdKeywords = new Set([...jdWords].filter(x => !stopwords.has(x)));
    const matchedKeywords = new Set([...jdKeywords].filter(x => resWords.has(x)));
    
    let overlapPercentage = 0.0;
    if (jdKeywords.size > 0) {
      overlapPercentage = Math.round((matchedKeywords.size / jdKeywords.size) * 10000) / 100;
    }

    // 6. Mistral Parser structured call
    const prompt = `
    Analyze the candidate's resume and job description. Provide structural metrics:
    1. ATS compatibility score out of 100 (consider formatting, phrasing, and match).
    2. Extracted skills.
    3. Work experience summary.
    4. Key projects.
    5. Education details.
    6. Candidate strengths.
    7. Clear suggestions for improvements to make the resume match the job description better.
    
    Resume text:
    ${rawText.slice(0, 4000)}
    
    Job description:
    ${jobDescription.slice(0, 2000)}
    `;

    const systemInstruction = "You are an expert HR Executive and ATS resume grading system. Provide strict JSON structure.";
    
    const insights = await mistralService.generateStructuredCompletion(
      prompt,
      systemInstruction,
      'ResumeInsights'
    );

    const aiScore = insights.ats_score || 70;
    const weightedScore = Math.round((aiScore * 0.7 + overlapPercentage * 0.3) * 10) / 10;
    const finalScore = Math.min(weightedScore, 100);

    const results = {
      ats_score: finalScore,
      skills_extracted: insights.skills_extracted || [],
      experience_summary: insights.experience_summary || 'Work history summary...',
      projects: insights.projects || [],
      education: insights.education || [],
      strengths: insights.strengths || [],
      weaknesses_improvements: insights.weaknesses_improvements || [],
      overlap_percentage: overlapPercentage,
      file_url: fileUrl
    };

    // 7. Save to Database
    if (email) {
      try {
        let user = await dbManager.getUser(email);
        if (!user) {
          user = await dbManager.saveUser(
            email.split('@')[0],
            email,
            '',
            0
          );
        }
        if (user.id) {
          await dbManager.saveResume(
            user.id,
            file.name,
            rawText,
            finalScore,
            fileUrl || undefined
          );
        }
      } catch (dbErr) {
        console.error('Failed to save resume logs to database:', dbErr);
      }
    }

    return NextResponse.json(results);
  } catch (err) {
    console.error('ATS Diagnostic endpoint failed:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
