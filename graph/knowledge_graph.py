import networkx as nx
import plotly.graph_objects as go
import numpy as np
from typing import Dict, Any, List, Tuple, Optional

from utils.logger import logger

class CareerKnowledgeGraph:
    def __init__(self):
        self.graph = nx.DiGraph()

    def add_user(self, user_name: str, target_role: str):
        """Adds User node and links to target role."""
        self.graph.add_node(user_name, category="User", color="#FF4B4B", size=25)
        self.graph.add_node(target_role, category="Role", color="#00C0F2", size=22)
        self.graph.add_edge(user_name, target_role, relationship="aims_for")

    def add_skill(self, skill_name: str, parent_concept: Optional[str] = None):
        """Adds a Skill node and categorizes it."""
        self.graph.add_node(skill_name, category="Skill", color="#00F294", size=15)
        if parent_concept:
            self.graph.add_node(parent_concept, category="Technology", color="#FFAA00", size=18)
            self.graph.add_edge(parent_concept, skill_name, relationship="includes")

    def link_skill_to_role(self, skill_name: str, role_name: str, is_gap: bool = False):
        """Creates relationship between a Skill and a Job Role."""
        rel_type = "missing_for" if is_gap else "requires"
        color = "#FF3E3E" if is_gap else "#00F294"
        self.graph.add_edge(role_name, skill_name, relationship=rel_type, color=color)

    def add_learning_resource(self, resource_title: str, target_skill: str):
        """Links study resources to skill nodes."""
        self.graph.add_node(resource_title, category="Resource", color="#D946EF", size=12)
        self.graph.add_edge(resource_title, target_skill, relationship="teaches")

    def add_interview_question(self, question_text: str, target_concept: str):
        """Links interview preparation questions to skill nodes."""
        short_q = question_text[:25] + "..." if len(question_text) > 25 else question_text
        self.graph.add_node(short_q, category="Question", color="#A855F7", size=12, full_text=question_text)
        self.graph.add_edge(short_q, target_concept, relationship="tests")

    def build_plotly_figure(self) -> go.Figure:
        """Converts the NetworkX Graph into a beautiful interactive 2D Plotly scatter plot."""
        logger.info("Generating Plotly network visualization from NetworkX graph...")
        
        if len(self.graph.nodes) == 0:
            # Fallback node if graph is empty
            self.graph.add_node("Root", category="System", color="#888888", size=15)

        # Calculate spring layout
        pos = nx.spring_layout(self.graph, k=0.5, iterations=50, seed=42)
        
        # Edge lines
        edge_x = []
        edge_y = []
        for edge in self.graph.edges():
            x0, y0 = pos[edge[0]]
            x1, y1 = pos[edge[1]]
            edge_x.append(x0)
            edge_x.append(x1)
            edge_x.append(None)
            edge_y.append(y0)
            edge_y.append(y1)
            edge_y.append(None)

        edge_trace = go.Scatter(
            x=edge_x, y=edge_y,
            line=dict(width=1, color='#4A5568'),
            hoverinfo='none',
            mode='lines'
        )

        # Node points grouped by category
        node_x = []
        node_y = []
        node_text = []
        node_colors = []
        node_sizes = []
        
        for node in self.graph.nodes():
            x, y = pos[node]
            node_x.append(x)
            node_y.append(y)
            
            node_info = self.graph.nodes[node]
            cat = node_info.get("category", "General")
            color = node_info.get("color", "#FFFFFF")
            size = node_info.get("size", 12)
            
            node_colors.append(color)
            node_sizes.append(size)
            
            # Hover text details
            hover_details = f"<b>{node}</b><br>Category: {cat}"
            if "full_text" in node_info:
                hover_details += f"<br>Q: {node_info['full_text']}"
            node_text.append(hover_details)

        node_trace = go.Scatter(
            x=node_x, y=node_y,
            mode='markers+text',
            hoverinfo='text',
            text=[node.split(" (")[0] for node in self.graph.nodes()], # Shorter label display
            textposition="top center",
            textfont=dict(size=10, color="#E2E8F0"),
            marker=dict(
                showscale=False,
                color=node_colors,
                size=node_sizes,
                line=dict(width=2, color='#1A202C')
            ),
            hovertext=node_text
        )

        # Build figure
        fig = go.Figure(
            data=[edge_trace, node_trace],
            layout=go.Layout(
                showlegend=False,
                hovermode='closest',
                margin=dict(b=10, l=10, r=10, t=10),
                xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
                yaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
                plot_bgcolor='rgba(10, 15, 30, 0.95)',
                paper_bgcolor='rgba(10, 15, 30, 0.95)',
                width=800,
                height=500
            )
        )
        return fig
