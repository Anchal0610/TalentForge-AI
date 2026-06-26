import streamlit as st
from graph.graph_builder import CareerGraphBuilder
from utils.logger import logger

st.set_page_config(page_title="Knowledge Graph Explorer", page_icon="🕸️", layout="wide")

# Custom CSS
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=Inter:wght@300;400;500;600&display=swap');
    html, body, [class*="css"] { font-family: 'Inter', sans-serif; background-color: #050811; color: #E2E8F0; }
    h1, h2, h3, h4 { font-family: 'Outfit', sans-serif !important; background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #D946EF 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .glass-card { background: rgba(15, 23, 42, 0.45); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 24px; backdrop-filter: blur(12px); margin-bottom: 20px; }
</style>
""", unsafe_allow_html=True)

st.title("🕸️ Career Knowledge Graph Explorer")

st.markdown("""
<div class="glass-card">
    <h3>Semantic Mapping of Skills & Resources</h3>
    <p style="color: #94A3B8;">
        Visualize how your capabilities link to target engineering roles, technologies, projects, study guides, and mock interviews. Red connections indicate critical missing skills (gaps) to acquire.
    </p>
</div>
""", unsafe_allow_html=True)

# Fetch from session state or use default seed data
user_name = "Jane Doe"
target_role = st.session_state.get("target_role", "MLOps Engineer")
skills = st.session_state.get("current_skills_list", ["Python", "SQL", "Flask", "Docker"])
gaps = st.session_state.get("missing_skills_list", ["Kubernetes", "CI/CD Pipelines", "Qdrant / Vector Databases"])
projects = ["Churn Predictor API", "Ingestion Engine"]

col1, col2 = st.columns([3, 1])

with col1:
    st.subheader("Interactive Skill Graph Map")
    
    with st.spinner("Stitching nodes and assembling visual relationships..."):
        # Build the graph using builder
        kg = CareerGraphBuilder.build_user_career_graph(
            user_name=user_name,
            target_role=target_role,
            skills=skills,
            gaps=gaps,
            projects=projects
        )
        
        # Get plotly figure
        fig = kg.build_plotly_figure()
        st.plotly_chart(fig, use_container_width=True)

with col2:
    st.subheader("Graph Legend")
    st.markdown("""
    - <span style="color:#FF4B4B; font-weight:bold;">● User Node</span>: Represents you.
    - <span style="color:#00C0F2; font-weight:bold;">● Target Role</span>: The title you are pursuing.
    - <span style="color:#00F294; font-weight:bold;">● Acquired Skill</span>: Your parsed/validated capabilities.
    - <span style="color:#FFAA00; font-weight:bold;">● Technology Category</span>: Broad stack classifications.
    - <span style="color:#D946EF; font-weight:bold;">● Study Guides</span>: Resources to close gaps.
    - <span style="color:#A855F7; font-weight:bold;">● Interview Questions</span>: Interactive practice files.
    - <span style="color:#EAB308; font-weight:bold;">● Project Node</span>: Portfolio builds.
    """, unsafe_allow_html=True)
    
    st.markdown("---")
    st.write(f"**Total nodes parsed:** {len(kg.graph.nodes)}")
    st.write(f"**Total edges linked:** {len(kg.graph.edges)}")
    
    if st.button("Refresh Graph Data"):
        st.rerun()
