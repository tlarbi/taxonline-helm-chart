from qdrant_client import AsyncQdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue, SearchRequest
from app.core.config import settings
import httpx


class QdrantService:
    def __init__(self):
        self.client = AsyncQdrantClient(
            host=settings.QDRANT_HOST,
            port=settings.QDRANT_PORT,
            grpc_port=settings.QDRANT_GRPC_PORT,
            prefer_grpc=True,
        )
        self.collection = settings.QDRANT_COLLECTION

    async def ping(self) -> bool:
        try:
            await self.client.get_collections()
            return True
        except Exception:
            return False

    async def get_collection_info(self) -> dict:
        info = await self.client.get_collection(self.collection)
        return {
            "vectors_count": info.vectors_count,
            "indexed_vectors_count": info.indexed_vectors_count,
            "points_count": info.points_count,
        }

    async def search(self, query: str, domain: str = None, limit: int = 20) -> list:
        # Get embedding from Ollama
        embedding = await self._get_embedding(query)
        filters = None
        if domain:
            filters = Filter(
                must=[FieldCondition(key="domain", match=MatchValue(value=domain))]
            )
        results = await self.client.search(
            collection_name=self.collection,
            query_vector=embedding,
            query_filter=filters,
            limit=limit,
            with_payload=True,
        )
        return [
            {
                "id": str(r.id),
                "score": r.score,
                "text": r.payload.get("text", ""),
                "metadata": {k: v for k, v in r.payload.items() if k != "text"},
            }
            for r in results
        ]

    async def get_point(self, point_id: str) -> dict:
        results = await self.client.retrieve(
            collection_name=self.collection,
            ids=[point_id],
            with_payload=True,
            with_vectors=False,
        )
        if not results:
            return None
        r = results[0]
        return {"id": str(r.id), "payload": r.payload}

    async def update_point(self, point_id: str, updates: dict):
        from qdrant_client.models import SetPayload
        await self.client.set_payload(
            collection_name=self.collection,
            payload=updates,
            points=[point_id],
        )

    async def delete_point(self, point_id: str):
        from qdrant_client.models import PointIdsList
        await self.client.delete(
            collection_name=self.collection,
            points_selector=PointIdsList(points=[point_id]),
        )

    async def delete_by_document(self, document_id: int):
        """Delete all chunks for a document (rollback)"""
        from qdrant_client.models import FilterSelector
        await self.client.delete(
            collection_name=self.collection,
            points_selector=FilterSelector(
                filter=Filter(
                    must=[FieldCondition(key="document_id", match=MatchValue(value=document_id))]
                )
            ),
        )

    async def _get_embedding(self, text: str) -> list:
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(
                f"http://{settings.OLLAMA_HOST}:{settings.OLLAMA_PORT}/api/embeddings",
                json={"model": settings.OLLAMA_EMBEDDING_MODEL, "prompt": text},
            )
            return r.json()["embedding"]


qdrant_service = QdrantService()
