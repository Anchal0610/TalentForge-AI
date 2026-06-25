from crewai import Agent
from utils.logger import logger

class LearningRoadmapAgent:
    def __init__(self, llm=None):
        self.llm = llm

    def get_agent(self) -> Agent:
        """Returns the CrewAI Agent for Roadmap Creation."""
        logger.info("Initializing Learning Roadmap Agent...")
        return Agent(
            role="Syllabus Design Architect",
            goal="Design highly structured, weekly curriculum models with realistic code milestones and course recommendations.",
            backstory=(
                "You are an instructional designer and software tutor. "
                "You know how to sequence technical learnings starting from basics up to complete system architectures, "
                "creating hands-on project milestones to validate theoretical knowledge."
            ),
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )
