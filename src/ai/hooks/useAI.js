import { useState, useEffect, useCallback, useRef } from 'react';
import { aiService } from '../services/aiService';
import { prepareFullContext, getContextBadges } from '../services/aiContextService';
import { aiMemoryService } from '../services/aiMemoryService';
import { useStore } from '../../store/useStore';
import toast from 'react-hot-toast';

export function useAI() {
  const store = useStore();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState(null);
  
  // AbortController for cancelling generation
  const abortControllerRef = useRef(null);

  // Multi-conversation state
  const [conversations, setConversations] = useState(() => aiMemoryService.getConversations());
  const [activeConvId, setActiveConvId] = useState(() => {
    const saved = aiMemoryService.getActiveConversationId();
    if (saved && aiMemoryService.getConversation(saved)) return saved;
    const list = aiMemoryService.getConversations();
    if (list.length > 0) return list[0].id;
    const initial = aiMemoryService.createConversation('normal', 'Getting Started');
    return initial.id;
  });

  const activeConv = conversations.find(c => c.id === activeConvId) || conversations[0] || null;
  const messages = activeConv ? activeConv.messages || [] : [];
  const currentMode = activeConv ? activeConv.mode || 'normal' : 'normal';

  // Live context badges for header UI
  const contextBadges = getContextBadges(store);

  // Refresh status on mount
  const refreshStatus = useCallback(async () => {
    const s = await aiService.getStatus();
    setStatus(s);
    return s;
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // Persist conversations whenever activeConv messages/mode changes
  const updateActiveConversation = useCallback((updater) => {
    setConversations(prev => {
      const idx = prev.findIndex(c => c.id === activeConvId);
      if (idx === -1) return prev;
      const updated = updater(prev[idx]);
      const nextList = [...prev];
      nextList[idx] = updated;
      aiMemoryService.saveConversation(updated);
      return nextList;
    });
  }, [activeConvId]);

  // Switch Conversation
  const switchConversation = (id) => {
    if (isStreaming) stopGeneration();
    aiMemoryService.setActiveConversationId(id);
    setActiveConvId(id);
  };

  // Create New Conversation
  const createNewConversation = (mode = 'normal', title = 'New Conversation') => {
    if (isStreaming) stopGeneration();
    const newConv = aiMemoryService.createConversation(mode, title);
    setConversations(aiMemoryService.getConversations());
    setActiveConvId(newConv.id);
    return newConv;
  };

  // Delete Conversation
  const deleteConversation = (id) => {
    aiMemoryService.deleteConversation(id);
    const updated = aiMemoryService.getConversations();
    setConversations(updated);
    if (activeConvId === id) {
      if (updated.length > 0) {
        setActiveConvId(updated[0].id);
      } else {
        const fresh = aiMemoryService.createConversation('normal', 'New Conversation');
        setConversations([fresh]);
        setActiveConvId(fresh.id);
      }
    }
    toast.success('Conversation removed');
  };

  // Rename Conversation
  const renameConversation = (id, newTitle) => {
    aiMemoryService.renameConversation(id, newTitle);
    setConversations(aiMemoryService.getConversations());
  };

  // Change personality mode for active conversation
  const setMode = (newMode) => {
    updateActiveConversation(conv => ({
      ...conv,
      mode: newMode
    }));
  };

  // Clear messages in current conversation
  const clearConversation = () => {
    if (isStreaming) stopGeneration();
    updateActiveConversation(conv => ({
      ...conv,
      messages: []
    }));
    toast.success('Conversation messages cleared');
  };

  // Stop Generation
  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setLoading(false);
  };

  // Send Message with Streaming support
  const sendMessage = async (userText) => {
    if (!userText || !userText.trim() || loading || isStreaming) return;
    
    const userMsg = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: userText.trim(),
      timestamp: new Date().toISOString()
    };

    const newHistory = [...messages, userMsg];
    
    // Update local state immediately with user message
    updateActiveConversation(conv => ({
      ...conv,
      messages: newHistory
    }));

    setLoading(true);
    setIsStreaming(true);
    setStreamingContent('');
    setError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const context = prepareFullContext(store);
      const preferences = aiMemoryService.getPreferences();

      let streamAccumulator = '';

      await aiService.streamChatMessage({
        messages: newHistory,
        mode: currentMode,
        context,
        preferences,
        abortSignal: controller.signal,
        onChunk: (chunk, total) => {
          streamAccumulator = total;
          setStreamingContent(total);
        },
        onDone: (finalText) => {
          const contentToSave = finalText || streamAccumulator;
          if (contentToSave) {
            const aiMsg = {
              id: `msg_${Date.now() + 1}`,
              role: 'assistant',
              content: contentToSave,
              timestamp: new Date().toISOString(),
              mode: currentMode
            };

            updateActiveConversation(conv => ({
              ...conv,
              messages: [...newHistory, aiMsg]
            }));
          }
          setStreamingContent('');
          setIsStreaming(false);
          setLoading(false);
          abortControllerRef.current = null;
        },
        onError: (err) => {
          throw err;
        }
      });
    } catch (err) {
      if (err.name === 'AbortError') {
        // Generation manually stopped
        toast('Generation stopped', { icon: '⏹️' });
      } else {
        console.error('AI Companion Error:', err);
        setError(err.message);
        toast.error(err.message, { icon: '⚠️' });
      }
      setStreamingContent('');
      setIsStreaming(false);
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Regenerate last response
  const regenerateLastResponse = () => {
    if (messages.length === 0 || loading || isStreaming) return;
    const lastUserIdx = [...messages].map(m => m.role).lastIndexOf('user');
    if (lastUserIdx === -1) return;
    
    const lastUserMsg = messages[lastUserIdx].content;
    const trimmed = messages.slice(0, lastUserIdx);
    
    updateActiveConversation(conv => ({
      ...conv,
      messages: trimmed
    }));

    sendMessage(lastUserMsg);
  };

  // Action Proposal Approval Workflow (Phase 8)
  const approveAction = (action) => {
    try {
      if (!action || !action.type) return;

      const todayStr = new Date().toISOString().split('T')[0];

      if (action.type === 'create_task') {
        const title = action.title || action.taskTitle || 'New Task';
        const priority = action.priority || 'Medium';
        const category = action.category || 'General';
        
        store.addTask(todayStr, {
          title,
          priority,
          category,
          completed: false
        });
        toast.success(`Task created: "${title}"`, { icon: '✅' });
      } else if (action.type === 'start_focus') {
        toast.success('Focus session initiated', { icon: '🎯' });
      } else if (action.type === 'log_habit') {
        if (action.habitId) {
          store.toggleHabitLog(todayStr, action.habitId);
          toast.success('Habit logged for today', { icon: '🌟' });
        }
      }
    } catch (err) {
      console.error('Failed to execute AI proposal:', err);
      toast.error('Could not apply suggested action');
    }
  };

  return {
    status,
    refreshStatus,
    loading,
    isStreaming,
    streamingContent,
    error,
    conversations,
    activeConvId,
    activeConv,
    messages,
    currentMode,
    contextBadges,
    switchConversation,
    createNewConversation,
    deleteConversation,
    renameConversation,
    setMode,
    clearConversation,
    stopGeneration,
    sendMessage,
    regenerateLastResponse,
    approveAction
  };
}
