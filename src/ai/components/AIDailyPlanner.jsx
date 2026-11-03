import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Check, Plus, RefreshCw, Zap, Coffee, ShieldAlert } from 'lucide-react';
import { aiService } from '../services/aiService';
import { prepareFullContext } from '../services/aiContextService';
import { useStore, today } from '../../store/useStore';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function AIDailyPlanner() {
  const store = useStore();
  const { addTask, startPomodoro, setPage } = store;
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [acceptedTasks, setAcceptedTasks] = useState(new Set());

  const loadPlan = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const context = prepareFullContext(store);
      const res = await aiService.getDailyPlan(context, force);
      setPlan(res);
    } catch (err) {
      setError(err.message || 'Failed to synthesize plan');
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlan(false);
  }, []);

  const handleAcceptTask = (taskItem) => {
    addTask({
      title: taskItem.title,
      priority: taskItem.priority || 'Medium',
      category: 'Work',
      dueTime: taskItem.recommendedTime !== 'Flexible' ? taskItem.recommendedTime : undefined
    }, today());

    setAcceptedTasks(prev => new Set([...prev, taskItem.taskId || taskItem.title]));
    toast.success(`Task scheduled: "${taskItem.title}"`, { icon: '📅' });
  };

  const handleStartFocus = (block) => {
    setPage('focus');
    startPomodoro();
    toast.success(`Initiated ${block.duration}m focus block: "${block.label}"`, { icon: '⏱️' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={18} color="var(--accent-primary)" />
            <span>AI Strategic Daily Planner</span>
          </h3>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            Balanced task sequencing, deep focus intervals, and recovery checkpoints
          </div>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => loadPlan(true)}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>{loading ? 'Synthesizing…' : 'Regenerate Plan'}</span>
        </button>
      </div>

      {loading && !plan && (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
          <RefreshCw size={28} className="spin" color="var(--accent-primary)" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Evaluating Daily Workload & Cognitive Pacing…</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Analyzing scheduled tasks, habit commitments, and training schedule.</div>
        </div>
      )}

      {error && !plan && (
        <div style={{ padding: 18, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 14, color: 'var(--color-danger)', fontSize: 13 }}>
          {error}
        </div>
      )}

      {plan && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Daily Theme & Assessment Card */}
          <div className="card" style={{ padding: '20px 24px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                  TACTICAL MISSION THEME
                </span>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', margin: '4px 0 0' }}>
                  {plan.dailyTheme}
                </h2>
              </div>

              <span className="badge" style={{
                fontSize: 11, fontWeight: 800,
                background: plan.workloadAssessment === 'Overloaded' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                color: plan.workloadAssessment === 'Overloaded' ? '#ef4444' : '#10b981'
              }}>
                Workload: {plan.workloadAssessment}
              </span>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              {plan.plannerAdvice}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {/* Recommended Sequencing */}
            <div className="card" style={{ padding: 20, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={16} color="var(--accent-primary)" />
                <span>Recommended Mission Order</span>
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(plan.recommendedOrder || []).length === 0 ? (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', padding: 12 }}>No sequence generated.</div>
                ) : (
                  plan.recommendedOrder.map((item, idx) => {
                    const isAccepted = acceptedTasks.has(item.taskId || item.title);
                    return (
                      <div key={idx} style={{
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12
                      }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent-primary)' }}>#{idx + 1}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.title}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            {item.recommendedTime} · {item.reason}
                          </div>
                        </div>

                        <button
                          type="button"
                          className="btn btn-ghost btn-xs"
                          disabled={isAccepted}
                          onClick={() => handleAcceptTask(item)}
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: isAccepted ? '#10b981' : 'var(--accent-primary)',
                            background: isAccepted ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.08)',
                            padding: '4px 8px',
                            borderRadius: 6,
                            flexShrink: 0
                          }}
                        >
                          {isAccepted ? 'Scheduled ✓' : '+ Schedule'}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Focus & Breaks Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Focus Blocks */}
              <div className="card" style={{ padding: 20, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={16} color="#8b5cf6" />
                  <span>Proposed Deep Work Blocks</span>
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(plan.focusBlocks || []).map((fb, idx) => (
                    <div key={idx} style={{
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: 'rgba(139, 92, 246, 0.06)',
                      border: '1px solid rgba(139, 92, 246, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{fb.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fb.time} · {fb.duration} mins</div>
                      </div>
                      <button
                        className="btn btn-primary btn-xs"
                        onClick={() => handleStartFocus(fb)}
                        style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px' }}
                      >
                        Start Block
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recovery Checkpoints */}
              <div className="card" style={{ padding: 20, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Coffee size={16} color="#10b981" />
                  <span>Recovery & Movement Breaks</span>
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(plan.recoveryBreaks || []).map((rb, idx) => (
                    <div key={idx} style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: 12
                    }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{rb.activity}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{rb.time} ({rb.duration}m)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

