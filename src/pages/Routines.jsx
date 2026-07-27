import { useState } from 'react';
import { useStore, CATEGORIES } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Repeat, Trash2, Edit2, ToggleLeft, ToggleRight, X, Save, Info, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const PRIORITIES = ['Low', 'Medium', 'High'];
const PRIORITY_COLORS = { Low: 'var(--priority-low)', Medium: 'var(--priority-medium)', High: 'var(--priority-high)' };

const WEEKDAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WEEKDAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function RoutineModal({ routine, onClose }) {
  const { addRoutine, updateRoutine } = useStore();
  const isEdit = Boolean(routine);
  const [form, setForm] = useState({
    title: routine?.title || '', 
    description: routine?.description || '',
    priority: routine?.priority || 'Medium', 
    category: routine?.category || 'Work',
    dueTime: routine?.dueTime || '',
    days: routine?.days || [0, 1, 2, 3, 4, 5, 6]
  });

  const toggleDay = (day) => {
    setForm(prev => ({
      ...prev,
      days: prev.days.includes(day) 
        ? prev.days.filter(d => d !== day) 
        : [...prev.days, day].sort()
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title required'); return; }
    if (form.days.length === 0) { toast.error('Select at least one day'); return; }
    
    if (isEdit) { 
      updateRoutine(routine.id, form); 
      toast.success('Routine updated & synced! 🔁'); 
    }
    else { 
      addRoutine(form); 
      toast.success(`Routine added for ${form.days.length === 7 ? 'every day' : `${form.days.length} days`}! 🔁`); 
    }
    onClose();
  };

  return (
    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div className="modal" initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.93, y: 20 }} transition={{ duration: 0.2 }}>
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit Routine' : 'New Routine Task'}</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ background: 'rgba(110,106,255,0.08)', border: '1px solid rgba(110,106,255,0.15)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <Info size={14} style={{ flexShrink: 0, marginTop: 1, color: 'var(--accent-primary)' }} />
              This mission will automatically initialize on your selected days.
            </div>
            
            <div className="form-group">
              <label className="form-label">Mission Title *</label>
              <input className="form-input" autoFocus placeholder="e.g. Morning workout, Read for 20 min…" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>

            <div className="form-group">
              <label className="form-label">Frequency (Days of Week) *</label>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                {WEEKDAYS_SHORT.map((day, i) => (
                  <button key={i} type="button" onClick={() => toggleDay(i)}
                    style={{ 
                      flex: 1, height: 36, borderRadius: 10, border: '1px solid var(--border-subtle)', 
                      background: form.days.includes(i) ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                      color: form.days.includes(i) ? 'white' : 'var(--text-muted)',
                      fontSize: 12, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Protocol Brief</label>
              <textarea className="form-textarea" style={{ minHeight: 60 }} placeholder="Optional notes…" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <div style={{ display: 'flex', gap: 5 }}>
                  {PRIORITIES.map(p => (
                    <button key={p} type="button" onClick={() => setForm({ ...form, priority: p })}
                      style={{ flex: 1, padding: '7px 4px', borderRadius: 'var(--radius-md)', border: `2px solid ${form.priority === p ? PRIORITY_COLORS[p] : 'var(--border-default)'}`, background: form.priority === p ? `${PRIORITY_COLORS[p]}18` : 'transparent', color: form.priority === p ? PRIORITY_COLORS[p] : 'var(--text-muted)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Classification</label>
                <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Activation Time (Due Time)</label>
              <input type="time" className="form-input" value={form.dueTime} onChange={e => setForm({ ...form, dueTime: e.target.value })} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Abstain</button>
            <button type="submit" className="btn btn-primary"><Save size={13} /> {isEdit ? 'Update Protocol' : 'Initialize Routine'}</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function Routines() {
  const { routines, toggleRoutine, deleteRoutine, getRoutineStats } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [editRoutine, setEditRoutine] = useState(null);

  const CATEGORY_EMOJI = { Work: '💼', Personal: '👤', Health: '💪', Learning: '📚', Creative: '🎨', Social: '👥', Finance: '💰', Other: '📌' };

  const { activeProtocols, totalCompleted } = getRoutineStats();
  const deploymentRecord = totalCompleted;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 60 }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: -0.8 }}>🔁 Routine Protocols</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>Automated mission initialization for peak operational consistency.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditRoutine(null); setShowModal(true); }}>
          <Plus size={16} /> New Protocol
        </button>
      </motion.div>

      {/* Stats */}
      <div className="grid-3">
        {[
          { label: 'Active Protocols', value: activeProtocols, color: 'var(--accent-primary)', icon: <Repeat size={20} /> },
          { label: 'Efficiency Streak', value: routines.filter(r => r.enabled).length > 0 ? 'Optimal' : 'Pending', color: 'var(--color-success)', icon: <ToggleRight size={20} /> },
          { label: 'Deployment Count', value: deploymentRecord, color: 'var(--accent-secondary)', icon: <Info size={20} /> },
        ].map((s, i) => (
          <motion.div key={s.label} className="stat-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            style={{ padding: '20px 24px', background: 'var(--bg-card)', border: '1.5px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</span>
              <div style={{ color: s.color, opacity: 0.8 }}>{s.icon}</div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color, marginTop: 8 }}>{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Routine list */}
      {routines.length === 0 ? (
        <div className="empty-state" style={{ padding: '80px 40px', background: 'var(--bg-card)', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-xl)' }}>
          <div className="empty-state-icon" style={{ fontSize: 48, marginBottom: 16 }}>🔁</div>
          <div className="empty-state-title" style={{ fontSize: 18, fontWeight: 900 }}>No routine protocols initialized</div>
          <div className="empty-state-sub" style={{ maxWidth: 400, margin: '12px auto', lineHeight: 1.6 }}>Add recurring missions like physical training, neural loading, or tactical reviews — they'll initialize automatically on your chosen days.</div>
          <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={() => setShowModal(true)}>
            <Plus size={16} /> Initialize First Protocol
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <AnimatePresence>
            {routines.map((r, i) => (
              <motion.div key={r.id} className={`routine-card-premium`}
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: r.enabled ? 1 : 0.6, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.04 }}
                style={{ 
                  position: 'relative', display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
                  background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', border: '1.5px solid var(--border-subtle)',
                  boxShadow: r.enabled ? '0 4px 20px rgba(0,0,0,0.05)' : 'none', overflow: 'hidden'
                }}>
                
                {/* Priority Indicator */}
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: PRIORITY_COLORS[r.priority] }} />

                {/* Category Icon */}
                <div style={{ width: 48, height: 48, borderRadius: 14, background: `${PRIORITY_COLORS[r.priority]}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                  {CATEGORY_EMOJI[r.category] || '📌'}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</div>
                    {!r.enabled && <span style={{ fontSize: 9, fontWeight: 900, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase' }}>Paused</span>}
                  </div>
                  {r.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.description}</div>}
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {WEEKDAYS_SHORT.map((d, di) => {
                        const isActive = (r.days || [0,1,2,3,4,5,6]).includes(di);
                        return (
                          <div key={di} style={{ 
                            width: 18, height: 18, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 9, fontWeight: 900, background: isActive ? 'rgba(99,102,241,0.15)' : 'var(--bg-elevated)',
                            color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)', border: isActive ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent'
                          }}>
                            {d}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ width: 1, height: 12, background: 'var(--border-subtle)' }} />
                    <span style={{ fontSize: 10, fontWeight: 800, color: PRIORITY_COLORS[r.priority], background: `${PRIORITY_COLORS[r.priority]}10`, padding: '2px 10px', borderRadius: 20 }}>{r.priority}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '2px 10px', borderRadius: 20 }}>{r.category}</span>
                    {r.dueTime && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={10} /> {r.dueTime}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-ghost btn-icon btn-sm" title={r.enabled ? 'Pause Protocol' : 'Resume Protocol'}
                    onClick={() => { toggleRoutine(r.id); toast(r.enabled ? 'Protocol paused' : 'Protocol active 🔁', { icon: r.enabled ? '⏸️' : '▶️' }); }}>
                    {r.enabled ? <ToggleRight size={20} color="var(--color-success)" /> : <ToggleLeft size={20} />}
                  </button>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setEditRoutine(r); setShowModal(true); }}><Edit2 size={16} /></button>
                  <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--color-danger)' }} 
                    onClick={() => { 
                      if (window.confirm('Delete this protocol? Future uncompleted missions will be removed, but your completed mission history will be preserved.')) {
                        deleteRoutine(r.id); 
                        toast.success('Protocol removed. History preserved.'); 
                      }
                    }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Suggestions Overlay */}
      {routines.length < 3 && (
        <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ padding: 24, background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(99,102,241,0.03) 100%)', border: '1.5px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 16, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Plus size={18} color="var(--accent-primary)" />
            Tactical Suggestions
          </div>
          <div className="grid-2" style={{ gap: 12 }}>
            {[
              { title: '🏃 Morning PT', category: 'Health', priority: 'High', days: [1,2,3,4,5] },
              { title: '📖 Neural Loading (Read)', category: 'Learning', priority: 'Medium', days: [0,1,2,3,4,5,6] },
              { title: '📝 Strategic Debrief', category: 'Work', priority: 'High', days: [1,2,3,4,5] },
              { title: '🧘 Mental Calibration', category: 'Health', priority: 'Medium', days: [0,6] },
            ].map(s => (
              <div key={s.title} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>{s.title}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginTop: 2 }}>{s.category} · {s.days.length === 7 ? 'Daily' : 'Custom'}</div>
                </div>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { 
                   addRoutine({ ...s, enabled: true });
                   toast.success('Protocol initialized!');
                }}>
                  <Plus size={14} />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {showModal && <RoutineModal routine={editRoutine} onClose={() => { setShowModal(false); setEditRoutine(null); }} />}
      </AnimatePresence>
    </div>
  );
}
