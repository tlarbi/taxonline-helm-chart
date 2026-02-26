"""
Pipeline Service: Bronze -> Silver -> Gold
Bronze: Raw PDF extraction
Silver: Cleaning, chunking, metadata enrichment
Gold: Embedding + indexing in Qdrant/OpenSearch
"""
import asyncio
from datetime import datetime
from typing import AsyncGenerator
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.pipeline_job import PipelineJob, JobStatus
from app.models.document import Document, DocumentStatus
from app.services.qdrant_service import qdrant_service
from app.services.s3_service import s3_service

# In-memory pub/sub for WebSocket streaming
_job_streams: dict[int, list] = {}


class PipelineService:

    async def run(self, document_id: int, job_id: int):
        async with AsyncSessionLocal() as db:
            job = await db.get(PipelineJob, job_id)
            doc = await db.get(Document, document_id)
            job.status = JobStatus.running
            job.started_at = datetime.utcnow()
            await db.commit()

        try:
            await self._log(job_id, "📥 Starting pipeline...", 0, "bronze")
            pdf_bytes = await s3_service.download(doc.s3_key)

            # Bronze: Extract text
            await self._log(job_id, "🥉 Bronze: Extracting PDF text...", 10, "bronze")
            raw_text = await self._extract_pdf(pdf_bytes)
            await self._log(job_id, f"✅ Extracted {len(raw_text)} chars", 25, "bronze")

            # Silver: Clean + chunk
            await self._log(job_id, "🥈 Silver: Chunking & enriching...", 30, "silver")
            chunks = await self._chunk_text(raw_text, doc)
            await self._log(job_id, f"✅ Created {len(chunks)} chunks", 50, "silver")

            # Gold: Embed + index
            await self._log(job_id, "🥇 Gold: Embedding & indexing...", 55, "gold")
            chunk_ids = await self._index_chunks(chunks, document_id, job_id)
            await self._log(job_id, f"✅ Indexed {len(chunk_ids)} vectors", 90, "gold")

            # Finalize
            async with AsyncSessionLocal() as db:
                job = await db.get(PipelineJob, job_id)
                doc = await db.get(Document, document_id)
                job.status = JobStatus.completed
                job.progress = 100.0
                job.completed_at = datetime.utcnow()
                job.rollback_snapshot = {"chunk_ids": chunk_ids, "document_id": document_id}
                doc.status = DocumentStatus.indexed
                doc.chunk_count = len(chunk_ids)
                doc.indexed_at = datetime.utcnow()
                await db.commit()

            await self._log(job_id, "🎉 Pipeline complete!", 100, "completed", status="completed")

        except Exception as e:
            async with AsyncSessionLocal() as db:
                job = await db.get(PipelineJob, job_id)
                doc = await db.get(Document, document_id)
                job.status = JobStatus.failed
                job.error = str(e)
                job.completed_at = datetime.utcnow()
                doc.status = DocumentStatus.failed
                await db.commit()
            await self._log(job_id, f"❌ Pipeline failed: {e}", job.progress, "failed", status="failed")

    async def rollback(self, job_id: int):
        async with AsyncSessionLocal() as db:
            job = await db.get(PipelineJob, job_id)
            if job.rollback_snapshot:
                doc_id = job.rollback_snapshot.get("document_id")
                await qdrant_service.delete_by_document(doc_id)
                job.status = JobStatus.rolled_back
                doc = await db.get(Document, job.document_id)
                if doc:
                    doc.status = DocumentStatus.rolled_back
                    doc.chunk_count = 0
                await db.commit()

    async def stream_logs(self, job_id: int) -> AsyncGenerator:
        _job_streams.setdefault(job_id, [])
        last_idx = 0
        timeout = 300  # 5 min max
        elapsed = 0
        while elapsed < timeout:
            events = _job_streams.get(job_id, [])
            for event in events[last_idx:]:
                yield event
                last_idx += 1
                if event.get("status") in ("completed", "failed"):
                    return
            await asyncio.sleep(0.5)
            elapsed += 0.5

    async def _log(self, job_id: int, message: str, progress: float, stage: str, status: str = "running"):
        event = {
            "message": message, "progress": progress,
            "stage": stage, "status": status,
            "timestamp": datetime.utcnow().isoformat(),
        }
        _job_streams.setdefault(job_id, []).append(event)
        async with AsyncSessionLocal() as db:
            job = await db.get(PipelineJob, job_id)
            if job:
                job.logs = (job.logs or []) + [event]
                job.progress = progress
                job.stage = stage
                await db.commit()

    async def _extract_pdf(self, pdf_bytes: bytes) -> str:
        import pypdf
        import io
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        return "\n".join(page.extract_text() or "" for page in reader.pages)

    async def _chunk_text(self, text: str, doc: Document) -> list:
        chunk_size = 800
        overlap = 100
        words = text.split()
        chunks = []
        i = 0
        while i < len(words):
            chunk_words = words[i:i + chunk_size]
            chunk_text = " ".join(chunk_words)
            chunks.append({
                "text": chunk_text,
                "document_id": doc.id,
                "filename": doc.filename,
                "doc_type": doc.doc_type,
                "year": doc.year,
                "domain": doc.domain,
                "tags": doc.tags,
                "chunk_index": len(chunks),
            })
            i += chunk_size - overlap
        return chunks

    async def _index_chunks(self, chunks: list, document_id: int, job_id: int) -> list:
        import httpx, uuid
        from qdrant_client.models import PointStruct
        ids = []
        batch_size = 50
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i:i + batch_size]
            points = []
            for chunk in batch:
                async with httpx.AsyncClient(timeout=60) as client:
                    from app.core.config import settings
                    r = await client.post(
                        f"http://{settings.OLLAMA_HOST}:{settings.OLLAMA_PORT}/api/embeddings",
                        json={"model": settings.OLLAMA_EMBEDDING_MODEL, "prompt": chunk["text"]},
                    )
                    embedding = r.json()["embedding"]
                chunk_id = str(uuid.uuid4())
                points.append(PointStruct(id=chunk_id, vector=embedding, payload=chunk))
                ids.append(chunk_id)
            await qdrant_service.client.upsert(
                collection_name=qdrant_service.collection,
                points=points,
            )
            progress = 55 + (i / len(chunks)) * 35
            await self._log(job_id, f"Indexed batch {i // batch_size + 1}", progress, "gold")
        return ids


pipeline_service = PipelineService()
