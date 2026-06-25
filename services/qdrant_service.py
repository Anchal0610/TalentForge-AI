import os
import uuid
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.http import models
from qdrant_client.http.exceptions import UnexpectedResponse
from utils.logger import logger
from dotenv import load_dotenv

load_dotenv()

class QdrantService:
    def __init__(self):
        url = os.getenv("QDRANT_URL", ":memory:")
        api_key = os.getenv("QDRANT_API_KEY")
        
        # Strip outer quotes if users add them by accident in .env
        if url:
            url = url.strip("'\"")
        if api_key:
            api_key = api_key.strip("'\"")

        logger.info(f"Initializing Qdrant Client in mode/URL: {url}")
        
        try:
            if url == ":memory:":
                self.client = QdrantClient(location=":memory:")
            elif url.startswith("http"):
                self.client = QdrantClient(url=url, api_key=api_key)
            else:
                # Persistent local storage fallback
                self.client = QdrantClient(path=url)
            logger.info("Qdrant Client connected successfully.")
        except Exception as e:
            logger.error(f"Failed to connect to Qdrant: {str(e)}. Initializing in-memory fallback.")
            self.client = QdrantClient(location=":memory:")

    def recreate_collection(self, collection_name: str, vector_size: int = 1536) -> bool:
        """Deletes if exists and recreates a Qdrant collection with cosine distance metric."""
        try:
            logger.info(f"Recreating Qdrant collection: {collection_name} (Size: {vector_size})")
            self.client.recreate_collection(
                collection_name=collection_name,
                vectors_config=models.VectorParams(
                    size=vector_size,
                    distance=models.Distance.COSINE
                )
            )
            return True
        except Exception as e:
            logger.error(f"Error creating collection {collection_name}: {str(e)}")
            return False

    def check_collection_exists(self, collection_name: str) -> bool:
        """Checks if collection exists in Qdrant."""
        try:
            self.client.get_collection(collection_name=collection_name)
            return True
        except (UnexpectedResponse, Exception):
            return False

    def ensure_collection(self, collection_name: str, vector_size: int = 1536) -> bool:
        """Creates collection if not exists."""
        if not self.check_collection_exists(collection_name):
            return self.recreate_collection(collection_name, vector_size)
        return True

    def upsert_chunks(
        self, 
        collection_name: str, 
        texts: List[str], 
        embeddings: List[List[float]], 
        metadatas: Optional[List[Dict[str, Any]]] = None
    ) -> List[str]:
        """Upserts texts and corresponding embeddings with payload metadata into Qdrant."""
        self.ensure_collection(collection_name, len(embeddings[0]))
        
        points = []
        point_ids = []
        
        for i, (text, vector) in enumerate(zip(texts, embeddings)):
            point_id = str(uuid.uuid4())
            point_ids.append(point_id)
            
            payload = {"content": text}
            if metadatas and i < len(metadatas):
                payload.update(metadatas[i])
                
            points.append(
                models.PointStruct(
                    id=point_id,
                    vector=vector,
                    payload=payload
                )
            )
            
        try:
            logger.info(f"Upserting {len(points)} vectors into collection '{collection_name}'...")
            self.client.upsert(
                collection_name=collection_name,
                points=points
            )
            logger.info("Upsert successful.")
            return point_ids
        except Exception as e:
            logger.error(f"Failed vector upsert: {str(e)}")
            return []

    def similarity_search(
        self, 
        collection_name: str, 
        query_vector: List[float], 
        limit: int = 5,
        filter_payload: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Executes a vector search in Qdrant."""
        if not self.check_collection_exists(collection_name):
            logger.warning(f"Search aborted: Collection '{collection_name}' does not exist.")
            return []
            
        qdrant_filter = None
        if filter_payload:
            conditions = [
                models.FieldCondition(
                    key=k,
                    match=models.MatchValue(value=v)
                ) for k, v in filter_payload.items()
            ]
            qdrant_filter = models.Filter(must=conditions)
            
        try:
            search_result = self.client.search(
                collection_name=collection_name,
                query_vector=query_vector,
                limit=limit,
                query_filter=qdrant_filter,
                with_payload=True
            )
            
            results = []
            for hit in search_result:
                results.append({
                    "id": hit.id,
                    "score": hit.score,
                    "payload": hit.payload,
                    "content": hit.payload.get("content", "")
                })
            return results
        except Exception as e:
            logger.error(f"Search failed: {str(e)}")
            return []

# Single global connection service instance
qdrant_service = QdrantService()
