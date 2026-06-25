import os
import sqlite3
from typing import Dict, Any, List, Optional
from utils.logger import logger

# Import psycopg2 dynamically for PostgreSQL support
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    POSTGRES_AVAILABLE = True
except ImportError:
    POSTGRES_AVAILABLE = False

class DatabaseManager:
    def __init__(self):
        self.db_url = os.getenv("DATABASE_URL", "")
        # Clean quotes
        if self.db_url:
            self.db_url = self.db_url.strip("'\"")

        self.sqlite_db = "nexora_career.db"

    def is_postgres_active(self) -> bool:
        return POSTGRES_AVAILABLE and (self.db_url.startswith("postgresql://") or self.db_url.startswith("postgres://"))

    def get_connection(self):
        """Creates and returns a connection. Caller is responsible for closing."""
        if self.is_postgres_active():
            return psycopg2.connect(self.db_url)
        return sqlite3.connect(self.sqlite_db)

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
                raw_text TEXT,
                ats_score REAL,
                skills_json {json_type},
                insights_json {json_type},
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

        conn = self.get_connection()
        try:
            cursor = conn.cursor()
            for q in queries:
                cursor.execute(q)
            conn.commit()
            logger.info(f"Schema tables initialized successfully on: {db_type}")
        except Exception as e:
            logger.error(f"Error during schema initialization: {str(e)}")
            conn.rollback()
            raise e
        finally:
            conn.close()

    def save_user(self, name: str, email: str, target_role: str, readiness_score: float) -> Dict[str, Any]:
        """Saves user data and returns the updated record."""
        postgres_mode = self.is_postgres_active()
        conn = self.get_connection()
        try:
            if postgres_mode:
                # Direct psycopg2 cursor returning dictionary records
                cursor = conn.cursor(cursor_factory=RealDictCursor)
                # Postgres support for ON CONFLICT (email) DO UPDATE
                cursor.execute("""
                    INSERT INTO users (name, email, target_role, readiness_score) 
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (email) 
                    DO UPDATE SET name = EXCLUDED.name, target_role = EXCLUDED.target_role, readiness_score = EXCLUDED.readiness_score
                    RETURNING *
                """, (name, email, target_role, readiness_score))
                row = cursor.fetchone()
                conn.commit()
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
                conn.commit()
                return {"id": user_id, "name": name, "email": email, "target_role": target_role, "readiness_score": readiness_score}
        except Exception as e:
            logger.error(f"Database save_user failed: {str(e)}")
            conn.rollback()
            raise e
        finally:
            conn.close()

    def get_user(self, email: str) -> Optional[Dict[str, Any]]:
        """Retrieves user profile details by email."""
        postgres_mode = self.is_postgres_active()
        conn = self.get_connection()
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
        finally:
            conn.close()

    def save_resume(self, user_id: int, filename: str, raw_text: str, ats_score: float) -> Dict[str, Any]:
        """Saves parsed resume attributes."""
        postgres_mode = self.is_postgres_active()
        conn = self.get_connection()
        try:
            if postgres_mode:
                cursor = conn.cursor(cursor_factory=RealDictCursor)
                cursor.execute("""
                    INSERT INTO resumes (user_id, filename, raw_text, ats_score) 
                    VALUES (%s, %s, %s, %s)
                    RETURNING *
                """, (user_id, filename, raw_text, ats_score))
                row = cursor.fetchone()
                conn.commit()
                return dict(row) if row else {}
            else:
                cursor = conn.cursor()
                cursor.execute(
                    "INSERT INTO resumes (user_id, filename, raw_text, ats_score) VALUES (?, ?, ?, ?)",
                    (user_id, filename, raw_text, ats_score)
                )
                resume_id = cursor.lastrowid
                conn.commit()
                return {"id": resume_id, "user_id": user_id, "filename": filename, "raw_text": raw_text, "ats_score": ats_score}
        except Exception as e:
            logger.error(f"Database save_resume failed: {str(e)}")
            conn.rollback()
            raise e
        finally:
            conn.close()

# Global instances
db_manager = DatabaseManager()

def init_db():
    db_manager.init_tables()
