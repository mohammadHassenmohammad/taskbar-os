import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Plus,
  Trash2,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Bot,
  Square,
  MessageSquare,
  Edit2,
  Check,
  Search,
  Menu,
  X,
  ChevronDown,
  Layers,
  HeartHandshake,
  Dumbbell,
  Compass,
  Zap,
  BookOpen
} from 'lucide-react';
import AIMessage from './AIMessage';
import { motion, AnimatePresence } from 'framer-motion';

const PERSONALITY_MODES_CONFIG = [
  { id: 'normal', name: 'Normal', desc: 'Natural everyday dialogue', icon: Bot },
  { id: 'friendly', name: 'Friendly', desc: 'Warm, approachable, conversational', icon: HeartHandshake },
  { id: 'motivation', name: 'Motivation', desc: 'Overcoming friction, constructive wins', icon: Zap },
  { id: 'emotional_support', name: 'Emotional Support', desc: 'Empathetic listening on tough days', icon: HeartHandshake },
  { id: 'coach', name: 'Coach', desc: 'Tactical, action-oriented execution', icon: Compass },
  { id: 'analytical', name: 'Analytical', desc: 'Evidence-based metrics & data trends', icon: Layers },
  { id: 'learning', name: 'Learning', desc: 'Clear step-by-step explanations', icon: BookOpen },
  { id: 'concise', name: 'Concise', desc: 'Short, direct, minimal fluff', icon: Sparkles }
];

const SUGGESTED_PROMPTS = [
  'How was my productivity this week?',
  'What tasks should I prioritize today?',
  'Which habits have been most consistent?',
  'I had a tough day and feel unproductive.',
  'Summarize my workout and focus history.',
  'Help me structure a realistic daily schedule.'
];

export default function AIChat({ ai }) {
  const {
    messages,
    loading,
    isStreaming,
    streamingContent,
    error,
    conversations,
    activeConvId,
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
  } = ai;

  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingConvId, setEditingConvId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modeDropdownOpen, setModeDropdownOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, loading]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!inputText.trim() || loading || isStreaming) return;
    sendMessage(inputText);
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleStartRename = (conv) => {
    setEditingConvId(conv.id);
    setEditingTitle(conv.title);
  };

  const handleSaveRename = (convId) => {
    if (editingTitle.trim()) {
      renameConversation(convId, editingTitle.trim());
    }
    setEditingConvId(null);
  };

  const filteredConversations = (conversations || []).filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeModeObj = PERSONALITY_MODES_CONFIG.find(m => m.id === currentMode) || PERSONALITY_MODES_CONFIG[0];
  const ActiveIcon = activeModeObj.icon;

  return (
    <div style={{
      display: 'flex',
      height: '620px',
      background: 'var(--bg-card)',
      borderRadius: 'var(--radius-xl, 20px)',
      border: '1px solid var(--border-subtle)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* 1. CONVERSATIONS SIDEBAR */}
      <div style={{
        width: '260px',
        borderRight: '1px solid var(--border-subtle)',
        background: 'rgba(0, 0, 0, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 10,
        transition: 'transform 0.2s ease',
        flexShrink: 0
      }} className={`ai-chat-sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Sidebar Header */}
        <div style={{
          padding: '12px 14px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8
        }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => createNewConversation(currentMode)}
            style={{ width: '100%', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <Plus size={14} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Conversation Search */}
        <div style={{ padding: '8px 12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            padding: '4px 8px'
          }}>
            <Search size={12} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: 11,
                outline: 'none',
                width: '100%'
              }}
            />
          </div>
        </div>

        {/* Conversations List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
          {filteredConversations.length === 0 ? (
            <div style={{ padding: '20px 12px', textAlign: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
              No conversations found.
            </div>
          ) : (
            filteredConversations.map(conv => {
              const isActive = conv.id === activeConvId;
              const isEditing = editingConvId === conv.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => !isEditing && switchConversation(conv.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    margin: '3px 0',
                    borderRadius: 8,
                    background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                    border: isActive ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                    <MessageSquare size={13} color={isActive ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={() => handleSaveRename(conv.id)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(conv.id)}
                        autoFocus
                        style={{
                          background: 'var(--bg-base)',
                          border: '1px solid var(--accent-primary)',
                          borderRadius: 4,
                          color: 'var(--text-primary)',
                          fontSize: 11,
                          padding: '1px 4px',
                          width: '100%'
                        }}
                      />
                    ) : (
                      <span style={{
                        fontSize: 12,
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {conv.title}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {!isEditing && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon btn-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartRename(conv);
                        }}
                        style={{ padding: 2, color: 'var(--text-muted)' }}
                      >
                        <Edit2 size={11} />
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon btn-xs text-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                      style={{ padding: 2 }}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. MAIN CHAT ARENA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(255, 255, 255, 0.02)',
          flexWrap: 'wrap',
          gap: 8
        }}>
          {/* Left: Bot Profile & Mode Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: 'rgba(99, 102, 241, 0.15)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <ActiveIcon size={18} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <h3 style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                  TaskBar OS Companion
                </h3>

                {/* Personality Mode Selector Dropdown */}
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setModeDropdownOpen(!modeDropdownOpen)}
                    style={{
                      background: 'rgba(99, 102, 241, 0.12)',
                      border: '1px solid rgba(99, 102, 241, 0.25)',
                      borderRadius: 12,
                      padding: '2px 8px',
                      color: 'var(--accent-primary)',
                      fontSize: 10,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      cursor: 'pointer'
                    }}
                  >
                    <span>{activeModeObj.name}</span>
                    <ChevronDown size={10} />
                  </button>

                  {modeDropdownOpen && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      marginTop: 4,
                      width: '210px',
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 12,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                      zIndex: 50,
                      overflow: 'hidden',
                      padding: '4px'
                    }}>
                      {PERSONALITY_MODES_CONFIG.map(m => {
                        const Icon = m.icon;
                        const isSelected = m.id === currentMode;
                        return (
                          <div
                            key={m.id}
                            onClick={() => {
                              setMode(m.id);
                              setModeDropdownOpen(false);
                            }}
                            style={{
                              padding: '6px 8px',
                              borderRadius: 6,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              cursor: 'pointer',
                              background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                              color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)'
                            }}
                          >
                            <Icon size={13} />
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontSize: 11, fontWeight: 700 }}>{m.name}</div>
                              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{m.desc}</div>
                            </div>
                            {isSelected && <Check size={12} />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Context Indicator Badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Context:</span>
                {contextBadges.map((b, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: 4,
                      background: b.active ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                      color: b.active ? '#10b981' : 'var(--text-muted)'
                    }}
                  >
                    {b.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Header Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {isStreaming && (
              <button
                type="button"
                className="btn btn-danger btn-xs"
                onClick={stopGeneration}
                style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Square size={11} fill="currentColor" />
                <span>Stop</span>
              </button>
            )}

            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={regenerateLastResponse}
              disabled={messages.length === 0 || loading || isStreaming}
              title="Regenerate last response"
              style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <RefreshCw size={12} className={loading ? 'spin' : ''} />
              <span>Retry</span>
            </button>

            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={clearConversation}
              disabled={messages.length === 0}
              style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Trash2 size={12} />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Message Feed Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          {messages.length === 0 && !streamingContent ? (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '20px'
            }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12
              }}>
                <Sparkles size={24} />
              </div>
              <h4 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                Your Personal AI Companion is Ready
              </h4>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 420, margin: '0 0 20px', lineHeight: 1.5 }}>
                Connected to your real tasks, habits, workouts, and focus records. Ask anything or pick a conversation starter below:
              </p>

              {/* Suggested Prompts Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 8,
                width: '100%',
                maxWidth: 580
              }}>
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 10,
                      padding: '8px 12px',
                      color: 'var(--text-primary)',
                      fontSize: 11,
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent-primary)';
                      e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map(msg => (
                <AIMessage
                  key={msg.id}
                  message={msg}
                  onApproveAction={approveAction}
                />
              ))}

              {/* Streaming Content Display */}
              {isStreaming && (
                <AIMessage
                  message={{
                    id: 'streaming_active',
                    role: 'assistant',
                    content: streamingContent || 'Thinking...',
                    timestamp: new Date().toISOString(),
                    mode: currentMode
                  }}
                />
              )}

              {/* Loading Indicator */}
              {loading && !isStreaming && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.03)',
                  width: 'fit-content',
                  color: 'var(--text-muted)',
                  fontSize: 12
                }}>
                  <RefreshCw size={13} className="spin" color="var(--accent-primary)" />
                  <span>Synthesizing response...</span>
                </div>
              )}

              {error && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#ef4444',
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Composer Input Area */}
        <form onSubmit={handleSubmit} style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'rgba(255, 255, 255, 0.02)',
          display: 'flex',
          gap: 10,
          alignItems: 'flex-end'
        }}>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message TaskBar OS Companion (${activeModeObj.name} Mode)... (Shift+Enter for newline)`}
            rows={1}
            disabled={loading || isStreaming}
            style={{
              flex: 1,
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 12,
              padding: '10px 14px',
              color: 'var(--text-primary)',
              fontSize: 13,
              resize: 'none',
              outline: 'none',
              minHeight: '42px',
              maxHeight: '120px',
              fontFamily: 'inherit'
            }}
          />

          {isStreaming ? (
            <button
              type="button"
              className="btn btn-danger"
              onClick={stopGeneration}
              style={{ height: 42, width: 42, padding: 0, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Stop generating"
            >
              <Square size={16} fill="currentColor" />
            </button>
          ) : (
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!inputText.trim() || loading}
              style={{ height: 42, width: 42, padding: 0, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Send size={16} />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
