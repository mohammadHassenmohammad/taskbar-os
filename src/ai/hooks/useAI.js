import { useState, useEffect, useCallback } from 'react';
import { aiService } from '../services/aiService';
import { prepareFullContext } from '../services/aiContextService';
import { useStore } from '../../store/useStore';
import toast from 'react-hot-toast';

const STORAGE_CHAT_KEY = 'taskbar_ai_chat_history';

export function useAI() {
  const store = useStore();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Chat conversation state
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CHAT_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save chat to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CHAT_KEY, JSON.stringify(messages));
    } catch {
      // ignore storage quota errors
    }
  }, [messages]);

  // Fetch status on mount
  const refreshStatus = useCallback(async () => {
    const s = await aiService.getStatus();
    setStatus(s);
    return s;
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // Send message
  const sendMessage = async (userText) => {
    if (!userText || !userText.trim()) return;
    const userMsg = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: userText.trim(),
      timestamp: new Date().toISOString()
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setLoading(true);
    setError(null);

    try {
      const context = prepareFullContext(store);
      const res = await aiService.sendChatMessage(newHistory, context);

      const aiMsg = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: res.text,
        timestamp: new Date().toISOString(),
        provider: res.provider,
        model: res.model,
        isLocalFallback: res.isLocalFallback
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('AI Chat Error:', err);
      setError(err.message);
      toast.error(err.message, { icon: '⚠️' });
    } finally {
      setLoading(false);
    }
  };

  const clearConversation = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_CHAT_KEY);
    toast.success('Conversation history cleared');
  };

  const deleteMessage = (msgId) => {
    setMessages(prev => prev.filter(m => m.id !== msgId));
  };

  return {
    status,
    refreshStatus,
    loading,
    error,
    messages,
    sendMessage,
    clearConversation,
    deleteMessage
  };
}
