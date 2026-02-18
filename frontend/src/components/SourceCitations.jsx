import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, BookOpen, Percent } from 'lucide-react'

function ScoreBar({ score }) {
  const pct = Math.round(score * 100)
  const color = score > 0.75 ? '#00ff88' : score > 0.5 ? '#00cfff' : '#b56cff'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-ink-600 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-xs font-mono" style={{ color }}>{pct}%</span>
    </div>
  )
}

export default function SourceCitations({ sources }) {
  const [open, setOpen] = useState(false)
  if (!sources || sources.length === 0) return null

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 text-xs text-gray-500 hover:text-neon-blue transition-colors"
      >
        <BookOpen size={12} />
        <span className="font-mono">{sources.length} source{sources.length > 1 ? 's' : ''} retrieved</span>
        <ChevronDown
          size={12}
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-2 flex flex-col gap-2">
              {sources.map((src, i) => (
                <div key={i} className="bg-ink-700 rounded-xl p-3 border border-ink-500">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-neon-blue truncate max-w-[70%]">
                      📄 {src.filename}
                    </span>
                    <span className="text-xs text-gray-600 font-mono">chunk #{src.chunk_index}</span>
                  </div>
                  <ScoreBar score={src.relevance_score} />
                  <p className="mt-2 text-xs text-gray-400 line-clamp-3 leading-relaxed">
                    {src.content}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
