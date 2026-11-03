import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Edit2, X, Save, Check, Archive, 
  RotateCcw, Sparkles, Filter, Calendar, Activity, 
  TrendingUp, Award, Clock
} from 'lucide-react';
import { format, subDays, eachDayOfInterval, getDay } from 'date-fns';
import toast from 'react-hot-toast';

const COLORS = ['#6e6aff', '#a78bfa', '#10d98e', '#38bdf8', '#f5a623', '#ff5e72', '#f472b6', '#34d399'];
const ICONS = ['⭐', '💧', '🏃', '📖', '🧘', '🎯', '💪', '🍎', '😴', '✍️', '🎵', '🧹', '💊', '🌿', '🔥', '🏊', '💻', '☀️'];
const CATEGORIES = ['All', 'Health', 'Fitness', 'Productivity', 'Learning', 'Mindset', 'Personal'];
const LABEL_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function HabitModal({ habit, onClose }) {
  const { addHabit, updateHabit } = useStore();
  const isEdit = Boolean(habit);
  
  const [form, setForm] = useState({
    name: habit?.name || '',
    icon: habit?.icon || '⭐',
    color: habit?.color || '#6e6aff',
    category: habit?.category || 'Health',
    target: habit?.target || 1,
    unit: habit?.unit || 'times',
    frequency: habit?.frequency || 'daily',
    scheduledDays: habit?.scheduledDays || [0, 1, 2, 3, 4, 5, 6],
    reminderTime: habit?.reminderTime || '',
    notes: habit?.notes || '',
  });

  const handleToggleDay = (dayIndex) => {
    const current = [...form.scheduledDays];
    if (current.includes(dayIndex)) {
      if (current.length === 1) {
        toast.error('At least one day must be scheduled');
        return;
      }
      setForm({ ...form, scheduledDays: current.filter(d => d !== dayIndex), frequency: 'custom' });
    } else {
      setForm({ ...form, scheduledDays: [...current, dayIndex].sort(), frequency: 'custom' });
    }
  };

  const setPresetFrequency = (type) => {
    if (type === 'daily') {
      setForm({ ...form, frequency: 'daily', scheduledDays: [0, 1, 2, 3, 4, 5, 6] });
    } else if (type === 'weekdays') {
      setForm({ ...form, frequency: 'weekdays', scheduledDays: [1, 2, 3, 4, 5] });
    } else if (type === 'weekends') {
      setForm({ ...form, frequency: 'weekends', scheduledDays: [0, 6] });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Habit title is required'); return; }
    if (isEdit) {
      updateHabit(habit.id, form);
      toast.success('Habit updated!');
    } else {
      addHabit(form);
      toast.success('Habit initialized! Track consistency daily 🎯');
    }
    onClose();
  };

  return (
    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div className="modal" initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.93, y: 20 }}
        style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit Habit' : 'New Habit'}</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Habit Title */}
            <div className="form-group">
              <label className="form-label">Habit Name *</label>
              <input autoFocus className="form-input" placeholder="e.g. Morning 20m Walk, Read 15 pages…" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>

            {/* Category */}
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Icon Picker */}
            <div className="form-group">
              <label className="form-label">Icon</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxHeight: 90, overflowY: 'auto', padding: 2 }}>
                {ICONS.map(ic => (
                  <button key={ic} type="button" onClick={() => setForm({ ...form, icon: ic })}
                    style={{ 
                      width: 36, height: 36, borderRadius: 8, 
                      border: `2px solid ${form.icon === ic ? form.color : 'var(--border-default)'}`, 
                      background: form.icon === ic ? `${form.color}20` : 'transparent', 
                      fontSize: 18, cursor: 'pointer', transition: 'all 0.15s' 
                    }}>
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selector */}
            <div className="form-group">
              <label className="form-label">Theme Color</label>
              <div className="color-dots" style={{ display: 'flex', gap: 8 }}>
                {COLORS.map(c => (
                  <div key={c} className={`color-dot ${form.color === c ? 'selected' : ''}`}
                    style={{ background: c, width: 24, height: 24, borderRadius: '50%', cursor: 'pointer', border: form.color === c ? '2px solid white' : 'none' }} 
                    onClick={() => setForm({ ...form, color: c })} />
                ))}
              </div>
            </div>

            {/* Target and Unit */}
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Daily Target</label>
                <input type="number" className="form-input" min={1} max={1000} value={form.target} onChange={e => setForm({ ...form, target: Number(e.target.value) })} />
              </div>
              <div className="form-group">
                <label className="form-label">Unit</label>
                <select className="form-select" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                  {['times', 'minutes', 'hours', 'glasses', 'pages', 'km', 'steps', 'reps'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            {/* Schedule Days */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label className="form-label" style={{ margin: 0 }}>Schedule Days</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" className="btn btn-ghost btn-xs" onClick={() => setPresetFrequency('daily')}>Everyday</button>
                  <button type="button" className="btn btn-ghost btn-xs" onClick={() => setPresetFrequency('weekdays')}>Weekdays</button>
                  <button type="button" className="btn btn-ghost btn-xs" onClick={() => setPresetFrequency('weekends')}>Weekends</button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {LABEL_SHORT.map((lbl, idx) => {
                  const isScheduled = form.scheduledDays.includes(idx);
                  return (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => handleToggleDay(idx)}
                      style={{
                        flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 11, fontWeight: 700,
                        border: `1.5px solid ${isScheduled ? form.color : 'var(--border-default)'}`,
                        background: isScheduled ? `${form.color}25` : 'transparent',
                        color: isScheduled ? 'var(--text-primary)' : 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      {lbl}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div className="form-group">
              <label className="form-label">Why this habit matters (Motivation / Rule)</label>
              <input className="form-input" placeholder="e.g. Essential for morning focus and hydration." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>

            {/* Live Preview */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${form.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{form.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{form.name || 'My Habit'}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{form.target} {form.unit} · {form.category} · {form.scheduledDays.length} days/wk</div>
              </div>
            </div>
          </div>

          <div className="modal-footer" style={{ marginTop: 12 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary"><Save size={13} /> {isEdit ? 'Save Changes' : 'Create Habit'}</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function Habits() {
  const { habits = [], habitLogs = {}, logHabit, deleteHabit, toggleArchiveHabit } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [editHabit, setEditHabit] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showArchived, setShowArchived] = useState(false);
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayDow = new Date().getDay();

  // Last 7 days for habit matrix
  const last7 = useMemo(() => {
    return eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() });
  }, []);

  // Filtered habits list
  const activeHabits = useMemo(() => {
    return habits.filter(h => {
      if (h.archived !== showArchived) return false;
      if (selectedCategory !== 'All' && h.category !== selectedCategory) return false;
      return true;
    });
  }, [habits, showArchived, selectedCategory]);

  // Calculate streaks with scheduled day logic
  const getStreak = (habit) => {
    let streak = 0;
    const schedDays = habit.scheduledDays || [0, 1, 2, 3, 4, 5, 6];
    for (let i = 0; i <= 60; i++) {
      const d = subDays(new Date(), i);
      const dateKey = format(d, 'yyyy-MM-dd');
      const dow = d.getDay();
      
      const isScheduled = schedDays.includes(dow);
      const isCompleted = Boolean(habitLogs[dateKey]?.[habit.id]);

      if (isCompleted) {
        streak++;
      } else if (isScheduled) {
        // If today is scheduled and not yet done, don't break streak from yesterday
        if (i === 0) continue;
        break;
      }
    }
    return streak;
  };

  // Weekly completion rate for this habit
  const getCompletionRate = (habit) => {
    const schedDays = habit.scheduledDays || [0, 1, 2, 3, 4, 5, 6];
    let scheduledCount = 0;
    let completedCount = 0;
    
    last7.forEach(d => {
      const dateKey = format(d, 'yyyy-MM-dd');
      const dow = d.getDay();
      if (schedDays.includes(dow)) {
        scheduledCount++;
        if (habitLogs[dateKey]?.[habit.id]) completedCount++;
      }
    });

    if (scheduledCount === 0) return 100;
    return Math.round((completedCount / scheduledCount) * 100);
  };

  const toggleToday = (habitId) => {
    const current = Boolean(habitLogs[today]?.[habitId]);
    logHabit(habitId, today, !current);
    if (!current) {
      toast.success('Habit completed! +15 XP 🎯', { icon: '⚡' });
    } else {
      toast('Habit reopened', { icon: '↩️' });
    }
  };

  // Scheduled for today count & completed today count
  const todayScheduledHabits = useMemo(() => {
    return habits.filter(h => !h.archived && (h.scheduledDays || [0, 1, 2, 3, 4, 5, 6]).includes(todayDow));
  }, [habits, todayDow]);

  const totalCompletedToday = useMemo(() => {
    return todayScheduledHabits.filter(h => habitLogs[today]?.[h.id]).length;
  }, [todayScheduledHabits, habitLogs, today]);

  const todayProgressPct = todayScheduledHabits.length > 0 
    ? Math.round((totalCompletedToday / todayScheduledHabits.length) * 100) 
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -0.5 }}>🎯 Habit Tracker</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Systematic habit execution. Earn +15 XP per habit completed daily.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button 
            className="btn btn-ghost btn-sm"
            onClick={() => setShowArchived(!showArchived)}
            style={{ color: showArchived ? 'var(--accent-primary)' : 'var(--text-muted)' }}
          >
            <Archive size={14} /> {showArchived ? 'Show Active' : 'Archived'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => { setEditHabit(null); setShowModal(true); }}>
            <Plus size={15} /> New Habit
          </button>
        </div>
      </motion.div>

      {/* Overview Metric Cards */}
      <div className="grid-3" style={{ gap: 12 }}>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>TODAY'S EXECUTION</span>
            <span style={{ fontSize: 18 }}>⚡</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', marginTop: 6 }}>
            {totalCompletedToday} / {todayScheduledHabits.length}
          </div>
          <div style={{ height: 6, background: 'var(--border-subtle)', borderRadius: 3, marginTop: 10, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${todayProgressPct}%`, background: todayProgressPct === 100 ? 'var(--color-success)' : 'var(--accent-primary)', transition: 'width 0.4s ease' }} />
          </div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>COMPLETION RATE</span>
            <span style={{ fontSize: 18 }}>🎯</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: todayProgressPct === 100 ? 'var(--color-success)' : 'var(--accent-primary)', marginTop: 6 }}>
            {todayProgressPct}%
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
            {todayProgressPct === 100 ? 'All scheduled habits executed!' : `${todayScheduledHabits.length - totalCompletedToday} remaining for today`}
          </div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>ACTIVE REPERTOIRE</span>
            <span style={{ fontSize: 18 }}>🛡️</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', marginTop: 6 }}>
            {habits.filter(h => !h.archived).length} Habits
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
            Across {new Set(habits.map(h => h.category)).size} life domains
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className="btn btn-ghost btn-xs"
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              border: selectedCategory === cat ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
              background: selectedCategory === cat ? 'rgba(99,102,241,0.15)' : 'var(--bg-card)',
              color: selectedCategory === cat ? 'var(--accent-primary)' : 'var(--text-muted)'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Habits List */}
      {activeHabits.length === 0 ? (
        <div className="empty-state" style={{ padding: '48px 20px', textAlign: 'center', background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
            {showArchived ? 'No archived habits' : 'No habits found in this category'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 360, margin: '8px auto 20px' }}>
            {showArchived ? 'Active habits can be archived to keep your daily focus clean.' : 'Build daily consistency. Start with small, non-negotiable habits.'}
          </div>
          {!showArchived && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
              <Plus size={14} /> Add First Habit
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <AnimatePresence>
            {activeHabits.map((habit, i) => {
              const streak = getStreak(habit);
              const weeklyRate = getCompletionRate(habit);
              const isScheduledToday = (habit.scheduledDays || [0, 1, 2, 3, 4, 5, 6]).includes(todayDow);
              const doneToday = Boolean(habitLogs[today]?.[habit.id]);

              return (
                <motion.div
                  key={habit.id}
                  className="card"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.04 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '16px 20px',
                    borderLeft: `4px solid ${habit.color || 'var(--accent-primary)'}`,
                    background: 'var(--bg-card)',
                    opacity: habit.archived ? 0.65 : 1
                  }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: `${habit.color}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22, flexShrink: 0
                    }}
                  >
                    {habit.icon || '⭐'}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>{habit.name}</span>
                      {streak >= 3 && (
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', padding: '2px 8px', borderRadius: 12 }}>
                          🔥 {streak}d Streak
                        </span>
                      )}
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 8 }}>
                        {habit.category || 'General'}
                      </span>
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, marginBottom: 10 }}>
                      Target: {habit.target} {habit.unit} · {weeklyRate}% consistency this week
                      {habit.notes ? ` · "${habit.notes}"` : ''}
                    </div>

                    {/* 7-day mini matrix */}
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      {last7.map((day) => {
                        const dateKey = format(day, 'yyyy-MM-dd');
                        const isDayScheduled = (habit.scheduledDays || [0, 1, 2, 3, 4, 5, 6]).includes(day.getDay());
                        const isDayDone = Boolean(habitLogs[dateKey]?.[habit.id]);
                        const isCurrentDay = dateKey === today;

                        return (
                          <div
                            key={dateKey}
                            onClick={() => {
                              logHabit(habit.id, dateKey, !isDayDone);
                              toast.success(isDayDone ? 'Habit reopened' : 'Habit marked done');
                            }}
                            title={`${format(day, 'EEE, MMM d')}: ${isDayDone ? 'Completed' : (isDayScheduled ? 'Missed' : 'Rest day')}`}
                            style={{
                              width: 26, height: 26, borderRadius: 6,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer',
                              border: isCurrentDay ? `2px solid ${habit.color}` : '1px solid var(--border-subtle)',
                              background: isDayDone ? habit.color : (isDayScheduled ? 'var(--bg-elevated)' : 'transparent'),
                              color: isDayDone ? 'white' : 'var(--text-muted)',
                              fontSize: 10, fontWeight: 800,
                              opacity: isDayScheduled || isDayDone ? 1 : 0.4
                            }}
                          >
                            {isDayDone ? <Check size={13} strokeWidth={3} /> : LABEL_SHORT[day.getDay()]}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Today check-off trigger */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => toggleToday(habit.id)}
                      style={{
                        width: 48, height: 48, borderRadius: 14,
                        border: `2px solid ${doneToday ? habit.color : 'var(--border-default)'}`,
                        background: doneToday ? `${habit.color}25` : 'var(--bg-elevated)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'all 0.2s ease',
                        boxShadow: doneToday ? `0 0 15px ${habit.color}35` : 'none'
                      }}
                    >
                      {doneToday ? (
                        <Check size={22} color={habit.color} strokeWidth={3} />
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 800, color: isScheduledToday ? 'var(--text-muted)' : 'var(--text-muted)', opacity: isScheduledToday ? 0.7 : 0.3 }}>
                          {isScheduledToday ? 'DO' : 'OFF'}
                        </span>
                      )}
                    </motion.button>
                    <span style={{ fontSize: 9, fontWeight: 800, color: doneToday ? 'var(--color-success)' : 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {doneToday ? 'DONE!' : (isScheduledToday ? 'TODAY' : 'REST')}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                    <button className="btn btn-ghost btn-icon btn-sm" title="Edit habit" onClick={() => { setEditHabit(habit); setShowModal(true); }}>
                      <Edit2 size={13} />
                    </button>
                    <button className="btn btn-ghost btn-icon btn-sm" title={habit.archived ? 'Unarchive' : 'Archive'} onClick={() => toggleArchiveHabit(habit.id)}>
                      <Archive size={13} />
                    </button>
                    <button className="btn btn-ghost btn-icon btn-sm" title="Delete habit" onClick={() => {
                      if (window.confirm(`Delete habit "${habit.name}"?`)) {
                        deleteHabit(habit.id);
                        toast.success('Habit deleted');
                      }
                    }}>
                      <Trash2 size={13} color="var(--color-danger)" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Edit / New Modal */}
      <AnimatePresence>
        {showModal && <HabitModal habit={editHabit} onClose={() => { setShowModal(false); setEditHabit(null); }} />}
      </AnimatePresence>
    </div>
  );
}
