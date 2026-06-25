import os
import json
from typing import Type, TypeVar, Optional, List
from openai import OpenAI
from pydantic import BaseModel
from dotenv import load_dotenv
from utils.logger import logger

load_dotenv()

T = TypeVar("T", bound=BaseModel)

class OpenAIService:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.model = os.getenv("OPENAI_MODEL_NAME", "gpt-4o-mini")
        
        if not self.api_key or self.api_key.startswith("your_"):
            logger.warning("OPENAI_API_KEY is not set or placeholder. Operating in MOCK mode.")
            self.client = None
        else:
            self.client = OpenAI(api_key=self.api_key)
            logger.info("OpenAI Client initialized successfully.")

    def get_embedding(self, text: str, model: str = "text-embedding-3-small") -> List[float]:
        """Generates embedding vector for the provided text."""
        if not self.client:
            # Mock 1536-dim embedding for demo/fallback
            import random
            random.seed(hash(text))
            return [random.uniform(-1, 1) for _ in range(1536)]
            
        try:
            response = self.client.embeddings.create(
                input=[text.replace("\n", " ")],
                model=model
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Error generating embedding: {str(e)}")
            # Fallback to mock
            import random
            random.seed(hash(text))
            return [random.uniform(-1, 1) for _ in range(1536)]

    def generate_structured_completion(
        self, 
        prompt: str, 
        system_instruction: str, 
        response_model: Type[T]
    ) -> T:
        """Calls OpenAI Chat Completion API with structured output schema support."""
        if not self.client:
            logger.warning("Mocking completion response model.")
            return self._generate_mock_model(response_model)

        try:
            completion = self.client.beta.chat.completions.parse(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": prompt},
                ],
                response_format=response_model,
            )
            return completion.choices[0].message.parsed
        except Exception as e:
            logger.error(f"Structured completion failed: {str(e)}. Attempting raw completion fallback.")
            try:
                # Fallback to JSON mode completion if parsing fails
                completion = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": f"{system_instruction}\nYou must respond strictly in JSON format matching: {response_model.schema_json()}"},
                        {"role": "user", "content": prompt},
                    ],
                    response_format={"type": "json_object"}
                )
                data = json.loads(completion.choices[0].message.content)
                return response_model.parse_obj(data)
            except Exception as nested_err:
                logger.error(f"Both structured and raw JSON completions failed: {str(nested_err)}")
                return self._generate_mock_model(response_model)

    def _generate_mock_model(self, response_model: Type[T]) -> T:
        """Returns seeded mock data objects matching schemas for dashboard stability."""
        name = response_model.__name__
        logger.info(f"Generating mock Pydantic object for type: {name}")
        
        if name == "ResumeInsights":
            return response_model(
                ats_score=78.5,
                skills_extracted=["Python", "SQL", "Docker", "Machine Learning", "Git"],
                experience_summary="3 years as a Junior Data Scientist with experience in building ETL pipelines and deploying ML models.",
                projects=["Customer Churn Predictor API", "Real-Time Log Ingestion System"],
                education=["B.S. in Computer Science, University of Technology"],
                strengths=["Strong programming core", "Familiarity with containerization"],
                weaknesses_improvements=["Needs more cloud deployment experience (AWS/GCP)", "Add automated testing tools to projects"]
            )
        elif name == "CareerRecommendation":
            return response_model(
                predicted_roles=["MLOps Engineer", "Data Engineer", "Backend Developer"],
                alignment_reasoning="Strong programming core in Python combined with Docker/SQL and MLOps projects indicates ready alignment with backend and deployment paths.",
                growth_trends={
                    "MLOps Engineer": "High growth (30% YoY) driven by enterprise LLM deployments.",
                    "Data Engineer": "Steady growth (18% YoY) as organizations unify data lakes.",
                    "Backend Developer": "Stable, high volume job openings globally."
                }
            )
        elif name == "SkillGapAnalysis":
            from models.schemas import SkillGapItem
            return response_model(
                target_role="MLOps Engineer",
                gaps=[
                    SkillGapItem(skill_name="Kubernetes", current_proficiency="None", required_proficiency="Intermediate", estimated_learning_hours=40, priority="High"),
                    SkillGapItem(skill_name="CI/CD Pipelines", current_proficiency="Beginner", required_proficiency="Advanced", estimated_learning_hours=20, priority="High"),
                    SkillGapItem(skill_name="Qdrant / Vector Databases", current_proficiency="None", required_proficiency="Intermediate", estimated_learning_hours=15, priority="Medium"),
                ],
                overall_gap_percentage=45.0
            )
        elif name == "LearningRoadmap":
            from models.schemas import RoadmapStep
            return response_model(
                target_role="MLOps Engineer",
                weekly_plan=[
                    RoadmapStep(week=1, topic="Docker deep-dive & Multi-stage builds", resources=["Docker Docs", "FreeCodeCamp Container Course"], project_milestone="Containerize and optimize the Churn Predictor app", certification_suggestion="Docker Certified Associate"),
                    RoadmapStep(week=2, topic="Kubernetes cluster orchestration & Helm", resources=["Kubernetes Interactive Tutorials", "Helm.sh guide"], project_milestone="Deploy local cluster using Minikube and expose service", certification_suggestion=None),
                    RoadmapStep(week=3, topic="CI/CD pipelines with GitHub Actions", resources=["GitHub Actions Docs", "YAML configurations"], project_milestone="Create CI pipeline with automatic tests and Docker Hub push", certification_suggestion=None)
                ],
                estimated_completion_weeks=3
            )
        elif name == "CareerReadiness":
            return response_model(
                overall_percentage=68.0,
                profile_strength=78.5,
                skill_match_strength=55.0,
                mock_interview_strength=70.0,
                next_steps=[
                    "Implement a Docker-based MLOps project to show infrastructure competency.",
                    "Review high-frequency system design concepts for large scale vector stores.",
                    "Prepare answers highlighting Kubernetes and container registry deployments."
                ]
            )
        
        # Default empty model instance
        return response_model.construct()

# Export a single global service instance
openai_service = OpenAIService()
