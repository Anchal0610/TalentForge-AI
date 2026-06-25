import streamlit as st
import pandas as pd
from services.openai_service import openai_service
from models.schemas import LearningRoadmap, CareerReadiness

st.set_page_config(page_title="Roadmap & Readiness Score", page_icon="🛣️", layout="wide")

# Custom CSS
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=Inter:wght@300;400;500;600&display=swap');
    html, body, [class*="css"] { font-family: 'Inter', sans-serif; background-color: #050811; color: #E2E8F0; }
    h1, h2, h3, h4 { font-family: 'Outfit', sans-serif !important; background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #D946EF 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .glass-card { background: rgba(15, 23, 42, 0.45); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 24px; backdrop-filter: blur(12px); margin-bottom: 20px; }
</style>
""", unsafe_allow_value=True)

st.title("🛣️ Learning Roadmaps & Career Readiness Score")

st.markdown("""
<div class="glass-card">
    <h3>Plan Your Skill Transition & Trace Success</h3>
    <p style="color: #94A3B8;">
        Explore your week-by-week custom syllabus complete with milestones and certifications. Monitor your Career Readiness score, structured using weighted profiles, mock transcripts, and core skills match metrics.
    </p>
</div>
""", unsafe_allow_value=True)

target_role = st.session_state.get("target_role", "MLOps Engineer")
missing_skills = st.session_state.get("missing_skills_list", ["Docker", "Kubernetes", "Vector Databases"])

col1, col2 = st.columns([1.5, 1])

with col1:
    st.subheader("Your Custom Weekly Learning Syllabus")
    
    if st.button("Generate Learning Roadmap", type="primary"):
        with st.spinner("Assembling curriculum and project milestones..."):
            prompt = f"""
            Target Role: {target_role}
            Missing Skills to close: {", ".join(missing_skills)}
            
            Build a comprehensive weekly learning plan spanning multiple weeks. Detail specific topics, study resources, coding project milestones, and credential options.
            """
            
            try:
                roadmap: LearningRoadmap = openai_service.generate_structured_completion(
                    prompt=prompt,
                    system_instruction="You are a professional software instructor and technical syllabus architect.",
                    response_model=LearningRoadmap
                )
                
                st.success(f"Curriculum successfully created! Target duration: {roadmap.estimated_completion_weeks} Weeks.")
                
                for step in roadmap.weekly_plan:
                    with st.expander(f"📅 WEEK {step.week}: {step.topic}"):
                        st.markdown("**Core Learning Resources:**")
                        for res in step.resources:
                            st.markdown(f"- 📖 {res}")
                        st.markdown(f"**Weekly Code Milestone:**\n*💻 {step.project_milestone}*")
                        if step.certification_suggestion:
                            st.markdown(f"**Recommended Certification:** `{step.certification_suggestion}`")
                            
            except Exception as e:
                st.error(f"Error compiling roadmap: {str(e)}")
    else:
        st.info("Click 'Generate Learning Roadmap' to create a weekly study curriculum.")

with col2:
    st.subheader("Career Readiness & Analytics")
    
    if st.button("Compute Readiness Score"):
        with st.spinner("Analyzing candidate performance profiles..."):
            prompt = f"""
            Target Role: {target_role}
            Current Skills: {st.session_state.get('current_skills_list', ['Python', 'Docker'])}
            Missing Skills: {missing_skills}
            Mock Interview History Score: 80%
            
            Calculate candidate career readiness. Provide percentage metrics and prioritized actions.
            """
            
            try:
                readiness: CareerReadiness = openai_service.generate_structured_completion(
                    prompt=prompt,
                    system_instruction="You are an expert HR quantitative analyst. Output career readiness profiles.",
                    response_model=CareerReadiness
                )
                
                st.success("Readiness indices refreshed!")
                
                # Big score badge
                score = readiness.overall_percentage
                color = "#10B981" if score >= 80 else "#F59E0B" if score >= 60 else "#EF4444"
                st.markdown(f"""
                <div class="glass-card" style="text-align: center; border-color: {color};">
                    <div style="font-size: 0.9rem; color: #94A3B8;">INDEX LEVEL</div>
                    <div style="font-size: 3.5rem; font-weight: 700; color: {color}; font-family: 'Outfit';">{score}%</div>
                </div>
                """, unsafe_allow_value=True)
                
                # Display metrics breakdown
                st.write("**Assessment Weights Breakdown:**")
                st.write(f"- Resume strength: `{readiness.profile_strength}%`")
                st.write(f"- Technical skills fit: `{readiness.skill_match_strength}%`")
                st.write(f"- Mock interview proficiency: `{readiness.mock_interview_strength}%`")
                
                st.markdown("### Next Immediate Steps:")
                for step in readiness.next_steps:
                    st.markdown(f"- 📈 {step}")
                    
            except Exception as e:
                st.error(f"Error calculating readiness: {str(e)}")
    else:
        st.info("Click 'Compute Readiness Score' to calculate profile matching health indices.")
