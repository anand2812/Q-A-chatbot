import { useState, useRef, useCallback } from 'react';
import { askQuestion, getHealth } from '../utils/api';

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [health, setHealth] = useState(null);
  
  const refreshHealth = async () => {
    try {
      const h = await getHealth();
      setHealth(h);
    } catch (err) {
      console.error("Health check failed", err);
    }
  };

  const clearChat = useCallback(() => setMessages([]), []);

  const sendMessage = useCallback(async (questionText) => {
    const q = (questionText ?? input).trim();
    if (!q || isLoading) return;

    setInput('');
    // Optimistically add user message
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setIsLoading(true);

    // Add typing indicator
    setMessages(prev => [...prev, { role: 'assistant', content: '', isTyping: true }]);

    try {
      // Prepare history for API (exclude typing indicators)
      const history = messages
        .filter(m => !m.isTyping)
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await askQuestion(q, history);

      setMessages(prev => {
        const withoutTyping = prev.filter(m => !m.isTyping);
        return [...withoutTyping, {
          role: 'assistant',
          content: res.answer,
          sources: res.sources,
          meta: {
            model_used: res.model_used,
            tokens_used: res.tokens_used,
            response_time_ms: res.response_time_ms,
          }
        }];
      });
    } catch (err) {
      setMessages(prev => {
        const withoutTyping = prev.filter(m => !m.isTyping);
        return [...withoutTyping, {
          role: 'assistant',
          content: `⚠️ Error: ${err.response?.data?.detail || err.message}`,
          isError: true
        }];
      });
    } finally {
      setIsLoading(false);
      refreshHealth();
    }
  }, [input, isLoading, messages]);

  return {
    messages,
    input,
    setInput,
    isLoading,
    health,
    sendMessage,
    clearChat,
    refreshHealth
  };
}
