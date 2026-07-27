import { useState } from 'react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, X, Save, Check } from 'lucide-react';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import toast from 'react-hot-toast';

const COLORS = ['#6e6aff','#a78bfa','#10d98e','#38bdf8','#f5a623','#ff5e72','#f472b6','#34d399'];
const ICONS = ['⭐','🏃','📖','💧','🧘','🎯','💪','🍎','😴','✍️','🎵','🧹','💊','🌿','🔥','🏊'];
const LABEL_SHORT = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function HabitModal({ habit, onClose }) {
  const { addHabit, updateHabit } = useStore();
  const isEdit = Boolean(habit);
  const [form, setForm] = useState({
    name: habit?.name || '', icon: habit?.icon || '⭐',
    color: habit?.color || '#6e6aff', target: habit?.target || 1, unit: habit?.unit || 'times',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name required'); return; }
    if (isEdit) { updateHabit(habit.id, form); toast.success('Habit updated!'); }
    else { addHabit(form); toast.success('Habit added! Track it daily 🎯'); }
    onClose();
  };

  return (
    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div className="modal" initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.93, y: 20 }}>
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit Habit' : 'New Habit'}</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Habit Name</label>
              <input autoFocus className="form-input" placeholder="e.g. Morning Run, Read 30 min…" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Icon</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {ICONS.map(ic => (
                  <button key={ic} type="button" onClick={() => setForm({ ...form, icon: ic })}
                    style={{ width: 36, height: 36, borderRadius: 8, border: `2px solid ${form.icon === ic ? form.color : 'var(--border-default)'}`, background: form.icon === ic ? `${form.color}20` : 'transparent', fontSize: 18, cursor: 'pointer', transition: 'all 0.15s' }}>
                    {ic}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Color</label>
              <div className="color-dots">
                {COLORS.map(c => (
                  <div key={c} className={`color-dot ${form.color === c ? 'selected' : ''}`}
                    style={{ background: c }} onClick={() => setForm({ ...form, color: c })} />
                ))}
              </div>
            </div>
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Daily Target</label>
                <input type="number" className="form-input" min={1} max={100} value={form.target} onChange={e => setForm({ ...form, target: Number(e.target.value) })} />
              </div>
              <div className="form-group">
                <label className="form-label">Unit</label>
                <select className="form-select" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                  {['times','minutes','hours','glasses','pages','km','reps'].map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
            {/* Preview */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${form.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{form.icon}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{form.name || 'My Habit'}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{form.target} {form.unit} / day</div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary"><Save size={13} /> {isEdit ? 'Update' : 'Add Habit'}</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function Habits() {
  const { habits, habitLogs, logHabit, deleteHabit } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [editHabit, setEditHabit] = useState(null);
  const today = format(new Date(), 'yyyy-MM-dd');

  // Last 7 days for habit grid
  const last7 = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() });

  // Calculate streaks
  const getStreak = (habitId) => {
    let streak = 0;
    for (let i = 0; i <= 60; i++) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
      if (habitLogs[d]?.[habitId]) streak++;
      else break;
    }
    return streak;
  };

  const getCompletionRate = (habitId) => {
    const days = last7.map(d => format(d, 'yyyy-MM-dd'));
    const done = days.filter(d => habitLogs[d]?.[habitId]).length;
    return Math.round((done / 7) * 100);
  };

  const toggleToday = (habitId) => {
    const current = habitLogs[today]?.[habitId] || false;
    logHabit(habitId, today, !current);
    if (!current) toast.success('Habit logged! 🎯', { duration: 1500 });
  };

  const totalCompleted = habits.filter(h => habitLogs[today]?.[h.id]).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -0.5 }}>🎯 Habit Tracker</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Build consistency one day at a time.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditHabit(null); setShowModal(true); }}>
          <Plus size={15} /> New Habit
        </button>
      </motion.div>

      {/* Today progress */}
      {habits.length > 0 && (
        <motion.div className="card" style={{ background: 'linear-gradient(135deg, rgba(110,106,255,0.08), rgba(167,139,250,0.06))', border: '1px solid rgba(110,106,255,0.15)' }}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Today's Progress</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                {totalCompleted} of {habits.length} habits completed
              </div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: totalCompleted === habits.length ? 'var(--color-success)' : 'var(--accent-primary)' }}>
              {habits.length > 0 ? Math.round((totalCompleted / habits.length) * 100) : 0}%
            </div>
          </div>
          <div style={{ height: 6, background: 'var(--border-subtle)', borderRadius: 6, overflow: 'hidden', marginTop: 12 }}>
            <motion.div style={{ height: '100%', background: totalCompleted === habits.length ? 'var(--color-success)' : 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))', borderRadius: 6 }}
              initial={{ width: 0 }} animate={{ width: `${habits.length > 0 ? (totalCompleted / habits.length) * 100 : 0}%` }} transition={{ duration: 0.8 }} />
          </div>
        </motion.div>
      )}

      {/* Habits list */}
      {habits.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎯</div>
          <div className="empty-state-title">No habits yet</div>
          <div className="empty-state-sub">Start tracking habits like exercise, reading, hydration, sleep…</div>
          <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
            <Plus size={13} /> Add First Habit
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <AnimatePresence>
            {habits.map((habit, i) => {
              const streak = getStreak(habit.id);
              const rate = getCompletionRate(habit.id);
              const doneToday = !!(habitLogs[today]?.[habit.id]);
              return (
                <motion.div key={habit.id} className="habit-card"
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.05 }}>
                  {/* Icon */}
                  <div className="habit-icon-wrap" style={{ background: `${habit.color}18` }}>
                    <span>{habit.icon}</span>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{habit.name}</span>
                      {streak >= 3 && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-warning)', background: 'rgba(245,166,35,0.12)', padding: '1px 7px', borderRadius: 20 }}>🔥 {streak}d</span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>{habit.target} {habit.unit}/day · {rate}% this week</div>
                    {/* 7-day dots */}
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                      {last7.map((day) => {
                        const key = format(day, 'yyyy-MM-dd');
                        const done = !!(habitLogs[key]?.[habit.id]);
                        const isToday = key === today;
                        return (
                          <div key={key} className={`habit-day-dot ${done ? 'done' : ''}`}
                            style={{ background: done ? habit.color : 'transparent', border: isToday ? `2px solid ${habit.color}` : undefined, cursor: isToday ? 'pointer' : 'default', opacity: isToday ? 1 : 0.85 }}
                            onClick={() => isToday && toggleToday(habit.id)}
                            title={`${format(day, 'MMM d')}${isToday ? ' (click to toggle)' : ''}`}>
                            {done ? <Check size={12} /> : <span style={{ fontSize: 8, color: 'var(--text-muted)', fontWeight: 700 }}>{LABEL_SHORT[day.getDay()]}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Today checkbox */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <motion.div
                      whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }}
                      onClick={() => toggleToday(habit.id)}
                      style={{ width: 44, height: 44, borderRadius: 12, border: `2px solid ${doneToday ? habit.color : 'var(--border-default)'}`, background: doneToday ? `${habit.color}20` : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s', fontSize: 18 }}>
                      {doneToday ? <Check size={20} color={habit.color} /> : <span style={{ opacity: 0.3 }}>·</span>}
                    </motion.div>
                    <span style={{ fontSize: 9, color: doneToday ? 'var(--color-success)' : 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                      {doneToday ? 'Done!' : 'Today'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setEditHabit(habit); setShowModal(true); }}><Edit2 size={13} /></button>
                    <button className="btn btn-danger btn-icon btn-sm" onClick={() => { deleteHabit(habit.id); toast.success('Habit removed'); }}><Trash2 size={13} /></button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showModal && <HabitModal habit={editHabit} onClose={() => { setShowModal(false); setEditHabit(null); }} />}
      </AnimatePresence>
    </div>
  );
}
