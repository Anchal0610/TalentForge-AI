from crewai import Agent
from utils.logger import logger

class SkillGapAgent:
    def __init__(self, llm=None):
        self.llm = llm

    def get_agent(self) -> Agent:
        """Returns the CrewAI Agent for Skill Gap Analysis."""
        logger.info("Initializing Skill Gap Agent...")
        return Agent(
            role="Technical Competency Evaluator",
            goal="Identify exact mismatches between a candidate's current capabilities and the requirements of their target role.",
            backstory=(
                "You are a rigorous technical interviewer and skills taxonomist. "
                "You build skill matrix mappings, estimating learning curve difficulties and priorities. "
                "You pinpoint precise missing tools, frameworks, or system concepts."
            ),
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )
