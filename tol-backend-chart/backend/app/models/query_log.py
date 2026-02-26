from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, JSON, Float, Boolean, Text
from app.core.database import Base


class QueryLog(Base):
    __tablename__ = "query_logs"

    id = Column(Integer, primary_key=True, index=True)
    query_text = Column(Text, nullable=False)
    user_session = Column(String(100))
    domain = Column(String(100))
    retrieval_score = Column(Float)
    response_time_ms = Column(Integer)
    chunk_count = Column(Integer, default=0)
    was_cached = Column(Boolean, default=False)
    failed = Column(Boolean, default=False)
    failure_reason = Column(String(255), nullable=True)
    feedback_score = Column(Integer, nullable=True)  # 1-5
    metadata = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
