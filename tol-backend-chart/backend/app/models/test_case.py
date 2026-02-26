from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, JSON, Enum, Float, Boolean, Text
from app.core.database import Base
import enum


class TestCase(Base):
    __tablename__ = "test_cases"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(Text, nullable=False)
    expected_answer = Column(Text, nullable=False)
    expected_sources = Column(JSON, default=[])  # list of doc IDs or article refs
    domain = Column(String(100))
    tags = Column(JSON, default=[])
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, nullable=True)


class TestRun(Base):
    __tablename__ = "test_runs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    config_a = Column(JSON, nullable=False)   # retrieval config
    config_b = Column(JSON, nullable=True)    # for A/B test
    results = Column(JSON, default=[])
    summary = Column(JSON, default={})
    status = Column(String(50), default="pending")
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, nullable=True)
