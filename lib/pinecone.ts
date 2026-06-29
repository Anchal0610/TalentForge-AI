import crypto from 'crypto';

interface VectorPoint {
  id: string;
  values: number[];
  metadata: {
    content: string;
    document_name: string;
    chunk_index: number;
    [key: string]: any;
  };
}

class PineconeService {
  private apiKey: string;
  private indexName: string;
  private mockStore: VectorPoint[] = [];

  constructor() {
    this.apiKey = (process.env.PINECONE_API_KEY || '').trim();
    this.indexName = (process.env.PINECONE_INDEX_NAME || 'nexora-career-index').trim();
  }

  private isConfigured() {
    return this.apiKey && !this.apiKey.startsWith('your_') && !this.apiKey.startsWith('pcsk_');
  }

  // Fallback to simple local cosine similarity
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;
    for (let i = 0; i < Math.min(vecA.length, vecB.length); i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  public async upsertChunks(
    texts: string[],
    embeddings: number[][],
    metadatas: any[]
  ): Promise<string[]> {
    const ids = texts.map(() => crypto.randomUUID());

    if (!this.isConfigured()) {
      console.log('Pinecone not configured. Upserting to local mock memory store...');
      texts.forEach((text, i) => {
        this.mockStore.push({
          id: ids[i],
          values: embeddings[i] || [],
          metadata: {
            content: text,
            document_name: metadatas[i]?.document_name || 'MockDoc.pdf',
            chunk_index: metadatas[i]?.chunk_index || i,
            ...metadatas[i]
          }
        });
      });
      return ids;
    }

    try {
      // In production, we fetch index details to retrieve host url, then upsert
      const hostRes = await fetch(`https://api.pinecone.io/indexes/${this.indexName}`, {
        headers: {
          'Api-Key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });
      
      if (!hostRes.ok) throw new Error(`Pinecone index description failed: ${hostRes.statusText}`);
      const indexInfo = await hostRes.json();
      const host = indexInfo.status?.host;
      if (!host) throw new Error('Host not found in Pinecone index status.');

      const vectors = texts.map((text, i) => ({
        id: ids[i],
        values: embeddings[i],
        metadata: {
          content: text,
          document_name: metadatas[i]?.document_name || 'Document',
          chunk_index: metadatas[i]?.chunk_index || i,
          ...metadatas[i]
        }
      }));

      const upsertRes = await fetch(`https://${host}/vectors/upsert`, {
        method: 'POST',
        headers: {
          'Api-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ vectors })
      });

      if (!upsertRes.ok) throw new Error(`Upsert failed: ${upsertRes.statusText}`);
      console.log(`Successfully upserted ${vectors.length} points to Pinecone index: ${this.indexName}`);
      return ids;
    } catch (err) {
      console.error('Pinecone HTTP upsert failed, saving to local mock store fallback:', err);
      texts.forEach((text, i) => {
        this.mockStore.push({
          id: ids[i],
          values: embeddings[i] || [],
          metadata: {
            content: text,
            document_name: metadatas[i]?.document_name || 'FallbackDoc.pdf',
            chunk_index: metadatas[i]?.chunk_index || i,
            ...metadatas[i]
          }
        });
      });
      return ids;
    }
  }

  public async similaritySearch(
    queryVector: number[],
    limit = 4,
    filterPayload?: any
  ): Promise<any[]> {
    if (!this.isConfigured()) {
      console.log('Pinecone not configured. Running similarity search in mock memory store...');
      return this.mockSearch(queryVector, limit, filterPayload);
    }

    try {
      const hostRes = await fetch(`https://api.pinecone.io/indexes/${this.indexName}`, {
        headers: {
          'Api-Key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!hostRes.ok) throw new Error(`Pinecone index status check failed: ${hostRes.statusText}`);
      const indexInfo = await hostRes.json();
      const host = indexInfo.status?.host;
      if (!host) throw new Error('Host not found.');

      const body: any = {
        vector: queryVector,
        topK: limit,
        includeMetadata: true
      };

      if (filterPayload) {
        body.filter = {};
        for (const [k, v] of Object.entries(filterPayload)) {
          body.filter[k] = { '$eq': v };
        }
      }

      const queryRes = await fetch(`https://${host}/query`, {
        method: 'POST',
        headers: {
          'Api-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!queryRes.ok) throw new Error(`Query failed: ${queryRes.statusText}`);
      const queryData = await queryRes.json();

      return (queryData.matches || []).map((match: any) => ({
        id: match.id,
        score: match.score || 0.0,
        payload: match.metadata || {},
        content: match.metadata?.content || ''
      }));
    } catch (err) {
      console.error('Pinecone query failed, searching local fallback mock store:', err);
      return this.mockSearch(queryVector, limit, filterPayload);
    }
  }

  private mockSearch(queryVector: number[], limit: number, filterPayload?: any): any[] {
    if (this.mockStore.length === 0) {
      // Seed some mock nodes if empty
      this.mockStore = [
        {
          id: 'mock-1',
          values: Array(1024).fill(0.1),
          metadata: {
            content: 'The core systems deployment pipeline requires standard containerization with docker, multi-stage building tags, and kube-scheduler binding endpoints.',
            document_name: 'MLOps Guidelines.pdf',
            chunk_index: 0
          }
        },
        {
          id: 'mock-2',
          values: Array(1024).fill(0.2),
          metadata: {
            content: 'Vector databases like Qdrant and Pinecone index high-dimensional embeddings using Hierarchical Navigable Small World graphs (HNSW) and Scalar Quantization vectors.',
            document_name: 'Vector Database Handbook.pdf',
            chunk_index: 0
          }
        }
      ];
    }

    const scored = this.mockStore
      .filter(item => {
        if (!filterPayload) return true;
        for (const [k, v] of Object.entries(filterPayload)) {
          if (item.metadata[k] !== v) return false;
        }
        return true;
      })
      .map(item => {
        const score = this.cosineSimilarity(queryVector, item.values);
        return {
          id: item.id,
          score,
          payload: item.metadata,
          content: item.metadata.content
        };
      });

    // Sort by descending score
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }

  public async getDiagnostics() {
    if (!this.isConfigured()) {
      return {
        enabled: false,
        status: 'Demo/Mock Fallback Mode',
        indexName: this.indexName,
        activeIndexes: []
      };
    }
    try {
      const res = await fetch('https://api.pinecone.io/indexes', {
        headers: { 'Api-Key': this.apiKey }
      });
      if (res.ok) {
        const indexes = await res.json();
        return {
          enabled: true,
          status: 'Active Connection',
          indexName: this.indexName,
          activeIndexes: (indexes.indexes || []).map((idx: any) => idx.name)
        };
      }
      return {
        enabled: false,
        status: 'Error connecting to Pinecone API',
        indexName: this.indexName,
        activeIndexes: []
      };
    } catch {
      return {
        enabled: false,
        status: 'Offline (Exception occurred)',
        indexName: this.indexName,
        activeIndexes: []
      };
    }
  }
}

export const pineconeService = new PineconeService();
