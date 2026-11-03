import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { playNotificationSound } from '../lib/audio';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, RotateCcw, Brain, Minimize2, Maximize2, 
  SkipForward, CheckCircle2, Clock, CheckSquare, Sparkles, Volume2, VolumeX, List
} from 'lucide-react';
import toast from 'react-hot-toast';
import Confetti from 'react-confetti';

const MODES = {
  focus: { label: 'Focus Session', color: 'var(--accent-primary)', emoji: '🎯' },
  'short-break': { label: 'Short Break', color: 'var(--color-success)', emoji: '☕' },
  'long-break': { label: 'Long Break', color: 'var(--color-info)', emoji: '🌴' },
};

function formatTime(seconds) {
  const safeSec = Math.max(0, Math.floor(seconds || 0));
  const m = Math.floor(safeSec / 60).toString().padStart(2, '0');
  const s = (safeSec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function FocusMode() {
  const { 
    pomodoro, startPomodoro, pausePomodoro, resumePomodoro, 
    resetPomodoro, skipPomodoroSession, completePomodoroSession,
    settings, getTasksForDate, activeDate, toggleTaskComplete, 
    focusMode, toggleFocusMode 
  } = useStore();

  const [displayTime, setDisplayTime] = useState(pomodoro.timeLeft || 25 * 60);
  const [showHistory, setShowHistory] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const audioContextRef = useRef(null);

  // Synchronize display time with absolute persisted timestamp
  useEffect(() => {
    const updateTick = () => {
      if (pomodoro.running && pomodoro.targetEndTime) {
        const remaining = Math.max(0, Math.ceil((pomodoro.targetEndTime - Date.now()) / 1000));
        setDisplayTime(remaining);

        if (remaining <= 0) {
          // Session Completed
          completePomodoroSession();
          if (settings.sound) {
            playNotificationSound(settings.notificationSound);
          }
          if (pomodoro.mode === 'focus') {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 5000);
            toast.success('Focus mission accomplished! +25 XP awarded ⚡', { duration: 5000, icon: '🏆' });
          } else {
            toast.success('Break finished. Ready for deep work!', { icon: '☕' });
          }
        }
      } else {
        setDisplayTime(pomodoro.timeLeft || 0);
      }
    };

    updateTick();
    const interval = setInterval(updateTick, 500);
    return () => clearInterval(interval);
  }, [pomodoro.running, pomodoro.targetEndTime, pomodoro.timeLeft, pomodoro.mode, settings, completePomodoroSession]);

  const currentMode = MODES[pomodoro.mode] || MODES.focus;
  const totalDuration = pomodoro.totalDuration || (25 * 60);
  const progressPct = totalDuration > 0 ? Math.min(100, Math.max(0, ((totalDuration - displayTime) / totalDuration) * 100)) : 0;
  
  const todayTasks = getTasksForDate(activeDate).filter((t) => !t.completed).slice(0, 5);
  const linkedTask = pomodoro.linkedTaskId 
    ? getTasksForDate(activeDate).find(t => t.id === pomodoro.linkedTaskId) 
    : null;

  const handleStartResume = () => {
    if (pomodoro.running) {
      pausePomodoro();
    } else if (displayTime < totalDuration && displayTime > 0) {
      resumePomodoro();
    } else {
      startPomodoro(pomodoro.mode, null, pomodoro.linkedTaskId);
    }
  };

  const handleSwitchMode = (modeKey) => {
    startPomodoro(modeKey, null, pomodoro.linkedTaskId);
  };

  const circumference = 2 * Math.PI * 110;

  const content = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 28,
      minHeight: focusMode ? '100vh' : '65vh',
      padding: '24px 16px',
      maxWidth: 600,
      margin: '0 auto',
      position: 'relative'
    }}>
      {showConfetti && <Confetti numberOfPieces={150} recycle={false} />}

      {/* Top Controls: Exit Fullscreen / History Toggle */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          className="btn btn-ghost btn-xs"
          onClick={() => setShowHistory(!showHistory)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}
        >
          <List size={14} /> {showHistory ? 'Hide Log' : 'Focus History'}
        </button>

        <button
          className="btn btn-ghost btn-sm"
          onClick={toggleFocusMode}
          title={focusMode ? 'Exit full screen' : 'Full screen focus'}
        >
          {focusMode ? <><Minimize2 size={14} /> Exit Ambient Mode</> : <><Maximize2 size={14} /> Ambient Canvas</>}
        </button>
      </div>

      {/* Mode Selector Tabs */}
      <div style={{ 
        display: 'flex', gap: 6, background: 'var(--bg-elevated)', 
        padding: 4, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' 
      }}>
        {Object.entries(MODES).map(([key, m]) => {
          const isActive = pomodoro.mode === key;
          return (
            <button
              key={key}
              onClick={() => handleSwitchMode(key)}
              style={{
                padding: '8px 18px',
                borderRadius: 'var(--radius-md)',
                background: isActive ? m.color : 'transparent',
                color: isActive ? 'white' : 'var(--text-secondary)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span>{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Linked Task Indicator */}
      {linkedTask && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px',
          background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: 20, fontSize: 12, fontWeight: 700, color: 'var(--text-primary)'
        }}>
          <span>🎯 Active Mission:</span>
          <span style={{ color: 'var(--accent-primary)' }}>{linkedTask.title}</span>
          <button 
            className="btn btn-ghost btn-icon btn-xs" 
            style={{ padding: 2 }}
            onClick={() => useStore.getState().setPomodoroState({ linkedTaskId: null })}
            title="Unlink task"
          >
            ✕
          </button>
        </div>
      )}

      {/* Timer Circular Canvas */}
      <div style={{ position: 'relative', width: 280, height: 280 }}>
        <svg width="280" height="280" style={{ position: 'absolute', top: 0, left: 0 }}>
          <circle cx="140" cy="140" r="110" fill="none" stroke="var(--bg-elevated)" strokeWidth="12" />
          <motion.circle 
            cx="140" cy="140" r="110" fill="none" 
            stroke={currentMode.color} strokeWidth="12" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progressPct / 100)}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            transform="rotate(-90 140 140)"
          />
        </svg>

        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontSize: 20, marginBottom: 4 }}>{currentMode.emoji}</div>
          <div style={{ 
            fontSize: 54, fontWeight: 900, color: currentMode.color, 
            fontVariantNumeric: 'tabular-nums', letterSpacing: -1 
          }}>
            {formatTime(displayTime)}
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--text-secondary)' }}>
            {pomodoro.running ? 'IN SESSION' : (displayTime < totalDuration ? 'PAUSED' : 'READY')}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Completed Sessions: {pomodoro.sessions || 0}
          </div>
        </div>
      </div>

      {/* Core Controls: Reset, Start/Pause, Skip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button 
          className="btn btn-ghost btn-icon" 
          onClick={resetPomodoro} 
          title="Reset Session"
          style={{ width: 44, height: 44, borderRadius: '50%' }}
        >
          <RotateCcw size={18} />
        </button>

        <motion.button
          className="btn btn-primary"
          style={{
            padding: '14px 44px',
            fontSize: 16,
            fontWeight: 800,
            borderRadius: 'var(--radius-full)',
            background: currentMode.color,
            boxShadow: `0 8px 24px ${currentMode.color}40`,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            minWidth: 160,
            justifyContent: 'center'
          }}
          onClick={handleStartResume}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
          {pomodoro.running ? (
            <><Pause size={18} /> Pause</>
          ) : (
            <><Play size={18} /> {displayTime < totalDuration && displayTime > 0 ? 'Resume' : 'Start Focus'}</>
          )}
        </motion.button>

        <button 
          className="btn btn-ghost btn-icon" 
          onClick={skipPomodoroSession} 
          title="Skip to next session"
          style={{ width: 44, height: 44, borderRadius: '50%' }}
        >
          <SkipForward size={18} />
        </button>
      </div>

      {/* Session Streak Counter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 12, height: 12,
              borderRadius: '50%',
              background: i < ((pomodoro.sessions || 0) % 4) ? currentMode.color : 'var(--border-default)',
              transition: 'background 0.3s ease',
            }}
          />
        ))}
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8, fontWeight: 700 }}>
          {(pomodoro.sessions || 0) % 4}/4 sessions to Long Break
        </span>
      </div>

      {/* Focus History Drawer */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ width: '100%', background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border-subtle)', padding: 16 }}
          >
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
              📜 Recent Focus Sessions ({pomodoro.history?.length || 0})
            </div>
            {(!pomodoro.history || pomodoro.history.length === 0) ? (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                No completed focus sessions logged yet today. Complete your first session to earn +25 XP!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
                {pomodoro.history.slice(0, 10).map((h, idx) => (
                  <div key={h.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 8, fontSize: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle2 size={14} color="var(--color-success)" />
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Focus Sprint ({h.durationMinutes}m)</span>
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                      {new Date(h.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Select Pending Tasks to Anchor Focus */}
      {!focusMode && todayTasks.length > 0 && (
        <div style={{ width: '100%' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, textAlign: 'center' }}>
            🎯 Link Task to Focus Session
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {todayTasks.map((task) => {
              const isSelected = pomodoro.linkedTaskId === task.id;
              return (
                <div
                  key={task.id}
                  onClick={() => {
                    useStore.getState().setPomodoroState({ linkedTaskId: isSelected ? null : task.id });
                    toast.success(isSelected ? 'Unlinked task' : `Focus linked to "${task.title}"`);
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px',
                    background: isSelected ? 'rgba(99,102,241,0.12)' : 'var(--bg-elevated)',
                    border: `1.5px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{
                    width: 18, height: 18, borderRadius: 5,
                    border: `2px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-strong)'}`,
                    background: isSelected ? 'var(--accent-primary)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    {isSelected && <CheckSquare size={12} color="white" />}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, flex: 1, color: 'var(--text-primary)' }}>{task.title}</span>
                  <span style={{ fontSize: 10, color: `var(--priority-${task.priority.toLowerCase()})`, fontWeight: 700 }}>{task.priority}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  if (focusMode) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: 'var(--bg-base)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}>
        {content}
      </div>
    );
  }

  return content;
}
