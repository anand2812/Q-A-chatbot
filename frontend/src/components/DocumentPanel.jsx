import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, Trash2, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react'
import { uploadDocument, deleteDocument } from '../utils/api'

const FILE_ICONS = { pdf: '📄', txt: '📝', md: '📋', docx: '📃' }

function DocCard({ doc, onDelete }) {
  const [deleting, setDeleting] = useState(false)
  const ext = doc.filename.split('.').pop().toLowerCase()

  const handleDelete = async () => {
    setDeleting(true)
    try { await onDelete(doc.doc_id) }
    catch { setDeleting(false) }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex items-center gap-3 bg-ink-700 rounded-xl px-4 py-3 group"
    >
      <span className="text-xl">{FILE_ICONS[ext] || '📎'}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium truncate">{doc.filename}</p>
        <p className="text-xs text-gray-500 font-mono">
          {doc.num_chunks} chunks · {(doc.size_bytes / 1024).toFixed(1)} KB
        </p>
      </div>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-500/20 rounded-lg text-gray-500 hover:text-red-400"
      >
        {deleting
          ? <Loader2 size={14} className="animate-spin" />
          : <Trash2 size={14} />
        }
      </button>
    </motion.div>
  )
}

export default function DocumentPanel({ documents, onDocumentsChange }) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [notification, setNotification] = useState(null)

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type })
    setTimeout(() => setNotification(null), 3500)
  }

  const onDrop = useCallback(async (accepted) => {
    if (!accepted.length) return
    setUploading(true)
    setProgress(0)

    for (const file of accepted) {
      try {
        const doc = await uploadDocument(file, setProgress)
        onDocumentsChange(prev => [...prev, doc])
        notify(`"${file.name}" indexed — ${doc.num_chunks} chunks ready`)
      } catch (err) {
        notify(err.response?.data?.detail || `Failed to upload ${file.name}`, 'error')
      }
    }
    setUploading(false)
    setProgress(0)
  }, [onDocumentsChange])

  const handleDelete = async (docId) => {
    await deleteDocument(docId)
    onDocumentsChange(prev => prev.filter(d => d.doc_id !== docId))
    notify('Document removed from index')
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'], 'text/markdown': ['.md'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    disabled: uploading,
    multiple: true,
  })

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse-slow" />
        <h2 className="font-display text-sm font-bold tracking-widest text-gray-400 uppercase">
          Knowledge Base
        </h2>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200
          ${isDragActive
            ? 'border-neon-green bg-neon-green/5 glow-green'
            : 'border-ink-500 hover:border-ink-400 bg-ink-800'}
          ${uploading ? 'opacity-60 pointer-events-none' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          {uploading ? (
            <>
              <Loader2 size={28} className="text-neon-green animate-spin" />
              <p className="text-sm text-gray-400">Indexing... {progress}%</p>
              <div className="w-full bg-ink-600 rounded-full h-1.5 mt-1">
                <div
                  className="h-1.5 bg-neon-green rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <div className={`p-3 rounded-xl ${isDragActive ? 'bg-neon-green/10' : 'bg-ink-700'}`}>
                <Upload size={22} className={isDragActive ? 'text-neon-green' : 'text-gray-400'} />
              </div>
              <div>
                <p className="text-sm text-gray-300 font-medium">
                  {isDragActive ? 'Drop files to index' : 'Drop files or click to upload'}
                </p>
                <p className="text-xs text-gray-600 mt-1">PDF · TXT · MD · DOCX · max 50MB</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium ${
              notification.type === 'error'
                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                : 'bg-neon-green/10 text-neon-green border border-neon-green/20'
            }`}
          >
            {notification.type === 'error'
              ? <AlertCircle size={13} />
              : <CheckCircle size={13} />
            }
            {notification.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
        <p className="text-xs text-gray-600 font-mono uppercase tracking-wider">
          {documents.length} document{documents.length !== 1 ? 's' : ''} indexed
        </p>
        <AnimatePresence mode="popLayout">
          {documents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center gap-3 py-8"
            >
              <FileText size={32} className="text-ink-500" />
              <p className="text-xs text-gray-600 text-center">
                No documents yet.<br />Upload files to start Q&A.
              </p>
            </motion.div>
          ) : (
            documents.map(doc => (
              <DocCard key={doc.doc_id} doc={doc} onDelete={handleDelete} />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
