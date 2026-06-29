import sqlite3
import hashlib
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "nexora.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_user_table():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT,
            name TEXT,
            picture TEXT,
            auth_provider TEXT DEFAULT 'email',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()


def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()


def create_user(email, password=None, name=None, picture=None, auth_provider="email"):
    conn = get_db()
    try:
        hashed = hash_password(password) if password else None
        conn.execute(
            "INSERT INTO users (email, password, name, picture, auth_provider) VALUES (?, ?, ?, ?, ?)",
            (email, hashed, name, picture, auth_provider),
        )
        conn.commit()
        user_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        return user_id
    except sqlite3.IntegrityError:
        return None
    finally:
        conn.close()


def get_user_by_email(email):
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()
    return dict(user) if user else None


def verify_user(email, password):
    user = get_user_by_email(email)
    if user and user["password"] == hash_password(password):
        return user
    return None
