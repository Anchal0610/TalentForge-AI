import streamlit as st
import numpy as np
from services.mistral_service import mistral_service
from visualization.embedding_plot import embedding_plotter
from utils.logger import logger

st.set_page_config(page_title="3D Embedding Explorer", page_icon="🔮", layout="wide")

# Custom CSS
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=Inter:wght@300;400;500;600&display=swap');
    html, body, [class*="css"] { font-family: 'Inter', sans-serif; background-color: #050811; color: #E2E8F0; }
    h1, h2, h3, h4 { font-family: 'Outfit', sans-serif !important; background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #D946EF 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .glass-card { background: rgba(15, 23, 42, 0.45); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 24px; backdrop-filter: blur(12px); margin-bottom: 20px; }
</style>
""", unsafe_allow_html=True)

st.title("🔮 3D Vector Embedding Space Explorer")

st.markdown("""
<div class="glass-card">
    <h3>High-Dimensional Skill & Role Clustering</h3>
    <p style="color: #94A3B8;">
        Visualize your skills in semantic relation to target roles, libraries, resources, and question banks. High-dimensional vector embeddings are computed and projected down to 3D components. 
        You can visually see the proximity vector between your candidate profile and target job roles.
    </p>
</div>
""", unsafe_allow_html=True)

# Select settings
reducer_choice = st.sidebar.selectbox("Dimension Reduction Algorithm", ["UMAP", "t-SNE"])

# Define nodes to embed
user_skills = st.session_state.get("current_skills_list", ["Python", "SQL", "Flask", "Docker"])
missing_skills = st.session_state.get("missing_skills_list", ["Kubernetes", "CI/CD Pipelines", "Qdrant / Vector Databases"])
target_role = st.session_state.get("target_role", "MLOps Engineer")

# Compile complete list for embedding mapping
labels = ["Candidate Profile", target_role] + user_skills + missing_skills
categories = ["User", "Role"] + ["Skill"] * len(user_skills) + ["Technology"] * len(missing_skills)

# Add some learning resources for visualization thickness
for skill in missing_skills[:2]:
    labels.append(f"Accelerated {skill} Guide")
    categories.append("Resource")

st.sidebar.markdown("### Filter Workspace Nodes")
show_skills = st.sidebar.checkbox("Show Acquired Skills", value=True)
show_gaps = st.sidebar.checkbox("Show Missing Skill Gaps", value=True)
show_resources = st.sidebar.checkbox("Show Learning Resources", value=True)

# Filter lists based on sidebar checks
filtered_labels = []
filtered_categories = []

for lbl, cat in zip(labels, categories):
    if cat == "User" or cat == "Role":
        filtered_labels.append(lbl)
        filtered_categories.append(cat)
    elif cat == "Skill" and show_skills:
        filtered_labels.append(lbl)
        filtered_categories.append(cat)
    elif cat == "Technology" and show_gaps:
        filtered_labels.append(lbl)
        filtered_categories.append(cat)
    elif cat == "Resource" and show_resources:
        filtered_labels.append(lbl)
        filtered_categories.append(cat)

col1, col2 = st.columns([3, 1])

with col1:
    st.subheader(f"Projected 3D Vector Space ({reducer_choice})")
    
    with st.spinner("Generating embeddings and running vector projections..."):
        # Generate embeddings
        embeddings = []
        for text in filtered_labels:
            emb = mistral_service.get_embedding(text)
            embeddings.append(emb)
            
        # Draw scatter
        fig = embedding_plotter.generate_3d_scatter(
            labels=filtered_labels,
            categories=filtered_categories,
            embeddings=embeddings,
            reducer_type=reducer_choice
        )
        
        st.plotly_chart(fig, use_container_width=True)

with col2:
    st.subheader("Semantic Proximity Insights")
    st.markdown("""
    When embeddings are projected, similar concepts cluster together in vector space:
    - **Proximity Vector**: The dotted line shows the shortest path to align your capabilities with the target role requirements.
    - **Clustering**: Check how close your profile is to individual tools. If your profile is far from *Kubernetes*, it confirms MLOps readiness gap priority.
    """)
    
    if len(user_skills) > 0 and len(missing_skills) > 0:
        st.markdown("### Actionable Next Steps")
        st.markdown(f"1. Close your distance to **{missing_skills[0]}** by building a containerized project.")
        st.markdown("2. Check the learning resources mapped next to the missing clusters.")
