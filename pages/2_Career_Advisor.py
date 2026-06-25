import streamlit as st
from services.mistral_service import mistral_service
from models.schemas import CareerRecommendation


st.set_page_config(page_title="Career Advisor & Recommendations", page_icon="🧭", layout="wide")

# Custom CSS for Consistency
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=Inter:wght@300;400;500;600&display=swap');
    html, body, [class*="css"] { font-family: 'Inter', sans-serif; background-color: #050811; color: #E2E8F0; }
    h1, h2, h3, h4 { font-family: 'Outfit', sans-serif !important; background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #D946EF 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .glass-card { background: rgba(15, 23, 42, 0.45); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 24px; backdrop-filter: blur(12px); margin-bottom: 20px; }
</style>
""", unsafe_allow_value=True)

st.title("🧭 AI Career Recommendations")

st.markdown("""
<div class="glass-card">
    <h3>Discover Optimal Job Pathways</h3>
    <p style="color: #94A3B8;">
        Leverage our multi-agent career intelligence engine to predict matching roles, check industry trends, and determine high-growth pathways suited to your unique skillset.
    </p>
</div>
""", unsafe_allow_value=True)

col1, col2 = st.columns([1, 1])

with col1:
    st.subheader("Your Technical Skills")
    skills_input = st.text_area("List your skills (comma separated)", "Python, Docker, SQLite, Git, basic Machine Learning", height=100)
    
    st.subheader("Years of Experience")
    experience_years = st.slider("Select your professional years of experience", 0, 15, 2)
    
    st.subheader("Interests / Goals")
    interests_input = st.text_input("e.g. Cloud engineering, AI deployments, backend scale", "MLOps, automated deployment, microservices")
    
    run_advisor = st.button("Generate Recommendations", type="primary")

with col2:
    st.subheader("Recommended Pathways")
    
    if run_advisor:
        with st.spinner("Analyzing candidate profile against market demand data..."):
            prompt = f"""
            Analyze this candidate profile:
            Skills: {skills_input}
            Experience: {experience_years} years
            Interests: {interests_input}
            
            Predict the top 3 most suitable job roles, reason why they fit, and detail market growth/salary trends for each.
            """
            
            system_instruction = "You are a senior tech career strategist and recruiting expert. Output predictions matching the requested schema."
            
            try:
                rec: CareerRecommendation = mistral_service.generate_structured_completion(
                    prompt=prompt,
                    system_instruction=system_instruction,
                    response_model=CareerRecommendation
                )

                
                st.success("Advisor recommendations successfully prepared!")
                
                st.markdown("### Top Role Fits:")
                for role in rec.predicted_roles:
                    st.markdown(f"- 🌟 **{role}**")
                    
                st.markdown("### Fit Alignment Reasoning:")
                st.write(rec.alignment_reasoning)
                
                st.markdown("### Market Demand & Growth Trends:")
                for role, trend in rec.growth_trends.items():
                    st.markdown(f"- **{role}**: {trend}")
                    
                # Save predictions in session state for downstream pages
                st.session_state["predicted_roles"] = rec.predicted_roles
                
            except Exception as e:
                st.error(f"Error calculating career recommendation: {str(e)}")
    else:
        st.info("Input your profile details and click 'Generate Recommendations' to begin.")
