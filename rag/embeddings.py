from typing import List
from services.mistral_service import mistral_service
from utils.logger import logger

class EmbeddingPipeline:
    def __init__(self, model_name: str = "mistral-embed"):
        self.model_name = model_name

    def embed_text(self, text: str) -> List[float]:
        """Generates embedding for a single text chunk (1024 dimensions)."""
        return mistral_service.get_embedding(text, model=self.model_name)

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """Generates embeddings for a batch of text chunks."""
        logger.info(f"Generating Mistral embeddings for batch of {len(texts)} text chunks...")
        embeddings = []
        for i, text in enumerate(texts):
            try:
                emb = self.embed_text(text)
                embeddings.append(emb)
            except Exception as e:
                logger.error(f"Failed to generate embedding for chunk {i}: {str(e)}")
                # Append standard-dimension zero/mock vector on failure (1024 dims for Mistral)
                embeddings.append([0.0] * 1024)
        return embeddings

# Global default pipeline instance
embedding_pipeline = EmbeddingPipeline()
