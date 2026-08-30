"""Pydantic schemas for request/response validation."""
from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional, Literal, Dict, Any


# ---------- Chat ----------

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
    message: str = Field(default="", max_length=16000)
    session_id: Optional[str] = None
    user_email: Optional[str] = None
    user_id: Optional[str] = None
    mode: str = Field(default="chat")
    provider: str = Field(default="gemini")
    model: Optional[str] = Field(default=None, description="Specific model identifier to execute (e.g. gemma4:latest, gemma3:4b, deepseek-coder:6.7b).")
    # Attachments
    image_urls: List[str] = Field(
        default_factory=list,
        description="Publicly reachable image URLs the model should see (multimodal).",
    )
    image_data: List[str] = Field(
        default_factory=list,
        description=(
            "Inline base64-encoded image data URLs (data:image/png;base64,...). "
            "Useful for paste/drop in the chat UI."
        ),
    )
    images: Optional[List[str]] = Field(
        default=None,
        description="Alias for image_data from frontend payloads.",
    )
    document_ids: List[str] = Field(
        default_factory=list,
        description="RAG document IDs to ground the answer in.",
    )
    selected_document_ids: Optional[List[str]] = Field(
        default=None,
        description="Alias for document_ids from frontend payloads.",
    )
    use_tools: bool = Field(default=False, description="Enable tool calling for this turn.")
    history: Optional[List[Message]] = Field(default=None, deprecated=True)

    class Config:
        extra = "ignore"

    def get_image_data(self) -> List[str]:
        return self.images if self.images is not None else self.image_data

    def get_document_ids(self) -> List[str]:
        return self.selected_document_ids if self.selected_document_ids is not None else self.document_ids


class ToolCallRecord(BaseModel):
    name: str
    args: Dict[str, Any] = Field(default_factory=dict)
    result_preview: str = Field(default="", description="Truncated tool result for the client.")


class ChatResponse(BaseModel):
    reply: str
    model: str
    session_id: str
    tokens_used: Optional[int] = None
    tool_calls: List[ToolCallRecord] = Field(default_factory=list)
    citations: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="RAG citations: [{document_id, chunk_id, source, snippet}, ...]",
    )


# ---------- Documents (RAG) ----------

class DocumentMetadata(BaseModel):
    id: str
    name: str
    source_type: Literal["pdf", "text", "url", "markdown"]
    size_bytes: int
    chunks: int
    created_at: str
    metadata: Dict[str, Any] = Field(default_factory=dict)


class DocumentList(BaseModel):
    documents: List[DocumentMetadata]


class IngestTextRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    text: str = Field(..., min_length=1, max_length=200_000)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class IngestUrlRequest(BaseModel):
    url: HttpUrl
    name: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


# ---------- Tools ----------

class ToolDescriptor(BaseModel):
    name: str
    description: str
    parameters: Dict[str, Any]  # JSON schema


class ToolList(BaseModel):
    tools: List[ToolDescriptor]
