import { NextResponse } from 'next/server';
import { dbManager } from '@/lib/db';
import { pineconeService } from '@/lib/pinecone';
import { mistralService } from '@/lib/mistral';

export async function GET() {
  try {
    // 1. Initialize tables if not already done
    await dbManager.initDb();

    // 2. Query Diagnostic Metrics
    const dbStatus = await dbManager.getDiagnostics();
    const pineconeStatus = await pineconeService.getDiagnostics();
    
    const diagnostics = {
      db: dbStatus,
      pinecone: pineconeStatus,
      mistral: {
        modelName: process.env.MISTRAL_MODEL_NAME || 'mistral-large-latest',
        configured: !!process.env.MISTRAL_API_KEY && !process.env.MISTRAL_API_KEY.startsWith('your_'),
        mockMode: mistralService.getMockMode()
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(diagnostics);
  } catch (err) {
    console.error('Diagnostics route failed:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
