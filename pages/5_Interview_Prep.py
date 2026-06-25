import streamlit as st
from services.openai_service import openai_service
from models.schemas import InterviewQuestion, InterviewAnswer
from utils.logger import logger
import json

st.set_page_config(page_title="AI Interview Prep Suite", page_icon="🎤", layout="wide")

# Custom CSS
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=Inter:wght@300;400;500;600&display=swap');
    html, body, [class*="css"] { font-family: 'Inter', sans-serif; background-color: #050811; color: #E2E8F0; }
    h1, h2, h3, h4 { font-family: 'Outfit', sans-serif !important; background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #D946EF 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .glass-card { background: rgba(15, 23, 42, 0.45); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 24px; backdrop-filter: blur(12px); margin-bottom: 20px; }
</style>
""", unsafe_allow_value=True)

st.title("🎤 AI Interview Preparation Suite")

st.markdown("""
<div class="glass-card">
    <h3>Prepare for Live Assessments</h3>
    <p style="color: #94A3B8;">
        Generate target-focused questions, study multi-tiered responses (Beginner, Intermediate, Expert), and simulate an interactive mock evaluation. The engine analyzes your answer's keywords and coverage, suggesting key improvement steps.
    </p>
</div>
""", unsafe_allow_value=True)

# Select parameters
target_role = st.session_state.get("target_role", "MLOps Engineer")
missing_skills = st.session_state.get("missing_skills_list", ["Docker", "Kubernetes", "Vector Databases"])

tab1, tab2 = st.tabs(["📚 Question & Answer Bank", "🤖 Mock Interview Sim"])

with tab1:
    st.subheader("Generate Study Guides")
    difficulty = st.selectbox("Difficulty Level", ["All Levels", "Easy", "Medium", "Hard"])
    category = st.selectbox("Question Category", ["Technical", "HR / Behavioral", "System Design"])
    
    if st.button("Generate Q&A Guide", type="primary"):
        with st.spinner("Compiling technical interview checklist..."):
            prompt = f"""
            Target Role: {target_role}
            Skills and missing topics to test: {", ".join(missing_skills)}
            Difficulty: {difficulty}
            Category: {category}
            
            Formulate 3 interview questions and compile appropriate model answers for three levels: Beginner (basic definitions), Intermediate (working usage), and Expert (deep tradeoffs, scaling limits, edge-case architectures).
            """
            
            # Since generating lists of objects in single calls can hit limits,
            # we query using structured completion formatting or use robust fallbacks
            try:
                # We can request standard structured generation or parse outputs
                # For Phase 1, we will generate simulated Q&A lists.
                if openai_service.client:
                    # In production, we'd query structured endpoints
                    res = openai_service.client.chat.completions.create(
                        model=openai_service.model,
                        messages=[
                            {"role": "system", "content": "You are a lead interviewer. Output a list of 3 questions with their Beginner, Intermediate, Expert responses in JSON format."},
                            {"role": "user", "content": prompt}
                        ],
                        response_format={"type": "json_object"}
                    )
                    data = json.loads(res.choices[0].message.content)
                    questions_data = data.get("questions", [])
                else:
                    # Mock guide
                    questions_data = [
                        {
                            "question": f"Explain how containerization with Docker solves deployment issues in {target_role} setups.",
                            "category": "Technical",
                            "beginner_answer": "Docker bundles code and all its dependencies into an image, so it runs the same on any computer.",
                            "intermediate_answer": "It uses container runtimes to isolate environments, avoiding 'it works on my machine' problems. It supports layer caching and multi-stage builds to optimize image sizes.",
                            "expert_answer": "It leverages Linux kernel namespaces and cgroups to offer lightweight isolation. Expert setups combine multi-stage builds with distroless images to minimize attack surface area, utilizing daemonless runtime engines for orchestration security."
                        },
                        {
                            "question": "Describe the core difference between SQL and Vector Databases like Qdrant.",
                            "category": "System Design",
                            "beginner_answer": "SQL stores data in tables of rows and columns, while Vector databases store coordinates or embeddings.",
                            "intermediate_answer": "SQL is optimized for exact relational queries. Vector databases are built for similarity searches using indices like HNSW to scan high-dimensional vectors.",
                            "expert_answer": "SQL relational architectures focus on transactional integrity (ACID). Vector DBs like Qdrant use quantized vector indices (Scalar/Product Quantization) to run cosine similarity queries over massive datasets with sub-millisecond latencies, trading minor precision loss for throughput."
                        }
                    ]
                
                st.success("Study guide compiled!")
                for i, q in enumerate(questions_data):
                    with st.expander(f"Question {i+1}: {q.get('question')}"):
                        st.markdown(f"**Category:** `{q.get('category')}`")
                        st.markdown(f"🟢 **Beginner Response:**\n{q.get('beginner_answer')}")
                        st.markdown(f"🟡 **Intermediate Response:**\n{q.get('intermediate_answer')}")
                        st.markdown(f"🔴 **Expert Response:**\n{q.get('expert_answer')}")
                        
            except Exception as e:
                st.error(f"Error compiling guides: {str(e)}")

with tab2:
    st.subheader("Simulated Mock Trial")
    
    # Store interview questions and answers state
    if "mock_questions" not in st.session_state:
        st.session_state["mock_questions"] = [
            "What is a Kubernetes pod, and how does it relate to container scheduling?",
            "How do you approach fine-tuning or optimizing text embeddings for RAG pipelines?"
        ]
        st.session_state["mock_index"] = 0
        st.session_state["mock_history"] = []

    idx = st.session_state["mock_index"]
    questions = st.session_state["mock_questions"]
    
    if idx < len(questions):
        st.markdown(f"""
        <div class="glass-card" style="border-left: 5px solid #8B5CF6;">
            <div style="font-size: 0.8rem; color: #94A3B8;">MOCK QUESTION {idx+1} of {len(questions)}</div>
            <h4 style="color: #FFFFFF;">{questions[idx]}</h4>
        </div>
        """, unsafe_allow_value=True)
        
        user_response = st.text_area("Type your answer below:", height=150, placeholder="Start typing your explanation...")
        
        if st.button("Submit Answer", type="primary"):
            if not user_response:
                st.warning("Please type a response before submitting.")
            else:
                with st.spinner("Evaluating your response..."):
                    # Grading prompt
                    prompt = f"""
                    Question: {questions[idx]}
                    Candidate Response: {user_response}
                    
                    Evaluate the response on:
                    1. Score out of 100.
                    2. Missing keywords or technical concepts.
                    3. How to improve the answer.
                    """
                    
                    if openai_service.client:
                        try:
                            res = openai_service.client.chat.completions.create(
                                model=openai_service.model,
                                messages=[
                                    {"role": "system", "content": "You are a technical interviewer grading answers. Output your evaluation in JSON format."},
                                    {"role": "user", "content": prompt}
                                ],
                                response_format={"type": "json_object"}
                            )
                            evaluation = json.loads(res.choices[0].message.content)
                        except Exception as err:
                            evaluation = {"score": 75, "improvements": f"Evaluation error: {str(err)}"}
                    else:
                        evaluation = {
                            "score": 80,
                            "missing_keywords": ["Pod Sandbox", "kube-scheduler", "Control Plane"],
                            "improvements": "You answered the basic concepts. To improve, mention kube-scheduler and how nodes are selected."
                        }
                    
                    # Store history
                    st.session_state["mock_history"].append({
                        "question": questions[idx],
                        "user_answer": user_response,
                        "evaluation": evaluation
                    })
                    
                    # Display results
                    st.success("Answer evaluated!")
                    st.write(f"**Score:** `{evaluation.get('score')}/100`")
                    st.write(f"**Missing Terms:** {', '.join(evaluation.get('missing_keywords', []))}")
                    st.write(f"**Suggestions:** {evaluation.get('improvements')}")
                    
                    # Advance state
                    if st.button("Next Question"):
                        st.session_state["mock_index"] += 1
                        st.rerun()
    else:
        st.success("Mock Interview completed!")
        st.subheader("Performance Recap")
        
        total_score = 0
        for item in st.session_state["mock_history"]:
            st.markdown(f"**Q: {item['question']}**")
            st.markdown(f"Your Answer: *{item['user_answer']}*")
            st.markdown(f"Score: `{item['evaluation'].get('score')}/100`")
            st.markdown(f"Suggestions: {item['evaluation'].get('improvements')}")
            st.markdown("---")
            total_score += item['evaluation'].get('score', 0)
            
        if len(st.session_state["mock_history"]) > 0:
            avg = total_score / len(st.session_state["mock_history"])
            st.markdown(f"### Overall Mock Grade: **{avg:.1f}%**")
            
        if st.button("Restart Session"):
            st.session_state["mock_index"] = 0
            st.session_state["mock_history"] = []
            st.rerun()
