import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, JSON, Float, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class TestQuestion(Base):
    __tablename__ = "test_questions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    question: Mapped[str] = mapped_column(Text, nullable=False)
    expected_keywords: Mapped[list] = mapped_column(JSON, default=list)
    expected_article: Mapped[str | None] = mapped_column(String(100), nullable=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    difficulty: Mapped[str] = mapped_column(String(20), default="medium")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    created_by: Mapped[str] = mapped_column(String, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class TestRun(Base):
    __tablename__ = "test_runs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    run_type: Mapped[str] = mapped_column(String(20), default="suite")  # suite|ab|benchmark
    config: Mapped[dict] = mapped_column(JSON, default=dict)
    results: Mapped[list] = mapped_column(JSON, default=list)
    summary: Mapped[dict] = mapped_column(JSON, default=dict)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_by: Mapped[str] = mapped_column(String, nullable=False)
