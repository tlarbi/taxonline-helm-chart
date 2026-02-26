import uuid
import asyncio
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.auth import get_current_user, require_editor
from app.core.database import get_db
from app.models.document import Document, DocumentType
from app.models.pipeline_job import PipelineJob
from app.services.s3_service import s3_service
from app.services.pipeline_service import pipeline_service

router = APIRouter()


class DocumentMeta(BaseModel):
    doc_type: DocumentType
    year: int
    domain: str
    tags: List[str] = []


@router.post("/documents", dependencies=[Depends(require_editor)])
async def upload_documents(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    doc_type: str = Form(...),
    year: int = Form(...),
    domain: str = Form(...),
    tags: str = Form(""),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Max 10 files per upload")

    results = []
    for file in files:
        if not file.filename.endswith(".pdf"):
            raise HTTPException(status_code=400, detail=f"{file.filename}: PDF only")

        content = await file.read()
        if len(content) > 100 * 1024 * 1024:
            raise HTTPException(status_code=400, detail=f"{file.filename}: exceeds 100MB")

        # Upload to S3
        s3_key = f"documents/{uuid.uuid4()}/{file.filename}"
        await s3_service.upload(s3_key, content, content_type="application/pdf")

        # Create document record
        doc = Document(
            filename=file.filename,
            s3_key=s3_key,
            doc_type=doc_type,
            year=year,
            domain=domain,
            tags=tags.split(",") if tags else [],
            uploaded_by=current_user.id,
        )
        db.add(doc)
        await db.flush()

        # Create pipeline job
        job = PipelineJob(document_id=doc.id)
        db.add(job)
        await db.flush()
        doc.pipeline_job_id = job.id

        results.append({"document_id": doc.id, "job_id": job.id, "filename": file.filename})

        # Start async pipeline
        background_tasks.add_task(pipeline_service.run, doc.id, job.id)

    await db.commit()
    return {"uploaded": results}


@router.get("/documents")
async def list_documents(
    status: str = None,
    domain: str = None,
    doc_type: str = None,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    from sqlalchemy import select
    from app.models.document import DocumentStatus
    query = select(Document)
    if status:
        query = query.where(Document.status == status)
    if domain:
        query = query.where(Document.domain == domain)
    if doc_type:
        query = query.where(Document.doc_type == doc_type)
    result = await db.execute(query.order_by(Document.created_at.desc()).limit(200))
    docs = result.scalars().all()
    return [
        {
            "id": d.id, "filename": d.filename, "doc_type": d.doc_type,
            "year": d.year, "domain": d.domain, "tags": d.tags,
            "status": d.status, "chunk_count": d.chunk_count,
            "quality_score": d.quality_score, "created_at": d.created_at,
        }
        for d in docs
    ]


@router.delete("/documents/{doc_id}", dependencies=[Depends(require_editor)])
async def delete_document(doc_id: int, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    result = await db.execute(select(Document).where(Document.id == doc_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    # Rollback indexed chunks if needed
    if doc.status == "indexed":
        await pipeline_service.rollback(doc.pipeline_job_id)
    await s3_service.delete(doc.s3_key)
    await db.delete(doc)
    await db.commit()
    return {"deleted": doc_id}
