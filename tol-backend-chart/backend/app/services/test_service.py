import asyncio
from datetime import datetime
import httpx
from app.core.database import AsyncSessionLocal
from app.models.test_case import TestCase, TestRun
from app.services.qdrant_service import qdrant_service
from sqlalchemy import select


class TestService:
    async def run(self, run_id: int, test_case_ids: list[int]):
        async with AsyncSessionLocal() as db:
            run = await db.get(TestRun, run_id)
            run.status = "running"
            run.started_at = datetime.utcnow()
            await db.commit()

            query = select(TestCase).where(TestCase.is_active == True)
            if test_case_ids:
                query = query.where(TestCase.id.in_(test_case_ids))
            result = await db.execute(query)
            cases = result.scalars().all()

        results = []
        for case in cases:
            result_a = await self._run_single(case, run.config_a)
            result_b = await self._run_single(case, run.config_b) if run.config_b else None
            results.append({
                "test_case_id": case.id,
                "question": case.question,
                "expected": case.expected_answer,
                "result_a": result_a,
                "result_b": result_b,
                "passed": result_a.get("score", 0) >= run.config_a.get("min_score", 0.015),
            })

        total = len(results)
        passed = sum(1 for r in results if r["passed"])
        async with AsyncSessionLocal() as db:
            run = await db.get(TestRun, run_id)
            run.results = results
            run.summary = {
                "total": total, "passed": passed,
                "failed": total - passed,
                "pass_rate": round(passed / total * 100, 1) if total else 0,
            }
            run.status = "completed"
            run.completed_at = datetime.utcnow()
            await db.commit()

    async def _run_single(self, case: TestCase, config: dict) -> dict:
        start = asyncio.get_event_loop().time()
        try:
            results = await qdrant_service.search(
                case.question,
                domain=case.domain,
                limit=config.get("top_k", 5),
            )
            elapsed_ms = int((asyncio.get_event_loop().time() - start) * 1000)
            top_score = results[0]["score"] if results else 0
            return {
                "score": top_score,
                "latency_ms": elapsed_ms,
                "chunks_returned": len(results),
                "top_text": results[0]["text"][:200] if results else "",
            }
        except Exception as e:
            return {"score": 0, "error": str(e), "latency_ms": 0}


test_service = TestService()
