import React, { useState } from 'react';
import { Bot, User, Copy, Check, Trash2, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function AIMessage({ message, onDelete }) {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.role === 'assistant';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  // Basic lightweight markdown renderer for headers, bold, bullets, code blocks
  const renderFormattedContent = (text) => {
    if (!text) return null;
    const lines = text.split('\n');

    return lines.map((line, idx) => {
      // Headers
      if (line.startsWith('### ')) {
        return <h4 key={idx} style={{ fontSize: 14, fontWeight: 800, margin: '10px 0 4px', color: 'var(--text-primary)' }}>{line.replace('### ', '')}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={idx} style={{ fontSize: 16, fontWeight: 900, margin: '14px 0 6px', color: 'var(--text-primary)' }}>{line.replace('## ', '')}</h3>;
      }
      if (line.startsWith('# ')) {
        return <h2 key={idx} style={{ fontSize: 18, fontWeight: 900, margin: '16px 0 8px', color: 'var(--text-primary)' }}>{line.replace('# ', '')}</h2>;
      }
      // Bullet points
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const clean = line.trim().substring(2);
        return (
          <div key={idx} style={{ display: 'flex', gap: 8, margin: '3px 0 3px 6px', fontSize: 13, lineHeight: 1.5 }}>
            <span style={{ color: 'var(--accent-primary)', fontWeight: 800 }}>•</span>
            <span>{renderInlineStyles(clean)}</span>
          </div>
        );
      }
      // Empty lines
      if (!line.trim()) {
        return <div key={idx} style={{ height: 6 }} />;
      }
      // Standard line
      return <p key={idx} style={{ margin: '3px 0', fontSize: 13, lineHeight: 1.6 }}>{renderInlineStyles(line)}</p>;
    });
  };

  const renderInlineStyles = (str) => {
    // Bold **text**
    const parts = str.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} style={{ padding: '1px 5px', borderRadius: 4, background: 'rgba(255,255,255,0.08)', fontSize: 12 }}>{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  return (
    <div style={{
      display: 'flex',
      gap: 12,
      padding: '14px 16px',
      borderRadius: 'var(--radius-lg, 16px)',
      background: isAssistant ? 'var(--bg-card)' : 'rgba(99, 102, 241, 0.08)',
      border: isAssistant ? '1px solid var(--border-subtle)' : '1px solid rgba(99, 102, 241, 0.25)',
      position: 'relative'
    }}>
      {/* Avatar */}
      <div style={{
        width: 32,
        height: 32,
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isAssistant ? 'rgba(99, 102, 241, 0.15)' : 'var(--accent-primary)',
        color: isAssistant ? 'var(--accent-primary)' : 'white',
        flexShrink: 0,
        marginTop: 2
      }}>
        {isAssistant ? <Bot size={18} /> : <User size={18} />}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>
              {isAssistant ? 'TaskBar OS AI' : 'Operative'}
            </span>
            {message.isLocalFallback && (
              <span style={{
                fontSize: 9,
                fontWeight: 700,
                padding: '1px 5px',
                borderRadius: 4,
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b'
              }}>
                LOCAL ENGINE
              </span>
            )}
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {message.timestamp ? format(new Date(message.timestamp), 'h:mm a') : ''}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              className="btn btn-ghost btn-icon btn-xs"
              onClick={handleCopy}
              title="Copy message text"
              style={{ padding: 4, color: 'var(--text-muted)' }}
            >
              {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
            </button>
            {onDelete && (
              <button
                className="btn btn-ghost btn-icon btn-xs text-danger"
                onClick={() => onDelete(message.id)}
                title="Delete message"
                style={{ padding: 4 }}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        <div style={{ color: 'var(--text-secondary)' }}>
          {renderFormattedContent(message.content)}
        </div>
      </div>
    </div>
  );
}
