import { NextResponse } from 'next/server';
import { mistralService } from '@/lib/mistral';
import { pineconeService } from '@/lib/pinecone';

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // 1. Generate query embedding
    const queryVector = await mistralService.getEmbedding(query);

    // 2. Query Pinecone for relevant documents
    const hits = await pineconeService.similaritySearch(queryVector, 4);
    
    // 3. Format retrieved context
    let contextString = 'No relevant context found.';
    if (hits && hits.length > 0) {
      contextString = hits.map((hit, i) => {
        const docName = hit.payload?.document_name || 'Unknown Document';
        const content = hit.content || '';
        return `--- Context Chunk ${i + 1} (Source: ${docName}) ---\n${content}`;
      }).join('\n\n');
    }

    // 4. Generate answer via Mistral completions
    const systemPrompt = "You are a helpful Career Intelligence Assistant. Answer the question using ONLY the provided document context.";
    
    const userPrompt = `
    Use the following context to answer the user question. If you don't know the answer, state that it's not present in the context.
    
    Context:
    ${contextString}
    
    Question:
    ${query}
    `;

    const answer = await mistralService.chatCompletion(
      [{ role: 'user', content: userPrompt }],
      systemPrompt
    );

    return NextResponse.json({
      answer,
      context: contextString
    });
  } catch (err) {
    console.error('RAG query endpoint failed:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
