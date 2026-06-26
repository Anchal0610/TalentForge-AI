import { NextResponse } from 'next/server';
import { mistralService } from '@/lib/mistral';

export async function POST(request: Request) {
  try {
    const { question, candidateResponse } = await request.json();

    if (!question || !candidateResponse) {
      return NextResponse.json({ error: 'Missing question or response' }, { status: 400 });
    }

    const prompt = `
    Question: ${question}
    Candidate Response: ${candidateResponse}
    
    Evaluate the response on:
    1. Score out of 100.
    2. Missing keywords or technical concepts.
    3. How to improve the answer.
    Output a JSON object with keys: "score", "missing_keywords", "improvements".
    `;

    const systemInstruction = "You are a technical interviewer grading answers. Output your evaluation in JSON format.";

    const evaluation = await mistralService.generateStructuredCompletion(
      prompt,
      systemInstruction,
      'InterviewEvaluation'
    );

    // Provide default fallback values if fields are missing
    const score = evaluation.score || 75;
    const missing_keywords = evaluation.missing_keywords || ['Industry terminology', 'Best practices'];
    const improvements = evaluation.improvements || 'Elaborate more on container isolation mechanisms.';

    return NextResponse.json({
      score,
      missing_keywords,
      improvements
    });
  } catch (err) {
    console.error('Interview evaluation endpoint failed:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
