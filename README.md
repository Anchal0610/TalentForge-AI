# Nexora AI – Hackathon Winner Career Intelligence Platform

> **Tagline:** "Analyze. Learn. Upgrade. Get Interview Ready."

Nexora AI is a production-ready Career Intelligence Platform designed to transform uploaded resumes, notes, PDFs, and job descriptions into an interactive, growth-oriented career ecosystem.

---

## ⚡ Key Capabilities
1. **Resume & Document Intelligence & ATS Audits**: Scans documents/resumes to extract profile nodes, calculate compatibility match indexes, and processes raw documents using semantic indexing and RAG pipelines for contextual Q&A and summary.
2. **Career Recommendations**: Suggests matching tech roles and maps market growth curves.
3. **Skill Gap Analysis**: Pinpoints missing technical frameworks and libraries.
4. **Interview Preparation**: Provides technical questions with tiered answer models.
5. **3D Vector Embedding Space Explorer**: Visualizes semantic proximities between capabilities and job roles.
6. **Career Knowledge Graphs**: Interactive NetworkX maps tracing resources, mock questions, and target requirements.

---

## 🏗️ Phase 1 Project Architecture

```
├── app.py                     # Streamlit Main Dashboard & Navigation
├── requirements.txt           # Project Dependencies
├── .env.example               # Environment Variables Template
├── README.md                  # System Documentation
├── pages/                     # Streamlit Multi-page Skeletons
│   ├── 1_Resume_Intelligence.py
│   ├── 2_Career_Advisor.py
│   ├── 3_Skill_Gap.py
│   ├── 4_Interview_Prep.py
│   ├── 5_Knowledge_Graph.py
│   ├── 6_Embedding_Visualization.py
│   └── 7_Roadmap_and_Readiness.py
├── agents/                    # CrewAI Agent Definitions
│   ├── resume_agent.py
│   ├── career_agent.py
│   ├── skill_gap_agent.py
│   ├── document_agent.py
│   ├── interview_agent.py
│   ├── answer_agent.py
│   ├── roadmap_agent.py
│   └── readiness_agent.py
├── crew/                      # CrewAI Crew Orchestration
│   └── career_crew.py
├── rag/                       # RAG Pipeline (Chunking, Vector Ops)
│   ├── chunking.py
│   ├── embeddings.py
│   ├── retriever.py
│   └── vector_store.py
├── graph/                     # NetworkX Knowledge Graph Engine
│   ├── knowledge_graph.py
│   └── graph_builder.py
├── visualization/             # 3D Plotly & Dimensionality Reduction
│   ├── embedding_plot.py
│   ├── umap_reducer.py
│   └── tsne_reducer.py
├── services/                  # Core External Services Wrappers
│   ├── mistral_ocr.py
│   ├── mistral_service.py
│   ├── pinecone_service.py
│   └── ats_service.py

├── database/                  # Local Database (SQLite)
│   └── connection.py
├── models/                    # Data Schemas (Pydantic / SQL)
│   └── schemas.py
└── utils/                     # Logging & Helper Functions
    └── logger.py
```

---

## 🚀 Setup & Execution Guide

### 1. Prerequisites
- Python 3.10 or 3.11 installed.
- C++ build tools (optional, helps with standard `umap-learn` builds. Fallback PCA is embedded).

### 2. Configure Environment
1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in your keys:
   - `OPENAI_API_KEY`: Required for active OpenAI LLM services.
   - `MISTRAL_API_KEY`: Required for active Mistral OCR document ingestion.
   - `QDRANT_URL`: Set to `:memory:` to run transiently locally, or point to Qdrant Cloud cluster.

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run Streamlit Application
Launch the server local instance:
```bash
streamlit run app.py
```
Open [http://localhost:8501](http://localhost:8501) in your browser.

### 5. Run with Docker Compose
To build and spin up the Streamlit web application and a local persistent Qdrant instance together:
```bash
docker compose up --build
```
Open [http://localhost:8501](http://localhost:8501) in your browser. The application will automatically route vector indexing to the concurrent Qdrant service.