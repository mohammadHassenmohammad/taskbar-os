import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, AlertTriangle, Zap, Target, Calendar, Activity, Lightbulb } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

function InsightCard({ icon: Icon, title, body, evidence, color, delay = 0, actionTab, actionLabel, onAction }) {
  return (
    <motion.div
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${color}22`,
        borderLeft: `4px solid ${color}`,
        borderRadius: 'var(--radius-lg)',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.35 }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={18} color={color} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-primary)' }}>{title}</div>
            <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>INSIGHT OBSERVATION</div>
          </div>
        </div>

        {actionTab && actionLabel && (
          <button 
            className="btn btn-ghost btn-sm"
            onClick={() => onAction(actionTab)}
            style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent-primary)', flexShrink: 0, padding: '4px 10px', background: 'rgba(99,102,241,0.1)', borderRadius: 8 }}
          >
            {actionLabel} →
          </button>
        )}
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{body}</div>

      {evidence && (
        <div style={{ padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border-subtle)', fontSize: 11, display: 'flex', gap: 8, alignItems: 'center' }}>
          <strong style={{ color: 'var(--accent-primary)', textTransform: 'uppercase', fontSize: 10, letterSpacing: 0.5 }}>EVIDENCE:</strong>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{evidence}</span>
        </div>
      )}
    </motion.div>
  );
}

export default function AIInsights() {
  const { 
    tasks, gamification, getCrossModuleInsights, 
    setPage, setDietActiveDate, setGymActiveDate 
  } = useStore();

  const today = format(new Date(), 'yyyy-MM-dd');

  const handleAction = (tab) => {
    if (tab === 'diet') setDietActiveDate(today);
    if (tab === 'gym') setGymActiveDate(today);
    setPage(tab || 'today');
  };

  const realInsights = useMemo(() => {
    const list = getCrossModuleInsights(today);
    return list.map(item => ({
      icon: item.type === 'warning' ? AlertTriangle : item.type === 'success' ? Zap : Lightbulb,
      title: item.title,
      body: item.message,
      color: item.type === 'warning' ? 'var(--color-warning)' : item.type === 'success' ? 'var(--color-success)' : 'var(--accent-primary)',
      actionTab: item.actionTab,
      actionLabel: item.actionLabel
    }));
  }, [getCrossModuleInsights, today]);

  const allTasks = useMemo(() => Object.values(tasks).flat(), [tasks]);

  // 30-day trend
  const trend30 = useMemo(() => {
    const start = subDays(new Date(), 29);
    return eachDayOfInterval({ start, end: new Date() }).map((d) => {
      const key = format(d, 'yyyy-MM-dd');
      const dt = tasks[key] || [];
      return {
        label: format(d, 'MMM d'),
        score: dt.length > 0 ? Math.round((dt.filter((t) => t.completed).length / dt.length) * 100) : null,
        tasks: dt.length,
      };
    });
  }, [tasks]);

  // Skill radar (category completion rates)
  const radarData = useMemo(() => {
    const cats = ['Work', 'Personal', 'Health', 'Learning', 'Creative', 'Social'];
    return cats.map((cat) => {
      const catTasks = allTasks.filter((t) => t.category === cat);
      const done = catTasks.filter((t) => t.completed).length;
      const score = catTasks.length > 0 ? Math.round((done / catTasks.length) * 100) : 0;
      return { subject: cat, score, fullMark: 100 };
    });
  }, [allTasks]);

  // Productivity patterns
  const patterns = useMemo(() => {
    const total = allTasks.length;
    const completed = allTasks.filter((t) => t?.completed).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const highPriTotal = allTasks.filter((t) => t?.priority === 'High').length;
    const highPriDone = allTasks.filter((t) => t?.priority === 'High' && t?.completed).length;
    const highPriRate = highPriTotal > 0 ? Math.round((highPriDone / highPriTotal) * 100) : 0;

    const currentStreak = Number(gamification?.streak) || 0;
    const maxStreak = Math.max(currentStreak, Number(gamification?.maxStreak) || currentStreak);

    return { rate, highPriRate, highPriTotal, maxStreak };
  }, [allTasks, gamification]);

  const currentStreak = Number(gamification?.streak) || 0;

  // AI-generated insights
  const insights = useMemo(() => {
    const ins = [];
    if (allTasks.length === 0) {
      ins.push({ icon: Target, title: 'Getting Started', body: 'Add your first tasks to unlock personalized productivity insights tailored to your actual patterns.', color: 'var(--accent-primary)' });
      return ins;
    }
    if (patterns.rate >= 80) {
      ins.push({ icon: Zap, title: 'High Performer', body: `Consistent execution! Your ${patterns.rate}% completion rate demonstrates strong focus and daily follow-through.`, color: 'var(--color-success)' });
    } else if (patterns.rate >= 50) {
      ins.push({ icon: TrendingUp, title: 'Growing Steadily', body: `Your ${patterns.rate}% completion rate shows steady progress. Focus on closing active tasks before starting new ones.`, color: 'var(--color-info)' });
    } else {
      ins.push({ icon: AlertTriangle, title: 'Productivity Alert', body: `Your completion rate is currently ${patterns.rate}%. Consider scheduling fewer, higher-leverage tasks each day.`, color: 'var(--color-warning)' });
    }

    if (patterns.highPriRate < 60 && patterns.highPriTotal > 2) {
      ins.push({ icon: AlertTriangle, title: 'Priority Bottleneck', body: `Only ${patterns.highPriRate}% of high-priority tasks are completed. Schedule high-impact items during your peak morning energy window.`, color: 'var(--color-danger)' });
    } else if (patterns.highPriTotal > 0) {
      ins.push({ icon: Target, title: 'Priority Focus', body: `Great discipline! You are completing ${patterns.highPriRate}% of high-priority tasks.`, color: 'var(--color-success)' });
    }

    if (currentStreak >= 7) {
      ins.push({ icon: Activity, title: 'Streak Champion', body: `${currentStreak}-day consistency streak. Regular daily action builds lasting momentum.`, color: 'var(--color-warning)' });
    } else if (currentStreak === 0) {
      ins.push({ icon: Calendar, title: 'Build Consistency', body: 'Completing even one task today maintains streak momentum and focus.', color: 'var(--accent-secondary)' });
    }

    if (patterns.maxStreak >= 5) {
      ins.push({ icon: Brain, title: 'Consistency Trend', body: `You achieved a ${patterns.maxStreak}-day streak recently. Maintain this routine to consolidate habits.`, color: 'var(--accent-primary)' });
    }

    ins.push({ icon: Lightbulb, title: 'Execution Tip', body: 'Group similar administrative tasks together to protect uninterrupted deep focus blocks.', color: 'var(--accent-secondary)' });

    return ins;
  }, [patterns, currentStreak, allTasks.length]);

  // Focus score (0-100) — guaranteed non-NaN
  const focusScore = Math.min(100, Math.max(0, Math.round(
    ((patterns.rate || 0) * 0.4) +
    ((patterns.highPriRate || 0) * 0.3) +
    (Math.min(currentStreak, 30) / 30 * 100 * 0.2) +
    (Math.min(patterns.maxStreak || 0, 5) / 5 * 100 * 0.1)
  ))) || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <motion.div
        style={{ display: 'flex', alignItems: 'center', gap: 16 }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--shadow-glow)', fontSize: 22,
        }}>
          🤖
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>AI Productivity Coach</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Personalized insights based on your patterns</div>
        </div>
      </motion.div>

      {/* Score cards */}
      <div className="grid-3">
        {[
          { label: 'Focus Score', value: focusScore, suffix: '/100', color: 'var(--accent-primary)' },
          { label: 'Consistency', value: Math.min(100, gamification.streak * 10), suffix: '%', color: 'var(--color-success)' },
          { label: 'Completion Rate', value: patterns.rate, suffix: '%', color: 'var(--color-info)' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <span className="stat-label">{s.label}</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span className="stat-value" style={{ color: s.color }}>{s.value}</span>
              <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{s.suffix}</span>
            </div>
            <div style={{ height: 4, background: 'var(--border-subtle)', borderRadius: 4, overflow: 'hidden', marginTop: 4 }}>
              <motion.div
                style={{ height: '100%', background: s.color, borderRadius: 4 }}
                initial={{ width: 0 }}
                animate={{ width: `${s.value}%` }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.8 }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid-2">
        {/* 30-day trend */}
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="section-title" style={{ marginBottom: 16 }}>30-Day Productivity Trend</div>
          <div style={{ width: '100%', height: 190, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend30} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 9 }} axisLine={false} tickLine={false} interval={6} />
                <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 11 }}
                  formatter={(v) => v !== null ? [`${v}%`, 'Score'] : ['No data', '']}
                />
                <Line type="monotone" dataKey="score" stroke="var(--accent-primary)" strokeWidth={2} dot={false} connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Skill radar */}
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className="section-title" style={{ marginBottom: 16 }}>Skill Spider Chart</div>
          <div style={{ width: '100%', height: 190, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border-default)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <Radar name="Score" dataKey="score" stroke="var(--accent-primary)" fill="var(--accent-primary)" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* AI Insights & Real Cross-Module Intelligence */}
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Brain size={16} color="var(--accent-primary)" />
          <span>Real-Data Cross-Module Intelligence & Actionable Insights</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...realInsights, ...insights].map((ins, i) => (
            <InsightCard key={i} {...ins} onAction={handleAction} delay={0.3 + i * 0.06} />
          ))}
        </div>
      </div>

      {/* Burnout detector */}
      <motion.div
        className="card"
        style={{
          background: patterns.rate < 30 && allTasks.length > 5
            ? 'linear-gradient(135deg, rgba(255,94,114,0.08), rgba(245,166,35,0.05))'
            : 'linear-gradient(135deg, rgba(16,217,142,0.06), rgba(56,189,248,0.04))',
          border: `1px solid ${patterns.rate < 30 && allTasks.length > 5 ? 'rgba(255,94,114,0.15)' : 'rgba(16,217,142,0.12)'}`,
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>{patterns.rate < 30 && allTasks.length > 5 ? '⚠️' : '✅'}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: patterns.rate < 30 && allTasks.length > 5 ? 'var(--color-danger)' : 'var(--color-success)' }}>
            {patterns.rate < 30 && allTasks.length > 5 ? 'Burnout Risk Detected' : 'Mental Wellness: Good'}
          </span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
          {patterns.rate < 30 && allTasks.length > 5
            ? 'Your completion rate is significantly low with many tasks. This could indicate overload or burnout. Consider reducing your daily task count and taking breaks.'
            : "Your workload and completion patterns look healthy. Keep maintaining a sustainable pace to avoid future burnout. Remember to take breaks!"}
        </p>
      </motion.div>
    </div>
  );
}
