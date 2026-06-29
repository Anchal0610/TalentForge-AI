import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { ocrService } from '@/lib/ocr';
import { imagekitService } from '@/lib/imagekit';
import { mistralService } from '@/lib/mistral';
import { pineconeService } from '@/lib/pinecone';
import { dbManager } from '@/lib/db';

function splitTextIntoChunks(text: string, chunkSize = 800, chunkOverlap = 200): string[] {
  const chunks: string[] = [];
  if (!text) return chunks;
  
  let index = 0;
  while (index < text.length) {
    const chunk = text.slice(index, index + chunkSize);
    chunks.push(chunk);
    index += (chunkSize - chunkOverlap);
  }
  return chunks;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // 1. Write to temp file path
    const tempDir = path.join(os.tmpdir(), 'talentforge-temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempFilePath = path.join(tempDir, file.name);
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(tempFilePath, fileBuffer);

    let rawText = '';
    let fileUrl = null;

    try {
      // 2. Local OCR / text extraction
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

    // 5. Chunk the text
    const chunks = splitTextIntoChunks(rawText);
    if (chunks.length === 0) {
      return NextResponse.json({ error: 'No text extracted from document' }, { status: 400 });
    }

    // 6. Generate embeddings for all chunks in a batch loop
    console.log(`Generating embeddings for ${chunks.length} chunks...`);
    const embeddings: number[][] = [];
    for (const chunk of chunks) {
      const emb = await mistralService.getEmbedding(chunk);
      embeddings.push(emb);
    }

    // 7. Index chunks in Pinecone
    const metadatas = chunks.map((_, i) => ({
      document_name: file.name,
      chunk_index: i
    }));

    await pineconeService.upsertChunks(chunks, embeddings, metadatas);

    // 8. Save document to Database log
    await dbManager.saveDocument(file.name, chunks, fileUrl || undefined);

    return NextResponse.json({
      success: true,
      filename: file.name,
      chunksCount: chunks.length,
      file_url: fileUrl,
      rawText: rawText // Return text so frontend can show smart summary directly
    });
  } catch (err) {
    console.error('Document ingestion failed:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
