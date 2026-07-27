import { useState, useEffect, useRef } from 'react';
import { useStore, MUSCLE_GROUPS, WORKOUT_TEMPLATES, EXERCISE_LIBRARY_DEFAULT, DEFAULT_SCHEDULE } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, BookOpen, Plus, Trash2,
  ChevronRight, ChevronLeft, X, Play, TrendingUp, Settings2,
  RotateCcw, HelpCircle, Target, Hash, Zap, Search, Activity, Award, Check,
  TrendingDown, Info, Square, Sparkles
} from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { toast } from 'react-hot-toast';
import Confetti from 'react-confetti';

// ─── Motivational Data ───────────────────────────────────────────────────────
const MUSCLE_COLORS = {
  Chest: '#E11D48', Back: '#2563EB', Legs: '#059669', Core: '#7C3AED',
  Shoulders: '#EA580C', Arms: '#DB2777', Cardio: '#0891B2', 'Full Body': '#4F46E5', Flexibility: '#14b8a6',
};
const QUOTES = {
  Chest:    ['Pain is temporary. Pride is forever.','Push through the burn.','Every rep builds the warrior.'],
  Back:     ['Pull yourself to greatness.','Your back is your armor.','Wear the crown.'],
  Legs:     ['Leg day: legends are born.','Pain today, strength tomorrow.','LEGS OF A CHAMPION.'],
  Shoulders:['Broad shoulders, heavy burdens.','Build the boulders.','The frame of your masterpiece.'],
  Arms:     ['Work hard, show results.','Curl to confidence.','A statement of dedication.'],
  Core:     ['Foundation of greatness.','Forged in the gym.','Core strength = life strength.'],
  'Full Body':['Full commitment.','No excuses. Just work.','Tomorrow you own it.'],
  default:  ["Pain is temporary. Greatness is forever.",'Champions are made when no one is watching.'],
};
function getWorkoutQuote(schedName = '') {
  const n = schedName.toLowerCase();
  for (const [key, arr] of Object.entries(QUOTES)) {
    if (n.includes(key.toLowerCase())) return arr[new Date().getDate() % arr.length];
  }
  return QUOTES.default[new Date().getDate() % QUOTES.default.length];
}
function getPrimaryColor(exercises = []) {
  return MUSCLE_COLORS[exercises[0]?.muscle] || '#6e6aff';
}

const RestTimer = ({ restTimer, stopRestTimer }) => {
  if (!restTimer.running && restTimer.timeLeft === 0) return null;
  const pct = restTimer.duration > 0 ? (restTimer.timeLeft / restTimer.duration) * 100 : 0;
  const r = 26, circ = 2 * Math.PI * r;
  return (
    <AnimatePresence>
      <motion.div 
        key="rest-timer-overlay"
        initial={{ y: 100, opacity: 0, scale: 0.9 }} 
        animate={{ y: 0, opacity: 1, scale: 1 }} 
        exit={{ y: 100, opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', damping: 20, stiffness: 150 }}
        style={{
          position: 'fixed', bottom: 30, right: 30, zIndex: 99999,
          background: 'rgba(15, 17, 26, 0.8)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          color: 'white',
          padding: '18px 24px', borderRadius: '24px',
          display: 'flex', alignItems: 'center', gap: 20,
          boxShadow: '0 20px 80px rgba(0, 0, 0, 0.8), 0 0 20px rgba(124, 58, 237, 0.3)',
          border: '1px solid rgba(255,255,255,0.1)', minWidth: 240,
        }}
      >
        <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
          <svg width="64" height="64" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5"/>
            <motion.circle cx="32" cy="32" r={r} fill="none" stroke="url(#timerGrad)" strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circ}
              animate={{ strokeDashoffset: circ * (1 - pct / 100) }}
              transition={{ type: 'tween', ease: 'linear', duration: 1 }}
            />
            <defs>
              <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>
          <motion.div 
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, fontVariantNumeric: 'tabular-nums', textShadow: '0 0 10px rgba(139, 92, 246, 0.5)' }}>
            {restTimer.timeLeft}s
          </motion.div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 900, opacity: 0.5, textTransform: 'uppercase', letterSpacing: 2, color: '#a78bfa' }}>RECOVERY PROTOCOL</div>
          <div style={{ fontSize: 28, fontWeight: 950, lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: -1 }}>
            {Math.floor(restTimer.timeLeft/60)}:{String(restTimer.timeLeft%60).padStart(2,'0')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <div className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
            <div style={{ fontSize: 10, opacity: 0.6, fontWeight: 700 }}>SYNCHRONIZING...</div>
          </div>
        </div>
        <button className="btn-close-timer" onClick={stopRestTimer} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s' }}>
          <X size={18}/>
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default function Gym() {
  const { 
    user, authLoading, login, signup, logout, syncFirestore,
    workouts, gymActiveDate, setGymActiveDate, 
    activeGymTab, setActiveGymTab,
    createWorkout, updateWorkout, completeWorkout,
    addExerciseToWorkout, removeExerciseFromWorkout,
    addSet, removeSet, updateSet, toggleSetComplete,
    applyTemplate, gymSchedule, setGymScheduleDay, resetGymSchedule,
    personalRecords, bodyMetrics, logBodyMetrics,
    gamification, exerciseLibrary, resetWorkout, syncLibrary,
    addExerciseToLibrary, updateExerciseInLibrary, removeExerciseFromLibrary,
    restTimer, startRestTimer, stopRestTimer, tickRestTimer, setRestTimer,
    activeTimer, startTimer, stopTimer, applyGymScheduleForDate,
    clearActiveTimer
  } = useStore();

  const [showAddExModal, setShowAddExModal] = useState(false);
  const [showLibModal, setShowLibModal] = useState(null); // { mode: 'add'|'edit', ex?: any }
  const [showScheduleModal, setShowScheduleModal] = useState(null);
  const [localSchedule, setLocalSchedule] = useState(null);
  
  const [librarySearch, setLibrarySearch] = useState('');
  const [libraryFilter, setLibraryFilter] = useState('All');
  const [bwInput, setBwInput] = useState('');
  const [elapsedGym, setElapsedGym] = useState(0);

  const formatTime = (seconds) => {
    if (!seconds) return '0s';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  useEffect(() => {
    let interval;
    if (activeTimer?.type === 'exercise') {
      interval = setInterval(() => {
        setElapsedGym(Math.floor((Date.now() - activeTimer.startTime) / 1000));
      }, 1000);
    } else {
      setElapsedGym(0);
    }
    return () => clearInterval(interval);
  }, [activeTimer]);

  useEffect(() => {
    applyGymScheduleForDate(gymActiveDate);
  }, [gymActiveDate, applyGymScheduleForDate, workouts]);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const isToday  = gymActiveDate === todayStr;

  // STALE TIMER AUTO-CLEANUP: Clear timers older than 2 hours to prevent gym lockout
  const hasBlockingTimer = activeTimer && activeTimer.type !== 'exercise';
  useEffect(() => {
    if (activeTimer && activeTimer.startTime) {
      const age = Date.now() - activeTimer.startTime;
      const TWO_HOURS = 2 * 60 * 60 * 1000;
      if (age > TWO_HOURS) {
        console.warn('[Fitness OS] Auto-clearing stale timer:', activeTimer);
        clearActiveTimer();
        toast.success('Stale timer cleared — Gym unlocked! ⚡', { icon: '🔓' });
      }
    }
  }, [activeTimer, clearActiveTimer]);


  // Update local schedule when modal opens
  useEffect(() => {
    if (showScheduleModal !== null) {
      setLocalSchedule(JSON.parse(JSON.stringify(gymSchedule[showScheduleModal] || { name: '', exercises: [] })));
    } else {
      setLocalSchedule(null);
    }
  }, [showScheduleModal, gymSchedule]);

  // Auto-sync library if empty
  useEffect(() => {
    if (exerciseLibrary.length === 0) {
      syncLibrary();
    }
  }, [exerciseLibrary.length, syncLibrary]);

  // Rest Timer Tick
  useEffect(() => {
    let interval;
    if (restTimer.running) {
      interval = setInterval(() => {
        tickRestTimer();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [restTimer.running, tickRestTimer]);

  const handleNextDay = () => setGymActiveDate(format(addDays(new Date(gymActiveDate), 1), 'yyyy-MM-dd'));
  const handlePrevDay = () => setGymActiveDate(format(subDays(new Date(gymActiveDate), 1), 'yyyy-MM-dd'));
  const handleGoToToday = () => setGymActiveDate(format(new Date(), 'yyyy-MM-dd'));


  // ─── WORKOUT TAB: Schedule-driven ───────────────────────────────────────────
  const renderWorkoutTab = () => {
    const currentWorkout = workouts[gymActiveDate];
    const dow = new Date(gymActiveDate + 'T12:00:00').getDay();
    const sched = gymSchedule[dow];
    
    // Use saved workout if exists, otherwise preview from schedule
    const exercises = currentWorkout?.exercises || sched?.exercises || [];
    const isReadOnly = currentWorkout?.completed;

    const totalSets = exercises.reduce((acc, ex) => {
      if (currentWorkout) return acc + (ex.sets?.length || 0);
      return acc + (parseInt(ex.targetSets) || 3);
    }, 0);

    const doneSets = exercises.reduce((acc, ex) => {
      if (!currentWorkout) return acc;
      return acc + (ex.sets?.filter(s => s.completed).length || 0);
    }, 0);

    const progressPct = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0;

    const muscleColors = {
      Chest: '#f97316', Back: '#3b82f6', Legs: '#22c55e', Core: '#a855f7',
      Shoulders: '#06b6d4', Arms: '#f59e0b', Cardio: '#ef4444', 'Full Body': '#ec4899',
    };

    const heroColor = getPrimaryColor(exercises);

    const markAllDone = () => {
      exercises.forEach((ex) => {
        const sets = currentWorkout ? ex.sets : Array.from({ length: parseInt(ex.targetSets) || 3 });
        sets.forEach((_, sIdx) => {
          if (currentWorkout) {
            if (!ex.sets[sIdx].completed) toggleSetComplete(gymActiveDate, ex.id, ex.sets[sIdx].id);
          } else {
            // First click initializes the workout
            toggleSetComplete(gymActiveDate, ex.id, 'dummy'); // This will trigger init
          }
        });
      });
      toast.success('All sets checked! 🔥 Beast mode!');
    };

    const resetAll = () => {
      resetWorkout(gymActiveDate);
    };

    if (!sched || exercises.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: 20, textAlign: 'center' }}
        >
          <div style={{ fontSize: 72 }}>😴</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary)' }}>Rest Day</div>
          <div style={{ fontSize: 15, color: 'var(--text-muted)', maxWidth: 360 }}>
            {isToday ? "Today is your rest day. Recovery is part of the grind." : "No workout scheduled for this day."}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setActiveGymTab('schedule')}>
            <Settings2 size={14} /> Edit Master Schedule
          </button>
        </motion.div>
      );
    }

    // ── 7-day weekly strip (only in workout tab) ──────────────
    const weekDays_ = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const todayDow_ = new Date().getDay();
    const activeDow_ = new Date(gymActiveDate + 'T12:00:00').getDay();

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── 7-Day Week Strip (muscle-color themed) ── */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '2px 0' }}>
          {weekDays_.map((label, dow) => {
            const s = gymSchedule[dow];
            const isActive = dow === activeDow_;
            const isToday_ = dow === todayDow_;
            const isRest = !s?.exercises?.length;
            const col = isRest ? 'var(--border-default)' : (MUSCLE_COLORS[s.exercises[0]?.muscle] || '#6e6aff');
            return (
              <motion.button key={dow} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.93 }}
                onClick={() => { const b=new Date(),t=new Date(b); t.setDate(b.getDate()+(dow-todayDow_)); setGymActiveDate(format(t,'yyyy-MM-dd')); }}
                style={{
                  flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap:5,
                  padding:'9px 11px', borderRadius:'var(--radius-lg)', cursor:'pointer', minWidth:60,
                  border: isActive ? `2px solid ${col}` : isToday_ ? '1.5px solid var(--accent-primary)' : '1.5px solid var(--border-subtle)',
                  background: isActive ? col+'22' : 'var(--bg-card)',
                }}
              >
                <span style={{ fontSize:10, fontWeight:900, letterSpacing:1, textTransform:'uppercase', color: isActive ? col : isToday_ ? 'var(--accent-primary)' : 'var(--text-muted)' }}>{label}</span>
                <div style={{ width:7, height:7, borderRadius:'50%', background: isRest ? 'var(--border-default)' : col, opacity: isActive ? 1 : 0.6 }}/>
                <span style={{ fontSize:8, fontWeight:700, color: isActive ? col : 'var(--text-muted)', textAlign:'center', lineHeight:1.2, maxWidth:52 }}>
                  {isRest ? 'REST' : s.name.split('+')[0].trim().split(' ').slice(0,2).join(' ')}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* ── ADRENALINE HERO CARD ── */}
        {(() => {
          const quote = getWorkoutQuote(sched.name);
          const xpPotential = Math.round(exercises.length * 10 + totalSets * 15);
          return (
            <div style={{ borderRadius:'var(--radius-xl)', overflow:'hidden', border:`1.5px solid ${heroColor}40`, background:`linear-gradient(135deg, ${heroColor}18 0%, ${heroColor}06 100%)` }}>
              <div style={{ padding:'22px 24px 0' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:10, fontWeight:900, color:heroColor, textTransform:'uppercase', letterSpacing:2.5, marginBottom:6 }}>
                      {isToday ? "⚡ Today's Mission" : `📅 ${format(new Date(gymActiveDate+'T12:00:00'),'EEEE')}`}
                    </div>
                    <div style={{ fontSize:22, fontWeight:900, color:'var(--text-primary)', letterSpacing:-0.5, lineHeight:1.2 }}>{sched.name}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:8, fontStyle:'italic', lineHeight:1.5, maxWidth:400 }}>
                      "{quote}"
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                    {isToday && <button className="btn btn-ghost btn-sm" onClick={resetAll}><RotateCcw size={13}/> Reset</button>}
                    {currentWorkout?.completed ? (
                      <div style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:'var(--radius-lg)', background:'var(--color-success)', color:'white', fontWeight:800, fontSize:13 }}>
                        <Check size={13}/> MISSION DONE
                      </div>
                    ) : (
                      isToday && progressPct === 100 ? (
                        <button onClick={() => completeWorkout(gymActiveDate)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:'var(--radius-lg)', border:'none', background:'var(--color-success)', color:'white', fontWeight:800, fontSize:13, cursor:'pointer', boxShadow: '0 0 15px rgba(34,197,94,0.4)' }}>
                          <Award size={13}/> FINISH MISSION
                        </button>
                      ) : null
                    )}
                  </div>
                </div>
                <div style={{ display:'flex', gap:12, marginTop:14, flexWrap:'wrap' }}>
                  <span style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600 }}>📋 {exercises.length} ex</span>
                  <span style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600 }}>🏋️ {totalSets} sets</span>
                  <span style={{ fontSize:11, color:heroColor, fontWeight:800 }}>⚡ +{xpPotential} XP</span>
                  {gamification.gymStreak > 1 && <span style={{ fontSize:11, color:'#f97316', fontWeight:800 }}>🔥 {gamification.gymStreak} days</span>}
                </div>
              </div>
              {/* Progress Bar */}
              <div style={{ padding:'12px 18px 18px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize:10, fontWeight:800, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:1 }}>Session Progress</span>
                  <span style={{ fontSize:11, fontWeight:900, color: progressPct===100 ? '#22c55e' : heroColor }}>
                    {doneSets}/{totalSets} sets {progressPct===100 ? '🔥' : `(${progressPct}%)`}
                  </span>
                </div>
                <div style={{ height:10, background:'var(--bg-elevated)', borderRadius:'var(--radius-full)', overflow:'hidden' }}>
                  <motion.div
                    animate={{ width:`${progressPct}%` }}
                    transition={{ type:'spring', stiffness:60, damping:15 }}
                    style={{ height:'100%', borderRadius:'var(--radius-full)',
                      background: progressPct===100 ? 'linear-gradient(90deg,#22c55e,#16a34a)' : `linear-gradient(90deg,${heroColor},${heroColor}99)`,
                      boxShadow: progressPct===100 ? '0 0 14px rgba(34,197,94,0.5)' : `0 0 10px ${heroColor}50`,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })()}

        <div key={`${gymActiveDate}-${currentWorkout?.lastReset || '0'}`} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {exercises.map((ex, exIdx) => {
            const numSets = currentWorkout ? ex.sets?.length : (parseInt(ex.targetSets) || 3);
            const doneCount = currentWorkout ? ex.sets?.filter(s => s.completed).length : 0;
            const exPct = Math.round((doneCount / numSets) * 100);
            const allExDone = doneCount === numSets && numSets > 0;
            const tagColor = muscleColors[ex.muscle] || '#6e6aff';

            const allSetsDoneForEx = currentWorkout && ex.sets?.every(s => s.completed);
            const isExActive = activeTimer?.id === ex.id && activeTimer?.type === 'exercise';
            const isOtherExActive = activeTimer && (activeTimer.id !== ex.id || activeTimer.type !== 'exercise');

            return (
              <motion.div
                key={ex.id || exIdx}
                layout
                className="card exercise-card-premium"
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: isOtherExActive ? 0.4 : 1, 
                  y: 0,
                  scale: isExActive ? 1.02 : 1,
                  boxShadow: isExActive ? `0 0 40px ${tagColor}30` : 'var(--shadow-md)',
                  border: isExActive ? `2px solid ${tagColor}` : allExDone ? '1.5px solid var(--color-success)' : '1px solid var(--border-subtle)',
                }}
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  background: isExActive 
                    ? `linear-gradient(135deg, var(--bg-card) 0%, ${tagColor}08 100%)` 
                    : allExDone ? 'rgba(34, 197, 94, 0.03)' : 'var(--bg-card)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  filter: isOtherExActive ? 'grayscale(0.8) blur(0.5px)' : 'none',
                  pointerEvents: isOtherExActive ? 'none' : 'auto'
                }}
              >
                {/* Visual Progress Header */}
                <div style={{ height: 4, width: '100%', background: 'var(--bg-elevated)' }}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${exPct}%` }}
                    style={{ height: '100%', background: allExDone ? 'var(--color-success)' : tagColor, boxShadow: `0 0 10px ${allExDone ? 'var(--color-success)' : tagColor}60` }}
                  />
                </div>

                <div style={{ padding: '16px 18px 16px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
                  <div style={{ 
                    width: 44, height: 44, borderRadius: 14, background: tagColor + '15', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    fontSize: 20, color: tagColor, boxShadow: `inset 0 0 10px ${tagColor}20` 
                  }}>
                    {ex.muscle.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 2 }}>
                      <span style={{ fontSize: 18, fontWeight: 950, color: allExDone ? 'var(--color-success)' : 'var(--text-primary)', letterSpacing: -0.8 }}>{ex.name}</span>
                      <span style={{ fontSize: 8, fontWeight: 900, background: tagColor, color: 'white', padding: '2px 8px', borderRadius: 'var(--radius-full)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{ex.muscle}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Target size={13}/> {ex.targetSets} × {ex.targetReps}</span>
                      {ex.timeTaken > 0 && <span style={{ color: tagColor, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 5 }}>⏱ {formatTime(ex.timeTaken)}</span>}
                    </div>
                  </div>
                  
                  {/* Timer Control */}
                  {(!ex.completed || isExActive) && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      {!isExActive ? (
                        <button 
                          className="btn btn-primary" 
                          onClick={() => startTimer(ex.id, 'exercise', gymActiveDate)}
                          disabled={isOtherExActive || isReadOnly || !isToday}
                          style={{ 
                            borderRadius: 14, padding: '10px 20px', 
                            background: (isOtherExActive || !isToday) ? 'var(--text-muted)' : `linear-gradient(135deg, ${tagColor}, ${tagColor}dd)`,
                            border: 'none', fontWeight: 900, fontSize: 13, letterSpacing: 1,
                            boxShadow: (isOtherExActive || !isToday) ? 'none' : `0 8px 20px ${tagColor}40`,
                            cursor: !isToday ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <Play size={14} fill="white" style={{ marginRight: 8 }} /> START
                        </button>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <motion.button 
                            className="btn" 
                            onClick={() => {
                              if (allSetsDoneForEx) {
                                stopTimer();
                              } else {
                                toast.error('Incomplete Sequence: Finish all sets first!', { icon: '🚫', style: { borderRadius: '10px', background: '#333', color: '#fff' } });
                              }
                            }}
                            whileTap={allSetsDoneForEx ? { scale: 0.95 } : { x: [-4, 4, -4, 4, 0] }}
                            style={{ 
                              borderRadius: 14, padding: '10px 24px', 
                              background: allSetsDoneForEx ? 'var(--color-danger)' : 'var(--bg-elevated)', 
                              color: allSetsDoneForEx ? 'white' : 'var(--text-muted)',
                              border: allSetsDoneForEx ? 'none' : '1.5px solid var(--border-default)',
                              fontWeight: 900, fontSize: 13, letterSpacing: 1,
                              boxShadow: allSetsDoneForEx ? '0 8px 20px rgba(239,68,68,0.4)' : 'none',
                              cursor: 'pointer',
                              transition: 'all 0.3s'
                            }}
                          >
                            <Square size={14} fill="currentColor" style={{ marginRight: 8 }} /> FINISH
                          </motion.button>
                          {!allSetsDoneForEx && (
                            <motion.div 
                              animate={{ opacity: [0.4, 1, 0.4] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              style={{ fontSize: 9, fontWeight: 800, color: 'var(--color-danger)', textTransform: 'uppercase' }}
                            >
                              Check all sets to unlock
                            </motion.div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {ex.completed && !isExActive && (
                    <motion.div 
                      initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                      style={{ color: 'var(--color-success)', fontWeight: 950, fontSize: 13, background: 'rgba(34,197,94,0.1)', padding: '8px 16px', borderRadius: 12, border: '1.5px solid var(--color-success)' }}
                    >
                      EXCELLENT ✓
                    </motion.div>
                  )}
                </div>

                <div className="exercise-card-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 0, borderBottom: '1px solid var(--border-subtle)' }}>
                  {/* Sets Grid */}
                  <div className="exercise-sets-container" style={{ padding: '20px 24px', borderRight: '1px solid var(--border-subtle)', background: !isExActive && !allExDone ? 'rgba(0,0,0,0.01)' : 'transparent' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                      {currentWorkout ? (
                        ex.sets.map((set, sIdx) => (
                          <motion.button
                            key={set.id}
                            disabled={!isExActive || allExDone}
                            onClick={() => toggleSetComplete(gymActiveDate, ex.id, set.id)}
                            whileHover={isExActive ? { scale: 1.02, y: -4, background: tagColor + '20' } : {}}
                            whileTap={isExActive ? { scale: 0.98 } : {}}
                            className="btn-set-premium"
                            style={{
                              display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderRadius: '20px',
                              border: set.completed ? `2px solid ${tagColor}` : '2px solid var(--border-subtle)',
                              background: set.completed ? `linear-gradient(135deg, ${tagColor}15 0%, ${tagColor}05 100%)` : 'var(--bg-elevated)',
                              width: '100%',
                              opacity: (!isExActive && !allExDone) ? 0.4 : 1,
                              cursor: (!isExActive && !allExDone) ? 'not-allowed' : 'pointer',
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              boxShadow: set.completed ? `0 10px 25px ${tagColor}25` : 'none',
                              position: 'relative',
                              overflow: 'hidden'
                            }}
                          >
                            {isExActive && !set.completed && (
                              <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [0.05, 0.1, 0.05] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                style={{ position: 'absolute', inset: 0, background: tagColor }}
                              />
                            )}
                            <div style={{ 
                              width: 24, height: 24, borderRadius: 8, 
                              background: set.completed ? tagColor : 'rgba(255,255,255,0.03)', 
                              border: `2px solid ${set.completed ? tagColor : 'var(--border-strong)'}`, 
                              display:'flex', alignItems:'center', justifyContent:'center',
                              transition: 'all 0.3s',
                              boxShadow: isExActive && !set.completed ? `0 0 10px ${tagColor}40` : 'none',
                              animation: isExActive && !set.completed ? 'pulse-border 2s infinite' : 'none'
                            }}>
                              {set.completed && <Check size={14} color="white" strokeWidth={3} />}
                            </div>
<div style={{ textAlign: 'left' }}>
                              <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Set {sIdx + 1}</div>
                              <div style={{ fontSize: 15, fontWeight: 900, color: set.completed ? 'var(--text-primary)' : 'var(--text-secondary)', marginTop: 2 }}>
                                {set.weight && parseFloat(set.weight) > 0 ? `${set.weight}kg × ` : ''}{set.reps || ex.targetReps} <span style={{ fontSize: 11, opacity: 0.6 }}>REPS</span>
                              </div>
                            </div>
                          </motion.button>
                        ))
                      ) : (
                        <div style={{ padding: '20px', textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: 20, border: '2px dashed var(--border-subtle)', gridColumn: '1/-1' }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>Initialing Training Sequence...</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>Start exercise to enable set tracking</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Intelligence Panel */}
                  {(() => {
                    const libEx = exerciseLibrary.find(l => l.name === ex.name) || exerciseLibrary.find(l => l.id === ex.id);
                    return (
                      <div className="exercise-intel-panel" style={{ padding: '16px', background: 'rgba(var(--accent-primary-rgb), 0.02)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {isExActive && (
                          <div style={{ background: 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)' }}>
                            <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--color-danger)', textTransform: 'uppercase' }}>Time Under Tension</div>
                            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--color-danger)', fontFamily: 'monospace' }}>
                              {formatTime(elapsedGym)}
                            </div>
                          </div>
                        )}
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Equipment</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>{libEx?.equipment || 'Bodyweight'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Instructions</div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{libEx?.instructions || 'Focus on controlled movement.'}</div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── Completion Banner ── */}
        <AnimatePresence>
          {progressPct === 100 && (
            <>
              <Confetti
                width={window.innerWidth}
                height={window.innerHeight}
                recycle={false}
                numberOfPieces={400}
                gravity={0.15}
                colors={[heroColor, '#ffffff', '#10b981', '#fbbf24']}
                style={{ position: 'fixed', top: 0, left: 0, zIndex: 100000, pointerEvents: 'none' }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={{
                  background: `linear-gradient(135deg, ${heroColor}, #000000)`,
                  borderRadius: '32px',
                  padding: '40px 32px',
                  textAlign: 'center',
                  color: 'white',
                  boxShadow: `0 25px 60px ${heroColor}40`,
                  border: `1px solid ${heroColor}60`,
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <motion.div 
                  animate={{ rotate: [0, 10, -10, 10, 0] }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  style={{ fontSize: 64, marginBottom: 16 }}>🏆</motion.div>
                <div style={{ fontSize: 26, fontWeight: 950, marginBottom: 8, letterSpacing: -1 }}>MISSION ACCOMPLISHED</div>
                <div style={{ fontSize: 14, opacity: 0.8, fontWeight: 600, maxWidth: 300, margin: '0 auto' }}>
                  You have absolute mastery over this protocol. {totalSets} sets crushed with peak intensity.
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const renderScheduleTab = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const muscleColors = { Chest:'#f97316', Back:'#3b82f6', Legs:'#22c55e', Core:'#a855f7', Shoulders:'#06b6d4', Arms:'#f59e0b', Cardio:'#ef4444', 'Full Body':'#ec4899' };
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="card-glass" style={{ padding: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="section-title" style={{ fontSize: 20 }}>Master Schedule</div>
            <div className="section-sub">30-Day Six-Pack & Pull-Up Plan — tap any day to edit</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => {
            if(confirm('Restore the 30-Day Six-Pack & Pull-Up Plan? This overwrites current schedule.')) { resetGymSchedule(); toast.success('Schedule restored! 💪'); }
          }}>↺ Reset to 30-Day Plan</button>
        </div>

        <div className="grid-2">
          {days.map((day, idx) => {
            const sched = gymSchedule[idx];
            const isToday_ = idx === new Date().getDay();
            return (
              <motion.div key={day} className="card"
                whileHover={{ y: -3, borderColor: 'var(--accent-primary)' }}
                style={{ cursor: 'pointer', padding: 0, overflow: 'hidden', border: isToday_ ? '2px solid var(--accent-primary)' : '1px solid var(--border-default)' }}
              >
                {/* Card Header */}
                <div style={{ padding: '16px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', background: isToday_ ? 'rgba(110,106,255,0.06)' : 'transparent' }}
                  onClick={() => setShowScheduleModal(idx)}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)' }}>{day}</span>
                      {isToday_ && <span style={{ fontSize: 9, fontWeight: 900, color: 'var(--accent-primary)', background: 'rgba(110,106,255,0.12)', padding: '2px 8px', borderRadius: 'var(--radius-full)', textTransform: 'uppercase', letterSpacing: 1 }}>Today</span>}
                    </div>
                    {sched && <div style={{ fontSize: 12, color: 'var(--accent-primary)', fontWeight: 700, marginTop: 2 }}>{sched.name}</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button className="btn btn-ghost btn-icon btn-xs"
                      onClick={(e) => { e.stopPropagation(); setShowScheduleModal(idx); setShowAddExModal(true); }}
                      title="Add exercise"
                    ><Plus size={14} /></button>
                    <Settings2 size={16} color="var(--accent-primary)" />
                  </div>
                </div>

                {/* Exercise List */}
                <div style={{ padding: '10px 16px 14px' }} onClick={() => setShowScheduleModal(idx)}>
                  {sched ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {sched.exercises.map((ex, i) => {
                        const color = muscleColors[ex.muscle] || '#6e6aff';
                        return (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', borderLeft: `3px solid ${color}` }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{ex.name}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {ex.targetSets && ex.targetReps ? (
                                <span style={{ fontSize: 11, fontWeight: 800, color: color, background: color+'18', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                                  {ex.targetSets}×{ex.targetReps}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ padding: '16px 0', textAlign: 'center' }}>
                      <div style={{ fontSize: 28, marginBottom: 6 }}>😴</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Rest Day / Active Recovery</div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 100 }}>

      {/* Hero Header — Centered & Focus-Driven */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12, marginBottom: 10 }}>
        {activeGymTab === 'workout' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', padding: '8px 16px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', position: 'relative' }}>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={handlePrevDay} style={{ width: 28, height: 28 }}><ChevronLeft size={14} /></button>
            <div style={{ minWidth: 120 }}>
              <div style={{ fontSize: 14, fontWeight: 950, color: 'var(--text-primary)', letterSpacing: -0.4, lineHeight: 1.1 }}>{isToday ? 'Today' : format(new Date(gymActiveDate + 'T12:00:00'), 'EEEE')}</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 1 }}>{format(new Date(gymActiveDate + 'T12:00:00'), 'MMM d, yyyy')}</div>
            </div>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={handleNextDay} style={{ width: 28, height: 28 }}><ChevronRight size={14} /></button>
          </div>
        ) : null}
        
        {gamification.gymStreak > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#f97316,#dc2626)', 
              color: 'white', padding: '6px 16px', borderRadius: 'var(--radius-full)', 
              fontSize: 13, fontWeight: 900, boxShadow: '0 8px 20px rgba(249,115,22,0.3)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            🔥 {gamification.gymStreak} DAY STREAK
          </motion.div>
        )}
      </div>

      <div className="tab-bar" style={{ padding: '4px', background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)' }}>
        <button className={`tab-btn ${activeGymTab === 'workout' ? 'active' : ''}`} onClick={() => setActiveGymTab('workout')}><Play size={15} /> Workout</button>
        <button className={`tab-btn ${activeGymTab === 'schedule' ? 'active' : ''}`} onClick={() => setActiveGymTab('schedule')}><Calendar size={15} /> Schedule</button>
        <button className={`tab-btn ${activeGymTab === 'library' ? 'active' : ''}`} onClick={() => setActiveGymTab('library')}><BookOpen size={15} /> Library</button>
        <button className={`tab-btn ${activeGymTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveGymTab('stats')}><TrendingUp size={15} /> Insights</button>
      </div>

      {/* BLOCKING TIMER WARNING — Shows when a non-gym timer locks all exercises */}
      {hasBlockingTimer && (
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '14px 20px', borderRadius: 'var(--radius-lg)',
            background: 'rgba(239, 68, 68, 0.08)', border: '1.5px solid rgba(239, 68, 68, 0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 16, flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
            <span style={{ fontSize: 22 }}>🔒</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#ef4444' }}>Gym Locked — Active Task Timer Detected</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>
                A task timer is still running. Clear it to unlock gym exercises.
              </div>
            </div>
          </div>
          <button
            onClick={() => { clearActiveTimer(); toast.success('Timer cleared — Gym unlocked! 💪'); }}
            style={{
              padding: '10px 20px', borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white',
              border: 'none', fontWeight: 900, fontSize: 12, cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(239,68,68,0.3)', letterSpacing: 0.5,
              textTransform: 'uppercase', whiteSpace: 'nowrap'
            }}
          >
            🔓 Clear Timer & Unlock
          </button>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        <motion.div key={activeGymTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
          {activeGymTab === 'workout' && renderWorkoutTab()}
          {activeGymTab === 'schedule' && renderScheduleTab()}
          {activeGymTab === 'library' && (() => {
            const muscles = ['All', ...MUSCLE_GROUPS];
            const filtered = exerciseLibrary.filter(ex => {
              const matchFilter = libraryFilter === 'All' || ex.muscle === libraryFilter;
              const matchSearch = !librarySearch || ex.name.toLowerCase().includes(librarySearch.toLowerCase()) || ex.muscle.toLowerCase().includes(librarySearch.toLowerCase());
              return matchFilter && matchSearch;
            });
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{filtered.length} exercises found</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => syncLibrary()}>
                      <RotateCcw size={14} /> Sync Plan
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowLibModal({ mode: 'add' })}>
                      <Plus size={14} /> Add Exercise
                    </button>
                  </div>
                </div>
                {/* Search + Filter bar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}/>
                    <input
                      className="form-input"
                      style={{ paddingLeft: 40, width: '100%' }}
                      placeholder="Search exercises..."
                      value={librarySearch}
                      onChange={e => setLibrarySearch(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {muscles.map(m => {
                      const col = MUSCLE_COLORS[m] || '#6e6aff';
                      const active = libraryFilter === m;
                      return (
                        <button key={m} onClick={() => setLibraryFilter(m)}
                          style={{ padding: '5px 14px', borderRadius: 'var(--radius-full)', border: active ? `2px solid ${col}` : '1.5px solid var(--border-subtle)', background: active ? col+'22' : 'var(--bg-card)', color: active ? col : 'var(--text-muted)', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                        >{m}</button>
                      );
                    })}
                  </div>
                </div>
                {/* Grid */}
                <div className="grid-3">
                  {filtered.map(ex => {
                    const col = MUSCLE_COLORS[ex.muscle] || '#6e6aff';
                    return (
                      <motion.div key={ex.id} className="card" whileHover={{ y: -3, borderColor: col }}
                        style={{ cursor: 'pointer', padding: 0, overflow: 'hidden', borderTop: `3px solid ${col}` }}
                      >
                        <div style={{ padding: '14px 16px' }}>
                          <div style={{ display:'flex', justifyContent:'space-between' }}>
                            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8, lineHeight: 1.3 }}>{ex.name}</div>
                            <button className="btn btn-ghost btn-icon btn-xs" onClick={(e) => { e.stopPropagation(); setShowLibModal({ mode: 'edit', ex }); }}>
                              <Settings2 size={12} />
                            </button>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: col, background: col+'18', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>{ex.muscle}</span>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{ex.equipment || 'Bodyweight'}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
          {activeGymTab === 'stats' && (() => {
            const todayDate = new Date();
            const twentyEightDaysAgo = subDays(todayDate, 28);
            
            const statsWorkouts = Object.values(workouts)
              .filter(w => {
                const wDate = new Date(w.date + 'T12:00:00');
                // Only count workouts in the last 28 days
                const isRecent = wDate >= twentyEightDaysAgo;
                // Only count if at least one set was actually finished
                const hasProgress = w.exercises?.some(ex => ex.sets?.some(s => s.completed));
                return isRecent && hasProgress;
              })
              .sort((a, b) => a.date.localeCompare(b.date));
            const muscleCounts = {};
            let totalSetsDone = 0;
            let totalVolume = 0;
            const oneRepMaxes = {}; // { exerciseName: max }

            statsWorkouts.forEach(w => {
              w.exercises?.forEach(ex => {
                const completedSets = ex.sets?.filter(s => s.completed) || [];
                totalSetsDone += completedSets.length;
                
                completedSets.forEach(set => {
                  let w = parseFloat(set.weight) || 0;
                  const r = parseInt(set.reps) || 0;
                  
                  // If weight is 0 (bodyweight exercise), use the latest logged body weight for calculation
                  if (w === 0) {
                    const sortedMetrics = Object.entries(bodyMetrics)
                      .filter(([,v]) => v.weight)
                      .sort((a,b) => b[0].localeCompare(a[0]));
                    w = sortedMetrics[0]?.[1]?.weight || 70; // Fallback to 70kg if no metric logged
                  }

                  if (w > 0 && r > 0) {
                    totalVolume += w * r;
                    // Epley 1RM: w * (1 + r/30)
                    const orm = Math.round(w * (1 + r / 30));
                    if (!oneRepMaxes[ex.name] || orm > oneRepMaxes[ex.name]) {
                      oneRepMaxes[ex.name] = orm;
                    }
                  }
                });
                muscleCounts[ex.muscle] = (muscleCounts[ex.muscle] || 0) + completedSets.length;
              });
            });

            const topMuscles = Object.entries(muscleCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
            const maxMuscleVal = Math.max(...Object.values(muscleCounts), 1);
            const sortedPRs = Object.entries(oneRepMaxes).sort((a, b) => b[1] - a[1]).slice(0, 8);

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
                
                {/* ── ELITE PERFORMANCE METRICS ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  <motion.div whileHover={{ y: -5 }} className="card" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', border: '1px solid #4338ca', padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <Zap size={18} color="#818cf8" />
                      <span style={{ fontSize: 11, fontWeight: 900, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: 1.5 }}>Total Intensity</span>
                      <button className="btn btn-ghost btn-icon btn-xs" title="Volume = Sets x Reps x Weight. Measures total workload."><Info size={12} color="#a5b4fc" /></button>
                    </div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: 'white' }}>{(totalVolume / 1000).toFixed(1)}<span style={{ fontSize: 14, opacity: 0.6, marginLeft: 4 }}>TONS</span></div>
                    <div style={{ fontSize: 11, color: '#a5b4fc', marginTop: 4, fontWeight: 600 }}>Total weight moved all-time</div>
                  </motion.div>

                  <motion.div whileHover={{ y: -5 }} className="card" style={{ background: 'linear-gradient(135deg, #14532d 0%, #166534 100%)', border: '1px solid #15803d', padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <Activity size={18} color="#4ade80" />
                      <span style={{ fontSize: 11, fontWeight: 900, color: '#86efac', textTransform: 'uppercase', letterSpacing: 1.5 }}>Sets Crushed</span>
                    </div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: 'white' }}>{totalSetsDone}</div>
                    <div style={{ fontSize: 11, color: '#86efac', marginTop: 4, fontWeight: 600 }}>Completed with 100% effort</div>
                  </motion.div>

                  <motion.div whileHover={{ y: -5 }} className="card" style={{ background: 'linear-gradient(135deg, #7c2d12 0%, #9a3412 100%)', border: '1px solid #c2410c', padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <Zap size={18} color="#fb923c" />
                      <span style={{ fontSize: 11, fontWeight: 900, color: '#fdba74', textTransform: 'uppercase', letterSpacing: 1.5 }}>Warpath Streak</span>
                      <button className="btn btn-ghost btn-icon btn-xs" title="Consecutive days with completed missions. Don't break the chain!"><Info size={12} color="#fdba74" /></button>
                    </div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: 'white' }}>{gamification.gymStreak || 0}<span style={{ fontSize: 14, opacity: 0.6, marginLeft: 4 }}>DAYS</span></div>
                    <div style={{ fontSize: 11, color: '#fdba74', marginTop: 4, fontWeight: 600 }}>Consistent discipline level</div>
                  </motion.div>
                </div>

                <div className="grid-2">
                  {/* ── MUSCLE DOMINANCE ── */}
                  <div className="card" style={{ padding: 24, border: '1px solid var(--border-default)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>💪 Muscle Dominance</h3>
                      <div style={{ fontSize: 10, fontWeight: 900, background: 'var(--bg-elevated)', padding: '4px 10px', borderRadius: 'var(--radius-full)', color: 'var(--text-muted)' }}>BY SET VOLUME</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                      {topMuscles.length > 0 ? topMuscles.map(([muscle, count]) => {
                        const col = MUSCLE_COLORS[muscle] || '#6e6aff';
                        const pct = (count / maxMuscleVal) * 100;
                        return (
                          <div key={muscle}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>{muscle}</span>
                              <span style={{ fontSize: 12, fontWeight: 900, color: col }}>{count} sets</span>
                            </div>
                            <div style={{ height: 8, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: 'easeOut' }} style={{ height: '100%', background: `linear-gradient(90deg, ${col}88, ${col})`, borderRadius: 'var(--radius-full)', boxShadow: `0 0 10px ${col}44` }} />
                            </div>
                          </div>
                        );
                      }) : <div style={{ textAlign:'center', padding:40, opacity:0.5 }}>No data tracked yet. Start your mission!</div>}
                    </div>
                  </div>

                  {/* ── PROJECTED MAX (1RM) ── */}
                  <div className="card" style={{ padding: 24, border: '1px solid var(--border-default)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>🏆 Estimated 1RM</h3>
                      <button className="btn btn-ghost btn-icon btn-xs" title="1-Rep Max (Epley Formula): Predicted max lift for 1 rep based on your best sets."><Info size={14}/></button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {sortedPRs.length > 0 ? sortedPRs.map(([name, val]) => (
                        <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{name}</span>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--accent-primary)' }}>{val} kg</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800 }}>PROJECTED MAX</div>
                          </div>
                        </div>
                      )) : <div style={{ textAlign:'center', padding:40, opacity:0.5 }}>Lift heavy to see your power levels.</div>}
                    </div>
                  </div>
                </div>

                {/* ── CONSISTENCY WAR-MAP ── */}
                <div className="card" style={{ padding: 24 }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>📅 Battle Consistency</h3>
                      <div style={{ display: 'flex', gap: 15 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--bg-elevated)' }} />
                          <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)' }}>REST</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--accent-primary)' }} />
                          <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)' }}>WAR</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(30px, 1fr))', gap: 8 }}>
                      {Array.from({ length: 28 }).map((_, i) => {
                        const d = subDays(new Date(), 27 - i);
                        const dStr = format(d, 'yyyy-MM-dd');
                        const hasWorkout = !!workouts[dStr] && workouts[dStr].exercises?.some(ex => ex.sets?.some(s => s.completed));
                        return (
                          <motion.div
                            key={i}
                            whileHover={{ scale: 1.2, zIndex: 10 }}
                            title={dStr}
                            style={{
                              aspectRatio: '1/1',
                              borderRadius: 6,
                              background: hasWorkout ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' : 'var(--bg-elevated)',
                              border: dStr === todayStr ? '2px solid white' : '1px solid var(--border-subtle)',
                              boxShadow: hasWorkout ? '0 4px 12px rgba(110,106,255,0.4)' : 'none',
                              cursor: 'help'
                            }}
                          />
                        );
                      })}
                    </div>
                    <div style={{ marginTop: 24, textAlign: 'center' }}>
                       <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
                         {statsWorkouts.length} Missions Completed in 28 Days
                       </div>
                       <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                         Maintain the frequency. Don't break the chain.
                       </div>
                    </div>
                </div>

                {/* ── BODY TRENDS ── */}
                <div className="card" style={{ padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>⚖️ Body Composition Trend</h3>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <input
                        className="form-input form-input-sm" type="number" placeholder="Weight (kg)"
                        value={bwInput} onChange={e => setBwInput(e.target.value)}
                        style={{ width: 120 }}
                      />
                      <button className="btn btn-primary btn-sm" onClick={() => {
                        if (!bwInput) return;
                        logBodyMetrics(todayStr, { weight: parseFloat(bwInput) });
                        toast.success(`Weight logged: ${bwInput} kg! 💪`);
                        setBwInput('');
                      }}>Log</button>
                    </div>
                  </div>
                  {(() => {
                    const entries = Object.entries(bodyMetrics)
                      .filter(([,v]) => v.weight)
                      .sort((a,b) => a[0].localeCompare(b[0]))
                      .slice(-10);
                    if (!entries.length) return <div style={{ textAlign:'center', padding:40, opacity:0.5 }}>Log your weight to track body changes.</div>;
                    const weights = entries.map(([,v]) => v.weight);
                    const min = Math.min(...weights), max = Math.max(...weights);
                    return (
                      <div style={{ height: 160, display: 'flex', alignItems: 'flex-end', gap: 12, padding: '20px 0 40px' }}>
                        {entries.map(([date, v], i) => {
                          const h = max === min ? 100 : ((v.weight - min) / (max - min)) * 70 + 30;
                          return (
                            <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
                              <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-primary)' }}>{v.weight}</div>
                              <motion.div initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: i * 0.05 }} style={{ width: '100%', background: 'linear-gradient(to top, var(--accent-primary) 0%, var(--accent-secondary) 100%)', borderRadius: 'var(--radius-sm)', position: 'relative' }}>
                                <div style={{ position: 'absolute', top: -5, left: '50%', transform: 'translateX(-50%)', width: 6, height: 6, borderRadius: '50%', background: 'white' }} />
                              </motion.div>
                              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', transform: 'rotate(-45deg)', marginTop: 15, whiteSpace: 'nowrap' }}>{format(new Date(date + 'T12:00:00'), 'MMM d')}</div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* ── RECENT WAR LOGS ── */}
                {statsWorkouts.length > 0 && (
                  <div className="card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>📜 Recent War Logs</h3>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 800 }}>LAST 5 SESSIONS</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {statsWorkouts
                        .slice(-5)
                        .reverse()
                        .map((w, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
                          <div>
                            <div style={{ fontWeight: 900, fontSize: 15, color: 'var(--text-primary)' }}>{w.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontWeight: 700 }}>MISSION COMPLETED</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            {(() => {
                              // Fallback calculation if store XP is 0
                              let displayXP = w.xpEarned || 0;
                              if (displayXP === 0 && w.completed) {
                                const cSets = w.exercises?.flatMap(e => e.sets || []).filter(s => s.completed).length || 0;
                                displayXP = Math.round(cSets * 15 + (w.exercises?.length || 0) * 10);
                                if (displayXP < 50) displayXP = 50;
                              }
                              return <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--accent-primary)' }}>+{displayXP} XP</div>;
                            })()}
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800 }}>{w.exercises?.length || 0} OBJECTIVES</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── TACTICAL AI INSIGHTS ── */}
                {(() => {
                  const genInsights = [];
                  const sessionsLast7 = Object.values(workouts).filter(w => {
                    const d = new Date(w.date + 'T12:00:00');
                    return d >= subDays(new Date(), 7) && w.exercises?.some(e => e.sets?.some(s => s.completed));
                  }).length;
                  if (sessionsLast7 === 0) {
                    genInsights.push({ type: 'danger', icon: '🚨', title: 'Zero Frequency Detected', body: 'No workouts in the last 7 days. A minimum of 3 sessions/week is required to maintain muscle. Initiate a session now.' });
                  } else if (sessionsLast7 < 3) {
                    genInsights.push({ type: 'warning', icon: '⚠️', title: 'Low Training Frequency', body: `Only ${sessionsLast7} session${sessionsLast7 > 1 ? 's' : ''} this week. Target 4–5 sessions/week for elite conditioning.` });
                  } else {
                    genInsights.push({ type: 'success', icon: '🔥', title: 'Frequency Protocol Holding', body: `${sessionsLast7} sessions this week. Outstanding discipline. Ensure 1 full recovery day to prevent overtraining.` });
                  }
                  const mCounts = {};
                  Object.values(workouts).forEach(w => {
                    w.exercises?.forEach(ex => {
                      const done = ex.sets?.filter(s => s.completed).length || 0;
                      if (done > 0) mCounts[ex.muscle] = (mCounts[ex.muscle] || 0) + done;
                    });
                  });
                  const mArr = Object.entries(mCounts).sort((a, b) => b[1] - a[1]);
                  if (mArr.length >= 2) {
                    const [tN, tV] = mArr[0], [bN, bV] = mArr[mArr.length - 1];
                    if (tV / bV > 4) genInsights.push({ type: 'warning', icon: '⚖️', title: 'Muscle Imbalance Alert', body: `${tN} (${tV} sets) vs ${bN} (${bV} sets) — a ${(tV/bV).toFixed(0)}x gap. Prioritize ${bN} to restore symmetry.` });
                  }
                  const totalAll = Object.values(mCounts).reduce((a, b) => a + b, 0);
                  const legS = mCounts['Legs'] || 0;
                  if (totalAll > 20 && legS / totalAll < 0.10) {
                    genInsights.push({ type: 'warning', icon: '🦵', title: 'Leg Protocol Neglected', body: `Legs are only ${Math.round((legS/totalAll)*100)}% of total volume. Schedule leg day immediately.` });
                  }
                  const calcVol = (ws) => ws.reduce((acc, w) => acc + (w.exercises?.reduce((a, ex) => a + (ex.sets?.filter(s => s.completed).reduce((b, s) => b + ((parseFloat(s.weight)||70)*(parseInt(s.reps)||0)), 0)||0), 0)||0), 0);
                  const tw = statsWorkouts.filter(w => new Date(w.date+'T12:00:00') >= subDays(new Date(), 7));
                  const lw = statsWorkouts.filter(w => { const d = new Date(w.date+'T12:00:00'); return d >= subDays(new Date(),14) && d < subDays(new Date(),7); });
                  const vT = calcVol(tw), vL = calcVol(lw);
                  if (vL > 0 && vT > 0) {
                    const chg = ((vT - vL) / vL * 100).toFixed(0);
                    if (chg > 10) genInsights.push({ type: 'success', icon: '📈', title: 'Progressive Overload Active', body: `Volume up ${chg}% this week (${(vT/1000).toFixed(1)}T vs ${(vL/1000).toFixed(1)}T). Maintain trajectory.` });
                    else if (chg < -15) genInsights.push({ type: 'warning', icon: '📉', title: 'Volume Regression', body: `Volume dropped ${Math.abs(chg)}% week-over-week. If not a deload, recalibrate commitment.` });
                  }
                  const wE = Object.entries(bodyMetrics).filter(([,v]) => v.weight).sort((a,b) => a[0].localeCompare(b[0]));
                  if (wE.length >= 3) {
                    const r = wE.slice(-3).map(([,v]) => v.weight);
                    const diff = r[2] - r[0];
                    if (Math.abs(diff) > 1.5) genInsights.push({ type: 'info', icon: diff > 0 ? '⬆️' : '⬇️', title: diff > 0 ? 'Mass Gaining Phase' : 'Cutting Phase Detected', body: `Weight shifted ${Math.abs(diff).toFixed(1)}kg (${r[0]}→${r[2]}kg). ${diff > 0 ? 'Track calories for lean gains.' : 'Maintain protein to preserve muscle.'}` });
                  }
                  if (genInsights.length === 0) genInsights.push({ type: 'success', icon: '✅', title: 'All Systems Nominal', body: 'Frequency, volume, and balance within optimal parameters.' });
                  const cs = { danger: { bg:'rgba(239,68,68,0.08)', bd:'rgba(239,68,68,0.3)', tx:'#ef4444' }, warning: { bg:'rgba(245,158,11,0.08)', bd:'rgba(245,158,11,0.3)', tx:'#f59e0b' }, success: { bg:'rgba(16,185,129,0.08)', bd:'rgba(16,185,129,0.3)', tx:'#10b981' }, info: { bg:'rgba(99,102,241,0.08)', bd:'rgba(99,102,241,0.3)', tx:'#6366f1' } };
                  return (
                    <div className="card" style={{ padding: 24 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                        <div style={{ padding: 10, background: 'rgba(139,92,246,0.12)', borderRadius: 14 }}><Sparkles size={22} color="#8b5cf6" /></div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Tactical Intelligence Report</h3>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginTop: 2 }}>Auto-generated from {statsWorkouts.length} sessions (28 days)</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {genInsights.map((ins, i) => { const c = cs[ins.type]; return (
                          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                            style={{ padding: '16px 20px', borderRadius: 16, background: c.bg, border: `1px solid ${c.bd}`, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                            <div style={{ fontSize: 22, flexShrink: 0 }}>{ins.icon}</div>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 900, color: c.tx, marginBottom: 6 }}>{ins.title}</div>
                              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{ins.body}</div>
                            </div>
                          </motion.div>
                        ); })}
                      </div>
                    </div>
                  );
                })()}

              </div>
            );
          })()}
        </motion.div>
      </AnimatePresence>

      {/* ADVANCED SCHEDULE MODAL */}
      {showScheduleModal !== null && localSchedule && (
        <div className="modal-overlay" onClick={() => setShowScheduleModal(null)}>
          <motion.div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Master Plan: {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][showScheduleModal]}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowScheduleModal(null)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
               <div className="form-group">
                 <label className="form-label">Workout Name</label>
                 <input className="form-input" value={localSchedule.name || ''} 
                   onChange={(e) => setLocalSchedule({ ...localSchedule, name: e.target.value })} />
               </div>
               
               <div style={{ marginTop: 25 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                    <label className="form-label" style={{ margin: 0 }}>Exercises & Targets</label>
                    <button className="btn btn-ghost btn-xs" onClick={() => setShowAddExModal(true)}>+ Add New</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {localSchedule.exercises.map((ex, i) => (
                      <div key={i} className="card-elevated" style={{ padding: 15, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
                           <span style={{ fontWeight: 800, fontSize: 15 }}>{ex.name}</span>
                           <button className="btn btn-ghost btn-icon btn-xs" onClick={() => {
                              const newExs = [...localSchedule.exercises];
                              newExs.splice(i, 1);
                              setLocalSchedule({ ...localSchedule, exercises: newExs });
                           }}><Trash2 size={14} /></button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                           <div className="form-group">
                              <label className="form-label" style={{ fontSize: 10 }}><Hash size={10} /> Target Sets</label>
                              <input type="number" className="form-input" value={ex.targetSets} 
                                onChange={(e) => {
                                   const newExs = [...localSchedule.exercises];
                                   newExs[i].targetSets = e.target.value;
                                   setLocalSchedule({ ...localSchedule, exercises: newExs });
                                }} />
                           </div>
                           <div className="form-group">
                              <label className="form-label" style={{ fontSize: 10 }}><Target size={10} /> Target Reps / Time</label>
                              <input type="text" className="form-input" value={ex.targetReps} 
                                onChange={(e) => {
                                   const newExs = [...localSchedule.exercises];
                                   newExs[i].targetReps = e.target.value;
                                   setLocalSchedule({ ...localSchedule, exercises: newExs });
                                }} />
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
            <div className="modal-footer" style={{ flexDirection: 'column', gap: 10 }}>
               <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => {
                 setGymScheduleDay(showScheduleModal, localSchedule);
                 toast.success('Schedule saved!');
                 setShowScheduleModal(null);
               }}>Save Master Plan</button>
               {new Date().getDay() === showScheduleModal && (
                 <button className="btn btn-ghost btn-sm" style={{ width: '100%' }} onClick={() => {
                   setGymScheduleDay(showScheduleModal, localSchedule);
                   applyTemplate(gymActiveDate, localSchedule);
                   toast.success('Applied to today\'s session! 🔥');
                   setShowScheduleModal(null);
                 }}>Save & Apply to Today</button>
               )}
            </div>
          </motion.div>
        </div>
      )}


      {/* ADD EXERCISE PICKER */}
      {showAddExModal && (
        <div className="modal-overlay" onClick={() => setShowAddExModal(false)}>
          <motion.div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
               <h2 className="modal-title">Pick Exercise</h2>
               <button className="btn btn-ghost btn-icon" onClick={() => setShowAddExModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
               {exerciseLibrary.map(ex => (
                 <button key={ex.id} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'space-between', marginBottom: 5 }} onClick={() => {
                    if (localSchedule) {
                      const newExs = [...(localSchedule.exercises || []), { name: ex.name, muscle: ex.muscle, type: ex.type, targetSets: 3, targetReps: 12 }];
                      setLocalSchedule({ ...localSchedule, exercises: newExs });
                    } else {
                      addExerciseToWorkout(gymActiveDate, ex);
                    }
                    setShowAddExModal(false);
                 }}>
                   <div style={{ textAlign: 'left' }}>
                     <div style={{ fontWeight: 700 }}>{ex.name}</div>
                     <div style={{ fontSize: 10, opacity: 0.6 }}>{ex.muscle}</div>
                   </div>
                   <Plus size={16} />
                 </button>
               ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Library Management Modal ── */}
      <AnimatePresence>
        {showLibModal && (
          <div className="modal-overlay" style={{ zIndex: 10000 }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="card modal-content" style={{ width: 450, padding: 30, background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                <h2 style={{ margin:0, fontSize: 20 }}>{showLibModal.mode === 'add' ? 'Add to Library' : 'Edit Exercise'}</h2>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowLibModal(null)}><X size={20}/></button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = {
                  name: formData.get('name'),
                  muscle: formData.get('muscle'),
                  equipment: formData.get('equipment'),
                  type: formData.get('type'),
                  instructions: formData.get('instructions')
                };
                if (showLibModal.mode === 'add') addExerciseToLibrary(data);
                else updateExerciseInLibrary(showLibModal.ex.id, data);
                setShowLibModal(null);
                toast.success('Library updated!');
              }} style={{ display:'flex', flexDirection:'column', gap:15 }}>
                <div className="form-group">
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Exercise Name</label>
                  <input name="name" className="form-input" defaultValue={showLibModal.ex?.name} required placeholder="e.g. Diamond Push Ups" />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Muscle Group</label>
                    <select name="muscle" className="form-input" defaultValue={showLibModal.ex?.muscle || 'Chest'}>
                      {MUSCLE_GROUPS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Equipment</label>
                    <input name="equipment" className="form-input" defaultValue={showLibModal.ex?.equipment} placeholder="e.g. Bodyweight" />
                  </div>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Instructions</label>
                  <textarea name="instructions" className="form-input" defaultValue={showLibModal.ex?.instructions} style={{ height: 80 }} placeholder="Step by step guide..." />
                </div>
                <div style={{ display:'flex', gap:10, marginTop:10 }}>
                  {showLibModal.mode === 'edit' && (
                    <button type="button" className="btn btn-ghost" style={{ color:'#ef4444' }} onClick={() => {
                      if(confirm('Delete from library?')) { removeExerciseFromLibrary(showLibModal.ex.id); setShowLibModal(null); }
                    }}>Delete</button>
                  )}
                  <button type="submit" className="btn btn-primary" style={{ flex:1 }}>Save to Library</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <RestTimer restTimer={restTimer} stopRestTimer={stopRestTimer} />
    </div>
  );
}
