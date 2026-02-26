import csv
import json
import io
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.query_log import QueryLog
from app.models.document import Document

router = APIRouter()


@router.get("/coverage")
async def fiscal_coverage(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    """Coverage by fiscal domain"""
    result = await db.execute(
        select(Document.domain, func.count(Document.id).label("doc_count"),
               func.sum(Document.chunk_count).label("chunk_count"))
        .where(Document.status == "indexed")
        .group_by(Document.domain)
        .order_by(func.sum(Document.chunk_count).desc())
    )
    rows = result.fetchall()
    return [
        {"domain": r.domain, "documents": r.doc_count, "chunks": r.chunk_count or 0}
        for r in rows
    ]


@router.get("/heatmap")
async def document_heatmap(
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Heatmap: documents consulted by day/domain"""
    since = datetime.utcnow() - timedelta(days=days)
    result = await db.execute(
        text("""
            SELECT 
                date_trunc('day', created_at) as day,
                domain,
                COUNT(*) as query_count
            FROM query_logs
            WHERE created_at >= :since AND domain IS NOT NULL
            GROUP BY date_trunc('day', created_at), domain
            ORDER BY day ASC
        """),
        {"since": since},
    )
    rows = result.fetchall()
    return [{"day": r.day, "domain": r.domain, "count": r.query_count} for r in rows]


@router.get("/top-queries")
async def top_queries(
    limit: int = 20,
    failed_only: bool = False,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Top queries by frequency"""
    query = (
        select(QueryLog.query_text, func.count(QueryLog.id).label("count"),
               func.avg(QueryLog.retrieval_score).label("avg_score"))
        .group_by(QueryLog.query_text)
        .order_by(func.count(QueryLog.id).desc())
        .limit(limit)
    )
    if failed_only:
        query = query.where(QueryLog.failed == True)
    result = await db.execute(query)
    rows = result.fetchall()
    return [
        {"query": r.query_text, "count": r.count, "avg_score": round(r.avg_score or 0, 4)}
        for r in rows
    ]


@router.get("/user-behavior")
async def user_behavior(
    days: int = 7,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """User behavior analysis"""
    since = datetime.utcnow() - timedelta(days=days)
    result = await db.execute(
        text("""
            SELECT
                date_trunc('hour', created_at) as hour,
                COUNT(*) as queries,
                AVG(response_time_ms) as avg_latency,
                AVG(retrieval_score) as avg_score,
                SUM(CASE WHEN failed THEN 1 ELSE 0 END) as failures
            FROM query_logs
            WHERE created_at >= :since
            GROUP BY date_trunc('hour', created_at)
            ORDER BY hour ASC
        """),
        {"since": since},
    )
    rows = result.fetchall()
    return [
        {
            "hour": r.hour, "queries": r.queries,
            "avg_latency": round(r.avg_latency or 0, 1),
            "avg_score": round(r.avg_score or 0, 4),
            "failures": r.failures,
        }
        for r in rows
    ]


@router.get("/export")
async def export_data(
    format: str = Query("csv", regex="^(csv|json)$"),
    table: str = Query("query_logs", regex="^(query_logs|documents)$"),
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Export data as CSV or JSON"""
    since = datetime.utcnow() - timedelta(days=days)

    if table == "query_logs":
        result = await db.execute(
            select(QueryLog).where(QueryLog.created_at >= since).order_by(QueryLog.created_at.desc())
        )
        rows = result.scalars().all()
        data = [
            {
                "id": r.id, "query": r.query_text, "domain": r.domain,
                "score": r.retrieval_score, "latency_ms": r.response_time_ms,
                "cached": r.was_cached, "failed": r.failed, "created_at": str(r.created_at),
            }
            for r in rows
        ]
    else:
        result = await db.execute(select(Document).order_by(Document.created_at.desc()))
        rows = result.scalars().all()
        data = [
            {
                "id": r.id, "filename": r.filename, "type": r.doc_type,
                "domain": r.domain, "year": r.year, "status": r.status,
                "chunks": r.chunk_count, "created_at": str(r.created_at),
            }
            for r in rows
        ]

    if format == "json":
        content = json.dumps(data, indent=2, default=str)
        return StreamingResponse(
            io.StringIO(content),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename={table}_{days}d.json"},
        )
    else:
        output = io.StringIO()
        if data:
            writer = csv.DictWriter(output, fieldnames=data[0].keys())
            writer.writeheader()
            writer.writerows(data)
        output.seek(0)
        return StreamingResponse(
            output,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={table}_{days}d.csv"},
        )
