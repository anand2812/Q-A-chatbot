"""
Pydantic models for API request/response schemas.
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


# ── Document Models ──────────────────────────────────────────────────────────

class DocumentMetadata(BaseModel):
    doc_id: str
    filename: str
    file_type: str
    num_chunks: int
    upload_time: datetime
    size_bytes: int


class DocumentListResponse(BaseModel):
    documents: List[DocumentMetadata]
    total: int


class DeleteDocumentResponse(BaseModel):
    message: str
    doc_id: str


# ── Chat Models ───────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str


class SourceChunk(BaseModel):
    doc_id: str
    filename: str
    content: str
    chunk_index: int
    relevance_score: float


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    conversation_history: Optional[List[ChatMessage]] = []
    top_k: Optional[int] = Field(default=5, ge=1, le=20)
    use_streaming: Optional[bool] = False


class ChatResponse(BaseModel):
    answer: str
    sources: List[SourceChunk]
    model_used: str
    tokens_used: Optional[int] = None
    response_time_ms: int


# ── Health Model ─────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    version: str
    vector_store_ready: bool
    num_indexed_documents: int
    num_total_chunks: int
    embedding_model: str
    llm_model: str
