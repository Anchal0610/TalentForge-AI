from crewai import Agent
from utils.logger import logger

class CareerAdvisorAgent:
    def __init__(self, llm=None):
        self.llm = llm

    def get_agent(self) -> Agent:
        """Returns the CrewAI Agent for Career Advising."""
        logger.info("Initializing Career Advisor Agent...")
        return Agent(
            role="Principal Career Architect",
            goal="Predict and map optimal career pathways based on user qualifications, aligning paths with industry demand trends.",
            backstory=(
                "You are a talent development expert and career pathway designer. "
                "You analyze emerging job market dynamics, salaries, and title distributions. "
                "Your role matches users with sustainable, high-growth tech positions."
            ),
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )
