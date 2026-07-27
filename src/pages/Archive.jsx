import { useStore } from '../store/useStore';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { CheckCircle2, Lock, ArrowRight, Calendar } from 'lucide-react';
import TaskCard from '../components/TaskCard';
import { useState } from 'react';

export default function Archive() {
  const { tasks, submittedDays, setActiveDate, setPage, unlockDay } = useStore();
  const [expandedDay, setExpandedDay] = useState(null);

  const submittedKeys = Object.keys(submittedDays)
    .filter((k) => submittedDays[k])
    .sort((a, b) => b.localeCompare(a));

  if (submittedKeys.length === 0) {
    return (
      <div className="empty-state" style={{ minHeight: '60vh' }}>
        <div className="empty-state-icon">🗄️</div>
        <div className="empty-state-title">No archived days yet</div>
        <div className="empty-state-sub">Submit a day to see it appear here</div>
        <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => setPage('today')}>
          Go to Today
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 760, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
          {submittedKeys.length} submitted {submittedKeys.length === 1 ? 'day' : 'days'}
        </div>
      </motion.div>

      {submittedKeys.map((key, i) => {
        const dayTasks = tasks[key] || [];
        const done = dayTasks.filter((t) => t.completed).length;
        const total = dayTasks.length;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        const d = new Date(key + 'T00:00:00');
        const isExpanded = expandedDay === key;

        return (
          <motion.div
            key={key}
            className="card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            {/* Day header */}
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}
              onClick={() => setExpandedDay(isExpanded ? null : key)}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: pct === 100 ? 'rgba(16,217,142,0.12)' : 'rgba(110,106,255,0.1)',
                border: `1px solid ${pct === 100 ? 'rgba(16,217,142,0.2)' : 'rgba(110,106,255,0.15)'}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1, color: pct === 100 ? 'var(--color-success)' : 'var(--accent-primary)' }}>
                  {format(d, 'd')}
                </div>
                <div style={{ fontSize: 8, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  {format(d, 'MMM')}
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {format(d, 'EEEE, MMMM d yyyy')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                  <div style={{ height: 4, flex: 1, background: 'var(--border-subtle)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? 'var(--color-success)' : 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))', borderRadius: 4 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: pct === 100 ? 'var(--color-success)' : 'var(--text-secondary)', minWidth: 38 }}>{pct}%</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {done}/{total} tasks completed
                </div>
              </div>

              <div style={{ display: 'flex', align: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(16,217,142,0.12)', color: 'var(--color-success)', padding: '3px 8px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Lock size={9} /> Submitted
                </span>
                <span style={{ fontSize: 14, color: 'var(--text-muted)', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', display: 'flex', alignItems: 'center' }}>›</span>
              </div>
            </div>

            {/* Expanded task list */}
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ marginTop: 16, borderTop: '1px solid var(--border-subtle)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                {dayTasks.map((task) => (
                  <TaskCard key={task.id} task={task} date={key} onEdit={() => {}} isReadOnly={true} />
                ))}

                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => { setActiveDate(key); setPage('today'); }}
                  >
                    <ArrowRight size={12} /> View Full
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--color-warning)' }}
                    onClick={() => unlockDay(key)}
                  >
                    🔓 Unlock Edit
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
