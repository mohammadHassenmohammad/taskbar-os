import { useState, useEffect, useMemo } from 'react';
import { Check, Edit2, Trash2, Copy, MoveRight, Clock, GripVertical, Play, Square, Target } from 'lucide-react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const PRIORITY_COLORS = {
  Low: 'var(--priority-low)',
  Medium: 'var(--priority-medium)',
  High: 'var(--priority-high)',
};

const CATEGORY_CLASS = {
  Work: 'tag-work', Personal: 'tag-personal', Health: 'tag-health',
  Learning: 'tag-learning', Creative: 'tag-creative', Social: 'tag-social',
  Finance: 'tag-finance', Other: 'tag-other',
};


const formatTime = (seconds) => {
  if (!seconds) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

export default function TaskCard({ task, date, onEdit, isReadOnly = false, compact = false }) {
  const { 
    deleteTask, duplicateTask, postponeTask, setTaskReminder,
    activeTimer, startTimer, stopTimer, toggleTaskComplete 
  } = useStore();
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState(task.reminderAt || '');

  const isActive = activeTimer?.id === task.id;
  const isOtherActive = activeTimer && activeTimer.id !== task.id;

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const isCurrentDay = date === todayStr;

  useEffect(() => {
    let interval;
    if (isActive) {
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - activeTimer.startTime) / 1000));
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [isActive, activeTimer]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: isReadOnly || isActive });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : undefined,
  };

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      deleteTask(task.id, date);
      toast.success('Task deleted');
    }, 200);
  };

  const handleDuplicate = () => {
    duplicateTask(task.id, date);
    toast.success('Task duplicated!');
  };

  const catClass = CATEGORY_CLASS[task.category] || 'tag-other';

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={`task-card-premium ${task.completed ? 'completed' : ''} ${isActive ? 'timer-active' : ''}`}
      initial={{ opacity: 0, x: -10 }}
      animate={{ 
        opacity: isDeleting ? 0 : 1, 
        x: isDeleting ? 10 : 0,
        scale: isActive ? 1.02 : 1,
        boxShadow: isActive ? '0 20px 40px rgba(99,102,241,0.3)' : (task.completed ? 'none' : '0 4px 12px rgba(0,0,0,0.05)'),
        background: isActive 
          ? 'linear-gradient(135deg, var(--bg-card) 0%, rgba(99,102,241,0.08) 100%)' 
          : (task.completed ? 'rgba(34,197,94,0.02)' : 'var(--bg-card)'),
        border: isActive ? '1.5px solid var(--accent-primary)' : (task.completed ? '1px solid rgba(34,197,94,0.2)' : '1px solid var(--border-subtle)')
      }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Visual Indicator Header */}
      <div style={{ height: 4, width: '100%', background: 'var(--bg-elevated)', position: 'absolute', top: 0, left: 0 }}>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${task.progress || (task.completed ? 100 : 0)}%` }}
          style={{ height: '100%', background: task.completed ? 'var(--color-success)' : PRIORITY_COLORS[task.priority] }}
        />
      </div>

      <div className={`task-card-content-wrapper ${compact ? 'compact' : ''}`}>
        
        {/* Left Section: Timer & Status */}
        {!compact && (
          <div className="task-card-left">
            {task.completed ? (
              <motion.div 
                initial={{ scale: 0 }} animate={{ scale: 1 }} 
                className="task-check-premium checked"
                onClick={() => toggleTaskComplete(task.id, date)}
                style={{ cursor: 'pointer' }}
              >
                <Check size={20} color="white" strokeWidth={3} />
              </motion.div>
            ) : (
              !isActive ? (
                <button 
                  className="btn btn-ghost btn-icon task-play-btn" 
                  onClick={() => startTimer(task.id, 'task', date)}
                >
                  <Play size={24} fill="currentColor" />
                </button>
              ) : (
                <button 
                  className="btn btn-primary btn-icon task-stop-btn" 
                  onClick={() => stopTimer()}
                >
                  <Square size={20} fill="white" />
                </button>
              )
            )}
            {isActive && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="task-timer-display"
              >
                {formatTime(elapsed)}
              </motion.div>
            )}
          </div>
        )}

        {/* Middle Section: Intelligence */}
        <div className="task-card-middle">
          <div className="task-card-header">
            <div style={{ flex: 1 }}>
              <div className="task-field-label">Mission Title</div>
              <h3 className={`task-title-text ${task.completed ? 'completed' : ''}`}>
                {task.text || task.title}
              </h3>
            </div>
            {task.timeTaken > 0 && !isActive && (
              <div className="task-time-invested">
                 <div className="task-field-label">Time Invested</div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                   <span className="task-time-badge" style={{ 
                     background: task.estimatedTime && (task.timeTaken / 60) > task.estimatedTime ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)',
                     color: task.estimatedTime && (task.timeTaken / 60) > task.estimatedTime ? 'var(--color-danger)' : 'var(--accent-primary)'
                   }}>
                    ⏱ {formatTime(task.timeTaken)}
                   </span>
                   {task.estimatedTime > 0 && (
                     <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)' }}>
                       / {task.estimatedTime}m est.
                     </span>
                   )}
                 </div>
              </div>
            )}
          </div>
          
          {task.description && (
            <div className="task-description-container">
              <div className="task-field-label">Protocol Brief</div>
              <p className="task-description-text">
                {task.description}
              </p>
            </div>
          )}

          <div className="task-metadata-row">
            <div className="task-meta-item">
               <div className="task-field-label">Classification</div>
               <span className={`task-tag-premium ${catClass}`}>{task.category}</span>
            </div>
            
            <div className="task-meta-item">
               <div className="task-field-label">Priority</div>
               <span className="task-priority-badge" style={{ color: PRIORITY_COLORS[task.priority] }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: PRIORITY_COLORS[task.priority] }} />
                {task.priority}
               </span>
            </div>

            {task.dueTime && !task.completed && (
              <div className="task-meta-item">
                 <div className="task-field-label">Due Time</div>
                 <span className="task-deadline-badge" style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(167,139,250,0.08)', padding: '3px 10px', borderRadius: 6 }}>
                  <Target size={12} /> {task.dueTime}
                 </span>
              </div>
            )}

            {task.reminderAt && !task.completed && (
              <div className="task-meta-item">
                 <div className="task-field-label">Reminder</div>
                 <span className="task-reminder-badge">
                  <Clock size={12} /> {task.reminderAt}
                 </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Operational Clusters */}
        <div className="task-card-right">
          {!isReadOnly && !isActive && (
            <div className="task-action-cluster" style={{ flexDirection: compact ? 'row' : 'column' }}>
              <div className="task-action-row">
                {!compact && !task.completed && isCurrentDay && (
                  <div style={{ position: 'relative' }}>
                    <button className="btn btn-ghost btn-icon btn-sm action-btn" 
                      style={{ color: task.reminderAt ? 'var(--accent-primary)' : 'var(--text-muted)' }} 
                      onClick={() => setShowTimePicker(!showTimePicker)}
                      title="Set Reminder"
                    >
                      <Clock size={16} />
                    </button>
                    <AnimatePresence>
                      {showTimePicker && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                          className="reminder-popover"
                        >
                          <div className="popover-title">Mission Reminder</div>
                          <input 
                            type="time" 
                            className="form-input" 
                            value={tempTime} 
                            onChange={(e) => setTempTime(e.target.value)} 
                          />
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => {
                              if (tempTime) {
                                const [h, m] = tempTime.split(':');
                                const hour = parseInt(h);
                                const ampm = hour >= 12 ? 'PM' : 'AM';
                                const h12 = hour % 12 || 12;
                                const timeStr = `${h12 < 10 ? '0' + h12 : h12}:${m} ${ampm}`;
                                setTaskReminder(date, task.id, timeStr);
                              } else {
                                setTaskReminder(date, task.id, '');
                              }
                              setShowTimePicker(false);
                              toast.success('Reminder armed ⏱');
                            }}>Arm</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowTimePicker(false)}>X</button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
                {!compact && isCurrentDay && !task.completed && (
                  <button className="btn btn-ghost btn-icon btn-sm action-btn" style={{ color: 'var(--accent-secondary)' }} 
                    onClick={() => {
                      const nextDate = new Date(date + 'T12:00:00');
                      nextDate.setDate(nextDate.getDate() + 1);
                      const toDate = nextDate.toLocaleDateString('en-CA');
                      postponeTask(task.id, date, toDate);
                      toast.success('Mission postponed');
                    }}
                    title="Postpone to Tomorrow"
                  >
                    <MoveRight size={16} />
                  </button>
                )}
              </div>
              <div className="task-action-row">
                <button className="btn btn-ghost btn-icon btn-sm action-btn" onClick={() => onEdit(task)} title="Edit Mission"><Edit2 size={compact ? 12 : 16} /></button>
                {!compact && <button className="btn btn-ghost btn-icon btn-sm action-btn" onClick={() => duplicateTask(task.id, date)} title="Duplicate Mission"><Copy size={16} /></button>}
                <button className="btn btn-ghost btn-icon btn-sm action-btn" style={{ color: 'var(--color-danger)' }} 
                  onClick={() => { setIsDeleting(true); setTimeout(() => deleteTask(task.id, date), 300); }}
                  title="Abstain/Delete"
                >
                  <Trash2 size={compact ? 12 : 16} />
                </button>
              </div>
              {!compact && <div {...attributes} {...listeners} className="drag-handle" title="Reorder Mission">
                <GripVertical size={20} />
              </div>}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
