import os
from contextlib import contextmanager
from utils.logger import logger

# Import database packages dynamically for fallback safety
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    POSTGRES_AVAILABLE = True
except ImportError:
    POSTGRES_AVAILABLE = False

import sqlite3

def get_db_url() -> str:
    return os.getenv("DATABASE_URL", "")

def is_postgres() -> bool:
    url = get_db_url()
    return POSTGRES_AVAILABLE and (url.startswith("postgresql://") or url.startswith("postgres://"))

@contextmanager
def get_db_connection():
    """Context manager supplying database sessions. Dynamically handles PostgreSQL or SQLite."""
    url = get_db_url()
    
    if is_postgres():
        try:
            # Connect to PostgreSQL (Supabase)
            conn = psycopg2.connect(url)
            # Make sure it behaves like Row/Dict cursor
            cursor_factory = RealDictCursor
            yield conn
            conn.commit()
            conn.close()
            return
        except Exception as e:
            logger.error(f"PostgreSQL Connection failed: {str(e)}. Falling back to local SQLite.")

    # Fallback to local SQLite
    db_file = "nexora_career.db"
    conn = sqlite3.connect(db_file)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error(f"SQLite transaction error: {str(e)}")
        raise e
    finally:
        conn.close()

def init_db():
    """Initializes tables using dialect-correct PostgreSQL/SQLite statements."""
    logger.info("Initializing Database schemas...")
    
    postgres_mode = is_postgres()
    
    # Dialect differences
    primary_key_syntax = "SERIAL PRIMARY KEY" if postgres_mode else "INTEGER PRIMARY KEY AUTOINCREMENT"
    json_type = "JSONB" if postgres_mode else "TEXT"
    timestamp_syntax = "CURRENT_TIMESTAMP"
    
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # User Profiles Table
        cursor.execute(f"""
            CREATE TABLE IF NOT EXISTS users (
                id {primary_key_syntax},
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE,
                target_role VARCHAR(255),
                readiness_score REAL DEFAULT 0.0,
                created_at TIMESTAMP DEFAULT {timestamp_syntax}
            )
        """)
        
        # Resumes Table
        cursor.execute(f"""
            CREATE TABLE IF NOT EXISTS resumes (
                id {primary_key_syntax},
                user_id INTEGER,
                filename VARCHAR(255),
                raw_text TEXT,
                ats_score REAL,
                skills_json {json_type},
                insights_json {json_type},
                created_at TIMESTAMP DEFAULT {timestamp_syntax}
            )
        """)
        
        # Skill Gap Table
        cursor.execute(f"""
            CREATE TABLE IF NOT EXISTS skill_gaps (
                id {primary_key_syntax},
                user_id INTEGER,
                target_role VARCHAR(255),
                missing_skills TEXT,
                priority_list TEXT,
                last_calculated TIMESTAMP DEFAULT {timestamp_syntax}
            )
        """)
        
        # Document Chunk Metadata Table
        cursor.execute(f"""
            CREATE TABLE IF NOT EXISTS doc_chunks (
                id {primary_key_syntax},
                doc_name VARCHAR(255) NOT NULL,
                chunk_index INTEGER,
                content TEXT,
                vector_id VARCHAR(255),
                created_at TIMESTAMP DEFAULT {timestamp_syntax}
            )
        """)
        
        # Mock Interviews Table
        cursor.execute(f"""
            CREATE TABLE IF NOT EXISTS mock_interviews (
                id {primary_key_syntax},
                user_id INTEGER,
                topic VARCHAR(255),
                role VARCHAR(255),
                questions_json {json_type},
                answers_json {json_type},
                score REAL,
                created_at TIMESTAMP DEFAULT {timestamp_syntax}
            )
        """)
        
        db_type_name = "Supabase PostgreSQL" if postgres_mode else "Local SQLite"
        logger.info(f"Database schemas successfully initialized on: {db_type_name}")
