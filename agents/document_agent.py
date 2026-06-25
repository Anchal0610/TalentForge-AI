from crewai import Agent
from utils.logger import logger

class DocumentIntelligenceAgent:
    def __init__(self, llm=None):
        self.llm = llm

    def get_agent(self) -> Agent:
        """Returns the CrewAI Agent for Document Intelligence."""
        logger.info("Initializing Document Intelligence Agent...")
        return Agent(
            role="Knowledge Extraction Architect",
            goal="Synthesize uploaded study materials, codebases, or reference guides into bite-sized technical briefs and key study concepts.",
            backstory=(
                "You are an academic researcher and expert technical writer. "
                "You digest complex whitepapers, textbooks, and release notes, "
                "distilling essential system parameters and core logical components."
            ),
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )
