from typing import List, Dict, Any, Optional
from services.qdrant_service import qdrant_service
from rag.embeddings import embedding_pipeline
from utils.logger import logger

class VectorStoreManager:
    def __init__(self, default_collection: str = "nexora_docs"):
        self.collection_name = default_collection

    def index_document(
        self, 
        doc_name: str, 
        chunks: List[str], 
        metadata_common: Optional[Dict[str, Any]] = None
    ) -> List[str]:
        """Generates embeddings and indexing keys for chunks, then upserts to Qdrant."""
        if not chunks:
            logger.warning(f"No chunks provided for document: {doc_name}")
            return []
            
        embeddings = embedding_pipeline.embed_documents(chunks)
        
        metadatas = []
        for i, _ in enumerate(chunks):
            meta = {
                "document_name": doc_name,
                "chunk_index": i
            }
            if metadata_common:
                meta.update(metadata_common)
            metadatas.append(meta)
            
        point_ids = qdrant_service.upsert_chunks(
            collection_name=self.collection_name,
            texts=chunks,
            embeddings=embeddings,
            metadatas=metadatas
        )
        return point_ids

# Export default vector store manager
vector_store = VectorStoreManager()
