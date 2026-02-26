from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.core.auth import get_current_user, require_editor
from app.core.database import get_db
from app.models.test_case import TestCase, TestRun

router = APIRouter()


class TestCaseCreate(BaseModel):
    question: str
    expected_answer: str
    expected_sources: List[str] = []
    domain: Optional[str] = None
    tags: List[str] = []


class TestRunCreate(BaseModel):
    name: str
    test_case_ids: List[int] = []   # empty = all active
    config_a: dict                   # retrieval config
    config_b: Optional[dict] = None  # A/B test second config


@router.get("/cases")
async def list_cases(
    domain: str = None,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    query = select(TestCase).where(TestCase.is_active == True)
    if domain:
        query = query.where(TestCase.domain == domain)
    result = await db.execute(query.order_by(TestCase.created_at.desc()))
    cases = result.scalars().all()
    return [
        {
            "id": c.id, "question": c.question,
            "expected_answer": c.expected_answer,
            "domain": c.domain, "tags": c.tags,
        }
        for c in cases
    ]


@router.post("/cases", dependencies=[Depends(require_editor)])
async def create_case(
    payload: TestCaseCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    case = TestCase(**payload.dict(), created_by=current_user.id)
    db.add(case)
    await db.commit()
    return {"id": case.id}


@router.put("/cases/{case_id}", dependencies=[Depends(require_editor)])
async def update_case(case_id: int, payload: TestCaseCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TestCase).where(TestCase.id == case_id))
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404)
    for k, v in payload.dict().items():
        setattr(case, k, v)
    await db.commit()
    return {"updated": case_id}


@router.delete("/cases/{case_id}", dependencies=[Depends(require_editor)])
async def delete_case(case_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TestCase).where(TestCase.id == case_id))
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404)
    case.is_active = False
    await db.commit()
    return {"deleted": case_id}


@router.post("/runs")
async def create_run(
    payload: TestRunCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    from app.services.test_service import test_service
    run = TestRun(
        name=payload.name,
        config_a=payload.config_a,
        config_b=payload.config_b,
        created_by=current_user.id,
    )
    db.add(run)
    await db.commit()
    # Run async
    import asyncio
    asyncio.create_task(test_service.run(run.id, payload.test_case_ids))
    return {"run_id": run.id, "status": "started"}


@router.get("/runs")
async def list_runs(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    result = await db.execute(select(TestRun).order_by(TestRun.created_at.desc()).limit(50))
    runs = result.scalars().all()
    return [
        {
            "id": r.id, "name": r.name, "status": r.status,
            "summary": r.summary, "created_at": r.created_at,
            "completed_at": r.completed_at,
        }
        for r in runs
    ]


@router.get("/runs/{run_id}")
async def get_run(run_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    result = await db.execute(select(TestRun).where(TestRun.id == run_id))
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404)
    return {
        "id": run.id, "name": run.name, "status": run.status,
        "config_a": run.config_a, "config_b": run.config_b,
        "results": run.results, "summary": run.summary,
        "started_at": run.started_at, "completed_at": run.completed_at,
    }
