import { NextResponse } from 'next/server';
import { mistralService } from '@/lib/mistral';

export async function POST(request: Request) {
  try {
    const { skills, experience, interests } = await request.json();

    if (!skills) {
      return NextResponse.json({ error: 'Skills are required' }, { status: 400 });
    }

    const prompt = `
    Analyze this candidate profile:
    Skills: ${skills}
    Experience: ${experience || 0} years
    Interests: ${interests || ''}
    
    Predict the top 3 most suitable job roles, reason why they fit, and detail market growth/salary trends for each.
    `;

    const systemInstruction = "You are a senior tech career strategist and recruiting expert. Output predictions matching the requested schema.";

    const recommendations = await mistralService.generateStructuredCompletion(
      prompt,
      systemInstruction,
      'CareerRecommendation'
    );

    return NextResponse.json(recommendations);
  } catch (err) {
    console.error('Career recommendation endpoint failed:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
