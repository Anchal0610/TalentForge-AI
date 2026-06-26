import streamlit as st
import os
import sys

# Add root folder to path so imports work correctly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.connection import init_db
from services.auth import (
    handle_oauth_redirect,
    login_button,
    logout,
    is_logged_in,
    get_user,
    is_configured as auth_configured,
)
from utils.logger import logger

# Initialize database on application start
try:
    init_db()
except Exception as e:
    logger.error(f"Failed database setup on app startup: {str(e)}")

# Page Configuration
st.set_page_config(
    page_title="Nexora AI – Career Intelligence Dashboard",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Handle OAuth redirect callback
handle_oauth_redirect()

# Custom CSS for Next-Gen Aesthetic (Glassmorphism + Dark Mode + Neon Accents)
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=Inter:wght@300;400;500;600&display=swap');
    
    /* General Styles */
    html, body, [class*="css"] {
        font-family: 'Inter', sans-serif;
        background-color: #050811;
        color: #E2E8F0;
    }
    
    .stApp {
        background: radial-gradient(circle at 50% 50%, #0c1020 0%, #050811 100%);
    }
    
    h1, h2, h3, h4, h5, h6 {
        font-family: 'Outfit', sans-serif !important;
        font-weight: 700 !important;
        background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #D946EF 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    
    /* Premium Glassmorphic Cards */
    .glass-card {
        background: rgba(15, 23, 42, 0.45);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        padding: 24px;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        margin-bottom: 20px;
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        transition: all 0.3s ease-in-out;
    }
    
    .glass-card:hover {
        border-color: rgba(99, 102, 241, 0.4);
        box-shadow: 0 8px 32px 0 rgba(99, 102, 241, 0.15);
        transform: translateY(-2px);
    }
    
    /* Neon badges */
    .neon-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 50px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 10px;
    }
    
    .badge-blue { background: rgba(59, 130, 246, 0.2); border: 1px solid #3B82F6; color: #60A5FA; }
    .badge-green { background: rgba(16, 185, 129, 0.2); border: 1px solid #10B981; color: #34D399; }
    .badge-purple { background: rgba(139, 92, 246, 0.2); border: 1px solid #8B5CF6; color: #A78BFA; }
    
    /* Metric styling */
    .metric-value {
        font-size: 2.5rem;
        font-weight: 700;
        font-family: 'Outfit', sans-serif;
        color: #FFFFFF;
        margin-top: 5px;
    }
</style>
""", unsafe_allow_html=True)

# Sidebar with authentication
with st.sidebar:
    st.markdown("### ⚡ Nexora AI")
    st.divider()
    if is_logged_in():
        user = get_user()
        st.markdown(f"**Welcome, {user.get('name', 'User')}**")
        if user.get("picture"):
            st.image(user["picture"], width=60)
        st.caption(f"_{user.get('email', '')}_")
        if st.button("🚪 Sign Out", use_container_width=True):
            logout()
            st.rerun()
    else:
        st.markdown("#### Sign In")
        login_button()
        if not auth_configured():
            st.caption("Configure Google OAuth in .env")
    st.divider()
    st.page_link("app.py", label="🏠 Home", icon=None)
    st.page_link("pages/1_Resume_Intelligence.py", label="📄 Resume ATS", icon=None)
    st.page_link("pages/2_Career_Advisor.py", label="🎯 Career Advisor", icon=None)
    st.page_link("pages/3_Skill_Gap.py", label="📊 Skill Gap", icon=None)
    st.page_link("pages/4_Document_Intelligence.py", label="📚 Document RAG", icon=None)
    st.page_link("pages/5_Interview_Prep.py", label="🎤 Interview Prep", icon=None)
    st.page_link("pages/6_Knowledge_Graph.py", label="🕸️ Knowledge Graph", icon=None)
    st.page_link("pages/7_Embedding_Visualization.py", label="🔮 Embeddings", icon=None)
    st.page_link("pages/8_Roadmap_and_Readiness.py", label="🗺️ Roadmap", icon=None)
    st.page_link("pages/9_Admin_Dashboard.py", label="⚙️ Admin", icon=None)

# App Header
st.markdown("""
<div style='text-align: center; margin-top: 2rem; margin-bottom: 3rem;'>
    <h1 style='font-size: 3.5rem; margin-bottom: 0.2rem;'>Nexora AI</h1>
    <p style='font-size: 1.25rem; color: #94A3B8; font-weight: 300; letter-spacing: 0.05em;'>
        ANALYZE. LEARN. UPGRADE. GET INTERVIEW READY.
    </p>
</div>
""", unsafe_allow_html=True)

# Main Dashboard layout
col1, col2 = st.columns([2, 1])

with col1:
    st.markdown("""
    <div class="glass-card">
        <div class="neon-badge badge-blue">Platform Overview</div>
        <h3>Welcome to the Next-Gen Career Ecosystem</h3>
        <p style="color: #94A3B8; line-height: 1.6;">
            Nexora AI leverages advanced multi-agent systems, deep RAG pipelines, and vector embeddings to construct a hyper-personalized roadmap tailored for your engineering journey. Scan your resume, explore target requirements, learn from intelligent summaries, practice mock sessions, and visualize your skillset in 3D.
        </p>
        <div style="margin-top: 1.5rem;">
            <p style="color: #E2E8F0; font-weight: 600; margin-bottom: 0.5rem;">🚀 Available Modules:</p>
            <ul style="color: #94A3B8; line-height: 1.8; padding-left: 20px;">
                <li><b>Resume Intelligence & ATS Analysis</b>: Check resume match rates and optimization items.</li>
                <li><b>Career Advisor & Recommendations</b>: Discover top titles and market growth insights.</li>
                <li><b>Skill Gap Analysis</b>: Detailed checklist of missing libraries, tools, and algorithms.</li>
                <li><b>Document Intelligence</b>: Summarize documents and auto-extract core exam concepts.</li>
                <li><b>Interview Prep Suite</b>: Tiered answers (Beginner to Expert) and interactive mock evaluations.</li>
                <li><b>3D Vector & Knowledge Graph Explorers</b>: Interact with skills mapped to job clusters.</li>
            </ul>
        </div>
    </div>
    """, unsafe_allow_html=True)

with col2:
    st.markdown("""
    <div class="glass-card" style="text-align: center;">
        <div class="neon-badge badge-green">Candidate Health</div>
        <h4>Active Profile</h4>
        <div style="margin: 1.5rem 0;">
            <div style="color: #94A3B8; font-size: 0.85rem;">OVERALL READINESS</div>
            <div class="metric-value" style="color: #10B981;">74.5%</div>
        </div>
        <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 1rem;">
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.5rem;">
                <span style="color: #94A3B8;">ATS Score:</span>
                <span style="color: #3B82F6; font-weight: 600;">82.0%</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.5rem;">
                <span style="color: #94A3B8;">Skill Gap Matches:</span>
                <span style="color: #8B5CF6; font-weight: 600;">68.0%</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                <span style="color: #94A3B8;">Interview Completion:</span>
                <span style="color: #F59E0B; font-weight: 600;">Completed</span>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)

# Footer
st.markdown("""
<div style='text-align: center; margin-top: 5rem; padding-bottom: 2rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1.5rem;'>
    <p style='font-size: 0.8rem; color: #64748B;'>Nexora AI &copy; 2026. Made with &hearts; for Hackathon Excellence.</p>
</div>
""", unsafe_allow_html=True)
