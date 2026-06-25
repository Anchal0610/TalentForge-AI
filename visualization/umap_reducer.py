import numpy as np
from typing import List, Union
from utils.logger import logger

class UMAPReducer:
    def __init__(self, n_components: int = 3, random_state: int = 42):
        self.n_components = n_components
        self.random_state = random_state
        self.reducer = None
        self._init_reducer()

    def _init_reducer(self):
        try:
            import umap
            logger.info("Initializing UMAP dimension reducer...")
            self.reducer = umap.UMAP(
                n_components=self.n_components,
                random_state=self.random_state,
                n_neighbors=5,
                min_dist=0.3
            )
        except (ImportError, Exception) as e:
            logger.warning(f"UMAP installation unavailable or failed to import ({str(e)}). Falling back to PCA for dimensionality reduction.")
            self.reducer = None

    def fit_transform(self, embeddings: Union[List[List[float]], np.ndarray]) -> np.ndarray:
        """Projects high dimensional embeddings array into n-components (default 3D)."""
        data = np.array(embeddings)
        if len(data.shape) < 2 or data.shape[0] < 3:
            logger.warning("Insufficient data points for dimensionality reduction. Seeding mock random spaces.")
            # return standard 3D random space matching number of points
            return np.random.uniform(-5, 5, size=(data.shape[0], self.n_components))

        # Check if UMAP client is available
        if self.reducer:
            try:
                return self.reducer.fit_transform(data)
            except Exception as e:
                logger.error(f"UMAP reduction failed: {str(e)}. Falling back to PCA.")
                
        # PCA Fallback
        try:
            from sklearn.decomposition import PCA
            pca = PCA(n_components=self.n_components, random_state=self.random_state)
            return pca.fit_transform(data)
        except Exception as pca_err:
            logger.error(f"PCA fallback failed: {str(pca_err)}")
            return np.random.uniform(-5, 5, size=(data.shape[0], self.n_components))
