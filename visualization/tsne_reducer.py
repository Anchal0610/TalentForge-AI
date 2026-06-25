import numpy as np
from typing import List, Union
from utils.logger import logger

class TSNEReducer:
    def __init__(self, n_components: int = 3, random_state: int = 42):
        self.n_components = n_components
        self.random_state = random_state

    def fit_transform(self, embeddings: Union[List[List[float]], np.ndarray]) -> np.ndarray:
        """Projects high dimensional embeddings into 3D using t-SNE."""
        data = np.array(embeddings)
        
        # t-SNE requires perplexity less than number of samples
        n_samples = data.shape[0]
        if n_samples < 5:
            logger.warning("Too few data points for t-SNE. Seeding mock random spaces.")
            return np.random.uniform(-5, 5, size=(n_samples, self.n_components))

        perplexity = min(30, max(2, n_samples - 1))
        
        try:
            from sklearn.manifold import TSNE
            tsne = TSNE(
                n_components=self.n_components,
                random_state=self.random_state,
                perplexity=perplexity,
                n_iter=1000
            )
            return tsne.fit_transform(data)
        except Exception as e:
            logger.error(f"t-SNE reduction failed: {str(e)}. Falling back to basic PCA/random spaces.")
            try:
                from sklearn.decomposition import PCA
                pca = PCA(n_components=self.n_components, random_state=self.random_state)
                return pca.fit_transform(data)
            except Exception:
                return np.random.uniform(-5, 5, size=(n_samples, self.n_components))
