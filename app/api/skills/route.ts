import { NextResponse } from 'next/server';
import { mistralService } from '@/lib/mistral';

export async function POST(request: Request) {
  try {
    const { targetRole, currentSkills } = await request.json();

    if (!targetRole || !currentSkills) {
      return NextResponse.json({ error: 'Missing targetRole or currentSkills' }, { status: 400 });
    }

    const prompt = `
    Target Role: ${targetRole}
    Current Candidate Skills: ${currentSkills}
    
    Compare these two sets. Identify the specific tools, libraries, or system architectural concepts missing in the candidate's skills that are required for a ${targetRole}.
    Estimate current and required proficiency levels, required learning hours, and priority rating (High/Medium/Low).
    `;

    const systemInstruction = "You are a tech assessor and skills gap specialist. Match the output structure precisely.";

    const gapAnalysis = await mistralService.generateStructuredCompletion(
      prompt,
      systemInstruction,
      'SkillGapAnalysis'
    );

    return NextResponse.json(gapAnalysis);
  } catch (err) {
    console.error('Skill gap endpoint failed:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
