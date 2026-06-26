import os
import sqlite3
from typing import Dict, Any, List, Optional
from contextlib import contextmanager
from dotenv import load_dotenv
from utils.logger import logger

load_dotenv()
try:
    import streamlit as st
    cache_resource = st.cache_resource
except ImportError:
    def cache_resource(func):
        return func

# Import psycopg2 dynamically for PostgreSQL support
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    from psycopg2.pool import SimpleConnectionPool
    POSTGRES_AVAILABLE = True
except ImportError:
    POSTGRES_AVAILABLE = False

_POSTGRES_POOL = None

@cache_resource
def get_postgres_pool(url: str):
    """Caches a PostgreSQL connection pool to reuse sockets across Streamlit runs."""
    global _POSTGRES_POOL
    if _POSTGRES_POOL is not None:
        return _POSTGRES_POOL
    if not url:
        return None
    try:
        logger.info("Initializing cached PostgreSQL Connection Pool...")
        # Min connection 1, max connection 10
        _POSTGRES_POOL = SimpleConnectionPool(1, 10, dsn=url)
        return _POSTGRES_POOL
    except Exception as e:
        logger.error(f"Failed to create PostgreSQL connection pool: {str(e)}")
        return None


class DatabaseManager:
    def __init__(self):
        self.db_url = os.getenv("DATABASE_URL", "")
        # Clean quotes
        if self.db_url:
            self.db_url = self.db_url.strip("'\"")

        self.sqlite_db = "nexora_career.db"

    def is_postgres_active(self) -> bool:
        return POSTGRES_AVAILABLE and (self.db_url.startswith("postgresql://") or self.db_url.startswith("postgres://"))

    @contextmanager
    def get_connection(self):
        """Context manager yielding a database connection. Handles pooling for Postgres."""
        postgres_mode = self.is_postgres_active()
        if postgres_mode:
            try:
                pool = get_postgres_pool(self.db_url)
                if pool:
                    conn = pool.getconn()
                    try:
                        yield conn
                        conn.commit()
                    except Exception as e:
                        conn.rollback()
                        raise e
                    finally:
                        pool.putconn(conn)
                    return
            except Exception as e:
                logger.error(f"Error checking out database connection from pool: {str(e)}")

        # Fallback to local SQLite connection
        conn = sqlite3.connect(self.sqlite_db)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()

    # --- Data Adapter APIs ---

    def init_tables(self):
        """Runs table creation. Automatically detects standard Postgres (Neon) vs SQLite dialects."""
        postgres_mode = self.is_postgres_active()
        db_type = "Neon PostgreSQL" if postgres_mode else "Local SQLite"
        logger.info(f"Initializing Database tables on {db_type}...")

        # Dialect adjustments
        primary_key = "SERIAL PRIMARY KEY" if postgres_mode else "INTEGER PRIMARY KEY AUTOINCREMENT"
        json_type = "JSONB" if postgres_mode else "TEXT"
        timestamp_syntax = "CURRENT_TIMESTAMP"

        queries = [
            # User Profiles
            f"""
            CREATE TABLE IF NOT EXISTS users (
                id {primary_key},
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE,
                target_role VARCHAR(255),
                readiness_score REAL DEFAULT 0.0,
                created_at TIMESTAMP DEFAULT {timestamp_syntax}
            )
            """,
            # Resumes
            f"""
            CREATE TABLE IF NOT EXISTS resumes (
                id {primary_key},
                user_id INTEGER,
                filename VARCHAR(255),
                file_url TEXT,
                raw_text TEXT,
                ats_score REAL,
                skills_json {json_type},
                insights_json {json_type},
                created_at TIMESTAMP DEFAULT {timestamp_syntax}
            )
            """,
            # Documents
            f"""
            CREATE TABLE IF NOT EXISTS documents (
                id {primary_key},
                filename VARCHAR(255),
                file_url TEXT,
                chunk_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT {timestamp_syntax}
            )
            """,
            # Mock Interviews
            f"""
            CREATE TABLE IF NOT EXISTS mock_interviews (
                id {primary_key},
                user_id INTEGER,
                topic VARCHAR(255),
                role VARCHAR(255),
                questions_json {json_type},
                answers_json {json_type},
                score REAL,
                created_at TIMESTAMP DEFAULT {timestamp_syntax}
            )
            """
        ]

        with self.get_connection() as conn:
            try:
                cursor = conn.cursor()
                for q in queries:
                    cursor.execute(q)
                logger.info(f"Schema tables initialized successfully on: {db_type}")
            except Exception as e:
                logger.error(f"Error during schema initialization: {str(e)}")
                raise e

    def save_user(self, name: str, email: str, target_role: str, readiness_score: float) -> Dict[str, Any]:
        """Saves user data and returns the updated record."""
        postgres_mode = self.is_postgres_active()
        with self.get_connection() as conn:
            try:
                if postgres_mode:
                    cursor = conn.cursor(cursor_factory=RealDictCursor)
                    cursor.execute("""
                        INSERT INTO users (name, email, target_role, readiness_score) 
                        VALUES (%s, %s, %s, %s)
                        ON CONFLICT (email) 
                        DO UPDATE SET name = EXCLUDED.name, target_role = EXCLUDED.target_role, readiness_score = EXCLUDED.readiness_score
                        RETURNING *
                    """, (name, email, target_role, readiness_score))
                    row = cursor.fetchone()
                    return dict(row) if row else {}
                else:
                    conn.row_factory = sqlite3.Row
                    cursor = conn.cursor()
                    cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
                    user = cursor.fetchone()
                    
                    if user:
                        cursor.execute(
                            "UPDATE users SET name = ?, target_role = ?, readiness_score = ? WHERE email = ?",
                            (name, target_role, readiness_score, email)
                        )
                        user_id = user["id"]
                    else:
                        cursor.execute(
                            "INSERT INTO users (name, email, target_role, readiness_score) VALUES (?, ?, ?, ?)",
                            (name, email, target_role, readiness_score)
                        )
                        user_id = cursor.lastrowid
                    return {"id": user_id, "name": name, "email": email, "target_role": target_role, "readiness_score": readiness_score}
            except Exception as e:
                logger.error(f"Database save_user failed: {str(e)}")
                raise e

    def get_user(self, email: str) -> Optional[Dict[str, Any]]:
        """Retrieves user profile details by email."""
        postgres_mode = self.is_postgres_active()
        with self.get_connection() as conn:
            try:
                if postgres_mode:
                    cursor = conn.cursor(cursor_factory=RealDictCursor)
                    cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
                    row = cursor.fetchone()
                    return dict(row) if row else None
                else:
                    conn.row_factory = sqlite3.Row
                    cursor = conn.cursor()
                    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
                    row = cursor.fetchone()
                    return dict(row) if row else None
            except Exception as e:
                logger.error(f"Database get_user failed: {str(e)}")
                return None

    def save_resume(self, user_id: int, filename: str, raw_text: str, ats_score: float, file_url: Optional[str] = None) -> Dict[str, Any]:
        """Saves parsed resume attributes."""
        postgres_mode = self.is_postgres_active()
        with self.get_connection() as conn:
            try:
                if postgres_mode:
                    cursor = conn.cursor(cursor_factory=RealDictCursor)
                    cursor.execute("""
                        INSERT INTO resumes (user_id, filename, file_url, raw_text, ats_score) 
                        VALUES (%s, %s, %s, %s, %s)
                        RETURNING *
                    """, (user_id, filename, file_url, raw_text, ats_score))
                    row = cursor.fetchone()
                    return dict(row) if row else {}
                else:
                    cursor = conn.cursor()
                    cursor.execute(
                        "INSERT INTO resumes (user_id, filename, file_url, raw_text, ats_score) VALUES (?, ?, ?, ?, ?)",
                        (user_id, filename, file_url, raw_text, ats_score)
                    )
                    resume_id = cursor.lastrowid
                    return {"id": resume_id, "user_id": user_id, "filename": filename, "file_url": file_url, "raw_text": raw_text, "ats_score": ats_score}
            except Exception as e:
                logger.error(f"Database save_resume failed: {str(e)}")
                raise e

    def save_document(self, filename: str, file_url: Optional[str] = None, chunk_count: int = 0) -> Dict[str, Any]:
        """Saves uploaded document metadata."""
        postgres_mode = self.is_postgres_active()
        with self.get_connection() as conn:
            try:
                if postgres_mode:
                    cursor = conn.cursor(cursor_factory=RealDictCursor)
                    cursor.execute("""
                        INSERT INTO documents (filename, file_url, chunk_count) 
                        VALUES (%s, %s, %s)
                        RETURNING *
                    """, (filename, file_url, chunk_count))
                    row = cursor.fetchone()
                    return dict(row) if row else {}
                else:
                    cursor = conn.cursor()
                    cursor.execute(
                        "INSERT INTO documents (filename, file_url, chunk_count) VALUES (?, ?, ?)",
                        (filename, file_url, chunk_count)
                    )
                    doc_id = cursor.lastrowid
                    return {"id": doc_id, "filename": filename, "file_url": file_url, "chunk_count": chunk_count}
            except Exception as e:
                logger.error(f"Database save_document failed: {str(e)}")
                raise e

# Global instances
db_manager = DatabaseManager()

def init_db():
    db_manager.init_tables()
