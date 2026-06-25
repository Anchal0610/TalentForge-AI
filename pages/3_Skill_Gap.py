import streamlit as st
import pandas as pd
from services.mistral_service import mistral_service
from models.schemas import SkillGapAnalysis

st.set_page_config(page_title="Skill Gap Analysis", page_icon="⚖️", layout="wide")

# Custom CSS
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=Inter:wght@300;400;500;600&display=swap');
    html, body, [class*="css"] { font-family: 'Inter', sans-serif; background-color: #050811; color: #E2E8F0; }
    h1, h2, h3, h4 { font-family: 'Outfit', sans-serif !important; background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #D946EF 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .glass-card { background: rgba(15, 23, 42, 0.45); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 24px; backdrop-filter: blur(12px); margin-bottom: 20px; }
</style>
""", unsafe_allow_value=True)

st.title("⚖️ Skill Gap Analysis")

st.markdown("""
<div class="glass-card">
    <h3>Identify What is Keeping You From Your Next Role</h3>
    <p style="color: #94A3B8;">
        Select your target engineering title and compare your capabilities. The engine maps missing tech stacks, libraries, tools, and estimates study time to help prioritize your learning schedule.
    </p>
</div>
""", unsafe_allow_value=True)

# Try loading predicted roles from advisor page, fallback to presets
target_roles = st.session_state.get("predicted_roles", ["MLOps Engineer", "Data Engineer", "Backend Developer", "DevOps Specialist"])

col1, col2 = st.columns([1, 1.5])

with col1:
    st.subheader("Select Target Role")
    target_role = st.selectbox("Which role are you targeting?", target_roles)
    
    st.subheader("Your Current Capabilities")
    current_skills = st.text_area(
        "Current Skill Inventory (comma separated)", 
        "Python, Docker, SQLite, Git, SQL, Flask"
    )
    
    run_gap = st.button("Calculate Skill Gap Matrix", type="primary")

with col2:
    st.subheader("Gap Diagnostics")
    
    if run_gap:
        with st.spinner("Analyzing target role competency standard requirements..."):
            prompt = f"""
            Target Role: {target_role}
            Current Candidate Skills: {current_skills}
            
            Compare these two sets. Identify the specific tools, libraries, or system architectural concepts missing in the candidate's skills that are required for a {target_role}.
            Estimate current and required proficiency levels, required learning hours, and priority rating (High/Medium/Low).
            """
            
            system_instruction = "You are a tech assessor and skills gap specialist. Match the output structure precisely."
            
            try:
                gap_analysis: SkillGapAnalysis = mistral_service.generate_structured_completion(
                    prompt=prompt,
                    system_instruction=system_instruction,
                    response_model=SkillGapAnalysis
                )
                
                st.success("Skill Gap Matrix calculated!")
                
                # Show Gap Percentage
                pct = gap_analysis.overall_gap_percentage
                pct_color = "#EF4444" if pct > 50 else "#F59E0B" if pct > 20 else "#10B981"
                st.markdown(f"""
                <div class="glass-card" style="text-align: center; border-color: {pct_color};">
                    <div style="font-size: 0.9rem; color: #94A3B8;">SKILL GAP COEFFICIENT</div>
                    <div style="font-size: 3.5rem; font-weight: 700; color: {pct_color}; font-family: 'Outfit';">{pct}% Missing</div>
                </div>
                """, unsafe_allow_value=True)
                
                # Store list of missing skills in session state
                missing_names = [g.skill_name for g in gap_analysis.gaps]
                st.session_state["target_role"] = target_role
                st.session_state["current_skills_list"] = [s.strip() for s in current_skills.split(",")]
                st.session_state["missing_skills_list"] = missing_names
                
                # Build pandas table for display
                gap_table = []
                for g in gap_analysis.gaps:
                    gap_table.append({
                        "Skill / Tool": g.skill_name,
                        "Current": g.current_proficiency,
                        "Required": g.required_proficiency,
                        "Study Hours": g.estimated_learning_hours,
                        "Priority": g.priority
                    })
                    
                df = pd.DataFrame(gap_table)
                st.dataframe(df, use_container_width=True, hide_index=True)
                
                # Summary Priority List
                st.markdown("### 🎯 Recommended Study Order:")
                for i, item in enumerate(gap_analysis.gaps):
                    st.markdown(f"{i+1}. **{item.skill_name}** – {item.priority} Priority (Requires ~{item.estimated_learning_hours} hrs of learning)")
                    
            except Exception as e:
                st.error(f"Error calculating skill gaps: {str(e)}")
    else:
        st.info("Select a target role and click 'Calculate Skill Gap Matrix' to visualize competency differences.")
