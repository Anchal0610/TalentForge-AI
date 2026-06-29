import { prisma } from './prisma';

export interface User {
  id?: string;
  name: string;
  email: string;
  target_role?: string;
  readiness_score: number;
  created_at?: string;
}

export interface Resume {
  id?: string;
  user_id: string;
  filename: string;
  file_url?: string;
  raw_text: string;
  ats_score: number;
  skills_json?: string;
  insights_json?: string;
  created_at?: string;
}

export interface DocumentRecord {
  id?: string;
  filename: string;
  file_url?: string;
  chunk_count: number;
  created_at?: string;
}

export interface MockInterview {
  id?: string;
  user_id: string;
  topic: string;
  role: string;
  questions_json: string;
  answers_json: string;
  score: number;
  created_at?: string;
}

class DatabaseManager {
  public async initDb() {
    console.log('Initializing Database connection...');
    try {
      await prisma.$connect();
      console.log('MongoDB (via Prisma) connection initialized successfully.');
    } catch (err) {
      console.error('MongoDB connection error:', err);
      throw err;
    }
  }

  public async saveUser(name: string, email: string, targetRole: string, readinessScore: number): Promise<User> {
    try {
      const user = await prisma.user.upsert({
        where: { email },
        update: {
          name,
          target_role: targetRole,
          readiness_score: readinessScore,
        },
        create: {
          name,
          email,
          target_role: targetRole,
          readiness_score: readinessScore,
        },
      });
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        target_role: user.target_role || undefined,
        readiness_score: user.readiness_score,
        created_at: user.created_at.toISOString(),
      };
    } catch (err) {
      console.error('Error saving user via Prisma:', err);
      throw err;
    }
  }

  public async getUser(email: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });
      if (!user) return null;
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        target_role: user.target_role || undefined,
        readiness_score: user.readiness_score,
        created_at: user.created_at.toISOString(),
      };
    } catch (err) {
      console.error('Error getting user via Prisma:', err);
      throw err;
    }
  }

  public async saveResume(userId: string, filename: string, rawText: string, atsScore: number, fileUrl?: string): Promise<Resume> {
    try {
      const resume = await prisma.resume.create({
        data: {
          user_id: userId,
          filename,
          raw_text: rawText,
          ats_score: atsScore,
          file_url: fileUrl || null,
        },
      });
      return {
        id: resume.id,
        user_id: resume.user_id,
        filename: resume.filename,
        file_url: resume.file_url || undefined,
        raw_text: resume.raw_text,
        ats_score: resume.ats_score,
        created_at: resume.created_at.toISOString(),
      };
    } catch (err) {
      console.error('Error saving resume via Prisma:', err);
      throw err;
    }
  }

  public async saveDocument(filename: string, chunks: string[], fileUrl?: string): Promise<DocumentRecord> {
    try {
      const doc = await prisma.document.create({
        data: {
          filename,
          file_url: fileUrl || null,
          chunk_count: chunks.length,
          chunks: {
            create: chunks.map((chunk, index) => ({
              chunk_index: index,
              text_content: chunk,
            })),
          },
        },
      });
      return {
        id: doc.id,
        filename: doc.filename,
        file_url: doc.file_url || undefined,
        chunk_count: doc.chunk_count,
        created_at: doc.created_at.toISOString(),
      };
    } catch (err) {
      console.error('Error saving document and chunks via Prisma:', err);
      throw err;
    }
  }

  public async getDiagnostics() {
    const data = {
      databaseType: 'MongoDB (Prisma)',
      usersCount: 0,
      resumesCount: 0,
      documentsCount: 0,
      mockInterviewsCount: 0,
      dbHealthy: false,
    };

    try {
      const [usersCount, resumesCount, documentsCount, mockInterviewsCount] = await Promise.all([
        prisma.user.count(),
        prisma.resume.count(),
        prisma.document.count(),
        prisma.mockInterview.count(),
      ]);
      data.usersCount = usersCount;
      data.resumesCount = resumesCount;
      data.documentsCount = documentsCount;
      data.mockInterviewsCount = mockInterviewsCount;
      data.dbHealthy = true;
    } catch (err) {
      console.error('Db Diagnostics query failure:', err);
    }
    return data;
  }

  public async savePipelineSession(email: string, data: any): Promise<any> {
    try {
      const session = await prisma.pipelineSession.upsert({
        where: { email },
        update: {
          data: data as any,
        },
        create: {
          email,
          data: data as any,
        },
      });
      return session;
    } catch (err) {
      console.error('Failed to save pipeline session via Prisma:', err);
      throw err;
    }
  }

  public async getPipelineSession(email: string): Promise<any | null> {
    try {
      const session = await prisma.pipelineSession.findUnique({
        where: { email },
      });
      if (session) {
        return typeof session.data === 'string' ? JSON.parse(session.data) : session.data;
      }
      return null;
    } catch (err) {
      console.error('Failed to get pipeline session via Prisma:', err);
      throw err;
    }
  }
}

export const dbManager = new DatabaseManager();
