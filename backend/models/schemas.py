"""Pydantic schemas for request/response validation."""
from pydantic import BaseModel, Field
from typing import List, Optional


class Question(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000, description="The user's question")


class Answer(BaseModel):
    answer: str
    model: str
    tokens_used: Optional[int] = None
    session_id: Optional[str] = None


class Message(BaseModel):
    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    session_id: Optional[str] = None
    mode: str = Field(default="chat", pattern="^(chat|translate|search|code)$")
    provider: str = Field(default="gemini", pattern="^(gemini|ollama|ollama-cloud)$")
    # Client-supplied history is intentionally not accepted — the server is
    # the source of truth for conversation memory. Clients pass session_id only.
    history: Optional[List[Message]] = Field(default=None, deprecated=True)


class ChatResponse(BaseModel):
    reply: str
    model: str
    session_id: str
    tokens_used: Optional[int] = None
