import React from 'react'
import { Cpu, Database, Layers } from 'lucide-react'

export default function StatusBar({ health }) {
  if (!health) return null
  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-ink-800 border-b border-ink-700 text-xs font-mono">
      <div className={`flex items-center gap-1.5 ${health.vector_store_ready ? 'text-neon-green' : 'text-yellow-400'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${health.vector_store_ready ? 'bg-neon-green' : 'bg-yellow-400'} animate-pulse`} />
        {health.vector_store_ready ? 'Index Ready' : 'No Index'}
      </div>
      <div className="flex items-center gap-1.5 text-gray-500">
        <Database size={10} />
        {health.num_total_chunks.toLocaleString()} chunks
      </div>
      <div className="flex items-center gap-1.5 text-gray-500">
        <Layers size={10} />
        {health.num_indexed_documents} docs
      </div>
      <div className="flex items-center gap-1.5 text-gray-500 ml-auto">
        <Cpu size={10} />
        {health.llm_model}
      </div>
      <div className="flex items-center gap-1.5 text-gray-600">
        emb: {health.embedding_model}
      </div>
    </div>
  )
}
