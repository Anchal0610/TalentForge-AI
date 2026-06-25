import os
import json
from typing import Type, TypeVar, Optional, List
from dotenv import load_dotenv
from pydantic import BaseModel
from utils.logger import logger

load_dotenv()

T = TypeVar("T", bound=BaseModel)

class MistralService:
    def __init__(self):
        self.api_key = os.getenv("MISTRAL_API_KEY")
        self.model = os.getenv("MISTRAL_MODEL_NAME", "mistral-large-latest")
        
        if not self.api_key or self.api_key.startswith("your_"):
            logger.warning("MISTRAL_API_KEY not configured. Operating in MOCK mode.")
            self.client = None
        else:
            try:
                from mistralai import Mistral
                self.client = Mistral(api_key=self.api_key)
                logger.info("Mistral AI Client initialized successfully.")
            except ImportError:
                logger.error("Failed to import mistralai library. Operating in MOCK mode.")
                self.client = None

    def get_embedding(self, text: str, model: str = "mistral-embed") -> List[float]:
        """Generates a 1024-dimensional vector embedding using Mistral Embed."""
        if not self.client:
            # Seed 1024-dim mock vector
            import random
            random.seed(hash(text))
            return [random.uniform(-1, 1) for _ in range(1024)]
            
        try:
            # Mistral client embedding call format
            response = self.client.embeddings.create(
                model=model,
                inputs=[text.replace("\n", " ")]
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Mistral embedding generation failed: {str(e)}")
            import random
            random.seed(hash(text))
            return [random.uniform(-1, 1) for _ in range(1024)]

    def generate_structured_completion(
        self, 
        prompt: str, 
        system_instruction: str, 
        response_model: Type[T]
    ) -> T:
        """Requests completion using Mistral's JSON Mode fallback or structured models."""
        if not self.client:
            logger.warning("Generating Mock data model due to missing API configuration.")
            return self._generate_mock_model(response_model)

        try:
            # Format model request with system guidelines
            # Mistral supports JSON output format by setting response_format
            formatted_instruction = f"{system_instruction}\nYour response must strictly match the following JSON schema:\n{response_model.schema_json()}"
            
            chat_response = self.client.chat.complete(
                model=self.model,
                messages=[
                    {"role": "system", "content": formatted_instruction},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            
            content = chat_response.choices[0].message.content
            data = json.loads(content)
            return response_model.parse_obj(data)
            
        except Exception as e:
            logger.error(f"Mistral structured completion failed: {str(e)}")
            return self._generate_mock_model(response_model)

    def _generate_mock_model(self, response_model: Type[T]) -> T:
        """Fallback mock database generator for stable dashboard renders."""
        name = response_model.__name__
        logger.info(f"Generating mock Mistral object for type: {name}")
        
        if name == "ResumeInsights":
            return response_model(
                ats_score=79.0,
                skills_extracted=["Python", "SQL", "Git", "Flask", "Docker"],
                experience_summary="2 years experience as a Software Developer.",
                projects=["Personal Task Manager Api", "Log Parser CLI"],
                education=["B.S. in Computer Science"],
                strengths=["Solid programming foundation", "Version control experience"],
                weaknesses_improvements=["Missing cloud orchestration skills (Kubernetes)", "Needs database optimization experience"]
            )
        elif name == "CareerRecommendation":
            return response_model(
                predicted_roles=["Backend Engineer", "Data Engineer", "Systems Architect"],
                alignment_reasoning="Strong programming core in Python combined with Docker and SQL alignments.",
                growth_trends={
                    "Backend Engineer": "Steady growth (15% YoY) with high entry volume.",
                    "Data Engineer": "High growth (22% YoY) driven by pipeline orchestration needs."
                }
            )
        elif name == "SkillGapAnalysis":
            from models.schemas import SkillGapItem
            return response_model(
                target_role="Backend Engineer",
                gaps=[
                    SkillGapItem(skill_name="Kubernetes", current_proficiency="None", required_proficiency="Intermediate", estimated_learning_hours=35, priority="High"),
                    SkillGapItem(skill_name="CI/CD Pipelines", current_proficiency="Beginner", required_proficiency="Intermediate", estimated_learning_hours=15, priority="Medium"),
                    SkillGapItem(skill_name="Pinecone / Vector Databases", current_proficiency="None", required_proficiency="Intermediate", estimated_learning_hours=10, priority="High"),
                ],
                overall_gap_percentage=40.0
            )
        elif name == "LearningRoadmap":
            from models.schemas import RoadmapStep
            return response_model(
                target_role="Backend Engineer",
                weekly_plan=[
                    RoadmapStep(week=1, topic="Docker and Containerizing Flask apps", resources=["Docker official docs", "Flask scaling guide"], project_milestone="Optimize multi-stage Docker build", certification_suggestion=None),
                    RoadmapStep(week=2, topic="Pinecone vector databases and embeddings mapping", resources=["Pinecone docs", "Vector databases basics"], project_milestone="Implement vector indexing script in Python", certification_suggestion=None),
                ],
                estimated_completion_weeks=2
            )
        elif name == "CareerReadiness":
            return response_model(
                overall_percentage=72.0,
                profile_strength=79.0,
                skill_match_strength=60.0,
                mock_interview_strength=75.0,
                next_steps=[
                    "Implement a Docker container deployment locally.",
                    "Study basic similarity query indexing using Pinecone vector spaces.",
                    "Revise high-frequency systems design interview questions."
                ]
            )
        
        return response_model.construct()

# Single global service instance
mistral_service = MistralService()
