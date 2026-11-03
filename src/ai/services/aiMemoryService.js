/**
 * AI Memory Service — Short-Term Multi-Conversation & Long-Term Preferences
 * Manages separate conversation histories and explicit, user-controlled preferences.
 */

const STORAGE_KEY_CONVERSATIONS = 'taskbar_ai_conversations_v2';
const STORAGE_KEY_ACTIVE_CONV = 'taskbar_ai_active_conv_id';
const STORAGE_KEY_PREFERENCES = 'taskbar_ai_memory_preferences_v2';
const STORAGE_KEY_MEMORY_ENABLED = 'taskbar_ai_memory_enabled';

export const aiMemoryService = {
  // ==========================================
  // 1. SHORT-TERM CONVERSATION SESSIONS
  // ==========================================

  getConversations() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_CONVERSATIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  getActiveConversationId() {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_CONV) || null;
  },

  setActiveConversationId(id) {
    if (id) {
      localStorage.setItem(STORAGE_KEY_ACTIVE_CONV, id);
    } else {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_CONV);
    }
  },

  getConversation(id) {
    const list = this.getConversations();
    return list.find(c => c.id === id) || null;
  },

  createConversation(mode = 'normal', title = 'New Conversation') {
    const list = this.getConversations();
    const newConv = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title,
      mode,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [newConv, ...list];
    try {
      localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(updated));
      this.setActiveConversationId(newConv.id);
    } catch (err) {
      console.error('Failed to save conversation:', err);
    }
    return newConv;
  },

  saveConversation(conv) {
    if (!conv || !conv.id) return;
    const list = this.getConversations();
    const idx = list.findIndex(c => c.id === conv.id);
    
    // Auto-derive title from first user message if still default
    let title = conv.title;
    if ((!title || title === 'New Conversation') && conv.messages?.length > 0) {
      const firstUser = conv.messages.find(m => m.role === 'user');
      if (firstUser?.content) {
        title = firstUser.content.slice(0, 32).trim() + (firstUser.content.length > 32 ? '...' : '');
      }
    }

    const updatedConv = {
      ...conv,
      title: title || 'Conversation',
      updatedAt: new Date().toISOString()
    };

    let updatedList;
    if (idx >= 0) {
      updatedList = [...list];
      updatedList[idx] = updatedConv;
    } else {
      updatedList = [updatedConv, ...list];
    }

    try {
      localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(updatedList));
    } catch (err) {
      console.error('Failed to persist conversation history:', err);
    }
  },

  renameConversation(id, newTitle) {
    const list = this.getConversations();
    const conv = list.find(c => c.id === id);
    if (!conv) return false;
    conv.title = newTitle.trim();
    conv.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(list));
    return true;
  },

  deleteConversation(id) {
    const list = this.getConversations().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(list));
    if (this.getActiveConversationId() === id) {
      const nextId = list.length > 0 ? list[0].id : null;
      this.setActiveConversationId(nextId);
    }
  },

  clearAllConversations() {
    localStorage.removeItem(STORAGE_KEY_CONVERSATIONS);
    localStorage.removeItem(STORAGE_KEY_ACTIVE_CONV);
  },

  // ==========================================
  // 2. LONG-TERM PREFERENCE MEMORY
  // ==========================================

  isMemoryEnabled() {
    const val = localStorage.getItem(STORAGE_KEY_MEMORY_ENABLED);
    return val === null ? true : val === 'true';
  },

  setMemoryEnabled(enabled) {
    localStorage.setItem(STORAGE_KEY_MEMORY_ENABLED, String(enabled));
  },

  getPreferences() {
    if (!this.isMemoryEnabled()) return {};
    try {
      const data = localStorage.getItem(STORAGE_KEY_PREFERENCES);
      return data ? JSON.parse(data) : {
        preferredStyle: 'Balanced and concise',
        dailyFocusGoalMinutes: 90,
        planningPreference: 'Prioritize top 3 high-impact tasks'
      };
    } catch {
      return {};
    }
  },

  setPreference(key, value) {
    const prefs = this.getPreferences();
    prefs[key] = value;
    localStorage.setItem(STORAGE_KEY_PREFERENCES, JSON.stringify(prefs));
  },

  deletePreference(key) {
    const prefs = this.getPreferences();
    delete prefs[key];
    localStorage.setItem(STORAGE_KEY_PREFERENCES, JSON.stringify(prefs));
  },

  clearPreferences() {
    localStorage.setItem(STORAGE_KEY_PREFERENCES, JSON.stringify({}));
  }
};

