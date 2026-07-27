import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { format, subDays, eachDayOfInterval, isSameDay } from 'date-fns';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, AlertTriangle, Zap, Target, Calendar, Activity, Lightbulb } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

function InsightCard({ icon: Icon, title, body, color, delay = 0 }) {
  return (
    <motion.div
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${color}22`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px',
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
      }}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.35 }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={18} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{body}</div>
      </div>
    </motion.div>
  );
}

export default function AIInsights() {
  const { tasks, gamification } = useStore();

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
    const completed = allTasks.filter((t) => t.completed).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const highPriDone = allTasks.filter((t) => t.priority === 'High' && t.completed).length;
    const highPriTotal = allTasks.filter((t) => t.priority === 'High').length;
    const highPriRate = highPriTotal > 0 ? Math.round((highPriDone / highPriTotal) * 100) : 0;

    // Streaks
    let maxStreak = 0, cur = 0;
    trend30.forEach((d) => {
      if (d.score !== null && d.score >= 50) { cur++; maxStreak = Math.max(maxStreak, cur); }
      else cur = 0;
    });

    return { rate, highPriRate, highPriTotal, maxStreak };
  }, [allTasks, trend30]);

  // AI-generated insights
  const insights = useMemo(() => {
    const ins = [];
    if (allTasks.length === 0) {
      ins.push({ icon: Target, title: 'Getting Started', body: 'Add your first tasks to unlock personalized AI productivity insights tailored to your patterns.', color: 'var(--accent-primary)' });
      return ins;
    }
    if (patterns.rate >= 80) {
      ins.push({ icon: Zap, title: 'High Performer', body: `Excellent! Your ${patterns.rate}% completion rate puts you in the top tier. Consistency is your superpower — keep building on it.`, color: 'var(--color-success)' });
    } else if (patterns.rate >= 50) {
      ins.push({ icon: TrendingUp, title: 'Growing Steadily', body: `Your ${patterns.rate}% completion rate shows good progress. Focus on completing one more task per day to break into high-performer territory.`, color: 'var(--color-info)' });
    } else {
      ins.push({ icon: AlertTriangle, title: 'Productivity Alert', body: `Your completion rate is ${patterns.rate}%. This may indicate over-planning. Try scheduling fewer, more focused tasks each day.`, color: 'var(--color-warning)' });
    }

    if (patterns.highPriRate < 60 && patterns.highPriTotal > 2) {
      ins.push({ icon: AlertTriangle, title: 'Procrastination Pattern', body: `Only ${patterns.highPriRate}% of your high-priority tasks are completed. Tackle your hardest task first thing in the morning ("Eat the Frog" method).`, color: 'var(--color-danger)' });
    } else if (patterns.highPriTotal > 0) {
      ins.push({ icon: Target, title: 'Priority Focus', body: `Great job! You're completing ${patterns.highPriRate}% of high-priority tasks. This focused approach maximizes your impact.`, color: 'var(--color-success)' });
    }

    if (gamification.streak >= 7) {
      ins.push({ icon: Activity, title: 'Streak Champion', body: `🔥 ${gamification.streak}-day streak! You're building a powerful productivity habit. Research shows habits solidify after 21 days — keep going!`, color: 'var(--color-warning)' });
    } else if (gamification.streak === 0) {
      ins.push({ icon: Calendar, title: 'Start Your Streak', body: 'Consistency beats intensity. Completing even one task daily builds the momentum that separates successful people from the rest.', color: 'var(--accent-secondary)' });
    }

    if (patterns.maxStreak >= 5) {
      ins.push({ icon: Brain, title: 'Flow State Detected', body: `You achieved a ${patterns.maxStreak}-day productive streak in the last month. Identify what conditions made those days work and replicate them.`, color: 'var(--accent-primary)' });
    }

    ins.push({ icon: Lightbulb, title: 'Optimization Tip', body: 'Schedule your most cognitively demanding tasks between 9-11 AM when mental clarity peaks. Save administrative tasks for afternoons.', color: 'var(--accent-secondary)' });

    return ins;
  }, [patterns, gamification.streak]);

  // Focus score (0-100)
  const focusScore = Math.min(100, Math.round(
    (patterns.rate * 0.4) +
    (patterns.highPriRate * 0.3) +
    (Math.min(gamification.streak, 30) / 30 * 100 * 0.2) +
    (patterns.maxStreak / 5 * 100 * 0.1)
  ));

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

      {/* AI Insights */}
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Brain size={16} color="var(--accent-primary)" />
          Personalized Recommendations
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {insights.map((ins, i) => (
            <InsightCard key={i} {...ins} delay={0.3 + i * 0.06} />
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
