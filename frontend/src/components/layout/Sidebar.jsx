import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DocumentPanel from '../DocumentPanel';

export default function Sidebar({ isOpen, documents, onDocumentsChange }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.aside
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 300, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden border-r border-ink-700 bg-ink-800 flex-shrink-0"
                >
                    <div className="w-[300px] h-full p-4 overflow-y-auto">
                        <DocumentPanel
                            documents={documents}
                            onDocumentsChange={onDocumentsChange}
                        />
                    </div>
                </motion.aside>
            )}
        </AnimatePresence>
    );
}
