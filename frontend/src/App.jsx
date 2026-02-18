import React, { useState, useEffect, useRef } from 'react'
import { Sparkles, RotateCcw, Menu, X } from 'lucide-react'
import { listDocuments } from './utils/api'
import StatusBar from './components/StatusBar'
import Sidebar from './components/layout/Sidebar'
import ChatInterface from './components/chat/ChatInterface'
import ChatInput from './components/chat/ChatInput'
import { useChat } from './hooks/useChat'

export default function App() {
  const [documents, setDocuments] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const pollInterval = useRef(null)

  const {
    messages,
    input,
    setInput,
    isLoading,
    health,
    sendMessage,
    clearChat,
    refreshHealth
  } = useChat()

  // Load documents + health on mount
  useEffect(() => {
    listDocuments().then(res => setDocuments(res.documents)).catch(() => { })
    refreshHealth()
    pollInterval.current = setInterval(refreshHealth, 10000)
    return () => clearInterval(pollInterval.current)
  }, [refreshHealth])

  return (
    <div className="flex flex-col h-screen bg-ink-900 text-gray-200 overflow-hidden">
      {/* ── Top Nav ── */}
      <header className="flex items-center gap-4 px-5 py-3 border-b border-ink-700 bg-ink-800 z-10">
        <button
          onClick={() => setSidebarOpen(v => !v)}
          className="p-1.5 rounded-lg hover:bg-ink-700 text-gray-500 hover:text-gray-300 transition-colors"
        >
          {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
        </button>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Sparkles size={18} className="text-neon-green" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-neon-green rounded-full" />
          </div>
          <h1 className="font-display font-bold text-white text-base tracking-tight">
            RAG<span className="text-neon-green">.</span>chat
          </h1>
          <span className="hidden sm:block text-xs text-gray-600 font-mono border border-ink-600 px-2 py-0.5 rounded-full">
            GPT-4 · FAISS · HuggingFace
          </span>
        </div>

        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="ml-auto flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <RotateCcw size={12} />
            Clear
          </button>
        )}
      </header>

      {/* ── Status Bar ── */}
      <StatusBar health={health} />

      {/* ── Main Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ── */}
        <Sidebar
          isOpen={sidebarOpen}
          documents={documents}
          onDocumentsChange={setDocuments}
        />

        {/* ── Chat Area ── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <ChatInterface
            messages={messages}
            onSend={sendMessage}
            isLoading={isLoading}
          />

          <ChatInput
            input={input}
            setInput={setInput}
            onSend={sendMessage}
            isLoading={isLoading}
            isDisabled={documents.length === 0}
          />
        </main>
      </div>
    </div>
  )
}
