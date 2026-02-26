from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, JSON, Enum, Float, Text
from app.core.database import Base
import enum


class JobStatus(str, enum.Enum):
    queued = "queued"
    running = "running"
    completed = "completed"
    failed = "failed"
    rolled_back = "rolled_back"


class PipelineJob(Base):
    __tablename__ = "pipeline_jobs"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, nullable=False)
    status = Column(Enum(JobStatus), default=JobStatus.queued)
    stage = Column(String(50), default="queued")  # bronze|silver|gold
    progress = Column(Float, default=0.0)
    logs = Column(JSON, default=[])
    error = Column(Text, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    rollback_snapshot = Column(JSON, nullable=True)  # chunk IDs to delete on rollback
