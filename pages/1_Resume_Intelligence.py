import streamlit as st
import os
from services.mistral_ocr import mistral_ocr_service
from services.ats_service import ats_service
from services.imagekit_service import imagekit_service
from database.connection import db_manager
from rag.chunking import document_chunker
from rag.vector_store import vector_store
from rag.retriever import retriever
from services.mistral_service import mistral_service
from utils.logger import logger

st.set_page_config(page_title="Resume & Document Intelligence", page_icon="📄", layout="wide")

# Inject same styles for consistency
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=Inter:wght@300;400;500;600&display=swap');
    html, body, [class*="css"] { font-family: 'Inter', sans-serif; background-color: #050811; color: #E2E8F0; }
    h1, h2, h3, h4 { font-family: 'Outfit', sans-serif !important; background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #D946EF 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .glass-card { background: rgba(15, 23, 42, 0.45); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 24px; backdrop-filter: blur(12px); margin-bottom: 20px; }
</style>
""", unsafe_allow_html=True)

st.title("📄 Resume & Document Intelligence")

st.markdown("""
<div class="glass-card">
    <h3>Optimize and Query Your Career Materials</h3>
    <p style="color: #94A3B8;">
        Upload your resume for ATS audits and diagnostics, or ingest technical guides, textbooks, and documentation notes to build a semantic knowledge base. You can instantly ask complex questions, retrieve relevant context, and extract outlines.
    </p>
</div>
""", unsafe_allow_html=True)

tab1, tab2 = st.tabs(["📄 ATS Diagnostics", "📚 Document RAG & Summary"])

with tab1:
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Upload Resume")
        uploaded_file = st.file_uploader("Drop your resume file here", type=["pdf", "docx", "pptx", "txt"], key="resume_uploader")
        
        user_email = st.text_input("Your Email (to save results)", placeholder="you@example.com", key="resume_email")
        
        st.subheader("Target Job Description")
        job_description = st.text_area("Paste the job posting description here", height=250, placeholder="We are looking for a Senior Software Engineer skilled in Python, Docker, Qdrant...", key="job_desc")
        
        index_resume_db = st.checkbox("Index resume in vector database for semantic Q&A and summary", value=True)

    with col2:
        st.subheader("Analysis Results")
        if st.button("Run ATS Diagnostics", type="primary", key="btn_run_ats"):
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
                        
                        # Index resume in vector database if selected
                        if index_resume_db:
                            try:
                                chunks = document_chunker.split_text(resume_text)
                                vector_store.index_document(doc_name=uploaded_file.name, chunks=chunks)
                                st.session_state["active_doc_loaded"] = uploaded_file.name
                                st.session_state["raw_document_text"] = resume_text
                                logger.info(f"Resume {uploaded_file.name} indexed to vector store successfully.")
                            except Exception as vec_err:
                                logger.error(f"Failed to index resume to vector store: {str(vec_err)}")
                                st.warning("ATS Analysis completed, but failed to index resume in the vector database.")
                        
                        # Cleanup
                        os.remove(temp_path)
                        
                        # Display results
                        st.success("ATS Analysis completed!")
                        if index_resume_db:
                            st.info(f"Resume has also been indexed in the vector store. You can query or summarize it in the 'Document RAG & Summary' tab!")
                        
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

with tab2:
    col1, col2 = st.columns([1, 1.2])
    
    with col1:
        st.subheader("Document Ingestion")
        doc_file = st.file_uploader("Upload technical resources (PDF, DOCX, PPTX, TXT)", type=["pdf", "docx", "pptx", "txt"], key="doc_uploader")
        
        if st.button("Parse & Index Vector Store", type="primary", key="btn_index_doc"):
            if not doc_file:
                st.error("Please upload a document file first.")
            else:
                with st.spinner("Processing document (extracting text, generating embeddings, saving to Pinecone)..."):
                    # Save file locally
                    os.makedirs("temp", exist_ok=True)
                    temp_path = os.path.join("temp", doc_file.name)
                    with open(temp_path, "wb") as f:
                        f.write(doc_file.getbuffer())
                    
                    file_url = None
                    try:
                        # Upload to ImageKit
                        file_bytes = doc_file.getbuffer()
                        file_url = imagekit_service.upload_pdf(file_bytes, doc_file.name)
                        if file_url:
                            logger.info(f"Document uploaded to ImageKit: {file_url}")

                        # OCR extraction
                        raw_text = mistral_ocr_service.extract_text(temp_path)
                        
                        # Split into overlapping chunks
                        chunks = document_chunker.split_text(raw_text)
                        
                        # Index in Pinecone
                        point_ids = vector_store.index_document(doc_name=doc_file.name, chunks=chunks)
                        
                        # Store document metadata in Neon DB
                        try:
                            db_manager.save_document(
                                filename=doc_file.name,
                                file_url=file_url,
                                chunk_count=len(chunks)
                            )
                        except Exception as db_err:
                            logger.error(f"Failed to save document to DB: {str(db_err)}")
                        
                        # Clean up
                        os.remove(temp_path)
                        
                        st.success(f"Indexed successfully! Stored {len(chunks)} vectors inside index: nexora-career-index")
                        st.session_state["active_doc_loaded"] = doc_file.name
                        st.session_state["raw_document_text"] = raw_text
                        
                    except Exception as e:
                        st.error(f"Ingestion failed: {str(e)}")
                        if os.path.exists(temp_path):
                            os.remove(temp_path)

        # Document Smart Summary
        active_doc = st.session_state.get("active_doc_loaded")
        if st.session_state.get("raw_document_text"):
            st.subheader(f"Smart Ingestion Summary ({active_doc})")
            if st.button("Generate Summary", key="btn_summary"):
                with st.spinner("Summarizing raw contents..."):
                    raw_txt = st.session_state["raw_document_text"]
                    prompt = f"Please summarize the main concepts and technical learnings of this text in a bulleted outline:\n\n{raw_txt[:6000]}"
                    summary = mistral_service.generate_structured_completion(
                        prompt=prompt,
                        system_instruction="You are an expert technical editor. Summarize the text clearly.",
                        response_model=str # Fallback handles string inputs nicely
                    )
                    st.write(summary)

    with col2:
        st.subheader("Semantic Question Answering (RAG)")
        if active_doc:
            st.info(f"Active Query Context: `{active_doc}`")
        else:
            st.warning("No active document indexed in session. Querying the entire vector store.")

        query_input = st.text_input("Ask a question about the uploaded document:", placeholder="e.g. What is the system design deployment workflow?", key="rag_query")
        
        if st.button("Query Vector Database", key="btn_query_rag"):
            if not query_input:
                st.warning("Please enter a query.")
            else:
                with st.spinner("Searching semantic database & compiling response..."):
                    # Get relevant vectors context
                    context = retriever.get_context_string(query=query_input, limit=4)
                    
                    # Ask LLM with context
                    prompt = f"""
                    Use the following context to answer the user question. If you don't know the answer, state that it's not present in the context.
                    
                    Context:
                    {context}
                    
                    Question:
                    {query_input}
                    """
                    
                    # Generate completion using direct Chat Completion fallback inside service
                    if mistral_service.client:
                        try:
                            res = mistral_service.client.chat.complete(
                                model=mistral_service.model,
                                messages=[
                                    {"role": "system", "content": "You are a helpful Career Intelligence Assistant. Answer the question using ONLY the provided document context."},
                                    {"role": "user", "content": prompt}
                                ]
                            )
                            answer = res.choices[0].message.content
                        except Exception as err:
                            answer = f"Error calling Mistral Chat API: {str(err)}"
                    else:
                        answer = f"Mock Answer (Client in offline/mock mode) using context from {st.session_state.get('active_doc_loaded', 'Document')}"
                    
                    st.markdown("### Answer:")
                    st.write(answer)
                    
                    st.markdown("### Citation Context:")
                    with st.expander("Show Retrieved Text Segments"):
                        st.text(context)
