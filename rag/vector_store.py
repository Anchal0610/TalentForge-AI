from typing import List, Dict, Any, Optional
from services.pinecone_service import pinecone_service
from rag.embeddings import embedding_pipeline
from utils.logger import logger

class VectorStoreManager:
    def __init__(self, default_index: str = "nexora-career-index"):
        self.index_name = default_index

    def index_document(
        self, 
        doc_name: str, 
        chunks: List[str], 
        metadata_common: Optional[Dict[str, Any]] = None
    ) -> List[str]:
        """Generates embeddings and indexing keys for chunks, then upserts to Pinecone."""
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
            
        point_ids = pinecone_service.upsert_chunks(
            index_name=self.index_name,
            texts=chunks,
            embeddings=embeddings,
            metadatas=metadatas
        )
        return point_ids

# Export default vector store manager
vector_store = VectorStoreManager()
