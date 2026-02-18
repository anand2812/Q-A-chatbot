import React from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { Bot, User, Clock, Zap } from 'lucide-react'
import SourceCitations from './SourceCitations'

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {[0,1,2].map(i => (
        <span key={i} className="w-2 h-2 rounded-full bg-neon-green typing-dot" />
      ))}
    </div>
  )
}

export default function ChatMessage({ message, isTyping }) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`
        flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center
        ${isUser
          ? 'bg-neon-purple/20 border border-neon-purple/30'
          : 'bg-neon-green/10 border border-neon-green/20'
        }
      `}>
        {isUser
          ? <User size={14} className="text-neon-purple" />
          : <Bot  size={14} className="text-neon-green" />
        }
      </div>

      {/* Bubble */}
      <div className={`
        max-w-[78%] rounded-2xl px-4 py-3
        ${isUser
          ? 'bg-neon-purple/10 border border-neon-purple/20 rounded-tr-sm'
          : 'bg-surface border border-ink-500 rounded-tl-sm'
        }
      `}>
        {isTyping ? (
          <TypingIndicator />
        ) : (
          <>
            <div className={`prose text-sm leading-relaxed ${isUser ? 'text-gray-200' : 'text-gray-300'}`}>
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>

            {/* Meta row */}
            {message.meta && (
              <div className="flex items-center gap-3 mt-2 pt-2 border-t border-ink-600">
                {message.meta.response_time_ms && (
                  <span className="flex items-center gap-1 text-xs text-gray-600 font-mono">
                    <Clock size={10} />
                    {message.meta.response_time_ms}ms
                  </span>
                )}
                {message.meta.tokens_used > 0 && (
                  <span className="flex items-center gap-1 text-xs text-gray-600 font-mono">
                    <Zap size={10} />
                    {message.meta.tokens_used} tokens
                  </span>
                )}
                {message.meta.model_used && (
                  <span className="text-xs text-gray-600 font-mono ml-auto">
                    {message.meta.model_used}
                  </span>
                )}
              </div>
            )}

            {/* Source citations */}
            {message.sources && message.sources.length > 0 && (
              <SourceCitations sources={message.sources} />
            )}
          </>
        )}
      </div>
    </motion.div>
  )
}
