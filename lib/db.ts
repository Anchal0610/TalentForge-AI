import fs from 'fs';
import path from 'path';
import { Client } from 'pg';

export interface User {
  id?: number;
  name: string;
  email: string;
  target_role?: string;
  readiness_score: number;
  created_at?: string;
}

export interface Resume {
  id?: number;
  user_id: number;
  filename: string;
  file_url?: string;
  raw_text: string;
  ats_score: number;
  skills_json?: string;
  insights_json?: string;
  created_at?: string;
}

export interface DocumentRecord {
  id?: number;
  filename: string;
  file_url?: string;
  chunk_count: number;
  created_at?: string;
}

export interface MockInterview {
  id?: number;
  user_id: number;
  topic: string;
  role: string;
  questions_json: string;
  answers_json: string;
  score: number;
  created_at?: string;
}

class DatabaseManager {
  private usePostgres = false;
  private dbUrl = '';
  private jsonDbPath = '';

  constructor() {
    this.dbUrl = (process.env.DATABASE_URL || '').trim();
    this.usePostgres = this.dbUrl.startsWith('postgresql://') || this.dbUrl.startsWith('postgres://');
    this.jsonDbPath = path.join(process.cwd(), 'nexora_db.json');
  }

  private async getPostgresClient(): Promise<Client | null> {
    if (!this.usePostgres) return null;
    const client = new Client({
      connectionString: this.dbUrl,
      ssl: this.dbUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
    });
    try {
      await client.connect();
      return client;
    } catch (err) {
      console.error('Failed to connect to PostgreSQL. Falling back to local JSON database.', err);
      return null;
    }
  }

  // Read Local JSON DB
  private readJsonDb(): {
    users: User[];
    resumes: Resume[];
    documents: DocumentRecord[];
    mock_interviews: MockInterview[];
  } {
    if (!fs.existsSync(this.jsonDbPath)) {
      const defaultDb = { users: [], resumes: [], documents: [], mock_interviews: [] };
      fs.writeFileSync(this.jsonDbPath, JSON.stringify(defaultDb, null, 2));
      return defaultDb;
    }
    try {
      const content = fs.readFileSync(this.jsonDbPath, 'utf8');
      return JSON.parse(content);
    } catch (err) {
      console.error('Error reading JSON DB, resetting.', err);
      return { users: [], resumes: [], documents: [], mock_interviews: [] };
    }
  }

  // Write Local JSON DB
  private writeJsonDb(data: any) {
    fs.writeFileSync(this.jsonDbPath, JSON.stringify(data, null, 2));
  }

  public async initDb() {
    console.log('Initializing Database tables...');
    const pg = await this.getPostgresClient();
    
    if (pg) {
      try {
        await pg.query(`
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE,
            target_role VARCHAR(255),
            readiness_score REAL DEFAULT 0.0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        await pg.query(`
          CREATE TABLE IF NOT EXISTS resumes (
            id SERIAL PRIMARY KEY,
            user_id INTEGER,
            filename VARCHAR(255),
            file_url TEXT,
            raw_text TEXT,
            ats_score REAL,
            skills_json JSONB,
            insights_json JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        await pg.query(`
          CREATE TABLE IF NOT EXISTS documents (
            id SERIAL PRIMARY KEY,
            filename VARCHAR(255),
            file_url TEXT,
            chunk_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        await pg.query(`
          CREATE TABLE IF NOT EXISTS mock_interviews (
            id SERIAL PRIMARY KEY,
            user_id INTEGER,
            topic VARCHAR(255),
            role VARCHAR(255),
            questions_json JSONB,
            answers_json JSONB,
            score REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log('PostgreSQL schema initialized successfully.');
      } catch (err) {
        console.error('PostgreSQL initialization error:', err);
      } finally {
        await pg.end();
      }
    } else {
      // Local JSON DB Init
      this.readJsonDb();
      console.log('Local JSON DB schema initialized successfully.');
    }
  }

  public async saveUser(name: string, email: string, targetRole: string, readinessScore: number): Promise<User> {
    const pg = await this.getPostgresClient();
    if (pg) {
      try {
        const query = `
          INSERT INTO users (name, email, target_role, readiness_score) 
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (email) 
          DO UPDATE SET name = EXCLUDED.name, target_role = EXCLUDED.target_role, readiness_score = EXCLUDED.readiness_score
          RETURNING *
        `;
        const res = await pg.query(query, [name, email, targetRole, readinessScore]);
        return res.rows[0];
      } finally {
        await pg.end();
      }
    } else {
      const data = this.readJsonDb();
      let user = data.users.find(u => u.email === email);
      if (user) {
        user.name = name;
        user.target_role = targetRole;
        user.readiness_score = readinessScore;
      } else {
        const nextId = data.users.length > 0 ? Math.max(...data.users.map(u => u.id || 0)) + 1 : 1;
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
    const pg = await this.getPostgresClient();
    if (pg) {
      try {
        const res = await pg.query('SELECT * FROM users WHERE email = $1', [email]);
        return res.rows[0] || null;
      } finally {
        await pg.end();
      }
    } else {
      const data = this.readJsonDb();
      const user = data.users.find(u => u.email === email);
      return user || null;
    }
  }

  public async saveResume(userId: number, filename: string, rawText: string, atsScore: number, fileUrl?: string): Promise<Resume> {
    const pg = await this.getPostgresClient();
    if (pg) {
      try {
        const query = `
          INSERT INTO resumes (user_id, filename, file_url, raw_text, ats_score) 
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;
        const res = await pg.query(query, [userId, filename, fileUrl || null, rawText, atsScore]);
        return res.rows[0];
      } finally {
        await pg.end();
      }
    } else {
      const data = this.readJsonDb();
      const nextId = data.resumes.length > 0 ? Math.max(...data.resumes.map(r => r.id || 0)) + 1 : 1;
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
    const pg = await this.getPostgresClient();
    if (pg) {
      try {
        const query = `
          INSERT INTO documents (filename, file_url, chunk_count) 
          VALUES ($1, $2, $3)
          RETURNING *
        `;
        const res = await pg.query(query, [filename, fileUrl || null, chunkCount]);
        return res.rows[0];
      } finally {
        await pg.end();
      }
    } else {
      const data = this.readJsonDb();
      const nextId = data.documents.length > 0 ? Math.max(...data.documents.map(d => d.id || 0)) + 1 : 1;
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
      databaseType: this.usePostgres ? 'PostgreSQL (Neon)' : 'Local JSON Fallback',
      usersCount: 0,
      resumesCount: 0,
      documentsCount: 0,
      mockInterviewsCount: 0,
      dbHealthy: false,
    };

    const pg = await this.getPostgresClient();
    if (pg) {
      try {
        const u = await pg.query('SELECT COUNT(*) FROM users');
        const r = await pg.query('SELECT COUNT(*) FROM resumes');
        const d = await pg.query('SELECT COUNT(*) FROM documents');
        const m = await pg.query('SELECT COUNT(*) FROM mock_interviews');
        data.usersCount = parseInt(u.rows[0].count, 10);
        data.resumesCount = parseInt(r.rows[0].count, 10);
        data.documentsCount = parseInt(d.rows[0].count, 10);
        data.mockInterviewsCount = parseInt(m.rows[0].count, 10);
        data.dbHealthy = true;
      } catch (err) {
        console.error('Db Diagnostics query failure:', err);
      } finally {
        await pg.end();
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
}

export const dbManager = new DatabaseManager();
