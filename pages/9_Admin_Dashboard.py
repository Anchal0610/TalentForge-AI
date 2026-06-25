import streamlit as st
import os
import sqlite3
from database.connection import db_manager
from services.pinecone_service import pinecone_service
from services.mistral_service import mistral_service
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
        Run live checks on vector storage indexes, relational schema tables, and API connectivity modules. Monitor active service models and review system log parameters.
    </p>
</div>
""", unsafe_allow_value=True)

col1, col2 = st.columns([1, 1])

with col1:
    st.subheader("Platform Connections Health Check")
    
    if st.button("Execute Diagnostic Suite Check", type="primary"):
        # 1. Database Check (Neon vs SQLite)
        postgres_mode = db_manager.is_postgres_active()
        db_type = "Neon PostgreSQL" if postgres_mode else "Local SQLite"
        try:
            conn = db_manager.get_connection()
            cursor = conn.cursor()
            if postgres_mode:
                cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
                tables = [r[0] for r in cursor.fetchall()]
            else:
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
                tables = [r[0] for r in cursor.fetchall()]
            conn.close()
            st.success(f"✅ {db_type} Connection Healthy")
            st.info(f"Registered Schema Tables: {', '.join(tables)}")
        except Exception as e:
            st.error(f"❌ {db_type} database connection error: {str(e)}")
            
        # 2. Pinecone Client Check
        try:
            if pinecone_service.pc:
                active_indexes = [idx.name for idx in pinecone_service.pc.list_indexes()]
                st.success("✅ Pinecone Vector Connection Active")
                st.info(f"Active Indexes: {', '.join(active_indexes) if active_indexes else 'None'}")
            else:
                st.warning("⚠️ Pinecone Vector Client running in demo/mock fallback state")
        except Exception as e:
            st.error(f"❌ Pinecone Vector Client connection error: {str(e)}")
            
        # 3. Mistral AI Model Connectivity
        if mistral_service.client:
            st.success(f"✅ Mistral AI Client Validated (Active LLM: {mistral_service.model})")
        else:
            st.warning("⚠️ Mistral LLM operating in demo/mock fallback state (Key not configured)")
            
        # 4. Mistral OCR Config
        if mistral_ocr_service.client:
            st.success("✅ Mistral OCR Client Initialized")
        else:
            st.warning("⚠️ Mistral OCR client running in Local PDF/Doc Parser mode (Key not configured)")

with col2:
    st.subheader("Database Schema Metrics")
    try:
        def get_count(table_name):
            try:
                conn = db_manager.get_connection()
                cursor = conn.cursor()
                cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                count = cursor.fetchone()[0]
                conn.close()
                return count
            except Exception:
                return 0
                
        user_count = get_count("users")
        resume_count = get_count("resumes")
        mock_count = get_count("mock_interviews")
            
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
