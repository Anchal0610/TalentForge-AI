from graph.knowledge_graph import CareerKnowledgeGraph
from utils.logger import logger

class CareerGraphBuilder:
    @staticmethod
    def build_user_career_graph(
        user_name: str, 
        target_role: str, 
        skills: list, 
        gaps: list,
        projects: list = None
    ) -> CareerKnowledgeGraph:
        """Constructs an integrated Knowledge Graph mapping skills, roles, gaps, and study resources."""
        logger.info(f"Building career intelligence graph for {user_name} targeting {target_role}")
        kg = CareerKnowledgeGraph()
        
        # 1. Base User and Target
        kg.add_user(user_name, target_role)
        
        # 2. Add existing skills
        for skill in skills:
            kg.add_skill(skill)
            kg.link_skill_to_role(skill, target_role, is_gap=False)
            
        # 3. Add missing skills (gaps)
        for gap_skill in gaps:
            kg.add_skill(gap_skill)
            kg.link_skill_to_role(gap_skill, target_role, is_gap=True)
            
            # Seed study resources for missing gaps
            kg.add_learning_resource(f"Accelerated {gap_skill} Certification Guide", gap_skill)
            kg.add_learning_resource(f"Mastering {gap_skill} in Production (GitHub)", gap_skill)
            
            # Seed interview questions
            kg.add_interview_question(f"Explain key architectural bottlenecks when implementing {gap_skill}.", gap_skill)
            kg.add_interview_question(f"What are the best practices for scaling {gap_skill} deployments?", gap_skill)

        # 4. Bind Projects if available
        if projects:
            for proj in projects:
                kg.graph.add_node(proj, category="Project", color="#EAB308", size=15)
                kg.graph.add_edge(user_name, proj, relationship="built")
                # Connect projects to a random existing skill for visualization context
                if skills:
                    kg.graph.add_edge(proj, skills[0], relationship="implements")

        return kg
