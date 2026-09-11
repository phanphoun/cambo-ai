"""SQLAlchemy Database Models for Sastra AI (PostgreSQL)."""
import time
from sqlalchemy import Column, String, Float, Integer, Text, Boolean, ForeignKey, Index
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class UserDB(Base):
    """User account model stored in PostgreSQL."""
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, index=True)
    email = Column(String(128), unique=True, index=True, nullable=False)
    name = Column(String(128), nullable=False)
    password_hash = Column(String(256), nullable=False)
    role = Column(String(32), default="member", nullable=False)  # admin, member, guest
    avatar = Column(Text, nullable=True)
    created_at = Column(Float, default=time.time, nullable=False)
    updated_at = Column(Float, default=time.time, onupdate=time.time, nullable=False)

    # Relationships
    sessions = relationship("ChatSessionDB", back_populates="user", cascade="all, delete-orphan")


class CustomProviderDB(Base):
    """Custom and system AI model endpoints configuration."""
    __tablename__ = "custom_providers"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    type = Column(String(32), default="custom", nullable=False)  # builtin, custom
    status = Column(String(32), default="active", nullable=False)  # active, inactive
    base_url = Column(String(512), nullable=False)
    model = Column(String(128), nullable=False)
    api_key = Column(String(512), nullable=True)
    latency_ms = Column(Float, default=0.0, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(Float, default=time.time, nullable=False)


class ActivityLogDB(Base):
    """Telemetry and activity audit logs."""
    __tablename__ = "activity_logs"

    id = Column(String(64), primary_key=True, index=True)
    timestamp = Column(Float, default=time.time, index=True, nullable=False)
    action = Column(String(128), index=True, nullable=False)
    user_email = Column(String(128), index=True, nullable=False)
    provider = Column(String(64), default="gemini", nullable=False)
    status_code = Column(Integer, default=200, nullable=False)
    latency_ms = Column(Float, default=0.0, nullable=False)
    tokens_est = Column(Integer, default=0, nullable=False)
    details = Column(Text, nullable=True)


class ChatSessionDB(Base):
    """User chat session thread."""
    __tablename__ = "chat_sessions"

    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    title = Column(String(256), nullable=False, default="New Conversation")
    created_at = Column(Float, default=time.time, nullable=False)
    updated_at = Column(Float, default=time.time, onupdate=time.time, nullable=False)

    user = relationship("UserDB", back_populates="sessions")
    messages = relationship("ChatMessageDB", back_populates="session", cascade="all, delete-orphan")


class ChatMessageDB(Base):
    """Individual message stored in PostgreSQL."""
    __tablename__ = "chat_messages"

    id = Column(String(64), primary_key=True, index=True)
    session_id = Column(String(64), ForeignKey("chat_sessions.id", ondelete="CASCADE"), index=True, nullable=False)
    role = Column(String(32), nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    mode = Column(String(32), default="chat", nullable=False)
    provider = Column(String(64), default="gemini", nullable=False)
    created_at = Column(Float, default=time.time, nullable=False)

    session = relationship("ChatSessionDB", back_populates="messages")
