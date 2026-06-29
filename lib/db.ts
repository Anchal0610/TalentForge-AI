import fs from 'fs';
import path from 'path';
import { prisma } from './prisma';

export interface User {
  id?: string | number;
  name: string;
  email: string;
  target_role?: string;
  readiness_score: number;
  created_at?: string;
}

export interface Resume {
  id?: string | number;
  user_id: string | number;
  filename: string;
  file_url?: string;
  raw_text: string;
  ats_score: number;
  skills_json?: string;
  insights_json?: string;
  created_at?: string;
}

export interface DocumentRecord {
  id?: string | number;
  filename: string;
  file_url?: string;
  chunk_count: number;
  created_at?: string;
}

export interface MockInterview {
  id?: string | number;
  user_id: string | number;
  topic: string;
  role: string;
  questions_json: string;
  answers_json: string;
  score: number;
  created_at?: string;
}

class DatabaseManager {
  private usePrisma = false;
  private dbUrl = '';
  private jsonDbPath = '';

  constructor() {
    this.dbUrl = (process.env.DATABASE_URL || '').trim();
    this.usePrisma = this.dbUrl.startsWith('mongodb') || this.dbUrl.includes('mongodb');
    this.jsonDbPath = path.join(process.cwd(), 'nexora_db.json');
  }

  // Read Local JSON DB
  private readJsonDb(): {
    users: User[];
    resumes: Resume[];
    documents: DocumentRecord[];
    mock_interviews: MockInterview[];
    pipeline_sessions: { email: string; data: any; updated_at?: string }[];
  } {
    if (!fs.existsSync(this.jsonDbPath)) {
      const defaultDb = { users: [], resumes: [], documents: [], mock_interviews: [], pipeline_sessions: [] };
      fs.writeFileSync(this.jsonDbPath, JSON.stringify(defaultDb, null, 2));
      return defaultDb as any;
    }
    try {
      const content = fs.readFileSync(this.jsonDbPath, 'utf8');
      const parsed = JSON.parse(content);
      if (!parsed.pipeline_sessions) {
        parsed.pipeline_sessions = [];
      }
      return parsed;
    } catch (err) {
      console.error('Error reading JSON DB, resetting.', err);
      return { users: [], resumes: [], documents: [], mock_interviews: [], pipeline_sessions: [] };
    }
  }

  // Write Local JSON DB
  private writeJsonDb(data: any) {
    fs.writeFileSync(this.jsonDbPath, JSON.stringify(data, null, 2));
  }

  public async initDb() {
    console.log('Initializing Database connection...');
    if (this.usePrisma) {
      try {
        await prisma.$connect();
        console.log('MongoDB (via Prisma) connection initialized successfully.');
      } catch (err) {
        console.error('MongoDB connection error:', err);
      }
    } else {
      // Local JSON DB Init
      this.readJsonDb();
      console.log('Local JSON DB schema initialized successfully.');
    }
  }

  public async saveUser(name: string, email: string, targetRole: string, readinessScore: number): Promise<User> {
    if (this.usePrisma) {
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
    } else {
      const data = this.readJsonDb();
      let user = data.users.find(u => u.email === email);
      if (user) {
        user.name = name;
        user.target_role = targetRole;
        user.readiness_score = readinessScore;
      } else {
        const nextId = data.users.length > 0 ? Math.max(...data.users.map(u => Number(u.id) || 0)) + 1 : 1;
        user = {
          id: nextId,
          name,
          email,
          target_role: targetRole,
          readiness_score: readinessScore,
          created_at: new Date().toISOString()
        };
        data.users.push(user);
      }
      this.writeJsonDb(data);
      return user;
    }
  }

  public async getUser(email: string): Promise<User | null> {
    if (this.usePrisma) {
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
    } else {
      const data = this.readJsonDb();
      const user = data.users.find(u => u.email === email);
      return user || null;
    }
  }

  public async saveResume(userId: string | number, filename: string, rawText: string, atsScore: number, fileUrl?: string): Promise<Resume> {
    if (this.usePrisma) {
      try {
        const resume = await prisma.resume.create({
          data: {
            user_id: String(userId),
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
    } else {
      const data = this.readJsonDb();
      const nextId = data.resumes.length > 0 ? Math.max(...data.resumes.map(r => Number(r.id) || 0)) + 1 : 1;
      const resume: Resume = {
        id: nextId,
        user_id: userId,
        filename,
        file_url: fileUrl || undefined,
        raw_text: rawText,
        ats_score: atsScore,
        created_at: new Date().toISOString()
      };
      data.resumes.push(resume);
      this.writeJsonDb(data);
      return resume;
    }
  }

  public async saveDocument(filename: string, fileUrl?: string, chunkCount = 0): Promise<DocumentRecord> {
    if (this.usePrisma) {
      try {
        const doc = await prisma.document.create({
          data: {
            filename,
            file_url: fileUrl || null,
            chunk_count: chunkCount,
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
        console.error('Error saving document via Prisma:', err);
        throw err;
      }
    } else {
      const data = this.readJsonDb();
      const nextId = data.documents.length > 0 ? Math.max(...data.documents.map(d => Number(d.id) || 0)) + 1 : 1;
      const doc: DocumentRecord = {
        id: nextId,
        filename,
        file_url: fileUrl || undefined,
        chunk_count: chunkCount,
        created_at: new Date().toISOString()
      };
      data.documents.push(doc);
      this.writeJsonDb(data);
      return doc;
    }
  }

  public async getDiagnostics() {
    const data = {
      databaseType: this.usePrisma ? 'MongoDB (Prisma)' : 'Local JSON Fallback',
      usersCount: 0,
      resumesCount: 0,
      documentsCount: 0,
      mockInterviewsCount: 0,
      dbHealthy: false,
    };

    if (this.usePrisma) {
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
    } else {
      const jsonDb = this.readJsonDb();
      data.usersCount = jsonDb.users.length;
      data.resumesCount = jsonDb.resumes.length;
      data.documentsCount = jsonDb.documents.length;
      data.mockInterviewsCount = jsonDb.mock_interviews.length;
      data.dbHealthy = true;
    }
    return data;
  }

  public async savePipelineSession(email: string, data: any): Promise<any> {
    if (this.usePrisma) {
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
    } else {
      const db = this.readJsonDb();
      let session = db.pipeline_sessions.find(s => s.email === email);
      if (session) {
        session.data = data;
        session.updated_at = new Date().toISOString();
      } else {
        session = {
          email,
          data,
          updated_at: new Date().toISOString()
        };
        db.pipeline_sessions.push(session);
      }
      this.writeJsonDb(db);
      return session;
    }
  }

  public async getPipelineSession(email: string): Promise<any | null> {
    if (this.usePrisma) {
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
    } else {
      const db = this.readJsonDb();
      const session = db.pipeline_sessions.find(s => s.email === email);
      return session ? session.data : null;
    }
  }
}

export const dbManager = new DatabaseManager();
