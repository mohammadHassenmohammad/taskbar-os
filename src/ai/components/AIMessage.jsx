import React, { useState } from 'react';
import { Bot, User, Copy, Check, Trash2, CheckCircle2, X, Sparkles, AlertTriangle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function AIMessage({ message, onDelete, onApproveAction }) {
  const [copied, setCopied] = useState(false);
  const [actionHandled, setActionHandled] = useState(false);
  const isAssistant = message.role === 'assistant';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  // Detect actionable suggestion in assistant message (tasks, focus, water, habits, deletions)
  const extractActionProposal = (text) => {
    if (!text || !isAssistant || actionHandled) return null;

    // Check for explicit structured action block ```action ... ```
    const actionBlockMatch = text.match(/```(?:action|json)\s*\n([\s\S]*?)\n```/);
    if (actionBlockMatch) {
      try {
        const parsed = JSON.parse(actionBlockMatch[1]);
        if (parsed.action || parsed.type) {
          return {
            type: parsed.action || parsed.type,
            title: parsed.title || parsed.payload?.title || parsed.payload?.name || 'Action',
            payload: parsed.payload || parsed,
            risk: parsed.risk || (String(parsed.action || parsed.type).startsWith('delete') || String(parsed.action || parsed.type).startsWith('reset') ? 'consequential' : 'low'),
            warning: parsed.warning || (parsed.risk === 'consequential' ? 'This action is irreversible.' : null)
          };
        }
      } catch {}
    }

    // 1. Delete task (Consequential)
    const delTaskMatch = text.match(/(?:delete|remove)\s+task[:\s]+"([^"]+)"/i) ||
                         text.match(/Delete task[:\s]+([^\n.,]+)/i);
    if (delTaskMatch) {
      return {
        type: 'delete_task',
        title: delTaskMatch[1].trim(),
        risk: 'consequential',
        warning: 'This will permanently delete this mission.'
      };
    }

    // 1B. Delete routine protocol (Consequential)
    const delRoutineMatch = text.match(/(?:delete|remove)\s+routine[:\s]+"([^"]+)"/i) ||
                            text.match(/Delete routine[:\s]+([^\n.,]+)/i);
    if (delRoutineMatch) {
      return {
        type: 'delete_routine',
        title: delRoutineMatch[1].trim(),
        risk: 'consequential',
        warning: 'This will permanently remove this routine protocol and future occurrences.'
      };
    }

    // 1C. Delete habit (Consequential)
    const delHabitMatch = text.match(/(?:delete|remove)\s+habit[:\s]+"([^"]+)"/i) ||
                          text.match(/Delete habit[:\s]+([^\n.,]+)/i);
    if (delHabitMatch) {
      return {
        type: 'delete_habit',
        title: delHabitMatch[1].trim(),
        risk: 'consequential',
        warning: 'This will permanently delete this habit and reset tracked streak history.'
      };
    }

    // 2. Complete task
    const compTaskMatch = text.match(/(?:mark|complete|finish)\s+task[:\s]+"([^"]+)"/i) ||
                          text.match(/Complete task[:\s]+([^\n.,]+)/i);
    if (compTaskMatch) {
      return {
        type: 'complete_task',
        title: compTaskMatch[1].trim(),
        risk: 'low'
      };
    }

    // 3. Create task proposal
    const taskMatch = text.match(/(?:suggest|recommend|create)\s+task[:\s]+"([^"]+)"/i) ||
                      text.match(/Create task[:\s]+"([^"]+)"/i) ||
                      text.match(/(?:suggest|recommend|create)\s+task[:\s]+([^\n.,]+)/i);
    if (taskMatch) {
      return {
        type: 'create_task',
        title: taskMatch[1].trim(),
        priority: 'Medium',
        category: 'Work',
        risk: 'low'
      };
    }

    // 3B. Create routine proposal
    const routineMatch = text.match(/Create routine[:\s]+"([^"]+)"/i) ||
                         text.match(/(?:suggest|recommend)\s+routine[:\s]+"([^"]+)"/i);
    if (routineMatch) {
      return {
        type: 'create_routine',
        title: routineMatch[1].trim(),
        risk: 'low'
      };
    }

    // 3C. Create habit proposal
    const createHabitMatch = text.match(/Create habit[:\s]+"([^"]+)"/i) ||
                             text.match(/(?:suggest|recommend)\s+habit[:\s]+"([^"]+)"/i);
    if (createHabitMatch) {
      return {
        type: 'create_habit',
        title: createHabitMatch[1].trim(),
        risk: 'low'
      };
    }

    // 4. Start focus session proposal
    const focusMatch = text.match(/Start focus session[:\s]+(\d+)\s*(?:mins|minutes)?/i) ||
                       text.match(/(?:start|begin)\s+(\d+)-minute focus session/i);
    if (focusMatch) {
      return {
        type: 'start_focus',
        duration: parseInt(focusMatch[1], 10) || 25,
        risk: 'low'
      };
    }

    // 5. Log water hydration proposal
    const waterMatch = text.match(/Log water[:\s]+(\d+)\s*(?:glasses|glass)?/i) ||
                       text.match(/Drink\s+(\d+)\s+glasses of water/i);
    if (waterMatch) {
      return {
        type: 'log_water',
        amount: parseInt(waterMatch[1], 10) || 1,
        risk: 'low'
      };
    }

    // 6. Mark habit complete
    const habitMatch = text.match(/Mark habit complete[:\s]+"([^"]+)"/i) ||
                       text.match(/Check off habit[:\s]+"([^"]+)"/i);
    if (habitMatch) {
      return {
        type: 'log_habit',
        title: habitMatch[1].trim(),
        risk: 'low'
      };
    }

    return null;
  };

  const actionProposal = extractActionProposal(message.content);

  // Markdown renderer for headers, bold, bullets, inline code, and code blocks
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
    const parts = str.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} style={{ padding: '1px 5px', borderRadius: 4, background: 'rgba(255,255,255,0.08)', fontSize: 12, fontFamily: 'monospace' }}>{part.slice(1, -1)}</code>;
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>
              {isAssistant ? 'JARVIS' : 'Operative'}
            </span>
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

        {/* Action Proposal Card (Requires Explicit Approval) */}
        {actionProposal && !actionHandled && onApproveAction && (
          <div style={{
            marginTop: 12,
            padding: '12px 14px',
            borderRadius: 10,
            background: actionProposal.risk === 'consequential' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(99, 102, 241, 0.08)',
            border: actionProposal.risk === 'consequential' ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(99, 102, 241, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {actionProposal.risk === 'consequential' ? (
                <AlertTriangle size={18} color="var(--color-danger, #ef4444)" />
              ) : (
                <Sparkles size={16} color="var(--accent-primary)" />
              )}
              <div>
                <div style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: actionProposal.risk === 'consequential' ? 'var(--color-danger, #ef4444)' : 'var(--text-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}>
                  {actionProposal.risk === 'consequential' ? 'Consequential Action Confirmation' : 'Proposed Action'}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
                  {actionProposal.type === 'create_task' && `Create Task: "${actionProposal.title}"`}
                  {actionProposal.type === 'complete_task' && `Complete Task: "${actionProposal.title}"`}
                  {actionProposal.type === 'delete_task' && `Delete Task: "${actionProposal.title}"`}
                  {actionProposal.type === 'create_routine' && `Create Routine: "${actionProposal.title}"`}
                  {actionProposal.type === 'delete_routine' && `Delete Routine: "${actionProposal.title}"`}
                  {actionProposal.type === 'create_habit' && `Create Habit: "${actionProposal.title || actionProposal.name}"`}
                  {actionProposal.type === 'delete_habit' && `Delete Habit: "${actionProposal.title || actionProposal.name}"`}
                  {actionProposal.type === 'start_focus' && `Start Focus Session: ${actionProposal.duration} mins`}
                  {actionProposal.type === 'log_water' && `Log Hydration: ${actionProposal.amount} glass${actionProposal.amount > 1 ? 'es' : ''}`}
                  {actionProposal.type === 'log_habit' && `Log Habit: "${actionProposal.title || actionProposal.name}"`}
                  {!['create_task', 'complete_task', 'delete_task', 'create_routine', 'delete_routine', 'create_habit', 'delete_habit', 'start_focus', 'log_water', 'log_habit'].includes(actionProposal.type) &&
                    `${actionProposal.type.replace('_', ' ')}: "${actionProposal.title}"`}
                </div>
                {actionProposal.warning && (
                  <div style={{ fontSize: 11, color: 'var(--color-danger, #ef4444)', marginTop: 2 }}>
                    ⚠️ {actionProposal.warning}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                className={`btn btn-xs ${actionProposal.risk === 'consequential' ? 'btn-danger' : 'btn-primary'}`}
                onClick={() => {
                  onApproveAction(actionProposal);
                  setActionHandled(true);
                }}
                style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <CheckCircle2 size={12} />
                <span>
                  {actionProposal.risk === 'consequential' ? 'Authorize & Delete' : 'Approve & Execute'}
                </span>
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => setActionHandled(true)}
                style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <X size={12} />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
