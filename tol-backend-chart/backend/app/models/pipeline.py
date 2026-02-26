import uuid
from datetime import datetime
from sqlalchemy import String, Integer, Float, DateTime, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class PipelineRun(Base):
    __tablename__ = "pipeline_runs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    filename: Mapped[str] = mapped_column(String(500), nullable=False)
    s3_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    doc_type: Mapped[str] = mapped_column(String(50), nullable=False)
    year: Mapped[str] = mapped_column(String(4), nullable=False)
    tags: Mapped[list] = mapped_column(JSON, default=list)
    
    stage: Mapped[str] = mapped_column(String(20), default="bronze")  # bronze|silver|gold
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending|running|success|error
    progress: Mapped[int] = mapped_column(Integer, default=0)
    
    chunks_total: Mapped[int] = mapped_column(Integer, default=0)
    chunks_indexed: Mapped[int] = mapped_column(Integer, default=0)
    
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    logs: Mapped[list] = mapped_column(JSON, default=list)
    metadata_: Mapped[dict] = mapped_column("metadata", JSON, default=dict)
    
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    created_by: Mapped[str] = mapped_column(String, nullable=False)
