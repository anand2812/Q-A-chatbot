import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ChevronRight } from 'lucide-react';
import ChatMessage from '../ChatMessage';

const WELCOME_PROMPTS = [
    'What is the main topic of the uploaded document?',
    'Summarize the key points in 5 bullet points.',
    'What conclusions does the document draw?',
    'List all technical terms mentioned.',
];

export default function ChatInterface({ messages, onSend, isLoading }) {
    const bottomRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (messages.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 flex flex-col items-center justify-center gap-6 text-center px-4"
            >
                <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-neon-green/10 border border-neon-green/20 flex items-center justify-center glow-green">
                        <Sparkles size={28} className="text-neon-green" />
                    </div>
                    <div className="absolute -inset-4 bg-neon-green/5 rounded-full blur-xl" />
                </div>

                <div>
                    <h2 className="font-display font-bold text-2xl text-white mb-2">
                        Ask your documents
                    </h2>
                    <p className="text-gray-500 text-sm max-w-sm mx-auto">
                        Upload PDF, TXT, MD, or DOCX files, then ask questions.<br />
                        AI answers using only your document content.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
                    {WELCOME_PROMPTS.map((p, i) => (
                        <motion.button
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * i }}
                            onClick={() => onSend(p)}
                            disabled={isLoading}
                            className="flex items-center gap-2 bg-ink-800 hover:bg-ink-700 border border-ink-600 hover:border-neon-green/30 text-left px-4 py-3 rounded-xl text-sm text-gray-400 hover:text-gray-200 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={12} className="text-neon-green opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            {p}
                        </motion.button>
                    ))}
                </div>
            </motion.div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">
            {messages.map((msg, i) => (
                <ChatMessage key={i} message={msg} isTyping={msg.isTyping} />
            ))}
            <div ref={bottomRef} />
        </div>
    );
}
