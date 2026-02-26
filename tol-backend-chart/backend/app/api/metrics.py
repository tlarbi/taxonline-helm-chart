from fastapi import APIRouter, Depends
from app.core.auth import get_current_user
from app.services.qdrant_service import qdrant_service
import httpx
from app.core.config import settings
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from app.core.database import get_db
from app.models.query_log import QueryLog
from datetime import datetime, timedelta

router = APIRouter()


@router.get("/health")
async def health_check(_=Depends(get_current_user)):
    """Check health of all dependent services"""
    results = {}

    # Qdrant
    try:
        info = await qdrant_service.get_collection_info()
        results["qdrant"] = {"status": "ok", "vectors_count": info.get("vectors_count", 0)}
    except Exception as e:
        results["qdrant"] = {"status": "error", "error": str(e)}

    # OpenSearch
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(f"http://{settings.OPENSEARCH_HOST}:{settings.OPENSEARCH_PORT}/_cluster/health")
            data = r.json()
            results["opensearch"] = {"status": data.get("status", "unknown"), "shards": data.get("active_shards")}
    except Exception as e:
        results["opensearch"] = {"status": "error", "error": str(e)}

    # Ollama
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(f"http://{settings.OLLAMA_HOST}:{settings.OLLAMA_PORT}/api/tags")
            models = [m["name"] for m in r.json().get("models", [])]
            results["ollama"] = {"status": "ok", "models": models}
    except Exception as e:
        results["ollama"] = {"status": "error", "error": str(e)}

    overall = "ok" if all(v["status"] in ("ok", "green") for v in results.values()) else "degraded"
    return {"overall": overall, "services": results, "checked_at": datetime.utcnow()}


@router.get("/realtime")
async def realtime_metrics(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    """Real-time query metrics for the last hour"""
    one_hour_ago = datetime.utcnow() - timedelta(hours=1)

    total = await db.execute(
        select(func.count(QueryLog.id)).where(QueryLog.created_at >= one_hour_ago)
    )
    failed = await db.execute(
        select(func.count(QueryLog.id)).where(
            QueryLog.created_at >= one_hour_ago, QueryLog.failed == True
        )
    )
    avg_score = await db.execute(
        select(func.avg(QueryLog.retrieval_score)).where(QueryLog.created_at >= one_hour_ago)
    )
    avg_latency = await db.execute(
        select(func.avg(QueryLog.response_time_ms)).where(QueryLog.created_at >= one_hour_ago)
    )
    cache_hits = await db.execute(
        select(func.count(QueryLog.id)).where(
            QueryLog.created_at >= one_hour_ago, QueryLog.was_cached == True
        )
    )

    total_count = total.scalar() or 0
    failed_count = failed.scalar() or 0
    cache_count = cache_hits.scalar() or 0

    return {
        "queries_last_hour": total_count,
        "queries_per_minute": round(total_count / 60, 2),
        "failed_queries": failed_count,
        "error_rate": round(failed_count / total_count * 100, 1) if total_count else 0,
        "avg_retrieval_score": round(avg_score.scalar() or 0, 4),
        "avg_latency_ms": round(avg_latency.scalar() or 0, 1),
        "cache_hit_rate": round(cache_count / total_count * 100, 1) if total_count else 0,
        "timestamp": datetime.utcnow(),
    }


@router.get("/performance")
async def performance_over_time(
    hours: int = 24,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Hourly performance metrics for charts"""
    since = datetime.utcnow() - timedelta(hours=hours)
    result = await db.execute(
        text("""
            SELECT 
                date_trunc('hour', created_at) as hour,
                COUNT(*) as total,
                AVG(retrieval_score) as avg_score,
                AVG(response_time_ms) as avg_latency,
                SUM(CASE WHEN failed THEN 1 ELSE 0 END) as failed_count
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
            "hour": r.hour,
            "total": r.total,
            "avg_score": round(r.avg_score or 0, 4),
            "avg_latency": round(r.avg_latency or 0, 1),
            "failed": r.failed_count,
        }
        for r in rows
    ]
