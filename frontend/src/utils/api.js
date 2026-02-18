import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 60000,
})

// ── Documents ────────────────────────────────────────────────────────────────

export const uploadDocument = async (file, onProgress) => {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post('/documents/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: e => onProgress && onProgress(Math.round((e.loaded * 100) / e.total)),
  })
  return data
}

export const listDocuments = async () => {
  const { data } = await api.get('/documents')
  return data
}

export const deleteDocument = async (docId) => {
  const { data } = await api.delete(`/documents/${docId}`)
  return data
}

// ── Chat ─────────────────────────────────────────────────────────────────────

export const askQuestion = async (question, history = [], topK = 5) => {
  const { data } = await api.post('/chat/ask', {
    question,
    conversation_history: history,
    top_k: topK,
  })
  return data
}

// ── Health ───────────────────────────────────────────────────────────────────

export const getHealth = async () => {
  const { data } = await api.get('/health')
  return data
}
