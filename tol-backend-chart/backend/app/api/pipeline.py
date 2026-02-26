from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import asyncio
import json

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.pipeline_job import PipelineJob
from app.services.pipeline_service import pipeline_service

router = APIRouter()


@router.get("/jobs/{job_id}")
async def get_job(job_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    result = await db.execute(select(PipelineJob).where(PipelineJob.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {
        "id": job.id, "document_id": job.document_id,
        "status": job.status, "stage": job.stage,
        "progress": job.progress, "logs": job.logs,
        "error": job.error, "started_at": job.started_at,
        "completed_at": job.completed_at,
    }


@router.get("/jobs")
async def list_jobs(
    status: str = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    query = select(PipelineJob).order_by(PipelineJob.created_at.desc()).limit(limit)
    if status:
        query = query.where(PipelineJob.status == status)
    result = await db.execute(query)
    jobs = result.scalars().all()
    return [
        {
            "id": j.id, "document_id": j.document_id, "status": j.status,
            "stage": j.stage, "progress": j.progress,
            "created_at": j.created_at, "completed_at": j.completed_at,
        }
        for j in jobs
    ]


@router.post("/jobs/{job_id}/rollback")
async def rollback_job(
    job_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    result = await db.execute(select(PipelineJob).where(PipelineJob.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status not in ("completed", "failed"):
        raise HTTPException(status_code=400, detail="Can only rollback completed or failed jobs")
    await pipeline_service.rollback(job_id)
    return {"rolled_back": job_id}


# WebSocket endpoint for real-time pipeline logs
@router.websocket("/ws/{job_id}")
async def pipeline_ws(websocket: WebSocket, job_id: int):
    await websocket.accept()
    try:
        # Token check via query param
        token = websocket.query_params.get("token")
        if not token:
            await websocket.close(code=4001, reason="Unauthorized")
            return

        # Stream logs from pipeline_service
        async for event in pipeline_service.stream_logs(job_id):
            await websocket.send_text(json.dumps(event))
            if event.get("status") in ("completed", "failed", "rolled_back"):
                break
    except WebSocketDisconnect:
        pass
    finally:
        await websocket.close()
