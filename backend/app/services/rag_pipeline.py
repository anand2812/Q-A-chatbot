"""
RAG Pipeline
────────────
Orchestrates the full Retrieval-Augmented Generation pipeline:

  1. Retrieve relevant chunks via FAISS similarity search
  2. Build a context-rich prompt with conversation history
  3. Call OpenAI GPT-4 for generation
  4. Return answer + source attribution

Architecture:
  Query ──▶ HuggingFace Embeddings ──▶ FAISS Search ──▶ Top-K Chunks
                                                              │
  Conversation History ──────────────────────────────────────┤
                                                              ▼
                                                    GPT-4 Prompt ──▶ Answer + Sources
"""

import time
from typing import List, Tuple, Optional

from langchain_openai import ChatOpenAI
from langchain.schema import Document, HumanMessage, AIMessage, SystemMessage
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder

from app.core.config import settings
from app.core.logger import logger
from app.models.schemas import ChatMessage, SourceChunk
from app.services.vector_store import vector_store_service


# ─────────────────────────── System Prompt ───────────────────────────────────

SYSTEM_PROMPT = """You are an expert AI assistant that answers questions based strictly on the provided document context.

RULES:
1. Answer ONLY using information from the provided context.
2. If the context doesn't contain enough information, say: "I couldn't find sufficient information in the uploaded documents to answer this question."
3. Always cite which document/section your answer comes from.
4. Be concise, accurate, and professional.
5. If asked about topics unrelated to the documents, politely redirect to the document content.
6. Format your answer clearly with proper structure when appropriate.
7. Acknowledge when you're uncertain rather than fabricating information.

CONTEXT FROM DOCUMENTS:
{context}
"""


class RAGPipeline:
    """
    Core RAG pipeline: retrieval → augmentation → generation.
    """

    def __init__(self):
        self._llm: Optional[ChatOpenAI] = None

    def _get_llm(self) -> ChatOpenAI:
        if self._llm is None:
            if not settings.OPENAI_API_KEY:
                raise ValueError(
                    "OPENAI_API_KEY is not set. Please add it to your .env file."
                )
            self._llm = ChatOpenAI(
                model=settings.OPENAI_MODEL,
                temperature=settings.OPENAI_TEMPERATURE,
                max_tokens=settings.OPENAI_MAX_TOKENS,
                openai_api_key=settings.OPENAI_API_KEY,
            )
        return self._llm

    def answer(
        self,
        question: str,
        conversation_history: List[ChatMessage] = None,
        top_k: int = None,
    ) -> Tuple[str, List[SourceChunk], int, int]:
        """
        Full RAG answer pipeline.

        Returns:
            (answer_text, source_chunks, tokens_used, response_time_ms)
        """
        start_time = time.time()
        top_k = top_k or settings.TOP_K
        conversation_history = conversation_history or []

        # ── Step 1: Retrieve relevant chunks ─────────────────────────────────
        retrieved: List[Tuple[Document, float]] = vector_store_service.similarity_search(
            query=question,
            k=top_k,
        )

        if not retrieved:
            answer = (
                "No documents have been uploaded yet. "
                "Please upload a PDF, TXT, Markdown, or DOCX file to get started."
            )
            return answer, [], 0, int((time.time() - start_time) * 1000)

        # ── Step 2: Build context string ──────────────────────────────────────
        sources: List[SourceChunk] = []
        context_parts = []

        for i, (doc, score) in enumerate(retrieved):
            meta = doc.metadata
            content_snippet = doc.page_content.replace("\n", " ")
            context_parts.append(f"Source {i+1} ({meta.get('filename', 'unknown')}): {content_snippet}")
            
            sources.append(SourceChunk(
                doc_id=meta.get("doc_id", ""),
                filename=meta.get("filename", "unknown"),
                content=doc.page_content[:300] + ("..." if len(doc.page_content) > 300 else ""),
                chunk_index=meta.get("chunk_index", i),
                relevance_score=round(float(score), 4),
            ))

        context = "\n\n".join(context_parts)

        # ── Step 3: Build messages with ChatPromptTemplate ────────────────────
        
        # Guard against huge context
        if len(context) > 40000: # Approx 10k tokens safe limit for standard use, adjust as needed
             logger.warning(f"Context too large ({len(context)} chars), truncating...")
             context = context[:40000] + "...(truncated)"

        prompt_template = ChatPromptTemplate.from_messages([
            ("system", SYSTEM_PROMPT),
            MessagesPlaceholder(variable_name="history"),
            ("human", "{question}"),
        ])

        # Prepare history
        history_messages = []
        for msg in conversation_history[-6:]:
            if msg.role == "user":
                history_messages.append(HumanMessage(content=msg.content))
            elif msg.role == "assistant":
                history_messages.append(AIMessage(content=msg.content))
        
        chain = prompt_template | self._get_llm()

        # ── Step 4: LLM Call ──────────────────────────────────────────────────
        logger.info(f"Calling {settings.OPENAI_MODEL} with {len(history_messages)} history msgs, {len(retrieved)} chunks...")
        
        response = chain.invoke({
            "context": context,
            "history": history_messages,
            "question": question
        })

        answer_text = response.content
        tokens_used = response.response_metadata.get("token_usage", {}).get("total_tokens", 0)
        response_time_ms = int((time.time() - start_time) * 1000)

        logger.info(f"  ✓ Response in {response_time_ms}ms | tokens={tokens_used}")

        return answer_text, sources, tokens_used, response_time_ms


# Singleton
rag_pipeline = RAGPipeline()
