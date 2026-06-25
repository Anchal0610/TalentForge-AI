from crewai import Agent
from utils.logger import logger

class InterviewGeneratorAgent:
    def __init__(self, llm=None):
        self.llm = llm

    def get_agent(self) -> Agent:
        """Returns the CrewAI Agent for Interview Generation."""
        logger.info("Initializing Interview Generator Agent...")
        return Agent(
            role="Lead Technical Interview Panelist",
            goal="Formulate highly relevant behavioral, domain-specific, and company-specific technical interview questions.",
            backstory=(
                "You are an engineering director who has conducted hundreds of panel interviews at FAANG and startups. "
                "You design challenging questions that test design tradeoffs, programming logic, and structural scaling issues."
            ),
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )
