"""
Vector Store Service
────────────────────
Primary:  FAISS + HuggingFace Sentence Transformers (local, offline-capable)
Optional: Pinecone (cloud-scale, set USE_PINECONE=true in .env)

Responsibilities:
  • Embed and index document chunks
  • Similarity search for retrieval
  • Persist / load FAISS index from disk
  • Track indexed documents in a JSON manifest
"""

import os
import json
import pickle
from pathlib import Path
from typing import List, Dict, Tuple, Optional
from datetime import datetime

from langchain.schema import Document
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings

from app.core.config import settings
from app.core.logger import logger


MANIFEST_PATH = Path(settings.FAISS_INDEX_PATH) / "manifest.json"
INDEX_PATH    = Path(settings.FAISS_INDEX_PATH) / "index"


class VectorStoreService:
    """
    Manages FAISS vector store lifecycle: init, add, search, persist.
    """

    def __init__(self):
        self._embedding_model = None
        self._vector_store: Optional[FAISS] = None
        self._manifest: Dict = {}   # doc_id → metadata
        self._load_manifest()

    # ─────────────────────────── Public API ──────────────────────────────────

    async def add_documents(self, chunks: List[Document], doc_metadata: Dict) -> int:
        """Embed and add chunks to the vector store. Returns chunk count."""
        if not chunks:
            return 0

        embeddings = self._get_embeddings()
        doc_id = doc_metadata["doc_id"]

        logger.info(f"Embedding {len(chunks)} chunks for doc_id={doc_id}...")

        if self._vector_store is None:
            # First time initialization might be fast enough, but safer to thread it
            from fastapi.concurrency import run_in_threadpool
            self._vector_store = await run_in_threadpool(FAISS.from_documents, chunks, embeddings)
        else:
            from fastapi.concurrency import run_in_threadpool
            await run_in_threadpool(self._vector_store.add_documents, chunks)

        self._manifest[doc_id] = {
            **doc_metadata,
            "upload_time": doc_metadata["upload_time"].isoformat()
                           if isinstance(doc_metadata["upload_time"], datetime)
                           else doc_metadata["upload_time"],
        }

        await self._persist()
        logger.info(f"  ✓ Indexed. Total chunks in store: {self.total_chunks}")
        return len(chunks)

    def similarity_search(
        self,
        query: str,
        k: int = None,
    ) -> List[Tuple[Document, float]]:
        """
        Returns list of (Document, relevance_score) sorted by relevance.
        Score is cosine similarity (higher = more relevant).
        """
        if self._vector_store is None:
            logger.warning("Vector store is empty — no documents indexed yet.")
            return []

        k = k or settings.TOP_K
        results = self._vector_store.similarity_search_with_relevance_scores(query, k=k)
        logger.info(f"Retrieved {len(results)} chunks for query='{query[:60]}...'")
        return results

    async def delete_document(self, doc_id: str) -> bool:
        """
        Remove all chunks belonging to doc_id.
        FAISS doesn't natively support deletion, so we rebuild the index
        excluding the target doc's chunks.
        """
        if doc_id not in self._manifest:
            return False

        logger.info(f"Deleting doc_id={doc_id} from vector store (index rebuild)...")

        embeddings = self._get_embeddings()
        all_docs = self._get_all_documents()
        remaining = [d for d in all_docs if d.metadata.get("doc_id") != doc_id]

        from fastapi.concurrency import run_in_threadpool

        if remaining:
            self._vector_store = await run_in_threadpool(FAISS.from_documents, remaining, embeddings)
        else:
            self._vector_store = None

        del self._manifest[doc_id]
        await self._persist()
        logger.info(f"  ✓ Deleted. Remaining docs: {len(self._manifest)}")
        return True

    def get_all_metadata(self) -> List[Dict]:
        return list(self._manifest.values())

    @property
    def is_ready(self) -> bool:
        return self._vector_store is not None

    @property
    def total_chunks(self) -> int:
        if self._vector_store is None:
            return 0
        return self._vector_store.index.ntotal

    @property
    def num_documents(self) -> int:
        return len(self._manifest)

    # ─────────────────────────── Private Helpers ─────────────────────────────

    def _get_embeddings(self) -> HuggingFaceEmbeddings:
        if self._embedding_model is None:
            logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL}")
            self._embedding_model = HuggingFaceEmbeddings(
                model_name=settings.EMBEDDING_MODEL,
                model_kwargs={"device": "cpu"},
                encode_kwargs={"normalize_embeddings": True},
            )
            logger.info("  ✓ Embedding model loaded.")
        return self._embedding_model

    async def _persist(self):
        """Save FAISS index + manifest to disk."""
        index_path = str(INDEX_PATH)
        from fastapi.concurrency import run_in_threadpool
        
        if self._vector_store:
            await run_in_threadpool(self._vector_store.save_local, index_path)
        
        # Manifest save is small JSON, but good practice to thread file I/O
        await run_in_threadpool(self._save_manifest)
        logger.info(f"  ✓ Persisted index to {index_path}")

    def _load_manifest(self):
        """Load manifest JSON from disk."""
        if MANIFEST_PATH.exists():
            with open(MANIFEST_PATH, "r") as f:
                self._manifest = json.load(f)
            logger.info(f"Loaded manifest: {len(self._manifest)} docs")
        else:
            self._manifest = {}

    def _save_manifest(self):
        MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(MANIFEST_PATH, "w") as f:
            json.dump(self._manifest, f, indent=2)

    def _load_index(self):
        """Load FAISS index from disk if it exists."""
        if INDEX_PATH.exists():
            try:
                embeddings = self._get_embeddings()
                self._vector_store = FAISS.load_local(
                    str(INDEX_PATH),
                    embeddings,
                    allow_dangerous_deserialization=True,
                )
                logger.info(f"  ✓ FAISS index loaded ({self.total_chunks} chunks)")
            except Exception as e:
                logger.warning(f"Could not load existing index: {e}")
                self._vector_store = None

    def _get_all_documents(self) -> List[Document]:
        """Retrieve all stored documents from FAISS docstore."""
        if self._vector_store is None:
            return []
        store = self._vector_store.docstore._dict
        return list(store.values())

    def load_existing_index(self):
        """Call this on startup to restore persisted index."""
        self._load_index()


# Singleton
vector_store_service = VectorStoreService()
