import { NextResponse } from 'next/server';
import { mistralService } from '@/lib/mistral';

export async function POST(request: Request) {
  try {
    const { action, targetRole, missingSkills, currentSkills, mockScore } = await request.json();

    if (action === 'roadmap') {
      const role = targetRole || 'Software Engineer';
      const gaps = missingSkills && missingSkills.length > 0 ? missingSkills.join(', ') : 'Docker, Kubernetes';

      const prompt = `
      Target Role: ${role}
      Missing Skills to close: ${gaps}
      
      Build a comprehensive weekly learning plan spanning multiple weeks. Detail specific topics, study resources, coding project milestones, and credential options.
      `;

      const systemInstruction = "You are a professional software instructor and technical syllabus architect.";

      const roadmap = await mistralService.generateStructuredCompletion(
        prompt,
        systemInstruction,
        'LearningRoadmap'
      );

      return NextResponse.json(roadmap);
    } else if (action === 'readiness') {
      const role = targetRole || 'Software Engineer';
      const current = currentSkills ? currentSkills : 'Python, SQL';
      const gaps = missingSkills && missingSkills.length > 0 ? missingSkills.join(', ') : 'Docker, Kubernetes';
      const score = mockScore || 80;

      const prompt = `
      Target Role: ${role}
      Current Skills: ${current}
      Missing Skills: ${gaps}
      Mock Interview History Score: ${score}%
      
      Calculate candidate career readiness. Provide percentage metrics and prioritized actions.
      `;

      const systemInstruction = "You are an expert HR quantitative analyst. Output career readiness profiles.";

      const readiness = await mistralService.generateStructuredCompletion(
        prompt,
        systemInstruction,
        'CareerReadiness'
      );

      return NextResponse.json(readiness);
    } else {
      return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
    }
  } catch (err) {
    console.error('Roadmap/Readiness endpoint failed:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
