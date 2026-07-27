import { useMemo } from 'react';
import { useStore, CATEGORIES } from '../store/useStore'; // Sync Heartbeat: 1778478600
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Download, Calendar, TrendingUp, Award, AlertCircle, Lightbulb, 
  Activity, Zap, Target, Flame, Trophy, Shield, Moon 
} from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORY_COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#ef4444', '#f59e0b', '#10b981', '#3b82f6'];

function generateInsights(monthlyData) {
  const { overallRate, waterRate, volumeTotal, fitnessFrequency, bestWeek } = monthlyData;
  const insights = [];

  // Productivity
  if (overallRate >= 80) insights.push({ type: 'success', icon: <Trophy size={14}/>, text: 'Superior operational tempo! Your completion rate indicates elite focus and discipline.' });
  else if (overallRate >= 50) insights.push({ type: 'info', icon: <Target size={14}/>, text: 'Consistent mission execution. Aim to minimize task overflow for peak efficiency.' });
  else insights.push({ type: 'warning', icon: <AlertCircle size={14}/>, text: 'Operational friction detected. Consider refining your daily protocol to prioritize high-impact missions.' });

  // Fitness
  if (fitnessFrequency >= 4) insights.push({ type: 'success', icon: <Flame size={14}/>, text: `Elite physical momentum! Working out ${fitnessFrequency}x/week is driving superior neural clarity.` });
  if (volumeTotal < 50) insights.push({ type: 'info', icon: <Activity size={14}/>, text: 'Physical volume is stabilizing. Increase set intensity to further boost mission focus.' });

  // Hydration
  if (waterRate < 70) insights.push({ type: 'warning', icon: <Shield size={14}/>, text: 'Hydration levels are sub-optimal. Neural processing requires absolute fluid balance.' });
  
  // Bio-Hacking (Sleep)
  if (monthlyData.avgSleepQuality >= 8) insights.push({ type: 'success', icon: <Moon size={14}/>, text: 'Elite recovery detected. High sleep quality is directly amplifying your tactical focus.' });
  else if (monthlyData.avgSleepQuality < 6 && monthlyData.totalTasks > 0) insights.push({ type: 'warning', icon: <Moon size={14}/>, text: 'Recovery deficit identified. Low sleep quality is likely introducing operational friction.' });

  if (bestWeek) insights.push({ type: 'tip', icon: <Zap size={14}/>, text: `Synergy Peak: ${bestWeek.label} showed your highest operative balance. Replicate that week's routine.` });

  return insights;
}

const INSIGHT_COLORS = {
  success: 'var(--color-success)',
  info: 'var(--color-info)',
  warning: 'var(--color-warning)',
  tip: 'var(--accent-secondary)',
};

const formatFocusTime = (seconds) => {
  if (!seconds) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

export default function MonthlyReport() {
  const { tasks, submittedDays, waterSchedule, waterCompletions, workouts, sleepLogs, energyLogs } = useStore();
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const days = useMemo(() => eachDayOfInterval({ start: monthStart, end: monthEnd }), [monthStart, monthEnd]);

  const reportData = useMemo(() => {
    let totalTasks = 0, completedTasks = 0, totalFocus = 0;
    let waterTotal = 0, waterDone = 0;
    let volumeTotal = 0, tonnageTotal = 0, workoutDays = 0;
    let sleepQualTotal = 0, sleepDays = 0;
    let energyStability = 0;
    const catMap = {};
    const byWeek = {};

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    days.forEach((d) => {
      const key = format(d, 'yyyy-MM-dd');
      if (key > todayStr) return; // Future missions are not part of current debrief
      
      // Tasks
      const dt = tasks[key] || [];
      totalTasks += dt.length;
      const done = dt.filter((t) => t.completed).length;
      completedTasks += done;
      totalFocus += dt.reduce((acc, t) => acc + (t.timeTaken || 0), 0);
      const dayWorkouts = workouts[key];

      dt.forEach(t => {
        catMap[t.category] = (catMap[t.category] || 0) + 1;
      });

      // Water
      waterTotal += waterSchedule.length;
      waterDone += Object.keys(waterCompletions[key] || {}).length;

      // Fitness OS Integration
      if (dayWorkouts && dayWorkouts.exercises) {
        workoutDays++;
        dayWorkouts.exercises.forEach(ex => {
          (ex.sets || []).forEach(s => {
             if (s.completed) {
                volumeTotal++;
                const w = parseFloat(s.weight) || (ex.muscle === 'Cardio' ? 0 : 75); 
                tonnageTotal += (w * (parseInt(s.reps) || 0));
             }
          });
        });
      }

      // Bio-Hacking
      const log = sleepLogs[key];
      if (log) {
        sleepQualTotal += log.quality;
        sleepDays++;
      }
      
      const eLogs = energyLogs[key] || [];
      if (eLogs.length > 0) energyStability += 1;

      const weekNum = Math.ceil(d.getDate() / 7);
      const wk = `Week ${weekNum}`;
      if (!byWeek[wk]) byWeek[wk] = { label: wk, tasks: 0, completed: 0, volume: 0 };
      byWeek[wk].tasks += dt.length;
      byWeek[wk].completed += done;
      
      if (dayWorkouts && dayWorkouts.exercises) {
        dayWorkouts.exercises.forEach(ex => {
           byWeek[wk].volume += (ex.sets || []).filter(s => s.completed).length;
        });
      }
    });

    const weeklyData = Object.values(byWeek).map((w) => ({
      ...w,
      score: w.tasks > 0 ? Math.round((w.completed / w.tasks) * 100) : 0,
    }));

    const categoryData = Object.entries(catMap).map(([name, value]) => ({ name, value }));
    const overallRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const waterRate = waterTotal > 0 ? Math.round((waterDone / waterTotal) * 100) : 0;
    const fitnessFrequency = (workoutDays / (days.length / 7)).toFixed(1);
    const bestWeek = weeklyData.reduce((b, w) => w.score > b.score ? w : b, { score: 0 });
    const avgSleepQuality = sleepDays > 0 ? sleepQualTotal / sleepDays : 0;
    const energyScore = days.length > 0 ? (energyStability / days.length) * 100 : 0;

    return { 
      totalTasks, completedTasks, weeklyData, overallRate, bestWeek: bestWeek.score > 0 ? bestWeek : null, 
      totalFocus, waterRate, waterDone, volumeTotal, tonnageTotal, workoutDays, fitnessFrequency, categoryData,
      avgSleepQuality, energyScore
    };
  }, [tasks, submittedDays, days, waterSchedule, waterCompletions, workouts]);

  const insights = useMemo(() => generateInsights(reportData), [reportData]);

  const handleDownload = () => {
    const lines = [
      `TASKBAR OS - GRAND STRATEGIC DEBRIEF`,
      `Month: ${format(now, 'MMMM yyyy')}`,
      `Generated: ${format(now, 'PPpp')}`,
      ``,
      `MISSION SUMMARY`,
      `Total Tasks: ${reportData.totalTasks}`,
      `Completed: ${reportData.completedTasks}`,
      `Operational Rate: ${reportData.overallRate}%`,
      `Total Focus Time: ${formatFocusTime(reportData.totalFocus)}`,
      ``,
      `PHYSICAL PERFORMANCE`,
      `Total Tonnage (kg): ${reportData.tonnageTotal.toLocaleString()}`,
      `Total Sets: ${reportData.volumeTotal}`,
      `Workout Frequency: ${reportData.fitnessFrequency} sessions/week`,
      `Hydration Consistency: ${reportData.waterRate}%`,
      ``,
      `BIO-INTELLIGENCE`,
      `Average Sleep Quality: ${reportData.avgSleepQuality.toFixed(1)}/10`,
      `Energy Stability Index: ${reportData.energyScore.toFixed(0)}%`,
      ``,
      `AI OPERATIVE INSIGHTS`,
      ...insights.map((ins) => `• ${ins.text}`),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grand-debrief-${format(now, 'yyyy-MM')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Grand Debrief Downloaded!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1000, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="report-header"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: -1 }}>📊 Grand Strategic Debrief</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>{format(now, 'MMMM yyyy')} · Comprehensive Operational Analysis</p>
        </div>
        <button className="btn btn-primary" onClick={handleDownload} style={{ borderRadius: 12, padding: '10px 20px', whiteSpace: 'nowrap' }}>
          <Download size={16} /> Download Intelligence
        </button>
      </motion.div>

      {/* Primary KPI Grid */}
      <div className="grid-4" style={{ gap: 16 }}>
        {[
          { label: 'Operational Rate', value: `${reportData.overallRate}%`, icon: TrendingUp, color: 'var(--accent-primary)', sub: 'Completion' },
          { label: 'Fitness Frequency', value: `${reportData.fitnessFrequency}x`, icon: Activity, color: 'var(--color-success)', sub: 'Per Week' },
          { label: 'Total Volume', value: reportData.volumeTotal, icon: Zap, color: 'var(--color-warning)', sub: 'Sets Completed' },
          { label: 'Neural Focus', value: formatFocusTime(reportData.totalFocus), icon: Target, color: 'var(--accent-secondary)', sub: 'Focused Time' },
        ].map((s, i) => (
          <motion.div className="stat-card" key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            style={{ padding: '24px', background: 'var(--bg-card)', border: '1.5px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ padding: 8, background: `${s.color}15`, borderRadius: 10, color: s.color }}><s.icon size={20} /></div>
              <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{s.sub}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)' }}>{s.value}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
        {/* Weekly Operational Flow */}
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ padding: 24, borderRadius: 'var(--radius-xl)' }}>
          <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
            <TrendingUp size={18} color="var(--accent-primary)" />
            Weekly Operational Flow
          </div>
          <div style={{ width: '100%', height: 240, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reportData.weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 12, fontSize: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
                />
                <Line type="monotone" dataKey="score" stroke="var(--accent-primary)" strokeWidth={4} dot={{ r: 4, fill: 'var(--accent-primary)' }} name="Focus Score" />
                <Line type="monotone" dataKey="volume" stroke="var(--color-success)" strokeWidth={4} dot={{ r: 4, fill: 'var(--color-success)' }} name="Fitness Volume" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Tactical Classification */}
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          style={{ padding: 24, borderRadius: 'var(--radius-xl)' }}>
          <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Shield size={18} color="var(--accent-secondary)" />
            Tactical Classification
          </div>
          <div className="report-classification" style={{ display: 'flex', height: 240, alignItems: 'center', width: '100%' }}>
            <div style={{ flex: 1.5, height: '100%', minHeight: 200, width: '100%' }}>
              <div style={{ width: '100%', height: '100%', minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={reportData.categoryData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {reportData.categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="report-classification-legend" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 20 }}>
               {reportData.categoryData.slice(0, 5).map((cat, i) => (
                 <div key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>{cat.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-primary)', marginLeft: 'auto' }}>{cat.value}</span>
                 </div>
               ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Operative Balance Grid */}
      <div className="grid-2" style={{ gap: 20 }}>
        {/* AI Operative Insights */}
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ padding: 24, borderRadius: 'var(--radius-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Lightbulb size={20} color="var(--accent-secondary)" />
            <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)' }}>AI Operative Insights</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {insights.map((ins, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.05 }}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px',
                  background: 'var(--bg-elevated)', border: '1.5px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)',
                  borderLeft: `4px solid ${INSIGHT_COLORS[ins.type]}`
                }}>
                <div style={{ color: INSIGHT_COLORS[ins.type], marginTop: 2 }}>{ins.icon}</div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>{ins.text}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Consistency Dashboard */}
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          style={{ padding: 24, borderRadius: 'var(--radius-xl)', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(99,102,241,0.03) 100%)' }}>
          <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Award size={20} color="var(--color-success)" />
            Consistency Matrix
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'Strategic Alignment', value: reportData.overallRate, color: 'var(--accent-primary)' },
              { label: 'Physical Resilience', value: Math.min(100, (reportData.fitnessFrequency / 5) * 100), color: 'var(--color-success)' },
              { label: 'Hydration Protocol', value: reportData.waterRate, color: 'var(--accent-secondary)' },
              { label: 'Sleep Consistency', value: (reportData.avgSleepQuality / 10) * 100, color: '#8b5cf6' },
              { label: 'Energy Stability', value: reportData.energyScore, color: 'var(--color-success)' },
              { label: 'Focus Endurance', value: Math.min(100, (reportData.totalFocus / 36000) * 100), color: 'var(--color-info)' },
            ].map(m => (
              <div key={m.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{m.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 900, color: m.color }}>{Math.round(m.value)}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
                   <motion.div initial={{ width: 0 }} animate={{ width: `${m.value}%` }} transition={{ duration: 1, delay: 0.5 }}
                     style={{ height: '100%', background: m.color, borderRadius: 10 }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Strategic Command Next Steps */}
      <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        style={{ 
          padding: 32, background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(167,139,250,0.1))', 
          border: '1.5px solid rgba(99,102,241,0.2)', borderRadius: 'var(--radius-xl)', textAlign: 'center' 
        }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--accent-primary)', marginBottom: 8 }}>🚀 Next Month Directive</div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto 24px', lineHeight: 1.6, fontWeight: 500 }}>
          Your operative balance is stabilizing. For the next phase, focus on increasing "High Priority" volume while maintaining your physical training frequency.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          {['Increase Focus Volume', 'Maintain Fitness Streak', 'Neural Calibration Daily'].map(tag => (
            <span key={tag} style={{ padding: '6px 14px', background: 'white', color: 'var(--accent-primary)', borderRadius: 20, fontSize: 11, fontWeight: 800, border: '1px solid var(--accent-primary)' }}>
              {tag}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
