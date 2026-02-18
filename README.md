# 🤖 GenAI-Powered RAG Document Q&A Chatbot

> An end-to-end Retrieval-Augmented Generation (RAG) system built with LangChain, OpenAI GPT-4, HuggingFace Sentence Transformers, FAISS, FastAPI, and React.

![Tech Stack](https://img.shields.io/badge/LangChain-0.2-blue) ![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-green) ![FAISS](https://img.shields.io/badge/FAISS-CPU-orange) ![FastAPI](https://img.shields.io/badge/FastAPI-0.111-teal) ![React](https://img.shields.io/badge/React-18-blue)

---

## 📐 Architecture

```
User Query
    │
    ▼
React Frontend  ──────────────────────────────────────────────────────────┐
    │                                                                      │
    │  POST /api/v1/chat/ask                                               │
    ▼                                                                      │
FastAPI Backend                                                            │
    │                                                                      │
    ├─► RAG Pipeline                                                       │
    │       │                                                              │
    │       ├─ 1. Embed query  ────► HuggingFace Sentence Transformers    │
    │       │                        (all-MiniLM-L6-v2)                   │
    │       │                                                              │
    │       ├─ 2. Retrieve     ────► FAISS Index                          │
    │       │                        Top-K similar chunks                 │
    │       │                                                              │
    │       ├─ 3. Augment      ────► Build prompt with:                   │
    │       │                        • Retrieved chunks (context)          │
    │       │                        • Conversation history               │
    │       │                        • System instructions                │
    │       │                                                              │
    │       └─ 4. Generate     ────► OpenAI GPT-4o                        │
    │                                                                      │
    └─► Response: answer + source citations ──────────────────────────────┘

Document Ingestion:
  Upload ──► Validate ──► Chunk (800 tokens, 150 overlap) ──► Embed ──► FAISS
```

---

## 🗂️ Project Structure

```
rag-chatbot/
├── backend/
│   ├── main.py                          # FastAPI entry point
│   ├── requirements.txt
│   ├── .env.example
│   ├── Dockerfile
│   └── app/
│       ├── api/routes/
│       │   ├── chat.py                  # POST /chat/ask
│       │   ├── documents.py             # upload / list / delete
│       │   └── health.py                # GET /health
│       ├── core/
│       │   ├── config.py                # Pydantic settings (env vars)
│       │   └── logger.py
│       ├── models/
│       │   └── schemas.py               # Request/response Pydantic models
│       └── services/
│           ├── document_processor.py    # Load → chunk pipeline
│           ├── vector_store.py          # FAISS + HuggingFace embeddings
│           └── rag_pipeline.py          # LangChain RAG chain
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                      # Main layout + chat state
│   │   ├── components/
│   │   │   ├── DocumentPanel.jsx        # Upload + document list
│   │   │   ├── ChatMessage.jsx          # Message bubble (markdown)
│   │   │   ├── SourceCitations.jsx      # Retrieved chunk cards
│   │   │   └── StatusBar.jsx            # Live system stats
│   │   └── utils/api.js                 # Axios calls to backend
│   ├── Dockerfile
│   └── nginx.conf
│
└── docker-compose.yml
```

---

## 🚀 Quick Start

### Option A — Docker (Recommended, one command)

```bash
# 1. Clone / unzip the project
cd rag-chatbot

# 2. Configure your OpenAI API key
cp backend/.env.example backend/.env
# Edit backend/.env — set OPENAI_API_KEY=sk-...

# 3. Build and run
docker compose up --build

# 4. Open browser
open http://localhost:3000
```

---

### Option B — Local Development

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Set OPENAI_API_KEY=sk-... in .env

uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# Opens on http://localhost:3000
```

---

## ⚙️ Configuration (backend/.env)

| Variable | Default | Description |
|---|---|---|
| `OPENAI_API_KEY` | — | **Required.** Your OpenAI API key |
| `OPENAI_MODEL` | `gpt-4o` | Model to use (`gpt-4`, `gpt-3.5-turbo`, etc.) |
| `EMBEDDING_MODEL` | `all-MiniLM-L6-v2` | HuggingFace sentence transformer |
| `CHUNK_SIZE` | `800` | Max characters per chunk |
| `CHUNK_OVERLAP` | `150` | Overlap between adjacent chunks |
| `TOP_K` | `5` | Chunks retrieved per query |
| `USE_PINECONE` | `false` | Set `true` for Pinecone cloud vector DB |
| `PINECONE_API_KEY` | — | Pinecone key (if USE_PINECONE=true) |

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health` | System health + stats |
| `POST` | `/api/v1/documents/upload` | Upload & index a document |
| `GET` | `/api/v1/documents` | List indexed documents |
| `DELETE` | `/api/v1/documents/{doc_id}` | Delete a document |
| `POST` | `/api/v1/chat/ask` | Ask a question |

### Chat Request
```json
{
  "question": "What are the main findings?",
  "conversation_history": [
    { "role": "user", "content": "Who are the authors?" },
    { "role": "assistant", "content": "The authors are..." }
  ],
  "top_k": 5
}
```

### Chat Response
```json
{
  "answer": "The main findings are...",
  "sources": [
    {
      "doc_id": "a1b2c3",
      "filename": "research_paper.pdf",
      "content": "...relevant excerpt...",
      "chunk_index": 12,
      "relevance_score": 0.89
    }
  ],
  "model_used": "gpt-4o",
  "tokens_used": 892,
  "response_time_ms": 1423
}
```

---

## 🔬 How RAG Works (Step-by-Step)

1. **Document Ingestion**
   - File uploaded via React dropzone → FastAPI
   - `RecursiveCharacterTextSplitter` splits into 800-char chunks with 150-char overlap
   - HuggingFace `all-MiniLM-L6-v2` embeds each chunk into 384-dim vector
   - Vectors stored in FAISS index (persisted to disk)

2. **Query Processing**
   - User question embedded using same model → 384-dim query vector
   - FAISS cosine similarity search returns top-5 most relevant chunks

3. **Augmented Generation**
   - Retrieved chunks formatted as context in the system prompt
   - Last 6 conversation turns included for multi-turn awareness
   - GPT-4o generates grounded answer with citations

4. **Response**
   - Answer returned with source attribution (filename, chunk, relevance score)
   - Relevance score shown as progress bar in UI

---

## 🧩 Extending the Project

- **Pinecone**: Set `USE_PINECONE=true` for cloud-scale vector storage
- **Streaming**: Enable `use_streaming: true` in chat request for SSE
- **More file types**: Add loaders to `document_processor.py`
- **Auth**: Add FastAPI JWT middleware
- **Evaluation**: Use RAGAs framework to measure faithfulness & relevancy

---

## 📦 Tech Stack

| Component | Technology |
|---|---|
| LLM | OpenAI GPT-4o |
| Embeddings | HuggingFace `all-MiniLM-L6-v2` |
| Vector DB | FAISS (local) / Pinecone (cloud) |
| RAG Orchestration | LangChain 0.2 |
| Backend API | FastAPI 0.111 |
| Frontend | React 18 + Vite + TailwindCSS |
| Deployment | Docker + Nginx |

---

*Built by Anand Agrawal — GenAI-Powered RAG Chatbot v1.0*
