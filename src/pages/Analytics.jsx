import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { format, subDays, eachDayOfInterval, startOfMonth, endOfMonth, eachWeekOfInterval, startOfWeek, endOfWeek, parse, differenceInMinutes } from 'date-fns';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import { TrendingUp, Award, Target, Zap, Calendar, Activity } from 'lucide-react';

const HEATMAP_COLORS = ['var(--bg-elevated)', '#1e3a2f', '#166434', '#16a34a', '#22c55e'];
const CAT_COLORS = ['#6e6aff', '#a78bfa', '#10d98e', '#38bdf8', '#f5a623', '#ff5e72'];

function Section({ title, sub, children, delay = 0 }) {
  return (
    <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }}>
      <div className="section-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="section-title">{title}</div>
          {sub && <div className="section-sub">{sub}</div>}
        </div>
      </div>
      {children}
    </motion.div>
  );
}

export default function Analytics() {
  const { tasks, gamification, workouts, personalRecords, user, sleepLogs, energyLogs } = useStore();
  const todayKey = format(new Date(), 'yyyy-MM-dd');

  // --- Operative Intelligence ---
  const intelligence = useMemo(() => {
    if (!user) return null;
    const w = parseFloat(user.weight) || 0;
    const h = parseFloat(user.height) || 0;
    const a = parseInt(user.age) || 0;
    const g = user.gender || 'Other';
    
    // BMI
    const bmi = h > 0 ? (w / ((h / 100) ** 2)).toFixed(1) : 0;
    
    // BMR (Mifflin-St Jeor Equation)
    let bmr = 0;
    if (w > 0 && h > 0 && a > 0) {
      if (g === 'Male') bmr = 10 * w + 6.25 * h - 5 * a + 5;
      else if (g === 'Female') bmr = 10 * w + 6.25 * h - 5 * a - 161;
      else bmr = 10 * w + 6.25 * h - 5 * a - 78; // Average
    }
    
    // Water (basic calculation: 35ml per kg)
    const water = (w * 0.035).toFixed(1);
    
    return { bmi, bmr: Math.round(bmr), water, fitnessGoal: user.fitnessGoal, style: user.productivityStyle };
  }, [user]);

  // --- Last 30 days daily data ---
  const dailyData = useMemo(() => {
    const start = subDays(new Date(), 29);
    return eachDayOfInterval({ start, end: new Date() }).map((d) => {
      const key = format(d, 'yyyy-MM-dd');
      const dayTasks = tasks[key] || [];
      const done = dayTasks.filter((t) => t.completed).length;
      return {
        date: key,
        label: format(d, 'MMM d'),
        shortLabel: format(d, 'd'),
        total: dayTasks.length,
        completed: done,
        score: dayTasks.length > 0 ? Math.round((done / dayTasks.length) * 100) : 0,
      };
    });
  }, [tasks, todayKey]);

  // --- Weekly aggregates ---
  const weeklyData = useMemo(() => {
    const data = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const weekStart = startOfWeek(subDays(now, i * 7));
      const weekEnd = endOfWeek(weekStart);
      const label = `W${format(weekStart, 'ww')}`;
      let total = 0, done = 0;
      eachDayOfInterval({ start: weekStart, end: weekEnd }).forEach((d) => {
        const key = format(d, 'yyyy-MM-dd');
        const dt = tasks[key] || [];
        total += dt.length;
        done += dt.filter((t) => t.completed).length;
      });
      data.push({ label, total, completed: done, score: total > 0 ? Math.round((done / total) * 100) : 0 });
    }
    return data;
  }, [tasks, todayKey]);

  // --- Category performance ---
  const categoryData = useMemo(() => {
    const map = {};
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    Object.entries(tasks).forEach(([date, dayTasks]) => {
      if (date > todayStr) return; // Mission protocol: Exclude future projections
      dayTasks.forEach((t) => {
        if (!t || !t.category) return;
        if (!map[t.category]) map[t.category] = { total: 0, done: 0 };
        map[t.category].total++;
        if (t.completed) map[t.category].done++;
      });
    });
    return Object.entries(map).map(([name, data]) => ({
      name,
      value: Math.round((data.done / data.total) * 100),
      total: data.total
    })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [tasks]);

  // --- Priority distribution ---
  const priorityData = useMemo(() => {
    const map = { Low: 0, Medium: 0, High: 0 };
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    Object.entries(tasks).forEach(([date, dayTasks]) => {
      if (date > todayStr) return;
      dayTasks.forEach((t) => { 
        if (t && t.priority) map[t.priority] = (map[t.priority] || 0) + 1; 
      });
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [tasks]);

  // --- Summary stats ---
  const allTasks = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    return Object.entries(tasks).flatMap(([date, dayTasks]) => {
      if (date > todayStr) return [];
      return dayTasks;
    }).filter(Boolean);
  }, [tasks]);
  const totalAllTime = allTasks.length;
  const completedAllTime = allTasks.filter((t) => t.completed).length;
  const overallRate = totalAllTime > 0 ? Math.round((completedAllTime / totalAllTime) * 100) : 0;
  const avgPerDay = dailyData.length > 0 ? (dailyData.reduce((s, d) => s + d.total, 0) / 30).toFixed(1) : 0;
  const bestDay = dailyData.reduce((best, d) => d.score > best.score ? d : best, { score: 0, label: 'N/A' });

  // --- Heatmap (last 12 weeks) ---
  const heatmapData = useMemo(() => {
    const weeks = [];
    const now = new Date();
    for (let w = 11; w >= 0; w--) {
      const wStart = startOfWeek(subDays(now, w * 7));
      const col = [];
      for (let d = 0; d < 7; d++) {
        const day = new Date(wStart);
        day.setDate(day.getDate() + d);
        const key = format(day, 'yyyy-MM-dd');
        const dt = tasks[key] || [];
        const pct = dt.length > 0 ? dt.filter((t) => t.completed).length / dt.length : 0;
        col.push({ key, pct, count: dt.length, label: format(day, 'MMM d') });
      }
      weeks.push(col);
    }
    return weeks;
  }, [tasks, todayKey]);

  const getHeatColor = (pct, count) => {
    if (count === 0) return HEATMAP_COLORS[0];
    if (pct === 0) return '#2a1f1f';
    if (pct < 0.25) return HEATMAP_COLORS[1];
    if (pct < 0.5) return HEATMAP_COLORS[2];
    if (pct < 0.75) return HEATMAP_COLORS[3];
    return HEATMAP_COLORS[4];
  };

  // --- Fitness analysis ---
  const fitnessData = useMemo(() => {
    const start = subDays(new Date(), 29);
    const userWeight = parseFloat(user?.weight) || 75; // Fallback to 75kg
    return eachDayOfInterval({ start, end: new Date() }).map(d => {
      const key = format(d, 'yyyy-MM-dd');
      const dayWorkouts = workouts[key];
      let sets = 0;
      let tonnage = 0;
      if (dayWorkouts && dayWorkouts.exercises) {
        dayWorkouts.exercises.forEach(ex => {
          (ex.sets || []).forEach(s => {
             if (s.completed) {
                sets++;
                const w = parseFloat(s.weight) || (ex.muscle === 'Cardio' ? 0 : userWeight);
                const r = parseInt(s.reps) || 0;
                tonnage += (w * r);
             }
          });
        });
      }
      return {
        label: format(d, 'MMM d'),
        sets,
        tonnage: Math.round(tonnage)
      };
    });
  }, [workouts, todayKey, user?.weight]);
  
  // --- Sleep Intelligence ---
  const sleepData = useMemo(() => {
    const start = subDays(new Date(), 29);
    return eachDayOfInterval({ start, end: new Date() }).map(d => {
      const key = format(d, 'yyyy-MM-dd');
      const log = sleepLogs[key];
      const dayTasks = tasks[key] || [];
      const score = dayTasks.length > 0 ? (dayTasks.filter(t => t.completed).length / dayTasks.length) * 100 : 0;
      
      let duration = 0;
      if (log) {
        const s = parse(log.start, 'HH:mm', d);
        let e = parse(log.end, 'HH:mm', d);
        if (e < s) e = new Date(e.getTime() + 24 * 60 * 60 * 1000);
        duration = differenceInMinutes(e, s) / 60;
      }
      
      return {
        label: format(d, 'MMM d'),
        duration: parseFloat(duration.toFixed(1)),
        quality: log?.quality || 0,
        score: Math.round(score)
      };
    });
  }, [sleepLogs, tasks, todayKey]);

  const sleepLogCount = sleepData.filter(d => d.duration > 0).length;
  const avgSleepDuration = (sleepLogCount > 0 ? sleepData.reduce((s, d) => s + d.duration, 0) / sleepLogCount : 0).toFixed(1);
  const avgSleepQuality = (sleepLogCount > 0 ? sleepData.reduce((s, d) => s + d.quality, 0) / sleepLogCount : 0).toFixed(1);

  const energyFlowData = useMemo(() => {
    // Group energy logs by hour across the last 30 days to see peak performance windows
    const hourMap = {};
    for (let i = 0; i < 24; i++) {
      const h = i.toString().padStart(2, '0') + ':00';
      hourMap[h] = { count: 0, sum: 0 };
    }

    Object.values(energyLogs).forEach(dayLogs => {
      dayLogs.forEach(log => {
        const hour = log.time.split(':')[0] + ':00';
        if (hourMap[hour]) {
          hourMap[hour].count++;
          hourMap[hour].sum += log.level;
        }
      });
    });

    return Object.entries(hourMap).map(([hour, data]) => ({
      hour,
      avg: data.count > 0 ? parseFloat((data.sum / data.count).toFixed(1)) : 0
    })).filter(d => d.avg > 0 || ['08:00', '12:00', '16:00', '20:00'].includes(d.hour));
  }, [energyLogs]);

  const totalSets30 = useMemo(() => fitnessData.reduce((s, d) => s + d.sets, 0), [fitnessData]);
  const avgSetsPerDay = (totalSets30 / 30).toFixed(1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Summary stats */}
      <div className="grid-4">
        {[
          { label: 'Total Tasks', value: totalAllTime, icon: Target, color: 'var(--accent-primary)' },
          { label: 'Completed', value: completedAllTime, icon: Award, color: 'var(--color-success)' },
          { label: 'Overall Rate', value: `${overallRate}%`, icon: TrendingUp, color: 'var(--color-info)' },
          { label: 'Best Day Score', value: `${bestDay.score}%`, icon: Zap, color: 'var(--color-warning)', sub: bestDay.label },
        ].map((s, i) => (
          <motion.div className="stat-card" key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="stat-label">{s.label}</span>
              <s.icon size={16} color={s.color} />
            </div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            {s.sub && <div className="stat-sub">{s.sub}</div>}
          </motion.div>
        ))}
      </div>

      {/* Operative Intelligence */}
      {intelligence && (
        <Section title="Operative Intelligence" sub="Biometric analysis and mission parameters" delay={0.08}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
             {[
               { label: 'BMI Index', value: intelligence.bmi, icon: Activity, color: '#6366f1', detail: 'Body Mass Index' },
               { label: 'BMR (Daily)', value: `${intelligence.bmr} kcal`, icon: Zap, color: '#f59e0b', detail: 'Basal Metabolic Rate' },
               { label: 'Hydration Target', value: `${intelligence.water} L`, icon: Target, color: '#0ea5e9', detail: 'Recommended daily' },
               { label: 'Core Mission', value: intelligence.fitnessGoal, icon: Award, color: '#10b981', detail: 'Primary Objective' },
             ].map((item, idx) => (
               <div key={idx} style={{ padding: 16, background: 'var(--bg-elevated)', borderRadius: 16, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                     <div style={{ padding: 8, borderRadius: 10, background: `${item.color}15`, color: item.color }}>
                        <item.icon size={16} />
                     </div>
                     <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{item.label}</span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)' }}>{item.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{item.detail}</div>
               </div>
             ))}
          </div>
        </Section>
      )}

      {/* Daily Score 30d */}
      <Section title="30-Day Performance" sub="Daily task completion score" delay={0.1}>
        <div style={{ width: '100%', height: 200, minWidth: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="shortLabel" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
              <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 }}
                formatter={(v, n) => [n === 'score' ? `${v}%` : v, n === 'score' ? 'Score' : 'Tasks']}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.label || ''}
              />
              <Area type="monotone" dataKey="score" stroke="var(--accent-primary)" strokeWidth={2} fill="url(#aGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Section>

      <div className="grid-2">
        {/* Weekly bar chart */}
        <Section title="Weekly Comparison" sub="Tasks completed per week" delay={0.15}>
          <div style={{ width: '100%', height: 200, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12, color: 'var(--text-primary)' }}
                />
                <Bar dataKey="completed" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} name="Completed" />
                <Bar dataKey="total" fill="var(--bg-elevated)" radius={[4, 4, 0, 0]} name="Total" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>

        {/* Priority distribution Pie */}
        <Section title="Priority Distribution" sub="How tasks are distributed" delay={0.2}>
          <div style={{ width: '100%', height: 200, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={priorityData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" nameKey="name">
                  {priorityData.map((entry, index) => (
                    <Cell key={entry.name} fill={['var(--priority-low)', 'var(--priority-medium)', 'var(--priority-high)'][index]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }} />
                <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Section>
      </div>

      {/* Category Performance */}
      <Section title="Category Performance" sub="Completion rate per category" delay={0.25}>
        {categoryData.length === 0 ? (
          <div className="empty-state" style={{ padding: 24 }}>
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-title">No data</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {categoryData.map((c, i) => (
              <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: CAT_COLORS[i % CAT_COLORS.length], flexShrink: 0 }} />
                <div style={{ width: 90, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{c.name}</div>
                <div style={{ flex: 1, height: 8, background: 'var(--border-subtle)', borderRadius: 8, overflow: 'hidden' }}>
                  <motion.div
                    style={{ height: '100%', borderRadius: 8, background: CAT_COLORS[i % CAT_COLORS.length] }}
                    initial={{ width: 0 }}
                    animate={{ width: `${c.value}%` }}
                    transition={{ delay: 0.3 + i * 0.05, duration: 0.7 }}
                  />
                </div>
                <div style={{ width: 40, fontSize: 13, fontWeight: 700, color: CAT_COLORS[i % CAT_COLORS.length], textAlign: 'right' }}>
                  {c.value}%
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <div className="grid-2">
        {/* Fitness Volume 30d */}
        <Section title="Workout Volume" sub="Sets & Tonnage (last 30d)" delay={0.28}>
          <div style={{ width: '100%', height: 200, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={fitnessData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="fGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="tGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} interval={6} />
                <YAxis yAxisId="left" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }} />
                <Area yAxisId="left" type="monotone" dataKey="sets" stroke="#10b981" strokeWidth={2} fill="url(#fGrad)" name="Sets" />
                <Area yAxisId="right" type="monotone" dataKey="tonnage" stroke="#3b82f6" strokeWidth={2} fill="url(#tGrad)" name="Tonnage (kg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: 12, padding: 12, background: 'rgba(16,185,129,0.05)', borderRadius: 8, display: 'flex', justifyContent: 'space-between' }}>
             <div>
                <div style={{ fontSize: 9, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Intensity</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#10b981' }}>{avgSetsPerDay} Sets/Day</div>
             </div>
             <div>
                <div style={{ fontSize: 9, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Tonnage</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#3b82f6' }}>{Math.round(fitnessData.reduce((s, d) => s + d.tonnage, 0)).toLocaleString()} kg</div>
             </div>
          </div>
        </Section>

        {/* Focus vs Fitness Radar */}
        <Section title="Operative Balance" sub="Focus vs Physical Intensity" delay={0.3}>
          <div style={{ width: '100%', height: 200, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
               <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                 { 
                   subject: 'Consistency', 
                   A: Math.min(100, (gamification.streak / 20) * 100), 
                   B: Math.min(100, (fitnessData.filter(d => d.sets > 0).length / 24) * 100) 
                 },
                 { 
                   subject: 'Volume', 
                   A: overallRate, 
                   B: Math.min(100, (totalSets30 / 400) * 100) 
                 },
                 { 
                   subject: 'Intensity', 
                   A: bestDay.score, 
                   B: Math.min(100, (Math.max(...fitnessData.map(d => d.sets)) / 15) * 100) 
                 },
                 { 
                   subject: 'Recovery', 
                   A: Math.min(100, (parseFloat(avgSleepDuration) / 8) * 100), 
                   B: Math.min(100, (parseFloat(avgSleepQuality) / 10) * 100) 
                 },
                 { 
                   subject: 'Discipline', 
                   A: overallRate, 
                   B: Math.min(100, (fitnessData.filter(d => d.sets > 0).length / 30) * 100) 
                 },
               ]}>
                 <PolarGrid stroke="var(--border-subtle)" />
                 <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 700 }} />
                 <Radar name="Productivity" dataKey="A" stroke="var(--accent-primary)" fill="var(--accent-primary)" fillOpacity={0.4} />
                 <Radar name="Bio-Health" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                 <Legend iconSize={10} wrapperStyle={{ fontSize: 10, fontWeight: 800 }} />
               </RadarChart>
            </ResponsiveContainer>
          </div>
        </Section>
      </div>

      {/* Bio-Intelligence Correlation */}
      <div className="grid-2">
        <Section title="Sleep vs Productivity" sub="Correlation between recovery and completion" delay={0.32}>
           <div style={{ width: '100%', height: 200, minWidth: 0, minHeight: 0 }}>
             <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <AreaChart data={sleepData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} interval={6} />
                  <YAxis yAxisId="left" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }} />
                  <Area yAxisId="left" type="monotone" dataKey="score" stroke="var(--accent-primary)" strokeWidth={2} fill="var(--accent-primary)" fillOpacity={0.1} name="Task Score" />
                  <Area yAxisId="right" type="monotone" dataKey="duration" stroke="#8b5cf6" strokeWidth={2} fill="url(#sleepGrad)" name="Sleep Hrs" />
                </AreaChart>
             </ResponsiveContainer>
           </div>
           <div style={{ marginTop: 12, padding: 12, background: 'rgba(139,92,246,0.05)', borderRadius: 12, display: 'flex', justifyContent: 'space-between' }}>
              <div>
                 <div style={{ fontSize: 9, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Duration</div>
                 <div style={{ fontSize: 14, fontWeight: 900, color: '#8b5cf6' }}>{avgSleepDuration} Hrs</div>
              </div>
              <div>
                 <div style={{ fontSize: 9, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Quality</div>
                 <div style={{ fontSize: 14, fontWeight: 900, color: '#10b981' }}>{avgSleepQuality}/10</div>
              </div>
           </div>
        </Section>

        <Section title="Daily Energy Flow" sub="Aggregated energy pulse levels by hour" delay={0.34}>
           <div style={{ width: '100%', height: 200, minWidth: 0 }}>
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={energyFlowData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 10]} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="avg" fill="var(--color-success)" radius={[4, 4, 0, 0]} name="Avg Intensity" />
                </BarChart>
             </ResponsiveContainer>
           </div>
        </Section>
      </div>


      {/* Activity Heatmap */}
      <Section title="Activity Heatmap" sub="Task completion over the last 12 weeks" delay={0.3}>
        <div style={{ display: 'flex', gap: 4, alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginRight: 4, paddingTop: 2 }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} style={{ height: 13, fontSize: 8, color: 'var(--text-muted)', lineHeight: '13px', fontWeight: 600 }}>{d}</div>
            ))}
          </div>
          {heatmapData.map((week, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {week.map((cell) => (
                <div
                  key={cell.key}
                  className="heatmap-cell"
                  style={{ background: getHeatColor(cell.pct, cell.count) }}
                  title={`${cell.label}: ${cell.count > 0 ? `${Math.round(cell.pct * 100)}% (${cell.count} tasks)` : 'No tasks'}`}
                />
              ))}
            </div>
          ))}
        </div>
        {/* Heatmap legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 12, fontSize: 10, color: 'var(--text-muted)' }}>
          <span>Less</span>
          {HEATMAP_COLORS.map((c, i) => (
            <div key={i} style={{ width: 12, height: 12, borderRadius: 2, background: c, border: '1px solid var(--border-subtle)' }} />
          ))}
          <span>More</span>
        </div>
      </Section>
    </div>
  );
}
