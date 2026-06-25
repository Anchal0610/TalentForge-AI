from crewai import Agent
from utils.logger import logger

class AnswerGeneratorAgent:
    def __init__(self, llm=None):
        self.llm = llm

    def get_agent(self) -> Agent:
        """Returns the CrewAI Agent for Answer Generation."""
        logger.info("Initializing Answer Generator Agent...")
        return Agent(
            role="Senior Interview Success Mentor",
            goal="Formulate tiered study guides with beginner, intermediate, and expert answers for job-prep readiness.",
            backstory=(
                "You are a coding bootcamp director and tech career accelerator. "
                "You translate engineering concepts into articulate explanations, "
                "showing candidates exactly what key metrics and keywords to mention to stand out."
            ),
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )
