from crewai import Agent
from utils.logger import logger

class ReadinessAgent:
    def __init__(self, llm=None):
        self.llm = llm

    def get_agent(self) -> Agent:
        """Returns the CrewAI Agent for calculating readiness."""
        logger.info("Initializing Readiness Agent...")
        return Agent(
            role="Career Readiness Quantitative Analyst",
            goal="Synthesize candidate profiles, technical gap counts, and test performance metrics into an overall Readiness Index.",
            backstory=(
                "You are an assessment systems developer and statistician. "
                "You weigh complex indicators like resume scores, projects completed, and mock interview performance "
                "to yield a single predictive career preparation percentage."
            ),
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )
