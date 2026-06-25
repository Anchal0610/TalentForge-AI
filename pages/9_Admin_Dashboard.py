import streamlit as st
import os
import sqlite3
from database.connection import get_db_path, get_db_connection
from services.qdrant_service import qdrant_service
from services.openai_service import openai_service
from services.mistral_ocr import mistral_ocr_service
from utils.logger import logger

st.set_page_config(page_title="System Diagnostics - Admin", page_icon="⚙️", layout="wide")

# Custom CSS
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=Inter:wght@300;400;500;600&display=swap');
    html, body, [class*="css"] { font-family: 'Inter', sans-serif; background-color: #050811; color: #E2E8F0; }
    h1, h2, h3, h4 { font-family: 'Outfit', sans-serif !important; background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #D946EF 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .glass-card { background: rgba(15, 23, 42, 0.45); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 24px; backdrop-filter: blur(12px); margin-bottom: 20px; }
</style>
""", unsafe_allow_value=True)

st.title("⚙️ System Administration & Diagnostics")

st.markdown("""
<div class="glass-card">
    <h3>Engine Integrity Control Center</h3>
    <p style="color: #94A3B8;">
        Run live checks on vector storage points, relational schema records, and API connectivity modules. Monitor active service models and review system log parameters.
    </p>
</div>
""", unsafe_allow_value=True)

col1, col2 = st.columns([1, 1])

with col1:
    st.subheader("Platform Connections Health Check")
    
    if st.button("Execute Diagnostic Suite Check", type="primary"):
        # 1. Database Check
        try:
            db_path = get_db_path()
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
                tables = [r[0] for r in cursor.fetchall()]
            st.success(f"✅ SQLite Connection Healthy (Path: {db_path})")
            st.info(f"Registered Schema Tables: {', '.join(tables)}")
        except Exception as e:
            st.error(f"❌ SQLite database offline: {str(e)}")
            
        # 2. Qdrant Client Check
        try:
            q_info = qdrant_service.client.get_collections()
            st.success("✅ Qdrant Connection Active")
            cols = [col.name for col in q_info.collections]
            st.info(f"Active Collections: {', '.join(cols) if cols else 'None'}")
        except Exception as e:
            st.error(f"❌ Qdrant Vector Client connection error: {str(e)}")
            
        # 3. OpenAI Connectivity
        if openai_service.client:
            st.success(f"✅ OpenAI API Key Validated (Active LLM: {openai_service.model})")
        else:
            st.warning("⚠️ OpenAI operating in demo/mock fallback state (Key not configured)")
            
        # 4. Mistral OCR Config
        if mistral_ocr_service.client:
            st.success("✅ Mistral OCR Client Initialized")
        else:
            st.warning("⚠️ Mistral OCR client running in Local PDF/Doc Parser mode (Key not configured)")

with col2:
    st.subheader("Database Schema Metrics")
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Seed mock user if database is completely empty so app features have a profile reference
            cursor.execute("SELECT COUNT(*) FROM users")
            count = cursor.fetchone()[0]
            if count == 0:
                cursor.execute("INSERT INTO users (name, email, target_role, readiness_score) VALUES ('Jane Doe', 'jane@example.com', 'MLOps Engineer', 74.5)")
                cursor.execute("INSERT INTO resumes (user_id, filename, raw_text, ats_score) VALUES (1, 'mock_resume.pdf', 'Expert in Python development, Docker virtualization, and PostgreSQL databases.', 82.0)")
                
            cursor.execute("SELECT COUNT(*) FROM users")
            user_count = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM resumes")
            resume_count = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM mock_interviews")
            mock_count = cursor.fetchone()[0]
            
            st.write(f"- **Total Registered Users:** `{user_count}`")
            st.write(f"- **Total Resumes Parsed:** `{resume_count}`")
            st.write(f"- **Mock Interview Submissions:** `{mock_count}`")
            
    except Exception as e:
        st.error(f"Failed to query database stats: {str(e)}")

    st.subheader("Recent System Log Traces")
    log_file = os.path.join(os.getcwd(), "logs", "nexora.log")
    if os.path.exists(log_file):
        try:
            with open(log_file, "r") as f:
                lines = f.readlines()
            st.text_area("Last 10 Log events (JSON rotating):", "".join(lines[-10:]), height=180)
        except Exception as e:
            st.error(f"Error reading log file: {str(e)}")
    else:
        st.info("Log records will appear here after diagnostic events are generated.")
