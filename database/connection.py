import sqlite3
import os
from contextlib import contextmanager
from utils.logger import logger

DB_FILE = "nexora_career.db"

def get_db_path() -> str:
    """Returns the absolute path to the SQLite database."""
    # Read from environment if configured, fallback to default nexora_career.db
    db_url = os.getenv("DATABASE_URL", f"sqlite:///{DB_FILE}")
    if db_url.startswith("sqlite:///"):
        return db_url.replace("sqlite:///", "")
    return DB_FILE

@contextmanager
def get_db_connection():
    """Context manager for SQLite connections."""
    db_path = get_db_path()
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error(f"Database transaction error: {str(e)}")
        raise e
    finally:
        conn.close()

def init_db():
    """Initializes tables for Phase 1 Career Intelligence Ecosystem."""
    logger.info("Initializing SQLite database...")
    db_path = get_db_path()
    
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # User Profiles Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE,
                target_role TEXT,
                readiness_score REAL DEFAULT 0.0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Resumes Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS resumes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                filename TEXT,
                raw_text TEXT,
                ats_score REAL,
                skills_json TEXT,  -- Extracted skills list as JSON
                insights_json TEXT, -- ATS suggestions as JSON
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        """)
        
        # Skill Gap Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS skill_gaps (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                target_role TEXT,
                missing_skills TEXT, -- JSON array of missing skills
                priority_list TEXT,  -- JSON list of priorities and effort
                last_calculated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        """)
        
        # Document Chunk Metadata Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS doc_chunks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                doc_name TEXT NOT NULL,
                chunk_index INTEGER,
                content TEXT,
                vector_id TEXT, -- Qdrant Point UUID reference
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Mock Interviews & Question Bank Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS mock_interviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                topic TEXT,
                role TEXT,
                questions_json TEXT, -- JSON array of generated questions
                answers_json TEXT,   -- JSON array of user responses and evaluations
                score REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        """)
        
        logger.info("SQLite database tables created successfully.")
