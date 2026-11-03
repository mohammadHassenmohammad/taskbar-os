import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, Trash2, Sparkles, RefreshCw, AlertCircle, Bot } from 'lucide-react';
import AIMessage from './AIMessage';
import AIStatus from './AIStatus';
import { motion, AnimatePresence } from 'framer-motion';

const SUGGESTED_PROMPTS = [
  'How was my productivity this week?',
  'What tasks should I prioritize today?',
  'Which habits have been most consistent?',
  'What is preventing me from completing my tasks?',
  'Summarize my workout history',
  'Create a realistic weekly plan'
];

export default function AIChat({ ai }) {
  const { messages, loading, error, sendMessage, clearConversation, deleteMessage, status } = ai;
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!inputText.trim() || loading) return;
    sendMessage(inputText);
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: '560px',
      background: 'var(--bg-card)',
      borderRadius: 'var(--radius-xl, 20px)',
      border: '1px solid var(--border-subtle)',
      overflow: 'hidden'
    }}>
      {/* Header bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(255, 255, 255, 0.02)',
        flexWrap: 'wrap',
        gap: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: 'rgba(99, 102, 241, 0.15)',
            color: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Bot size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
              Tactical AI Assistant
            </h3>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Context-aware intelligence grounded in your stored activity
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={clearConversation}
            disabled={messages.length === 0}
            style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <Trash2 size={13} />
            <span>Clear History</span>
          </button>
        </div>
      </div>

      {/* Provider Status Pill */}
      <div style={{ padding: '8px 16px', background: 'rgba(0, 0, 0, 0.2)' }}>
        <AIStatus status={status} />
      </div>

      {/* Messages Scroll Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        maxHeight: 'calc(100vh - 380px)'
      }}>
        {messages.length === 0 ? (
          <div style={{
            margin: 'auto 0',
            textAlign: 'center',
            padding: '30px 16px'
          }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: 'rgba(99, 102, 241, 0.12)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px'
            }}>
              <Sparkles size={26} />
            </div>
            <h4 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 6 }}>
              How can I assist your mission today?
            </h4>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 420, margin: '0 auto 20px', lineHeight: 1.5 }}>
              Ask about your productivity patterns, workout volume, habit adherence, or ask me to draft a realistic schedule.
            </p>

            {/* Suggested Starter Prompts */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 8,
              maxWidth: 640,
              margin: '0 auto'
            }}>
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => sendMessage(prompt)}
                  style={{
                    fontSize: 12,
                    padding: '10px 12px',
                    textAlign: 'left',
                    borderRadius: 10,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    whiteSpace: 'normal',
                    height: 'auto',
                    lineHeight: 1.4
                  }}
                >
                  <span style={{ color: 'var(--accent-primary)', marginRight: 6 }}>⚡</span>
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map(msg => (
            <AIMessage key={msg.id} message={msg} onDelete={deleteMessage} />
          ))
        )}

        {/* Loading Indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 16px',
              borderRadius: 14,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              width: 'fit-content'
            }}
          >
            <RefreshCw size={15} className="spin" color="var(--accent-primary)" />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
              Analyzing application context & synthesizing response…
            </span>
          </motion.div>
        )}

        {/* Error notification banner */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            borderRadius: 10,
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--color-danger)',
            fontSize: 12
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <form onSubmit={handleSubmit} style={{
        padding: '14px 16px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(255, 255, 255, 0.01)',
        display: 'flex',
        gap: 10,
        alignItems: 'flex-end'
      }}>
        <textarea
          rows={1}
          className="form-input"
          placeholder="Ask anything about your tasks, habits, workouts, or schedule (Enter to send)…"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            resize: 'none',
            minHeight: 44,
            maxHeight: 120,
            padding: '11px 14px',
            fontSize: 13,
            lineHeight: 1.4,
            borderRadius: 12
          }}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!inputText.trim() || loading}
          style={{
            height: 44,
            width: 44,
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 12,
            flexShrink: 0
          }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

