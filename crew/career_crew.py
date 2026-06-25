from crewai import Crew, Process, Task
from typing import Dict, Any
import os

from utils.logger import logger
from agents.resume_agent import ResumeAnalyzerAgent
from agents.career_agent import CareerAdvisorAgent
from agents.skill_gap_agent import SkillGapAgent
from agents.document_agent import DocumentIntelligenceAgent
from agents.interview_agent import InterviewGeneratorAgent
from agents.answer_agent import AnswerGeneratorAgent
from agents.roadmap_agent import LearningRoadmapAgent
from agents.readiness_agent import ReadinessAgent

class CareerIntelligenceCrew:
    def __init__(self, use_mock: bool = False):
        self.use_mock = use_mock
        self.llm = None
        
        # Configure Mistral LLM for CrewAI Agents
        if not self.use_mock and os.getenv("MISTRAL_API_KEY"):
            try:
                from langchain_mistralai import ChatMistralAI
                self.llm = ChatMistralAI(
                    model=os.getenv("MISTRAL_MODEL_NAME", "mistral-large-latest"),
                    api_key=os.getenv("MISTRAL_API_KEY")
                )
                logger.info("CrewAI LLM successfully configured with Mistral AI.")
            except Exception as e:
                logger.warning(f"Failed to initialize ChatMistralAI LLM for CrewAI: {str(e)}")

    def run_career_analysis(self, resume_text: str, target_role: str) -> Dict[str, Any]:
        """Runs the crew tasks in sequence to perform resume, career path, and skill gap analyses."""
        logger.info(f"Setting up Career Crew execution for target role: {target_role}")
        
        if self.use_mock or not self.llm:
            logger.info("Executing Career Crew in MOCK mode...")
            # Simulate crew execution output matching expected fields
            return {
                "resume_insights": {
                    "ats_score": 81.0,
                    "skills_extracted": ["Python", "SQL", "Flask", "Docker"],
                    "experience_summary": "Software developer with backend focus.",
                    "strengths": ["Clean code practices", "Database schemas"],
                    "weaknesses_improvements": ["Add cloud platform exposure (AWS/GCP)", "Include PyTest framework skills"]
                },
                "career_recommendations": {
                    "predicted_roles": ["Backend Engineer", "Data Engineer", "Systems Architect"],
                    "growth_trends": {"Backend Engineer": "15% YoY growth", "Data Engineer": "22% YoY growth"}
                },
                "skill_gap": {
                    "missing_skills": ["AWS S3/RDS", "PyTest", "CI/CD GitHub Actions"],
                    "priority_list": ["High: AWS S3", "Medium: PyTest"]
                },
                "readiness_score": 72.0
            }

        # 1. Initialize Agents
        resume_agent = ResumeAnalyzerAgent(self.llm).get_agent()
        career_agent = CareerAdvisorAgent(self.llm).get_agent()
        gap_agent = SkillGapAgent(self.llm).get_agent()
        readiness_agent = ReadinessAgent(self.llm).get_agent()

        # 2. Define Tasks
        task_resume = Task(
            description=(
                f"Analyze this resume content: \n{resume_text}\n"
                "Extract lists of technical skills, experience metrics, projects, and education. "
                "Calculate an ATS rating score."
            ),
            expected_output="A structured summary including skills, projects, education, and ATS rating.",
            agent=resume_agent
        )

        task_career = Task(
            description=(
                f"Compare the extracted skills with the target role: {target_role}. "
                "Provide alternative title matches, growth projections, and future role suitability."
            ),
            expected_output="Top 3 recommended roles with reasons and career growth projections.",
            agent=career_agent
        )

        task_gap = Task(
            description=(
                f"Identify skills missing for a {target_role} compared to current skills. "
                "List specific missing tools or engineering capabilities, sorting them by learning priority."
            ),
            expected_output="A sorted checklist of missing tools, frameworks, and concepts with learning priority.",
            agent=gap_agent
        )

        task_readiness = Task(
            description=(
                "Synthesize the resume rating and the size of the skill gaps. "
                "Calculate an overall interview preparation readiness score (0-100%)."
            ),
            expected_output="An overall readiness score and a brief checklist of recommendations.",
            agent=readiness_agent
        )

        # 3. Assemble Crew
        crew = Crew(
            agents=[resume_agent, career_agent, gap_agent, readiness_agent],
            tasks=[task_resume, task_career, task_gap, task_readiness],
            process=Process.sequential,
            verbose=True
        )

        try:
            result = crew.kickoff()
            logger.info("Crew execution completed successfully.")
            return {
                "raw_result": result,
                "status": "Success"
            }
        except Exception as e:
            logger.error(f"Error executing CrewAI: {str(e)}")
            raise e
