import { NextResponse } from 'next/server';
import { mistralService } from '@/lib/mistral';

export async function POST(request: Request) {
  try {
    const { texts } = await request.json();

    if (!texts || !Array.isArray(texts)) {
      return NextResponse.json({ error: 'Array of texts is required' }, { status: 400 });
    }

    console.log(`Generating batch embeddings for ${texts.length} items...`);
    const embeddings = await Promise.all(
      texts.map(text => mistralService.getEmbedding(text))
    );

    return NextResponse.json({ embeddings });
  } catch (err) {
    console.error('Batch embeddings endpoint failed:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
