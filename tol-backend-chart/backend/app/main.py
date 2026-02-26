from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import logging

from app.core.config import settings
from app.core.database import init_db
from app.api import auth, upload, pipeline, metrics, tests, chunks, analytics

logging.basicConfig(level=settings.LOG_LEVEL.upper())
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting TaxOnline Dashboard API...")
    await init_db()
    yield
    logger.info("Shutting down...")


app = FastAPI(
    title="TaxOnline Dashboard API",
    description="Admin dashboard for TaxOnline RAG system",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS_LIST,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(upload.router, prefix="/api/upload", tags=["upload"])
app.include_router(pipeline.router, prefix="/api/pipeline", tags=["pipeline"])
app.include_router(metrics.router, prefix="/api/metrics", tags=["metrics"])
app.include_router(tests.router, prefix="/api/tests", tags=["testing"])
app.include_router(chunks.router, prefix="/api/chunks", tags=["chunks"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])


@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}


@app.get("/health/ready")
async def readiness():
    # Check critical dependencies
    from app.services.qdrant_service import qdrant_service
    qdrant_ok = await qdrant_service.ping()
    return {
        "status": "ready" if qdrant_ok else "degraded",
        "qdrant": qdrant_ok,
    }
