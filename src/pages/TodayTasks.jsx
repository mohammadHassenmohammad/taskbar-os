import { useState, useEffect } from 'react';
import { Plus, Send, Unlock, ChevronLeft, ChevronRight, Repeat, Info, Trash2, Edit2, Check, RotateCcw, Zap, Target, Sparkles } from 'lucide-react';
import { useStore } from '../store/useStore';
import { format, addDays, subDays, isToday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import toast from 'react-hot-toast';

const formatTime = (seconds) => {
  if (!seconds) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

function SidePanel({ date, tasks, pct, activeTimer, isSubmitted }) {
  const { routines, waterSchedule, waterCompletions, toggleWaterScheduleItem, addWaterScheduleItem, removeWaterScheduleItem } = useStore();
  const [showAddWater, setShowAddWater] = useState(false);
  const [newTime, setNewTime] = useState('10:00 AM');
  const [newAmt, setNewAmt] = useState('250ml');

  const enabledRoutines = routines.filter(r => r.enabled);
  const sched = waterSchedule || [];
  const completions = waterCompletions[date] || {};

  const handleAdd = () => {
    addWaterScheduleItem({ time: newTime, amount: newAmt });
    setShowAddWater(false);
    toast.success('Water mission added');
  };

  const totalFocusTime = tasks.reduce((acc, t) => acc + (t.timeTaken || 0), 0);
  const totalEstimated = tasks.reduce((acc, t) => acc + (t.estimatedTime || 0), 0) * 60; // Convert to seconds

  const catMap = tasks.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="today-side" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Intelligence Panel */}
      <motion.div className="card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
        style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(99,102,241,0.02) 100%)', border: '1.5px solid rgba(99,102,241,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ padding: 8, borderRadius: 10, background: 'rgba(99,102,241,0.1)', color: 'var(--accent-primary)' }}>
            <Zap size={18} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-primary)' }}>Focus Intelligence</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>Real-time performance</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ padding: '12px', borderRadius: 14, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Focus Time</div>
              {totalEstimated > 0 && (
                <div style={{ fontSize: 9, fontWeight: 800, color: totalFocusTime > totalEstimated ? 'var(--color-danger)' : 'var(--color-success)' }}>
                  {Math.round((totalFocusTime / totalEstimated) * 100)}% of Est.
                </div>
              )}
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)' }}>
              {formatTime(totalFocusTime)}
              {totalEstimated > 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>/ {formatTime(totalEstimated)}</span>}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ padding: '10px', borderRadius: 14, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Velocity</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--accent-primary)' }}>{Math.round(pct * 1.1)}%</div>
            </div>
            <div style={{ padding: '10px', borderRadius: 14, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Tasks</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--color-success)' }}>{tasks.filter(t => t.completed).length}/{tasks.length}</div>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        {tasks.length > 0 && (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Category Cluster</div>
            <div style={{ display: 'flex', gap: 4, height: 6, borderRadius: 3, overflow: 'hidden', background: 'var(--bg-elevated)' }}>
              {Object.entries(catMap).map(([cat, count]) => (
                <div 
                  key={cat} 
                  style={{ 
                    width: `${(count / tasks.length) * 100}%`, 
                    background: `var(--tag-${cat.toLowerCase()}, var(--accent-primary))`,
                    height: '100%'
                  }} 
                  title={`${cat}: ${count} missions`}
                />
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Smart Hydration */}
      <motion.div className="card" style={{ padding: '16px 18px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ padding: 8, background: 'rgba(99,102,241, 0.1)', borderRadius: 10 }}>
              <span style={{ fontSize: 18 }}>💧</span>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--text-primary)' }}>Hydration Schedule</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Daily Mission</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowAddWater(!showAddWater)}>
            <Plus size={14} />
          </button>
        </div>

        {showAddWater && (
          <motion.div style={{ marginBottom: 16, display: 'flex', gap: 8, background: 'var(--bg-elevated)', padding: 10, borderRadius: 10 }} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <input type="text" className="form-input" style={{ fontSize: 11, padding: '4px 8px' }} value={newTime} onChange={e => setNewTime(e.target.value)} placeholder="Time" />
            <input type="text" className="form-input" style={{ fontSize: 11, padding: '4px 8px' }} value={newAmt} onChange={e => setNewAmt(e.target.value)} placeholder="Amt" />
            <button className="btn btn-primary btn-sm" onClick={handleAdd}><Plus size={12}/></button>
          </motion.div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sched.map(item => {
            const isDone = completions[item.id];
            const isTodayDate = isToday(new Date(date + 'T12:00:00'));
            
            const handleToggle = () => {
              if (isSubmitted) return toast.error('This day is submitted and locked! 🔒');
              if (!isTodayDate) return toast.error('You can only hydrate in the present! 💧');
              toggleWaterScheduleItem(date, item.id);
            };

            return (
              <div key={item.id} 
                style={{ 
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', 
                  background: isDone ? 'rgba(99,102,241, 0.08)' : 'var(--bg-elevated)', 
                  borderRadius: 'var(--radius-lg)', 
                  cursor: (isTodayDate && !isSubmitted && !isDone) ? 'pointer' : 'default',
                  opacity: (isTodayDate && !isSubmitted) ? 1 : 0.6,
                  border: isDone ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  transition: 'all 0.2s'
                }}
              >
                <div onClick={handleToggle} style={{ 
                  width: 18, height: 18, borderRadius: 5, 
                  background: isDone ? 'var(--accent-primary)' : 'transparent',
                  border: `2px solid ${isDone ? 'var(--accent-primary)' : 'var(--border-strong)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {isDone && <span style={{ color: 'white', fontSize: 10 }}>✓</span>}
                </div>
                <div style={{ flex: 1 }} onClick={handleToggle}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: isDone ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{item.time}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>{item.amount}</div>
                </div>
                <button className="btn btn-ghost btn-icon btn-sm" style={{ opacity: 0.4 }} onClick={(e) => { e.stopPropagation(); removeWaterScheduleItem(item.id); }}>
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
          {sched.length === 0 && !showAddWater && (
            <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 11, color: 'var(--text-muted)', border: '1px dashed var(--border-subtle)', borderRadius: 10 }}>
              No hydration missions set.<br/>Click + to add your first one!
            </div>
          )}
        </div>
      </motion.div>

      {/* Routines indicator */}
      {enabledRoutines.length > 0 && (
        <motion.div className="card" style={{ padding: '12px 16px' }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Repeat size={13} color="var(--accent-primary)" />
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-primary)' }}>Routines Applied</div>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>
            {enabledRoutines.length} protocol(s) initializing daily...
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function TodayTasks() {
  const { 
    activeDate, setActiveDate, getTasksForDate, submittedDays, reorderTasks, 
    submitDay, unlockDay, applyRoutinesToDate, resetDayTasks, activeTimer,
    postponeTask, journal, updateMissionLog, addMissionNote, editMissionNote, deleteMissionNote, missionNotes,
    quickNotes, addQuickNote, deleteQuickNote, dailyFocus, setDailyFocus,
    focusMode, toggleFocusMode 
  } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [filter, setFilter] = useState('All');
  const [logInput, setLogInput] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => { applyRoutinesToDate(activeDate); }, [activeDate]);

  const tasks = getTasksForDate(activeDate);
  const isSubmitted = submittedDays[activeDate];
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const filtered = tasks.filter(t => filter === 'Pending' ? !t.completed : filter === 'Done' ? t.completed : true);
  const routineTaskCount = tasks.filter(t => t.isRoutine).length;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor));

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const ids = tasks.map(t => t.id);
    const oi = ids.indexOf(active.id), ni = ids.indexOf(over.id);
    const neo = [...ids]; neo.splice(oi, 1); neo.splice(ni, 0, active.id);
    reorderTasks(activeDate, neo);
  };

  const handleAddNote = () => {
    if (!logInput.trim()) return;
    addMissionNote(activeDate, logInput);
    setLogInput('');
    toast.success('Mission debrief recorded 🧠');
  };

  const dateLabel = isToday(new Date(activeDate + 'T00:00:00')) ? 'Today' : format(new Date(activeDate + 'T00:00:00'), 'EEEE, MMM d');

  return (
    <div className="today-layout">
      <div className="today-main" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Header Section with Discipline Grade */}
        <motion.div 
          className="card" 
          style={{ 
            padding: '16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
            justifyContent: 'space-between'
          }} 
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setActiveDate(format(subDays(new Date(activeDate + 'T12:00:00'), 1), 'yyyy-MM-dd'))}><ChevronLeft size={16} /></button>
            <div style={{ textAlign: 'center', minWidth: 100 }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: -0.5 }}>{dateLabel}</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600 }}>{format(new Date(activeDate + 'T12:00:00'), 'MMM d, yyyy')}</div>
            </div>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setActiveDate(format(addDays(new Date(activeDate + 'T12:00:00'), 1), 'yyyy-MM-dd'))}><ChevronRight size={16} /></button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 1, height: 24, background: 'var(--border-subtle)', display: window.innerWidth > 480 ? 'block' : 'none' }} />
            
            {/* Discipline Grade Badge */}
            <div style={{ 
              padding: '4px 10px', background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border-subtle)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 50
            }}>
              <div style={{ fontSize: 7, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>DISCIPLINE</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--accent-primary)' }}>
                 {(() => {
                   const t = getTasksForDate(activeDate);
                   if (t.length === 0) return '-';
                   const pctGrade = (t.filter(x => x.completed).length / t.length) * 100;
                   if (pctGrade >= 90) return 'S';
                   if (pctGrade >= 75) return 'A';
                   if (pctGrade >= 50) return 'B';
                   return 'C';
                 })()}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, width: window.innerWidth <= 480 ? '100%' : 'auto', justifyContent: 'center', marginTop: window.innerWidth <= 480 ? 8 : 0 }}>
            <button 
              className={`btn ${focusMode ? 'btn-primary' : 'btn-ghost'} btn-sm`} 
              onClick={toggleFocusMode}
              style={{ fontWeight: 800 }}
            >
              <Zap size={14} style={{ marginRight: 4 }} /> {focusMode ? 'FOCUS ON' : 'FOCUS'}
            </button>
            <button className="btn btn-ghost btn-sm" style={{ flex: window.innerWidth <= 480 ? 1 : 'none' }} onClick={() => setActiveDate(format(new Date(), 'yyyy-MM-dd'))}>Today</button>
            {isToday(new Date(activeDate + 'T12:00:00')) && (
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)', fontWeight: 800, flex: window.innerWidth <= 480 ? 1 : 'none' }} onClick={() => {
                if (window.confirm('Reset all tasks and timers for today?')) resetDayTasks(activeDate);
              }}><RotateCcw size={14} style={{ marginRight: 4 }}/> Reset</button>
            )}
          </div>
        </motion.div>

        {/* Neural Objective / Main Mission */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ padding: 16, background: 'rgba(var(--accent-primary-rgb), 0.05)', borderRadius: 16, border: '1.5px dashed rgba(var(--accent-primary-rgb), 0.2)' }}
        >
           <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Target size={14} color="var(--accent-primary)" />
              <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: 1 }}>Main Objective</span>
           </div>
           <input 
              type="text" 
              placeholder="DEFINE THE DAY'S PRIMARY SUCCESS CRITERIA..."
              value={dailyFocus[activeDate] || ''}
              onChange={(e) => setDailyFocus(activeDate, e.target.value)}
              style={{ 
                width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', 
                borderRadius: 12, padding: '12px 18px', fontSize: 15, fontWeight: 800, color: 'var(--accent-primary)',
                outline: 'none'
              }}
           />
        </motion.div>

        {/* Routine banner */}
        {routineTaskCount > 0 && (
          <motion.div className="routine-banner" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Repeat size={14} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
            <span><strong>{routineTaskCount} routine task{routineTaskCount > 1 ? 's' : ''}</strong> active for today.</span>
          </motion.div>
        )}

        {/* Progress + filters */}
        <motion.div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
          <div className="card" style={{ flex: 1, padding: '12px 16px', minWidth: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{completed}/{total} tasks · {pct}%</span>
              {isSubmitted && <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(16,217,142,0.12)', color: 'var(--color-success)', padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase' }}>✓ Submitted</span>}
            </div>
            <div style={{ height: 5, background: 'var(--border-subtle)', borderRadius: 5, overflow: 'hidden' }}>
              <motion.div style={{ height: '100%', borderRadius: 5, background: pct === 100 ? 'var(--color-success)' : 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))' }}
                initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
            </div>
          </div>
          <div className="tab-bar" style={{ flexShrink: 0 }}>
            {['All', 'Pending', 'Done'].map(f => (
              <button key={f} className={`tab-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>
        </motion.div>

        {/* Task list */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filtered.map(t => t.id)} strategy={verticalListSortingStrategy}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <AnimatePresence>
                {filtered
                  .filter(t => !focusMode || (activeTimer?.id === t.id))
                  .map((task, i) => (
                  <motion.div key={task.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ delay: i * 0.04 }}>
                    <TaskCard task={task} date={activeDate} onEdit={t => { setEditTask(t); setShowModal(true); }} isReadOnly={isSubmitted} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </SortableContext>
        </DndContext>

        {focusMode && !activeTimer && (
          <div className="empty-state" style={{ padding: '60px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🎯</div>
            <div className="empty-state-title">No Active Mission</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>Start a timer on a task to enter Focus Mode.</div>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 20 }} onClick={toggleFocusMode}>Disable Focus Mode</button>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">{filter !== 'All' ? `No ${filter.toLowerCase()} tasks` : 'No tasks yet'}</div>
          </div>
        )}

        {/* Actions */}
        <motion.div 
          style={{ 
            display: 'flex', gap: 10, paddingBottom: 80, 
            flexDirection: window.innerWidth <= 480 ? 'column' : 'row' 
          }} 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        >
          {!isSubmitted && isToday(new Date(activeDate + 'T00:00:00')) && (
            <button className="btn btn-primary" style={{ flex: 1, height: 48 }} onClick={() => { setEditTask(null); setShowModal(true); }}>
              <Plus size={16} /> Add Task
            </button>
          )}
          {!isSubmitted && total > 0 && isToday(new Date(activeDate + 'T12:00:00')) && (
            <button className="btn btn-ghost" style={{ height: 48 }} onClick={() => { submitDay(activeDate); toast.success(`Day submitted! Score: ${pct}% 🎉`); }}>
              <Send size={14} /> Submit Day
            </button>
          )}
          {(isSubmitted || !isToday(new Date(activeDate + 'T00:00:00'))) && (
            <div style={{ flex: 1, padding: '12px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
              {isSubmitted ? 'MISSION SUBMITTED & LOCKED' : 'TEMPORAL READ-ONLY MODE'}
            </div>
          )}
          {isSubmitted && isToday(new Date(activeDate + 'T12:00:00')) && (
            <button className="btn btn-ghost" style={{ color: 'var(--color-warning)', height: 48 }} onClick={() => { unlockDay(activeDate); toast('Edit mode unlocked', { icon: '🔓' }); }}>
              <Unlock size={14} /> Unlock Edit
            </button>
          )}
        </motion.div>

        {/* Mission Debrief Section */}
        <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          style={{ padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', marginBottom: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Info size={18} color="var(--accent-primary)" />
              <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)' }}>Mission Debrief</div>
            </div>
            {!isSubmitted && (
              <button className="btn btn-primary btn-sm" onClick={handleAddNote} disabled={!logInput.trim()} style={{ borderRadius: 10 }}>
                <Send size={12} /> Submit Log
              </button>
            )}
          </div>
          
          {!isSubmitted && (
            <textarea
              className="form-input"
              placeholder="Document breakthroughs, roadblocks, or reflections..."
              style={{ width: '100%', minHeight: 100, fontSize: 14, lineHeight: 1.6, padding: 16, borderRadius: 16, background: 'var(--bg-elevated)', border: '1.5px solid var(--border-subtle)', resize: 'vertical', marginBottom: 20 }}
              value={logInput}
              onChange={(e) => setLogInput(e.target.value)}
            />
          )}

          {/* Debrief History Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
              Neural Timeline
            </div>
            <AnimatePresence>
              {(missionNotes?.[activeDate] || []).map((note, i) => {
                const isEditing = editingNoteId === note.id;
                return (
                  <motion.div key={note.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} 
                    style={{ position: 'relative', paddingLeft: 16, borderLeft: '2px solid var(--accent-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent-primary)', marginBottom: 4 }}>
                        {format(new Date(note.timestamp), 'hh:mm a')}
                      </div>
                      {isEditing ? (
                        <textarea 
                          autoFocus
                          className="form-input" 
                          style={{ width: '100%', minHeight: 60, fontSize: 13, background: 'var(--bg-elevated)', padding: 8, borderRadius: 8 }}
                          value={editValue} 
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={() => {
                            if (editValue.trim()) editMissionNote(activeDate, note.id, editValue);
                            setEditingNoteId(null);
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              if (editValue.trim()) editMissionNote(activeDate, note.id, editValue);
                              setEditingNoteId(null);
                            }
                          }}
                        />
                      ) : (
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          {note.text}
                        </div>
                      )}
                    </div>
                    {!isSubmitted && (
                      <div style={{ display: 'flex', gap: 4, marginLeft: 10 }}>
                         <button className="btn btn-ghost btn-icon btn-sm" onClick={() => {
                           if (isEditing) {
                              if (editValue.trim()) editMissionNote(activeDate, note.id, editValue);
                              setEditingNoteId(null);
                           } else {
                              setEditingNoteId(note.id);
                              setEditValue(note.text);
                           }
                         }}>
                            {isEditing ? <Check size={12} /> : <Edit2 size={12} />}
                         </button>
                         <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => {
                           deleteMissionNote(activeDate, note.id);
                         }}><Trash2 size={12} /></button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {(!missionNotes[activeDate] || missionNotes[activeDate].length === 0) && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                No debriefs recorded yet for this session.
              </div>
            )}
          </div>

          {/* Neural Scratchpad Integration */}
          <div style={{ marginTop: 32, padding: 24, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ padding: 10, borderRadius: 12, background: 'rgba(var(--accent-primary-rgb), 0.1)', color: 'var(--accent-primary)' }}>
                   <Sparkles size={18} />
                </div>
                <div>
                   <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: 1 }}>Neural Scratchpad</div>
                   <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Capture tactical thoughts for this date</div>
                </div>
             </div>

             <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
                <input 
                  type="text" 
                  placeholder="NEW TACTICAL NOTE..."
                  className="form-input"
                  id="scratch-input"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      addQuickNote(activeDate, e.target.value.trim());
                      e.target.value = '';
                    }
                  }}
                  style={{ flex: 1, height: 48, borderRadius: 14, fontSize: 14, fontWeight: 700 }}
                />
                <button className="btn btn-primary btn-icon" onClick={() => {
                  const el = document.getElementById('scratch-input');
                  if (el.value.trim()) {
                    addQuickNote(activeDate, el.value.trim());
                    el.value = '';
                  }
                }}>
                  <Plus size={20} />
                </button>
             </div>

             <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <AnimatePresence>
                  {(quickNotes[activeDate] || []).map((note) => (
                    <motion.div 
                      key={note.id}
                      initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                      style={{ padding: 16, background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 9, fontWeight: 900, color: 'var(--accent-primary)', textTransform: 'uppercase', marginBottom: 4 }}>
                          {format(new Date(note.timestamp), 'HH:mm')}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{note.text}</div>
                      </div>
                      <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => deleteQuickNote(activeDate, note.id)}>
                        <Trash2 size={14} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {(!quickNotes[activeDate] || quickNotes[activeDate].length === 0) && (
                  <div style={{ textAlign: 'center', padding: '20px 0', opacity: 0.5, fontSize: 12, fontWeight: 600 }}>
                    Scratchpad empty for this session.
                  </div>
                )}
             </div>
          </div>
        </motion.div>
      </div>

      <SidePanel date={activeDate} tasks={tasks} pct={pct} activeTimer={activeTimer} isSubmitted={isSubmitted} />
      <TaskModal isOpen={showModal} onClose={() => { setShowModal(false); setEditTask(null); }} task={editTask} date={activeDate} />
    </div>
  );
}
