from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, JSON, Enum, Float
from app.core.database import Base
import enum


class DocumentType(str, enum.Enum):
    code = "code"
    circulaire = "circulaire"
    loi = "loi"
    decret = "decret"
    instruction = "instruction"


class DocumentStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    indexed = "indexed"
    failed = "failed"
    rolled_back = "rolled_back"


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    s3_key = Column(String(512), unique=True)
    doc_type = Column(Enum(DocumentType), nullable=False)
    year = Column(Integer)
    domain = Column(String(100))  # TVA, IS, IRG, etc.
    tags = Column(JSON, default=[])
    status = Column(Enum(DocumentStatus), default=DocumentStatus.pending)
    chunk_count = Column(Integer, default=0)
    quality_score = Column(Float, nullable=True)
    pipeline_job_id = Column(Integer, nullable=True)
    indexed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    uploaded_by = Column(Integer, nullable=True)
    metadata = Column(JSON, default={})
