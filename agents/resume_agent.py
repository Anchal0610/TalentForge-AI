from crewai import Agent
from utils.logger import logger
import os

class ResumeAnalyzerAgent:
    def __init__(self, llm=None):
        self.llm = llm

    def get_agent(self) -> Agent:
        """Returns the CrewAI Agent for Resume Analysis."""
        logger.info("Initializing Resume Analyzer Agent...")
        return Agent(
            role="Senior Resume & ATS Strategist",
            goal="Scan and extract structured career components, analyze ATS format compatibility, and score resume relevance.",
            backstory=(
                "You are an elite HR systems engineer and professional resume auditor. "
                "You understand parser architectures, keyphrase indexing, and recruiting workflows. "
                "You isolate skills, projects, and work histories, producing deep structural insights."
            ),
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )
