import React, { useState } from 'react';
import { Check, X, Edit2, Play, Plus, Droplets, Target, ShieldCheck } from 'lucide-react';
import { useStore, today } from '../../store/useStore';
import toast from 'react-hot-toast';

export default function AISuggestionCard({ suggestion, onDismiss }) {
  const { addTask, startPomodoro, logWater, setPage } = useStore();
  const [approved, setApproved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [customTitle, setCustomTitle] = useState(suggestion.payload?.taskTitle || suggestion.title);

  const handleApprove = () => {
    const todayStr = today();

    switch (suggestion.type) {
      case 'create_task':
        addTask({
          title: customTitle,
          priority: suggestion.payload?.priority || 'Medium',
          category: suggestion.payload?.category || 'Work',
          progress: 0
        }, todayStr);
        toast.success(`Mission approved & added: "${customTitle}"`, { icon: '🎯' });
        break;

      case 'start_focus':
        setPage('focus');
        startPomodoro();
        toast.success('Focus session initiated via tactical proposal', { icon: '⏱️' });
        break;

      case 'log_water':
        const nowTime = new Date().toTimeString().slice(0, 5);
        logWater(todayStr, nowTime);
        toast.success('Hydration logged (+250ml)', { icon: '💧' });
        break;

      default:
        toast.success('Action acknowledged');
    }

    setApproved(true);
    if (onDismiss) {
      setTimeout(onDismiss, 800);
    }
  };

  const getIcon = () => {
    switch (suggestion.type) {
      case 'create_task': return <Plus size={16} />;
      case 'start_focus': return <Play size={16} />;
      case 'log_water': return <Droplets size={16} />;
      default: return <Target size={16} />;
    }
  };

  return (
    <div style={{
      padding: '14px 16px',
      background: approved ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-elevated)',
      borderRadius: 'var(--radius-md, 12px)',
      border: approved ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      transition: 'all 0.2s ease'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            background: 'rgba(99, 102, 241, 0.15)',
            color: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {getIcon()}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
              {isEditing ? (
                <input
                  className="form-input"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  style={{ fontSize: 13, padding: '4px 8px' }}
                />
              ) : (
                customTitle
              )}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              {suggestion.description}
            </div>
          </div>
        </div>

        <span style={{
          fontSize: 9,
          fontWeight: 800,
          textTransform: 'uppercase',
          padding: '2px 6px',
          borderRadius: 4,
          background: suggestion.impact === 'High' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.12)',
          color: suggestion.impact === 'High' ? '#ef4444' : 'var(--accent-primary)'
        }}>
          {suggestion.impact || 'Medium'} Impact
        </span>
      </div>

      {/* Approval action cluster */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, paddingTop: 4, borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}>
        {suggestion.type === 'create_task' && !approved && (
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={() => setIsEditing(!isEditing)}
            style={{ fontSize: 11, color: 'var(--text-muted)' }}
          >
            <Edit2 size={12} /> {isEditing ? 'Done' : 'Edit'}
          </button>
        )}

        {onDismiss && !approved && (
          <button
            type="button"
            className="btn btn-ghost btn-xs text-danger"
            onClick={onDismiss}
            style={{ fontSize: 11 }}
          >
            <X size={12} /> Dismiss
          </button>
        )}

        <button
          type="button"
          className="btn btn-primary btn-xs"
          disabled={approved}
          onClick={handleApprove}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontWeight: 800,
            background: approved ? '#10b981' : undefined
          }}
        >
          <Check size={12} />
          <span>{approved ? 'Approved & Added' : 'Approve & Execute'}</span>
        </button>
      </div>
    </div>
  );
}

