import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, getDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Sparkles, MessageSquare, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Calendar() {
  const { 
    tasks, submittedDays, activeDate, setActiveDate, setPage, 
    waterSchedule, waterCompletions, applyRoutinesToDate, getHydrationStats, workouts,
    getWorkoutStatus, quickNotes, deleteQuickNote
  } = useStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(activeDate);
  const [editTask, setEditTask] = useState(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart); // 0=Sun

  // TEMPORAL MISSION FORESIGHT: Apply routines to all days in the current month view
  useEffect(() => {
    days.forEach(day => {
      const key = format(day, 'yyyy-MM-dd');
      applyRoutinesToDate(key);
    });
  }, [currentMonth]); // Re-run when month changes

  const prevMonth = () => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  const getCellColor = (dateKey) => {
    const dayTasks = tasks[dateKey] || [];
    if (dayTasks.length === 0) return 0;
    const pct = dayTasks.filter((t) => t.completed).length / dayTasks.length;
    return pct;
  };

  const selectedTasks = tasks[selectedDate] || [];
  const sel = new Date(selectedDate + 'T00:00:00');
  const isSelectedToday = isToday(sel);

  const formatTimeShort = (seconds) => {
    if (!seconds) return '0s';
    const m = Math.floor(seconds / 60);
    if (m >= 60) return `${Math.floor(m/60)}h ${m%60}m`;
    return `${m}m`;
  };

  return (
    <div className="calendar-layout" style={{ padding: '0 8px' }}>
      {/* Calendar panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
        {/* Month nav */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ padding: '24px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <button className="btn btn-ghost btn-icon" onClick={prevMonth}><ChevronLeft size={18} /></button>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: -0.5 }}>
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <button className="btn btn-ghost btn-icon" onClick={nextMonth}><ChevronRight size={18} /></button>
          </div>

          {/* Weekday headers */}
          <div className="calendar-grid" style={{ marginBottom: 12 }}>
            {WEEKDAYS.map((d) => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="calendar-grid">
            {Array.from({ length: startPad }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}

            {days.map((day) => {
              const key = format(day, 'yyyy-MM-dd');
              const dayTasks = tasks[key] || [];
              const pct = getCellColor(key);
              const isSelected = key === selectedDate;
              const isCurrentDay = isToday(day);
              const isSubmitted = submittedDays[key];
              const waterCount = waterSchedule.length;
              const waterDone = Object.keys(waterCompletions[key] || {}).length;

              let bg = 'var(--bg-card)';
              if (isSelected) bg = 'var(--accent-primary)';
              else if (isCurrentDay) bg = 'rgba(99,102,241,0.08)';

              return (
                <motion.div
                  key={key}
                  className={`cal-day ${isCurrentDay && !isSelected ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                  style={{ 
                    background: bg, border: isSelected ? 'none' : '1px solid var(--border-subtle)',
                    flexDirection: 'column', padding: '8px', minHeight: '64px', justifyContent: 'flex-start'
                  }}
                  whileHover={{ scale: 1.05, borderColor: 'var(--accent-primary)', zIndex: 10 }}
                  onClick={() => { setSelectedDate(key); setActiveDate(key); }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: isSelected ? 'white' : 'var(--text-primary)' }}>{format(day, 'd')}</span>
                    {isSubmitted && <div style={{ width: 6, height: 6, borderRadius: '50%', background: isSelected ? 'white' : 'var(--color-success)' }} />}
                  </div>

                  <div style={{ display: 'flex', gap: 6, width: '100%', flexWrap: 'wrap', marginTop: 'auto' }}>
                    {dayTasks.length > 0 && (
                      <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(99,102,241,0.1)', overflow: 'hidden' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(dayTasks.filter(t => t.completed).length / dayTasks.length) * 100}%` }}
                          style={{ height: '100%', background: isSelected ? 'white' : 'var(--accent-primary)' }} />
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      {Object.keys(waterCompletions[key] || {}).length > 0 && (
                        <div style={{ fontSize: 8, color: isSelected ? 'white' : '#0ea5e9', filter: isSelected ? 'brightness(2)' : 'none' }}>💧</div>
                      )}
                      {(tasks[key]?.workout || (tasks[key] && dayTasks.some(t => t.isGym))) && (
                        <div style={{ fontSize: 8, color: isSelected ? 'white' : 'var(--color-success)', filter: isSelected ? 'brightness(2)' : 'none' }}>🏋️</div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Legend */}
        <div className="card" style={{ padding: '12px 20px', display: 'flex', gap: 20, fontSize: 11, color: 'var(--text-muted)', flexWrap: 'wrap', justifyContent: 'center', background: 'rgba(255,255,255,0.02)' }}>
          {[
            { color: 'var(--accent-primary)', label: 'Today', type: 'box' },
            { color: 'var(--color-success)', label: 'Submitted', type: 'dot' },
            { color: 'var(--accent-primary)', label: 'Tasks', type: 'dot' },
            { color: '#0ea5e9', label: 'Water', type: 'dot' },
          ].map((l) => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {l.type === 'dot' ? (
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: l.color }} />
              ) : (
                <div style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(99,102,241,0.1)', border: `1px solid ${l.color}` }} />
              )}
              <span style={{ fontWeight: 600 }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Day detail panel */}
      <motion.div
        className="calendar-detail-panel"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: -0.5 }}>
                {isToday(sel) ? 'Today' : format(sel, 'EEEE')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{format(sel, 'MMMM d, yyyy')}</div>
            </div>
            {isSelectedToday && !submittedDays[selectedDate] && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => { setEditTask(null); setShowModal(true); }}
                style={{ borderRadius: 10, padding: '8px 14px' }}
              >
                <Plus size={14} /> Task
              </button>
            )}
          </div>

          {/* Detailed Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            <div style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Focus Time</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--accent-primary)' }}>
                {formatTimeShort(selectedTasks.reduce((acc, t) => acc + (t.timeTaken || 0), 0))}
              </div>
            </div>
            <div style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Hydration</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#0ea5e9' }}>
                {(() => {
                   const { completed, goal } = getHydrationStats(selectedDate);
                   return `${completed}/${goal}`;
                })()}
              </div>
            </div>
            <div style={{ gridColumn: 'span 2', padding: '12px', background: 'var(--bg-elevated)', borderRadius: 14, border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 12 }}>
               <div style={{ padding: 8, background: 'rgba(34,197,94,0.1)', borderRadius: 10, color: 'var(--color-success)' }}>🏋️</div>
               <div>
                  <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Workout Status</div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--text-primary)' }}>
                    {getWorkoutStatus(selectedDate)}
                  </div>
               </div>
            </div>
          </div>

          {/* Neural Scratchpad */}
          {(quickNotes[selectedDate] || []).length > 0 && (
            <div style={{ marginBottom: 20 }}>
               <div style={{ fontSize: 9, fontWeight: 900, color: 'var(--accent-primary)', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={10} /> Neural Scratchpad
               </div>
               <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {quickNotes[selectedDate].map((note) => (
                    <div key={note.id} style={{ padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-subtle)', position: 'relative' }}>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4, paddingRight: 20 }}>{note.text}</div>
                      <button 
                        onClick={() => deleteQuickNote(selectedDate, note.id)}
                        style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* Tasks List */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, margin: '0 -4px', padding: '0 4px' }}>
            <AnimatePresence>
              {selectedTasks.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <TaskCard 
                    task={task} 
                    date={selectedDate} 
                    onEdit={(t) => { setEditTask(t); setShowModal(true); }} 
                    isReadOnly={!isSelectedToday || submittedDays[selectedDate]}
                    compact={true}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            {selectedTasks.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>No tasks recorded</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Planning is the first step to victory.</div>
              </div>
            )}
          </div>

          <button
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 20, width: '100%', borderRadius: 12, fontWeight: 800, padding: '10px' }}
            onClick={() => { setActiveDate(selectedDate); setPage('today'); }}
          >
            OPEN FULL VIEW →
          </button>
        </div>
      </motion.div>

      <TaskModal isOpen={showModal} onClose={() => { setShowModal(false); setEditTask(null); }} task={editTask} date={selectedDate} />
    </div>
  );
}
