import streamlit as st
import os
from services.mistral_ocr import mistral_ocr_service
from services.ats_service import ats_service
from services.imagekit_service import imagekit_service
from database.connection import db_manager
from utils.logger import logger

st.set_page_config(page_title="Resume Intelligence & ATS Checker", page_icon="📄", layout="wide")

# Inject same styles for consistency
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=Inter:wght@300;400;500;600&display=swap');
    html, body, [class*="css"] { font-family: 'Inter', sans-serif; background-color: #050811; color: #E2E8F0; }
    h1, h2, h3, h4 { font-family: 'Outfit', sans-serif !important; background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #D946EF 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .glass-card { background: rgba(15, 23, 42, 0.45); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 24px; backdrop-filter: blur(12px); margin-bottom: 20px; }
</style>
""", unsafe_allow_html=True)

st.title("📄 Resume Intelligence & ATS Checker")

st.markdown("""
<div class="glass-card">
    <h3>Optimize Your Resume for ATS Algorithms</h3>
    <p style="color: #94A3B8;">
        Upload your resume (PDF, DOCX, PPTX, or TXT) and compare it against your target job description. Nexora AI's multi-agent parsing extracts your core skills, education, and milestones, scoring them directly against industry benchmarks.
    </p>
</div>
""", unsafe_allow_html=True)

col1, col2 = st.columns(2)

with col1:
    st.subheader("Upload Resume")
    uploaded_file = st.file_uploader("Drop your resume file here", type=["pdf", "docx", "pptx", "txt"])
    
    user_email = st.text_input("Your Email (to save results)", placeholder="you@example.com")
    
    st.subheader("Target Job Description")
    job_description = st.text_area("Paste the job posting description here", height=250, placeholder="We are looking for a Senior Software Engineer skilled in Python, Docker, Qdrant...")

with col2:
    st.subheader("Analysis Results")
    if st.button("Run ATS Diagnostics", type="primary"):
        if not uploaded_file:
            st.error("Please upload a resume file first.")
        elif not job_description:
            st.error("Please enter a target job description.")
        else:
            with st.spinner("Parsing resume text and checking alignment..."):
                # Save uploaded file temporarily for parsing
                os.makedirs("temp", exist_ok=True)
                temp_path = os.path.join("temp", uploaded_file.name)
                with open(temp_path, "wb") as f:
                    f.write(uploaded_file.getbuffer())
                
                file_url = None
                try:
                    # Upload to ImageKit
                    file_bytes = uploaded_file.getbuffer()
                    file_url = imagekit_service.upload_pdf(file_bytes, uploaded_file.name)
                    if file_url:
                        logger.info(f"Resume uploaded to ImageKit: {file_url}")
                    else:
                        logger.warning("ImageKit upload skipped or failed; proceeding without cloud storage.")

                    # Extract text using Mistral OCR (with fallback)
                    resume_text = mistral_ocr_service.extract_text(temp_path)
                    
                    # Calculate score
                    results = ats_service.calculate_match_score(resume_text, job_description)
                    
                    # Cleanup
                    os.remove(temp_path)
                    
                    # Display results
                    st.success("ATS Analysis completed!")
                    
                    # Show ATS Score
                    score = results["ats_score"]
                    color = "#10B981" if score >= 80 else "#F59E0B" if score >= 60 else "#EF4444"
                    st.markdown(f"""
                    <div class="glass-card" style="text-align: center; border-color: {color};">
                        <div style="font-size: 0.9rem; color: #94A3B8;">COMPATIBILITY INDEX</div>
                        <div style="font-size: 4rem; font-weight: 700; color: {color}; font-family: 'Outfit';">{score}%</div>
                    </div>
                    """, unsafe_allow_html=True)
                    
                    st.write("**Extracted Skills:**")
                    st.write(", ".join(results["skills_extracted"]))
                    
                    st.write("**Candidate Strengths:**")
                    for strength in results["strengths"]:
                        st.markdown(f"- ✅ {strength}")
                        
                    st.write("**ATS Optimization Areas (Missing Elements):**")
                    for weakness in results["weaknesses_improvements"]:
                        st.markdown(f"- ⚠️ {weakness}")

                    # Store resume data in Neon DB
                    if user_email:
                        try:
                            user = db_manager.get_user(user_email)
                            if not user:
                                user = db_manager.save_user(
                                    name=user_email.split("@")[0],
                                    email=user_email,
                                    target_role="",
                                    readiness_score=0.0
                                )
                            db_manager.save_resume(
                                user_id=user["id"],
                                filename=uploaded_file.name,
                                raw_text=resume_text,
                                ats_score=score,
                                file_url=file_url
                            )
                            st.info(f"Resume saved to database with file URL: {file_url or 'N/A'}")
                        except Exception as db_err:
                            logger.error(f"Failed to save resume to DB: {str(db_err)}")
                            st.warning("Resume analyzed but could not be saved to database.")
                        
                except Exception as e:
                    st.error(f"Failed to process files: {str(e)}")
                    if os.path.exists(temp_path):
                        os.remove(temp_path)
    else:
        st.info("Upload a resume and paste a job description, then click 'Run ATS Diagnostics' to begin.")
