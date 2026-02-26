from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional, List

from app.core.auth import get_current_user, require_editor
from app.core.database import get_db
from app.services.qdrant_service import qdrant_service

router = APIRouter()


class ChunkUpdate(BaseModel):
    text: Optional[str] = None
    metadata: Optional[dict] = None


@router.get("/search")
async def search_chunks(
    q: str = Query(..., min_length=3),
    domain: str = None,
    limit: int = Query(20, le=100),
    _=Depends(get_current_user),
):
    """Semantic search in Qdrant chunks"""
    results = await qdrant_service.search(q, domain=domain, limit=limit)
    return results


@router.get("/{chunk_id}")
async def get_chunk(chunk_id: str, _=Depends(get_current_user)):
    chunk = await qdrant_service.get_point(chunk_id)
    if not chunk:
        raise HTTPException(status_code=404, detail="Chunk not found")
    return chunk


@router.put("/{chunk_id}", dependencies=[Depends(require_editor)])
async def update_chunk(chunk_id: str, payload: ChunkUpdate):
    await qdrant_service.update_point(chunk_id, payload.dict(exclude_none=True))
    return {"updated": chunk_id}


@router.delete("/{chunk_id}", dependencies=[Depends(require_editor)])
async def delete_chunk(chunk_id: str):
    await qdrant_service.delete_point(chunk_id)
    return {"deleted": chunk_id}


@router.post("/reindex/{document_id}", dependencies=[Depends(require_editor)])
async def reindex_document(document_id: int, db: AsyncSession = Depends(get_db)):
    """Trigger re-indexation for a single document"""
    from app.services.pipeline_service import pipeline_service
    from app.models.document import Document
    from sqlalchemy import select
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404)
    import asyncio
    from app.models.pipeline_job import PipelineJob
    job = PipelineJob(document_id=doc.id)
    db.add(job)
    await db.commit()
    asyncio.create_task(pipeline_service.run(doc.id, job.id))
    return {"job_id": job.id}
