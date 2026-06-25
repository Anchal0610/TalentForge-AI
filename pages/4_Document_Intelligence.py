import streamlit as st
import os
from services.mistral_ocr import mistral_ocr_service
from rag.chunking import document_chunker
from rag.vector_store import vector_store
from rag.retriever import retriever
from services.openai_service import openai_service
from utils.logger import logger

st.set_page_config(page_title="Document Intelligence & RAG", page_icon="📚", layout="wide")

# Custom CSS
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=Inter:wght@300;400;500;600&display=swap');
    html, body, [class*="css"] { font-family: 'Inter', sans-serif; background-color: #050811; color: #E2E8F0; }
    h1, h2, h3, h4 { font-family: 'Outfit', sans-serif !important; background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #D946EF 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .glass-card { background: rgba(15, 23, 42, 0.45); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 24px; backdrop-filter: blur(12px); margin-bottom: 20px; }
</style>
""", unsafe_allow_value=True)

st.title("📚 Document Intelligence & RAG Engine")

st.markdown("""
<div class="glass-card">
    <h3>Semantic Study Assistant</h3>
    <p style="color: #94A3B8;">
        Ingest technical guidelines, textbooks, and documentation notes. The documents are parsed, chunked, embedded, and cataloged inside a local vector database. You can instantly ask complex technical questions and extract summaries.
    </p>
</div>
""", unsafe_allow_value=True)

col1, col2 = st.columns([1, 1.2])

with col1:
    st.subheader("Document Ingestion")
    doc_file = st.file_uploader("Upload technical resources (PDF, DOCX, PPTX, TXT)", type=["pdf", "docx", "pptx", "txt"])
    
    if st.button("Parse & Index Vector Store", type="primary"):
        if not doc_file:
            st.error("Please upload a document file first.")
        else:
            with st.spinner("Processing document (extracting text, generating embeddings, saving to Qdrant)..."):
                # Save file locally
                os.makedirs("temp", exist_ok=True)
                temp_path = os.path.join("temp", doc_file.name)
                with open(temp_path, "wb") as f:
                    f.write(doc_file.getbuffer())
                
                try:
                    # OCR extraction
                    raw_text = mistral_ocr_service.extract_text(temp_path)
                    
                    # Split into overlapping chunks
                    chunks = document_chunker.split_text(raw_text)
                    
                    # Index in Qdrant
                    point_ids = vector_store.index_document(doc_name=doc_file.name, chunks=chunks)
                    
                    # Clean up
                    os.remove(temp_path)
                    
                    st.success(f"Indexed successfully! Stored {len(chunks)} vectors inside collection: nexora_docs")
                    st.session_state["active_doc_loaded"] = doc_file.name
                    st.session_state["raw_document_text"] = raw_text
                    
                except Exception as e:
                    st.error(f"Ingestion failed: {str(e)}")
                    if os.path.exists(temp_path):
                        os.remove(temp_path)

    # Document Smart Summary
    if st.session_state.get("raw_document_text"):
        st.subheader("Smart Ingestion Summary")
        if st.button("Generate Summary"):
            with st.spinner("Summarizing raw contents..."):
                raw_txt = st.session_state["raw_document_text"]
                prompt = f"Please summarize the main concepts and technical learnings of this text in a bulleted outline:\n\n{raw_txt[:6000]}"
                summary = openai_service.generate_structured_completion(
                    prompt=prompt,
                    system_instruction="You are an expert technical editor. Summarize the text clearly.",
                    response_model=str # Fallback handles string inputs nicely
                )
                st.write(summary)

with col2:
    st.subheader("Semantic Question Answering (RAG)")
    query_input = st.text_input("Ask a question about the uploaded document:", placeholder="e.g. What is the system design deployment workflow?")
    
    if st.button("Query Vector Database"):
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
                # We can call completions endpoint via raw model helper or service fallback
                if openai_service.client:
                    try:
                        res = openai_service.client.chat.completions.create(
                            model=openai_service.model,
                            messages=[
                                {"role": "system", "content": "You are a helpful Career Intelligence Assistant. Answer the question using ONLY the provided document context."},
                                {"role": "user", "content": prompt}
                            ]
                        )
                        answer = res.choices[0].message.content
                    except Exception as err:
                        answer = f"Error calling ChatCompletion API: {str(err)}"
                else:
                    answer = f"Mock Answer (Client in offline/mock mode) using context from {st.session_state.get('active_doc_loaded', 'Document')}"
                
                st.markdown("### Answer:")
                st.write(answer)
                
                st.markdown("### Citation Context:")
                with st.expander("Show Retrieved Text Segments"):
                    st.text(context)
