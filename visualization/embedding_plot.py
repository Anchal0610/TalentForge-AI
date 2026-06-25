import numpy as np
import plotly.graph_objects as go
from typing import List, Dict, Any, Tuple
from visualization.umap_reducer import UMAPReducer
from visualization.tsne_reducer import TSNEReducer
from utils.logger import logger

class EmbeddingPlotter:
    def __init__(self):
        self.umap_reducer = UMAPReducer()
        self.tsne_reducer = TSNEReducer()

    def generate_3d_scatter(
        self, 
        labels: List[str], 
        categories: List[str], 
        embeddings: List[List[float]],
        reducer_type: str = "UMAP"
    ) -> go.Figure:
        """Projects embeddings and generates a next-gen dark 3D scatter plot using Plotly."""
        logger.info(f"Generating 3D Scatter plot using {reducer_type}...")
        
        # 1. Reduce dimensions
        if reducer_type.upper() == "UMAP":
            coords = self.umap_reducer.fit_transform(embeddings)
        else:
            coords = self.tsne_reducer.fit_transform(embeddings)
            
        x_vals = coords[:, 0]
        y_vals = coords[:, 1]
        z_vals = coords[:, 2]

        # 2. Map colors and sizes based on categories
        category_colors = {
            "User": "#FF4B4B",        # Neon Red
            "Role": "#00C0F2",        # Neon Blue
            "Skill": "#00F294",       # Neon Green
            "Technology": "#FFAA00",  # Orange
            "Resource": "#D946EF",    # Pink
            "Question": "#A855F7",    # Purple
            "General": "#E2E8F0"      # Off-white
        }
        
        colors = [category_colors.get(cat, "#E2E8F0") for cat in categories]
        sizes = [20 if cat in ["User", "Role"] else 12 for cat in categories]
        
        # 3. Create Scatter3d Trace
        scatter_trace = go.Scatter3d(
            x=x_vals,
            y=y_vals,
            z=z_vals,
            mode='markers+text',
            text=labels,
            textposition="top center",
            textfont=dict(size=9, color="#E2E8F0"),
            marker=dict(
                size=sizes,
                color=colors,
                opacity=0.85,
                line=dict(width=1, color='rgba(255,255,255,0.2)')
            ),
            hoverinfo='text',
            hovertext=[f"<b>{lbl}</b><br>Category: {cat}<br>X: {x:.2f}, Y: {y:.2f}, Z: {z:.2f}" 
                       for lbl, cat, x, y, z in zip(labels, categories, x_vals, y_vals, z_vals)]
        )

        # 4. Optional: draw connection vectors between User node and Target Role node
        data_traces = [scatter_trace]
        
        try:
            user_idx = categories.index("User")
            role_idx = categories.index("Role")
            
            # Extract coordinates
            ux, uy, uz = coords[user_idx]
            rx, ry, rz = coords[role_idx]
            
            # Compute Euclidean distance
            distance = np.sqrt((ux-rx)**2 + (uy-ry)**2 + (uz-rz)**2)
            
            # Draw line between them
            line_trace = go.Scatter3d(
                x=[ux, rx],
                y=[uy, ry],
                z=[uz, rz],
                mode='lines',
                line=dict(color='#F59E0B', width=3, dash='dash'),
                name='Role Proximity Vector',
                hoverinfo='text',
                hovertext=f"Proximity Distance: {distance:.2f} (lower is closer)"
            )
            data_traces.append(line_trace)
            logger.info(f"Plotted connection vector between User and Target Role. Distance: {distance:.4f}")
        except ValueError:
            pass # Either User or Role nodes are missing from the inputs

        # 5. Build Layout
        layout = go.Layout(
            scene=dict(
                xaxis=dict(
                    title="Component 1", 
                    gridcolor='rgba(255, 255, 255, 0.05)', 
                    backgroundcolor='rgba(10, 15, 30, 0.95)',
                    color="#94A3B8"
                ),
                yaxis=dict(
                    title="Component 2", 
                    gridcolor='rgba(255, 255, 255, 0.05)', 
                    backgroundcolor='rgba(10, 15, 30, 0.95)',
                    color="#94A3B8"
                ),
                zaxis=dict(
                    title="Component 3", 
                    gridcolor='rgba(255, 255, 255, 0.05)', 
                    backgroundcolor='rgba(10, 15, 30, 0.95)',
                    color="#94A3B8"
                ),
                bgcolor='rgba(10, 15, 30, 0.95)'
            ),
            margin=dict(r=0, l=0, b=0, t=0),
            paper_bgcolor='rgba(10, 15, 30, 0.95)',
            plot_bgcolor='rgba(10, 15, 30, 0.95)',
            legend=dict(
                font=dict(color="#E2E8F0"),
                bgcolor="rgba(10, 15, 30, 0.6)"
            ),
            width=800,
            height=600
        )
        
        fig = go.Figure(data=data_traces, layout=layout)
        return fig

# Export default plotter instance
embedding_plotter = EmbeddingPlotter()
