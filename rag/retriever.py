from typing import List, Dict, Any, Optional
from services.pinecone_service import pinecone_service
from rag.embeddings import embedding_pipeline
from utils.logger import logger

class RAGRetriever:
    def __init__(self, default_index: str = "nexora-career-index"):
        self.index_name = default_index

    def retrieve(
        self, 
        query: str, 
        limit: int = 4, 
        filter_payload: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Performs semantic similarity search for a query using Pinecone."""
        logger.info(f"Retrieving context for query: '{query}' via Pinecone")
        query_vector = embedding_pipeline.embed_text(query)
        
        results = pinecone_service.similarity_search(
            index_name=self.index_name,
            query_vector=query_vector,
            limit=limit,
            filter_payload=filter_payload
        )
        return results

    def get_context_string(
        self, 
        query: str, 
        limit: int = 4, 
        filter_payload: Optional[Dict[str, Any]] = None
    ) -> str:
        """Helper to return a single formatted string of retrieved chunks."""
        hits = self.retrieve(query, limit, filter_payload)
        if not hits:
            return "No relevant context found."
            
        context_parts = []
        for i, hit in enumerate(hits):
            doc_name = hit["payload"].get("document_name", "Unknown Document")
            content = hit["content"]
            context_parts.append(f"--- Context Chunk {i+1} (Source: {doc_name}) ---\n{content}")
            
        return "\n\n".join(context_parts)

# Export default retriever instance
retriever = RAGRetriever()
