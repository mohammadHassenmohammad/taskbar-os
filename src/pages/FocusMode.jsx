import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { playNotificationSound } from '../lib/audio';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Coffee, Brain, Minimize2, Maximize2, CheckCircle2 } from 'lucide-react';

const MODES = {
  focus: { label: 'Focus', color: 'var(--accent-primary)', emoji: '🎯' },
  'short-break': { label: 'Short Break', color: 'var(--color-success)', emoji: '☕' },
  'long-break': { label: 'Long Break', color: 'var(--color-info)', emoji: '🌴' },
};

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function FocusMode() {
  const { pomodoro, setPomodoroState, settings, getTasksForDate, activeDate, toggleTaskComplete, focusMode, toggleFocusMode } = useStore();
  const [localTime, setLocalTime] = useState(pomodoro.timeLeft);
  const [running, setRunning] = useState(false);
  const [soundscape, setSoundscape] = useState(false);
  const audioRef = useRef(null);
  const intervalRef = useRef(null);

  const modeDuration = useCallback((mode) => {
    if (mode === 'focus') return settings.pomodoroFocus * 60;
    if (mode === 'short-break') return settings.pomodoroShortBreak * 60;
    return settings.pomodoroLongBreak * 60;
  }, [settings]);

  const totalTime = modeDuration(pomodoro.mode);
  const progress = ((totalTime - localTime) / totalTime) * 100;

  const todayTasks = getTasksForDate(activeDate).filter((t) => !t.completed).slice(0, 5);

  useEffect(() => {
    setLocalTime(modeDuration(pomodoro.mode));
    setRunning(false);
    clearInterval(intervalRef.current);
  }, [pomodoro.mode, modeDuration]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setLocalTime((t) => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            setPomodoroState({ sessions: pomodoro.sessions + 1 });
            if (settings.sound) {
              playNotificationSound(settings.notificationSound);
            }
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  useEffect(() => {
    if (soundscape) {
      if (audioRef.current) {
        audioRef.current.play().catch(e => {
          console.warn("[Neural OS] Audio resource unavailable. Protocol degraded.");
          setSoundscape(false);
        });
      }
    } else {
      if (audioRef.current) audioRef.current.pause();
    }
  }, [soundscape]);

  const handleReset = () => {
    setRunning(false);
    setLocalTime(modeDuration(pomodoro.mode));
  };

  const switchMode = (mode) => {
    setPomodoroState({ mode });
    setRunning(false);
  };

  const mode = MODES[pomodoro.mode];
  const circumference = 2 * Math.PI * 110;

  const content = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 32,
      minHeight: focusMode ? '100vh' : '60vh',
      padding: '40px 24px',
    }}>
      {focusMode && (
        <button
          className="btn btn-ghost btn-sm"
          style={{ position: 'fixed', top: 20, right: 20, zIndex: 200 }}
          onClick={toggleFocusMode}
        >
          <Minimize2 size={14} /> Exit Focus
        </button>
      )}

      {/* Mode switcher */}
      <div style={{ display: 'flex', gap: 8, background: 'var(--bg-elevated)', padding: 4, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
        {Object.entries(MODES).map(([key, m]) => (
          <button
            key={key}
            onClick={() => switchMode(key)}
            style={{
              padding: '8px 20px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: pomodoro.mode === key ? mode.color === MODES[key].color ? m.color : 'var(--bg-card)' : 'transparent',
              background: pomodoro.mode === key ? m.color : 'transparent',
              color: pomodoro.mode === key ? 'white' : 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {m.emoji} {m.label}
          </button>
        ))}
      </div>
      {/* Timer ring */}
      <div style={{ position: 'relative', width: 280, height: 280 }}>
        <svg width="280" height="280" style={{ position: 'absolute', top: 0, left: 0 }}>
          <circle cx="140" cy="140" r="110" fill="none" stroke="var(--bg-elevated)" strokeWidth="12" />
          <motion.circle 
            cx="140" cy="140" r="110" fill="none" 
            stroke={mode.color} strokeWidth="12" strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: circumference * (1 - progress / 100) }}
            transition={{ duration: 1, ease: 'linear' }}
            transform="rotate(-90 140 140)"
          />
        </svg>

        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontSize: 16, marginBottom: 4 }}>{mode.emoji}</div>
          <div style={{ fontSize: 52, fontWeight: 900, color: mode.color, fontVariantNumeric: 'tabular-nums' }}>{formatTime(localTime)}</div>
          <div style={{ fontSize: 14, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2 }}>{mode.label}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Session #{pomodoro.sessions + 1}
          </div>
        </div>
      </div>

      {/* Neural Soundscapes */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <audio 
          ref={audioRef} 
          loop 
          src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" 
          onEmptied={() => console.log("[Neural OS] Audio source reset.")}
        />
        <button 
          onClick={() => setSoundscape(!soundscape)}
          style={{ 
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', 
            background: soundscape ? 'var(--accent-primary)' : 'var(--bg-elevated)', 
            color: soundscape ? 'white' : 'var(--text-primary)',
            border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-full)',
            fontSize: 12, fontWeight: 900, cursor: 'pointer', transition: 'all 0.3s'
          }}
        >
          <Brain size={14} /> {soundscape ? 'SOUNDSCAPE: ACTIVE' : 'NEURAL SOUNDSCAPE'}
        </button>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button className="btn btn-ghost btn-icon" onClick={handleReset} title="Reset">
          <RotateCcw size={18} />
        </button>

        <motion.button
          className="btn btn-primary"
          style={{
            padding: '14px 40px',
            fontSize: 16,
            borderRadius: 'var(--radius-full)',
            background: mode.color,
            boxShadow: `0 8px 24px ${mode.color}40`,
          }}
          onClick={() => setRunning((r) => !r)}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
          {running ? <><Pause size={18} /> Pause</> : <><Play size={18} /> {localTime < totalTime ? 'Resume' : 'Start'}</>}
        </motion.button>

        <button
          className="btn btn-ghost btn-icon"
          onClick={toggleFocusMode}
          title={focusMode ? 'Exit full screen' : 'Full screen focus'}
        >
          {focusMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
      </div>

      {/* Sessions counter */}
      <div style={{ display: 'flex', gap: 6 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 10, height: 10,
              borderRadius: '50%',
              background: i < (pomodoro.sessions % 4) ? mode.color : 'var(--border-default)',
              transition: 'background 0.3s',
            }}
          />
        ))}
        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>
          {pomodoro.sessions} sessions today
        </span>
      </div>

      {/* Pending tasks */}
      {!focusMode && todayTasks.length > 0 && (
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10, textAlign: 'center' }}>
            🎯 Focus on these tasks
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {todayTasks.map((task) => (
              <div
                key={task.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onClick={() => toggleTaskComplete(task.id, activeDate)}
              >
                <div style={{ width: 18, height: 18, borderRadius: 5, border: '2px solid var(--border-strong)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                <span style={{ fontSize: 13, fontWeight: 600, flex: 1, color: 'var(--text-primary)' }}>{task.title}</span>
                <span style={{ fontSize: 10, color: `var(--priority-${task.priority.toLowerCase()})`, fontWeight: 700 }}>{task.priority}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      {!focusMode && (
        <div style={{
          maxWidth: 360, textAlign: 'center', fontSize: 12,
          color: 'var(--text-muted)', lineHeight: 1.7,
          padding: '14px 20px',
          background: 'var(--bg-elevated)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
        }}>
          💡 <strong style={{ color: 'var(--text-secondary)' }}>Pro Tip:</strong> During focus sessions, eliminate distractions. After 4 sessions, take a long break.
        </div>
      )}
    </div>
  );

  if (focusMode) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: 'var(--bg-base)',
        zIndex: 150,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {content}
      </div>
    );
  }

  return content;
}
