"""
Document Processor
Handles ingestion of PDF, TXT, Markdown, and DOCX files.
Splits documents into semantic chunks with overlap.
"""

import os
import uuid
import hashlib
from pathlib import Path
from datetime import datetime
from typing import List, Tuple, Dict

from langchain.schema import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import (
    PyPDFLoader,
    TextLoader,
    UnstructuredMarkdownLoader,
    Docx2txtLoader,
)

from app.core.config import settings
from app.core.logger import logger


LOADERS = {
    "pdf":  PyPDFLoader,
    "txt":  TextLoader,
    "md":   UnstructuredMarkdownLoader,
    "docx": Docx2txtLoader,
}


class DocumentProcessor:
    """
    Loads, validates, and chunks documents for vector indexing.
    """

    def __init__(self):
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
            separators=["\n\n", "\n", ".", "!", "?", ",", " ", ""],
            length_function=len,
        )

    def validate_file(self, filepath: str) -> Tuple[bool, str]:
        """Validate file size and extension."""
        path = Path(filepath)
        ext = path.suffix.lstrip(".").lower()

        if ext not in settings.ALLOWED_EXTENSIONS:
            return False, f"Unsupported file type: .{ext}. Allowed: {settings.ALLOWED_EXTENSIONS}"

        size_mb = path.stat().st_size / (1024 * 1024)
        if size_mb > settings.MAX_FILE_SIZE_MB:
            return False, f"File too large: {size_mb:.1f}MB. Max allowed: {settings.MAX_FILE_SIZE_MB}MB"

        return True, "OK"

    def load_document(self, filepath: str) -> List[Document]:
        """Load a file and return list of LangChain Document objects."""
        ext = Path(filepath).suffix.lstrip(".").lower()
        loader_cls = LOADERS.get(ext)

        if not loader_cls:
            raise ValueError(f"No loader available for .{ext}")

        loader = loader_cls(filepath)
        documents = loader.load()
        logger.info(f"Loaded {len(documents)} page(s) from '{Path(filepath).name}'")
        return documents

    def chunk_documents(
        self,
        documents: List[Document],
        doc_id: str,
        filename: str,
    ) -> List[Document]:
        """Split documents into overlapping chunks, injecting metadata."""
        chunks = self.splitter.split_documents(documents)

        for i, chunk in enumerate(chunks):
            chunk.metadata.update({
                "doc_id": doc_id,
                "filename": filename,
                "chunk_index": i,
                "total_chunks": len(chunks),
            })

        logger.info(f"  → {len(chunks)} chunks (size={settings.CHUNK_SIZE}, overlap={settings.CHUNK_OVERLAP})")
        return chunks

    def process_file(self, filepath: str) -> Tuple[List[Document], Dict]:
        """
        Full pipeline: validate → load → chunk → return chunks + metadata.
        Returns (chunks, metadata_dict)
        """
        valid, msg = self.validate_file(filepath)
        if not valid:
            raise ValueError(msg)

        path = Path(filepath)
        doc_id = self._generate_doc_id(filepath)
        filename = path.name

        documents = self.load_document(filepath)
        chunks = self.chunk_documents(documents, doc_id, filename)

        metadata = {
            "doc_id": doc_id,
            "filename": filename,
            "file_type": path.suffix.lstrip(".").lower(),
            "num_chunks": len(chunks),
            "upload_time": datetime.utcnow(),
            "size_bytes": path.stat().st_size,
        }

        return chunks, metadata

    def _generate_doc_id(self, filepath: str) -> str:
        """Generate a deterministic doc ID from file content hash."""
        h = hashlib.md5()
        with open(filepath, "rb") as f:
            for block in iter(lambda: f.read(65536), b""):
                h.update(block)
        return h.hexdigest()[:12]
