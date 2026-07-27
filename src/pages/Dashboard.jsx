import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { format, subDays, startOfWeek, eachDayOfInterval } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ListTodo, Zap, Flame, Trophy, TrendingUp, ArrowRight, Plus, Activity, Sparkles, User, Target } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import BioHacker from '../components/BioHacker';
import NeuralScratchpad from '../components/NeuralScratchpad';
// Mission Protocol: Bio-Intelligence Module Integrated

const QUOTES = [
  "The secret of getting ahead is getting started. — Mark Twain",
  "Focus on being productive instead of busy. — Tim Ferriss",
  "Small daily improvements are the key to staggering long-term results.",
  "You don't have to be great to start, but you have to start to be great.",
  "Discipline is the bridge between goals and accomplishment. — Jim Rohn",
  "Success is the sum of small efforts repeated day in and day out.",
  "Every expert was once a beginner. Keep going!",
  "Your future is created by what you do today, not tomorrow.",
];

function StatCard({ label, value, sub, icon: Icon, color, delay = 0, onClick }) {
  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, boxShadow: '0 15px 35px rgba(0,0,0,0.2)', borderColor: 'var(--accent-primary)' }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', transition: 'border-color 0.3s' }}
      transition={{ delay, duration: 0.4 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span className="stat-label">{label}</span>
        {Icon && <div style={{ padding: 6, background: `${color}15`, borderRadius: 8 }}><Icon size={16} color={color || 'var(--accent-primary)'} /></div>}
      </div>
      <div className="stat-value" style={{ color: color || 'var(--text-primary)', marginTop: 8 }}>{value}</div>
      {sub && <div className="stat-sub" style={{ fontWeight: 700 }}>{sub}</div>}
    </motion.div>
  );
}

export default function Dashboard() {
  const { 
    tasks, submittedDays, gamification, getLevelInfo, setPage, 
    setActiveDate, workouts, personalRecords, user, isNewUser, dismissWelcome,
    waterLogs, waterGoal, bodyMetrics
  } = useStore();
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayTasks = tasks[today] || [];
  const completed = todayTasks.filter((t) => t.completed).length;
  const total = todayTasks.length;
  const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const lvl = getLevelInfo();
  const todayQuote = QUOTES[new Date().getDay() % QUOTES.length];

  // Calculation for Discipline Grade
  const disciplineScore = useMemo(() => {
    const taskScore = completionPct;
    const score = Math.round(taskScore);
    let grade = 'F';
    if (score >= 90) grade = 'S';
    else if (score >= 80) grade = 'A';
    else if (score >= 65) grade = 'B';
    else if (score >= 45) grade = 'C';
    else if (score >= 20) grade = 'D';
    
    return { score, grade };
  }, [completionPct]);

  // Weekly chart data
  const weekData = useMemo(() => {
    const start = subDays(new Date(), 6);
    return eachDayOfInterval({ start, end: new Date() }).map((d) => {
      const key = format(d, 'yyyy-MM-dd');
      const dayTasks = tasks[key] || [];
      const done = dayTasks.filter((t) => t.completed).length;
      return {
        day: format(d, 'EEE'),
        completed: done,
        total: dayTasks.length,
        score: dayTasks.length > 0 ? Math.round((done / dayTasks.length) * 100) : 0,
      };
    });
  }, [tasks]);

  // Recent activity
  const recentDays = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => {
      const d = subDays(new Date(), i);
      const key = format(d, 'yyyy-MM-dd');
      const dayTasks = tasks[key] || [];
      return {
        key,
        label: i === 0 ? 'Today' : i === 1 ? 'Yesterday' : format(d, 'MMM d'),
        total: dayTasks.length,
        completed: dayTasks.filter((t) => t.completed).length,
        submitted: submittedDays[key],
      };
    });
  }, [tasks, submittedDays]);

  // Category breakdown (Last 30 days for performance)
  const categoryData = useMemo(() => {
    const map = {};
    for (let i = 0; i < 30; i++) {
      const d = subDays(new Date(), i);
      const key = format(d, 'yyyy-MM-dd');
      (tasks[key] || []).forEach((t) => {
        if (!map[t.category]) map[t.category] = { count: 0, done: 0 };
        map[t.category].count++;
        if (t.completed) map[t.category].done++;
      });
    }
    return Object.entries(map).map(([name, data]) => ({
      name,
      value: Math.round((data.done / data.count) * 100) || 0
    })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [tasks]);

  const upcomingTasks = useMemo(() => {
    return todayTasks.filter(t => !t.completed).slice(0, 3);
  }, [todayTasks]);

  const fitnessStats = useMemo(() => {
    const start = subDays(new Date(), 6);
    const last7Days = eachDayOfInterval({ start, end: new Date() }).map(d => format(d, 'yyyy-MM-dd'));
    const workoutCount = last7Days.filter(d => workouts[d] && workouts[d].exercises?.length > 0).length;
    
    const start30 = subDays(new Date(), 29);
    const last30Days = eachDayOfInterval({ start: start30, end: new Date() }).map(d => format(d, 'yyyy-MM-dd'));
    let totalVolume = 0;
    last30Days.forEach(d => {
      const dayWorkouts = workouts[d];
      if (dayWorkouts && dayWorkouts.exercises) {
        dayWorkouts.exercises.forEach(ex => {
          totalVolume += (ex.sets || []).filter(s => s.completed).length;
        });
      }
    });

    return { workoutCount, totalVolume };
  }, [workouts]);

  const hydrationPct = useMemo(() => {
    const logs = waterLogs[today] || [];
    const total = logs.reduce((acc, l) => acc + parseInt(l.amount), 0);
    const goalMl = waterGoal * 250; // Assume 250ml per glass if goal is in glasses
    return Math.min(100, Math.round((total / goalMl) * 100));
  }, [waterLogs, waterGoal, today]);

  const latestWeight = useMemo(() => {
    const entries = Object.entries(bodyMetrics).sort((a,b) => b[0].localeCompare(a[0]));
    return entries[0]?.[1]?.weight || user?.weight || 'N/A';
  }, [bodyMetrics, user]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Welcome Protocol Overlay */}
      <AnimatePresence>
        {isNewUser && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ 
              position: 'fixed', inset: 0, background: 'rgba(10, 11, 16, 0.98)', 
              zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
            }}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="card"
              style={{ maxWidth: 500, padding: 40, textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--accent-primary)' }}
            >
              <div style={{ 
                width: 80, height: 80, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
                color: 'var(--accent-primary)'
              }}>
                <Zap size={40} />
              </div>
              <h2 style={{ fontSize: 28, fontWeight: 900, color: 'white', marginBottom: 12 }}>Welcome, Operative</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 30 }}>
                Protocol established. Your profile has been synchronized with the Nexus. 
                Your journey towards peak performance begins now.
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {[
                  { label: 'Identity', value: user?.username || 'Unknown', icon: User },
                  { label: 'Objective', value: user?.fitnessGoal || 'Peak Performance', icon: Target },
                  { label: 'Protocol', value: user?.productivityStyle || 'Deep Work', icon: Zap },
                  { label: 'Biometrics', value: `${user?.weight}kg / ${user?.height}cm`, icon: Activity },
                ].map((item, i) => (
                  <div key={i} style={{ padding: '12px 8px', background: 'var(--bg-elevated)', borderRadius: 16, border: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <item.icon size={10} color="var(--accent-primary)" />
                      <span style={{ fontSize: 9, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{item.label}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.value}</div>
                  </div>
                ))}
              </div>

              <button 
                onClick={dismissWelcome}
                className="btn btn-primary" 
                style={{ width: '100%', height: 50, marginTop: 30, fontSize: 15, fontWeight: 900 }}
              >
                Initialize Dashboard <ArrowRight size={18} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Welcome Hero - High-Fidelity Interactive Hub */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.005, boxShadow: '0 25px 60px rgba(99, 102, 241, 0.25)' }}
        style={{
          background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
          borderRadius: 'var(--radius-xl)',
          padding: 'clamp(24px, 5vw, 40px)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          cursor: 'default',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <div style={{ position: 'relative', zIndex: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'clamp(20px, 4vw, 32px)' }}>
          <div style={{ flex: '1 1 280px' }}>
            <motion.div 
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 'clamp(10px, 2vw, 12px)', fontWeight: 900, background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 1.5, backdropFilter: 'blur(10px)' }}>
                {user?.productivityStyle || 'Standard'} Protocol Active
              </span>
              <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 10px #4ade80' }} />
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              style={{ fontSize: 'clamp(24px, 6vw, 40px)', fontWeight: 950, marginBottom: 10, letterSpacing: -1.5, lineHeight: 1.1 }}>
              {greeting}, <br className="hide-desktop" />
              <span style={{ color: 'rgba(255,255,255,0.85)' }}>{user?.username || user?.name || 'Operative'}</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }} animate={{ opacity: 0.9 }} transition={{ delay: 0.4 }}
              style={{ fontSize: 'clamp(14px, 3vw, 16px)', maxWidth: 480, lineHeight: 1.6, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} /> Mission: <span style={{ fontWeight: 800 }}>{user?.fitnessGoal || 'Peak Performance'}</span>
            </motion.p>
          </div>
          
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5, type: 'spring' }}
            whileHover={{ scale: 1.05 }}
            style={{ 
              textAlign: 'center', background: 'rgba(255,255,255,0.12)', padding: 'clamp(16px, 4vw, 24px) clamp(24px, 5vw, 36px)', 
              borderRadius: 24, border: '1.5px solid rgba(255,255,255,0.25)', 
              backdropFilter: 'blur(16px)', boxShadow: '0 15px 35px rgba(0,0,0,0.15)',
              flex: '0 1 auto'
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4, opacity: 0.8 }}>Discipline Grade</div>
            <div style={{ fontSize: 'clamp(40px, 8vw, 56px)', fontWeight: 950, textShadow: '0 10px 20px rgba(0,0,0,0.15)', lineHeight: 1 }}>{disciplineScore?.grade || 'N/A'}</div>
            <div style={{ fontSize: 12, fontWeight: 800, marginTop: 4, opacity: 0.9 }}>SCORE: {disciplineScore?.score || 0}</div>
          </motion.div>
        </div>
        
        {/* Animated Tactical Background Elements */}
        <motion.div 
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1],
            x: [0, 20, 0],
            y: [0, -20, 0]
          }} 
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          style={{ position: 'absolute', top: -100, right: -100, width: 350, height: 350, background: 'rgba(255,255,255,0.08)', borderRadius: '40%', zIndex: 1 }}
        />
        <motion.div 
          animate={{ 
            rotate: -360,
            scale: [1, 1.2, 1],
            x: [0, -30, 0],
            y: [0, 30, 0]
          }} 
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          style={{ position: 'absolute', bottom: -150, left: -100, width: 400, height: 400, background: 'rgba(255,255,255,0.05)', borderRadius: '35%', zIndex: 1 }}
        />
      </motion.div>

      <div className="grid-4">
        <StatCard label="Task Focus" value={`${completionPct}%`} sub={`${completed}/${total} Done`} icon={CheckCircle2} color="var(--color-success)" delay={0.05} onClick={() => setPage('today')} />
        <StatCard label="Fitness Pulse" value={fitnessStats.workoutCount} sub="Sessions (7d)" icon={Zap} color="#10b981" delay={0.1} onClick={() => setPage('gym')} />
        <StatCard label="Hydration" value={`${hydrationPct}%`} sub="Daily Intake" icon={Activity} color="#0ea5e9" delay={0.15} onClick={() => setPage('today')} />
        <StatCard label="Physiology" value={`${latestWeight} kg`} sub="Current Weight" icon={Target} color="#8b5cf6" delay={0.2} onClick={() => setPage('analytics')} />
      </div>

      {/* Neural Hub: Scratchpad */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
        <NeuralScratchpad />
      </div>

      <BioHacker />

      {/* Charts row */}
      <div className="grid-2">
        <motion.div className="card-glass" style={{ padding: 24, borderRadius: 'var(--radius-xl)', minWidth: 0 }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <div className="section-header">
            <div className="section-title">Weekly Momentum</div>
            <TrendingUp size={16} color="var(--accent-primary)" />
          </div>
          <div style={{ width: '100%', height: 220, minHeight: 220 }}>
            <ResponsiveContainer width="99%" height="100%">
            <AreaChart data={weekData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="momentumGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 12, boxShadow: 'var(--shadow-md)' }}
                formatter={(v) => [`${v}%`, 'Completion']}
              />
              <Area type="monotone" dataKey="score" stroke="var(--accent-primary)" strokeWidth={3} fill="url(#momentumGradient)" />
            </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div className="card-glass" style={{ padding: 24, borderRadius: 'var(--radius-xl)' }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
          <div className="section-header">
            <div className="section-title">Mission Timeline</div>
            <Activity size={16} color="var(--accent-secondary)" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 10 }}>
            {upcomingTasks.length > 0 ? upcomingTasks.map((t, idx) => (
              <motion.div 
                key={t.id} 
                whileHover={{ x: 5 }}
                onClick={() => setPage('today')}
                style={{ display: 'flex', gap: 16, position: 'relative', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--accent-primary)', border: '2px solid var(--bg-page)', zIndex: 2 }} />
                  {idx < upcomingTasks.length - 1 && <div style={{ flex: 1, width: 2, background: 'var(--border-default)', margin: '4px 0' }} />}
                </div>
                <div style={{ flex: 1, paddingBottom: idx < upcomingTasks.length - 1 ? 20 : 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>{t.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <span style={{ padding: '2px 8px', background: 'var(--bg-hover)', borderRadius: 10, fontSize: 9, fontWeight: 900, textTransform: 'uppercase' }}>{t.category}</span>
                    <span style={{ fontWeight: 700 }}>• {t.priority}</span>
                  </div>
                </div>
              </motion.div>
            )) : (
              <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.5 }}>
                <CheckCircle2 size={32} style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 13, fontWeight: 700 }}>All missions completed</div>
              </div>
            )}
            {upcomingTasks.length > 0 && (
              <button className="btn btn-ghost" style={{ width: '100%', marginTop: 10, fontSize: 12, fontWeight: 800 }} onClick={() => setPage('routines')}>
                View Full Protocol <ArrowRight size={14} style={{ marginLeft: 6 }} />
              </button>
            )}
          </div>
        </motion.div>
      </div>

      <div className="grid-2">
        <motion.div className="card" style={{ borderRadius: 'var(--radius-xl)' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className="section-header">
            <div className="section-title">Recent Intelligence</div>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage('calendar')}>Log <ArrowRight size={12}/></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentDays.map((d) => (
              <div key={d.key} onClick={() => { setActiveDate(d.key); setPage('today'); }}
                style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', border: '1px solid var(--border-subtle)' }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>{d.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{d.completed}/{d.total} OBJECTIVES</div>
                </div>
                {d.submitted && <CheckCircle2 size={16} color="var(--color-success)" />}
                <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--accent-primary)' }}>{d.total > 0 ? Math.round((d.completed/d.total)*100) : 0}%</div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div className="card" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <div style={{ background: 'linear-gradient(135deg, var(--bg-elevated), var(--bg-surface))', padding: '24px', borderBottom: '1px solid var(--border-subtle)' }}>
             <div className="section-title">Elite Status</div>
             <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--accent-primary)', marginTop: 8 }}>{lvl.title}</div>
             <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>LEVEL {lvl.level} OPERATIVE</div>
          </div>
          <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 800 }}>RANK PROGRESS</span>
              <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)' }}>{gamification.xp} / {lvl.next?.xpRequired || 'MAX'} XP</span>
            </div>
            <div style={{ height: 12, background: 'var(--bg-elevated)', borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${lvl.progress}%` }} transition={{ duration: 1.5 }} style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
               {gamification.streak > 0 && <div className="badge" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>🔥 {gamification.streak} DAY STREAK</div>}
               {gamification.xp > 500 && <div className="badge" style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1' }}>⚡ ELITE UNIT</div>}
               {lvl.level > 5 && <div className="badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>🏆 MASTER</div>}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
