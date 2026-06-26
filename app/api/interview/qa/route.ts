import { NextResponse } from 'next/server';
import { mistralService } from '@/lib/mistral';

export async function POST(request: Request) {
  try {
    const { targetRole, missingSkills, difficulty, category } = await request.json();

    const role = targetRole || 'Software Engineer';
    const skillsList = missingSkills && missingSkills.length > 0 ? missingSkills.join(', ') : 'Docker, Kubernetes, Databases';
    const diff = difficulty || 'All Levels';
    const cat = category || 'Technical';

    const prompt = `
    Target Role: ${role}
    Skills and missing topics to test: ${skillsList}
    Difficulty: ${diff}
    Category: ${cat}
    
    Formulate 3 interview questions and compile appropriate model answers for three levels: Beginner (basic definitions), Intermediate (working usage), and Expert (deep tradeoffs, scaling limits, edge-case architectures).
    Output a JSON object with a key "questions" containing a list of objects, each having keys: "question", "category", "beginner_answer", "intermediate_answer", "expert_answer".
    `;

    const systemInstruction = "You are a lead interviewer. Output a list of 3 questions with their Beginner, Intermediate, Expert responses in JSON format.";

    // Query structured endpoint
    const response = await mistralService.generateStructuredCompletion(
      prompt,
      systemInstruction,
      'InterviewQAList'
    );

    // If Mistral structured completion returned empty or wasn't formatted properly, we provide default guide content
    let questions = response.questions;
    if (!questions || questions.length === 0) {
      questions = [
        {
          question: `Explain how containerization with Docker solves deployment issues in ${role} setups.`,
          category: 'Technical',
          beginner_answer: 'Docker bundles code and all its dependencies into an image, so it runs the same on any computer.',
          intermediate_answer: 'It uses container runtimes to isolate environments, avoiding local configuration drifts. It supports layer caching and multi-stage builds to optimize image sizes.',
          expert_answer: 'It leverages Linux kernel namespaces and cgroups to offer lightweight isolation. Expert setups combine multi-stage builds with distroless images to minimize attack surface area, utilizing daemonless runtime engines for orchestration security.'
        },
        {
          question: 'Describe the core difference between SQL and Vector Databases.',
          category: 'System Design',
          beginner_answer: 'SQL stores data in tables of rows and columns, while Vector databases store coordinates or embeddings.',
          intermediate_answer: 'SQL is optimized for exact relational queries. Vector databases are built for similarity searches using indices like HNSW to scan high-dimensional vectors.',
          expert_answer: 'SQL relational architectures focus on transactional integrity (ACID). Vector DBs use quantized vector indices (Scalar/Product Quantization) to run cosine similarity queries over massive datasets with sub-millisecond latencies, trading minor precision loss for throughput.'
        }
      ];
    }

    return NextResponse.json(questions);
  } catch (err) {
    console.error('Q&A Guide endpoint failed:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
