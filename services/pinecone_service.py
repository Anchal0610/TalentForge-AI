import os
import uuid
from typing import List, Dict, Any, Optional
from utils.logger import logger
from dotenv import load_dotenv

# Import Pinecone dynamically for fallback safety
try:
    from pinecone import Pinecone, ServerlessSpec
    PINECONE_AVAILABLE = True
except ImportError:
    PINECONE_AVAILABLE = False

load_dotenv()

class PineconeService:
    def __init__(self):
        self.api_key = os.getenv("PINECONE_API_KEY")
        self.index_name = os.getenv("PINECONE_INDEX_NAME", "nexora-career-index")
        
        # Clean quotes
        if self.api_key:
            self.api_key = self.api_key.strip("'\"")
        if self.index_name:
            self.index_name = self.index_name.strip("'\"")
            
        if not PINECONE_AVAILABLE or not self.api_key or self.api_key.startswith("your_"):
            logger.warning("Pinecone credentials missing or client unavailable. Operating in MOCK mode.")
            self.pc = None
            self.index = None
        else:
            try:
                self.pc = Pinecone(api_key=self.api_key)
                logger.info("Pinecone client initialized successfully.")
                self.ensure_index(self.index_name, dimension=1024)
                self.index = self.pc.Index(self.index_name)
            except Exception as e:
                logger.error(f"Failed to initialize Pinecone Index connection: {str(e)}. Operating in MOCK mode.")
                self.pc = None
                self.index = None

    def ensure_index(self, index_name: str, dimension: int = 1024):
        """Creates Pinecone serverless index if it does not exist."""
        if not self.pc:
            return
            
        try:
            active_indexes = [idx.name for idx in self.pc.list_indexes()]
            if index_name not in active_indexes:
                logger.info(f"Creating new Pinecone Serverless index: {index_name} (Dimension: {dimension})")
                self.pc.create_index(
                    name=index_name,
                    dimension=dimension,
                    metric="cosine",
                    spec=ServerlessSpec(
                        cloud="aws",
                        region="us-east-1"
                    )
                )
                logger.info("Index created successfully.")
            else:
                logger.info(f"Pinecone index '{index_name}' already exists.")
        except Exception as e:
            logger.error(f"Error checking/creating Pinecone index: {str(e)}")

    def upsert_chunks(
        self, 
        index_name: str, 
        texts: List[str], 
        embeddings: List[List[float]], 
        metadatas: Optional[List[Dict[str, Any]]] = None
    ) -> List[str]:
        """Upserts embeddings and text metadata to the Pinecone index."""
        if not self.index:
            logger.warning("Upsert bypassed (MOCK mode active). Generating random IDs.")
            return [str(uuid.uuid4()) for _ in range(len(texts))]

        vectors = []
        point_ids = []
        
        for i, (text, vector) in enumerate(zip(texts, embeddings)):
            point_id = str(uuid.uuid4())
            point_ids.append(point_id)
            
            # Combine content with other metadata items
            payload = {"content": text}
            if metadatas and i < len(metadatas):
                payload.update(metadatas[i])
                
            # Pinecone requires tuple: (id, vector, metadata)
            vectors.append((point_id, vector, payload))
            
        try:
            logger.info(f"Upserting {len(vectors)} points to Pinecone Index: {self.index_name}...")
            # Upsert in batches of 100
            batch_size = 100
            for k in range(0, len(vectors), batch_size):
                batch = vectors[k:k+batch_size]
                self.index.upsert(vectors=batch)
                
            logger.info("Upsert completed successfully.")
            return point_ids
        except Exception as e:
            logger.error(f"Pinecone upsert failed: {str(e)}")
            return []

    def similarity_search(
        self, 
        index_name: str, 
        query_vector: List[float], 
        limit: int = 5,
        filter_payload: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Queries Pinecone and extracts text values from payload metadata matches."""
        if not self.index:
            logger.warning("Query bypassed (MOCK mode active). Returning empty results.")
            return []
            
        # Format filters if any
        # Pinecone filters format: {"key": {"$eq": value}}
        filter_dict = {}
        if filter_payload:
            for k, v in filter_payload.items():
                filter_dict[k] = {"$eq": v}
                
        try:
            logger.info(f"Performing vector similarity search in index '{self.index_name}'...")
            query_response = self.index.query(
                vector=query_vector,
                top_k=limit,
                filter=filter_dict if filter_dict else None,
                include_metadata=True
            )
            
            results = []
            for match in query_response.get("matches", []):
                meta = match.get("metadata", {})
                results.append({
                    "id": match.get("id"),
                    "score": match.get("score", 0.0),
                    "payload": meta,
                    "content": meta.get("content", "")
                })
            return results
        except Exception as e:
            logger.error(f"Pinecone query failed: {str(e)}")
            return []

# Single global connection service instance
pinecone_service = PineconeService()
