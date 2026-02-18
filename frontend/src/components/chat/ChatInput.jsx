import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';

export default function ChatInput({ input, setInput, onSend, isLoading, isDisabled }) {
    const inputRef = useRef(null);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    const handleInput = (e) => {
        // Auto-grow
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
        setInput(e.target.value);
    };

    return (
        <div className="px-6 pb-5 pt-3 border-t border-ink-700 bg-ink-800/50 backdrop-blur-sm">
            <div className="flex gap-3 max-w-4xl mx-auto">
                <div className="flex-1 relative">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={handleInput}
                        onKeyDown={handleKeyDown}
                        placeholder={isDisabled
                            ? 'Upload documents first, then ask a question…'
                            : 'Ask a question about your documents… (Enter to send)'
                        }
                        disabled={isLoading}
                        rows={1}
                        className="
              w-full resize-none bg-ink-700 border border-ink-500 focus:border-neon-green/50
              rounded-2xl px-4 py-3 pr-12 text-sm text-gray-200 placeholder-gray-600
              outline-none transition-all focus:glow-green
              disabled:opacity-50 disabled:cursor-not-allowed
              min-h-[48px] max-h-[160px] overflow-y-auto
            "
                        style={{ height: 'auto' }}
                    />
                </div>
                <motion.button
                    onClick={() => onSend()}
                    disabled={!input.trim() || isLoading}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="
            flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center
            bg-neon-green text-ink-900 font-bold
            disabled:opacity-30 disabled:cursor-not-allowed
            hover:bg-white transition-colors
            shadow-lg shadow-neon-green/20
          "
                >
                    {isLoading
                        ? <span className="w-4 h-4 border-2 border-ink-900 border-t-transparent rounded-full animate-spin" />
                        : <Send size={16} strokeWidth={2.5} />
                    }
                </motion.button>
            </div>
            <p className="text-center text-xs text-gray-700 mt-2 font-mono">
                Shift+Enter for newline · answers grounded in your documents only
            </p>
        </div>
    );
}
