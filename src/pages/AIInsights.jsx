import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, TrendingUp, AlertTriangle, Zap, Target, Calendar, 
  Activity, Lightbulb, MessageSquare, FileText, CheckCircle2,
  RefreshCw, Dumbbell, Utensils, Clock, Sparkles
} from 'lucide-react';
import { 
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, 
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';

import { useAI } from '../ai/hooks/useAI';
import AIChat from '../ai/components/AIChat';
import AIDailyPlanner from '../ai/components/AIDailyPlanner';
import AIReportCard from '../ai/components/AIReportCard';
import AISuggestionCard from '../ai/components/AISuggestionCard';
import AIStatus from '../ai/components/AIStatus';
import { aiService } from '../ai/services/aiService';
import { prepareFullContext } from '../ai/services/aiContextService';

function InsightCard({ icon: Icon, title, body, evidence, color, delay = 0, actionTab, actionLabel, onAction }) {
  return (
    <motion.div
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${color}22`,
        borderLeft: `4px solid ${color}`,
        borderRadius: 'var(--radius-lg, 16px)',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.35 }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={18} color={color} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-primary)' }}>{title}</div>
            <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
              MEASURED OBSERVATION
            </div>
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

      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{body}</div>

      {evidence && (
        <div style={{ padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border-subtle)', fontSize: 11, display: 'flex', gap: 8, alignItems: 'center' }}>
          <strong style={{ color: 'var(--accent-primary)', textTransform: 'uppercase', fontSize: 10, letterSpacing: 0.5 }}>MEASURED EVIDENCE:</strong>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{evidence}</span>
        </div>
      )}
    </motion.div>
  );
}

export default function AIInsights() {
  const store = useStore();
  const { 
    tasks, gamification, getCrossModuleInsights, 
    setPage, setDietActiveDate, setGymActiveDate 
  } = store;

  const [activeTab, setActiveTab] = useState('chat'); // Default directly to clean conversational assistant
  const [reportPeriod, setReportPeriod] = useState('weekly');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [activeAnalysis, setActiveAnalysis] = useState('productivity');
  const [analysisData, setAnalysisData] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const ai = useAI();
  const today = format(new Date(), 'yyyy-MM-dd');

  const handleAction = (tab) => {
    if (tab === 'diet') setDietActiveDate(today);
    if (tab === 'gym') setGymActiveDate(today);
    setPage(tab || 'today');
  };

  // Load Actionable Suggestions with 15-min cache to respect Google Free Tier 5 RPM quota
  useEffect(() => {
    const fetchSuggestions = async () => {
      const cacheKey = 'taskbar_ai_suggestions_cache';
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.timestamp < 15 * 60 * 1000 && Array.isArray(parsed.data)) {
            setSuggestions(parsed.data);
            return;
          }
        } catch {}
      }

      setLoadingSuggestions(true);
      try {
        const fullContext = prepareFullContext(store);
        const res = await aiService.getSuggestions(fullContext);
        const top = res.slice(0, 4);
        setSuggestions(top);
        sessionStorage.setItem(cacheKey, JSON.stringify({ data: top, timestamp: Date.now() }));
      } catch (err) {
        console.error('Failed to load suggestions:', err);
      } finally {
        setLoadingSuggestions(false);
      }
    };
    fetchSuggestions();
  }, []);

  // Run modular analysis with caching
  const runAnalysis = async (type, forceRefresh = false) => {
    setActiveAnalysis(type);
    const cacheKey = `taskbar_ai_analysis_${type}`;
    if (!forceRefresh) {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.timestamp < 15 * 60 * 1000 && parsed.data) {
            setAnalysisData(parsed.data);
            return;
          }
        } catch {}
      }
    }

    setLoadingAnalysis(true);
    try {
      const fullContext = prepareFullContext(store);
      const dataPayload = type === 'productivity' ? fullContext.productivity :
                          type === 'habits' ? fullContext.habits :
                          type === 'workouts' ? fullContext.workouts :
                          type === 'nutrition' ? fullContext.nutrition : fullContext;
      const res = await aiService.analyze(type, dataPayload);
      setAnalysisData(res);
      sessionStorage.setItem(cacheKey, JSON.stringify({ data: res, timestamp: Date.now() }));
    } catch (err) {
      console.error('Analysis error:', err);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  useEffect(() => {
    runAnalysis('productivity');
  }, []);

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

  // Skill radar
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

  const focusScore = Math.min(100, Math.max(0, Math.round(
    ((patterns.rate || 0) * 0.4) +
    ((patterns.highPriRate || 0) * 0.3) +
    (Math.min(currentStreak, 30) / 30 * 100 * 0.2) +
    (Math.min(patterns.maxStreak || 0, 5) / 5 * 100 * 0.1)
  ))) || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '0 4px' }}>
      {/* Header bar */}
      <motion.div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)', fontSize: 20,
          }}>
            🤖
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)' }}>
              JARVIS Assistant
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Your personal AI companion for tasks, habits & planning
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', background: 'var(--bg-elevated)', padding: 4, borderRadius: 12, border: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: 2 }}>
          <button
            className={`btn btn-sm ${activeTab === 'chat' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('chat')}
            style={{ padding: '6px 14px', fontSize: 12, fontWeight: 700, borderRadius: 8 }}
          >
            <MessageSquare size={14} style={{ marginRight: 6 }} />
            Assistant
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'planner' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('planner')}
            style={{ padding: '6px 14px', fontSize: 12, fontWeight: 700, borderRadius: 8 }}
          >
            <Calendar size={14} style={{ marginRight: 6 }} />
            Daily Planner
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'overview' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('overview')}
            style={{ padding: '6px 14px', fontSize: 12, fontWeight: 700, borderRadius: 8 }}
          >
            <Brain size={14} style={{ marginRight: 6 }} />
            Insights & Health
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'reports' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('reports')}
            style={{ padding: '6px 14px', fontSize: 12, fontWeight: 700, borderRadius: 8 }}
          >
            <FileText size={14} style={{ marginRight: 6 }} />
            Weekly Report
          </button>
        </div>
      </motion.div>

      {/* Provider Status Pill */}
      <AIStatus status={ai.status} />

      {/* ── TAB 1: INTERACTIVE ASSISTANT (CHAT) ── */}
      {activeTab === 'chat' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <AIChat ai={ai} />
        </motion.div>
      )}

      {/* ── TAB 2: DAILY PLANNER ── */}
      {activeTab === 'planner' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <AIDailyPlanner />
        </motion.div>
      )}

      {/* ── TAB 3: OVERVIEW & MODULAR ANALYSIS ── */}
      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Actionable AI Suggestions Row */}
          {suggestions.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} />
                <span>Smart Recommendations</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                {suggestions.map((sug, idx) => (
                  <AISuggestionCard
                    key={sug.id || idx}
                    suggestion={sug}
                    onDismiss={() => setSuggestions(prev => prev.filter(s => s.id !== sug.id))}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Core Score Cards */}
          <div className="grid-3">
            {[
              { label: 'Tactical Focus Score', value: focusScore, suffix: '/100', color: 'var(--accent-primary)' },
              { label: 'Streak Consistency', value: Math.min(100, gamification.streak * 10), suffix: '%', color: 'var(--color-success)' },
              { label: 'Mission Completion Rate', value: patterns.rate, suffix: '%', color: 'var(--color-info)' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                className="stat-card"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <span className="stat-label">{s.label}</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span className="stat-value" style={{ color: s.color }}>{s.value}</span>
                  <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{s.suffix}</span>
                </div>
                <div style={{ height: 4, background: 'var(--border-subtle)', borderRadius: 4, overflow: 'hidden', marginTop: 8 }}>
                  <motion.div
                    style={{ height: '100%', background: s.color, borderRadius: 4 }}
                    initial={{ width: 0 }}
                    animate={{ width: `${s.value}%` }}
                    transition={{ delay: 0.2 + i * 0.1, duration: 0.8 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Deep Modular Domain Analysis */}
          <div className="card" style={{ padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                  Domain Intelligence Evaluations
                </h3>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Deep analysis synthesized from your actual logged history
                </div>
              </div>

              {/* Module Buttons */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { id: 'productivity', label: 'Productivity', icon: Brain },
                  { id: 'habits', label: 'Habits', icon: Target },
                  { id: 'workouts', label: 'Gym & Volume', icon: Dumbbell },
                  { id: 'nutrition', label: 'Diet & Energy', icon: Utensils }
                ].map(mod => {
                  const Icon = mod.icon;
                  const isSel = activeAnalysis === mod.id;
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      className={`btn btn-sm ${isSel ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => runAnalysis(mod.id)}
                      style={{ fontSize: 11, fontWeight: 700, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Icon size={13} />
                      <span>{mod.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {loadingAnalysis ? (
              <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-muted)' }}>
                <RefreshCw size={24} className="spin" color="var(--accent-primary)" style={{ margin: '0 auto 10px' }} />
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Evaluating {activeAnalysis} patterns…</div>
              </div>
            ) : analysisData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ padding: 16, background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                    Executive Evaluation Summary
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                    {analysisData.summary}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                  {analysisData.recommendations || analysisData.suggestions ? (
                    <div style={{ padding: 14, background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#10b981', textTransform: 'uppercase', marginBottom: 8 }}>
                        Strategic Recommendations
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {(analysisData.recommendations || analysisData.suggestions || []).map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {analysisData.strongestHabits || analysisData.bestPerformingDays ? (
                    <div style={{ padding: 14, background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase', marginBottom: 8 }}>
                        Top Strong Points
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {(analysisData.strongestHabits || analysisData.bestPerformingDays || []).map((sp, i) => (
                          <li key={i}>{sp}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>

                {analysisData.disclaimer && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                    🛡️ {analysisData.disclaimer}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Measured Charts Row */}
          <div className="grid-2">
            {/* 30-day trend */}
            <motion.div className="card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
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
            <motion.div className="card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="section-title" style={{ marginBottom: 16 }}>Category Competency Radar</div>
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

          {/* Cross-Module Measured Insights */}
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Brain size={16} color="var(--accent-primary)" />
              <span>Cross-Module Evidence & Recovery Insights</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {realInsights.map((ins, i) => (
                <InsightCard key={i} {...ins} onAction={handleAction} delay={0.2 + i * 0.05} />
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── TAB 4: STRATEGIC REPORTS ── */}
      {activeTab === 'reports' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-start', background: 'var(--bg-elevated)', padding: 4, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
            <button
              className={`btn btn-sm ${reportPeriod === 'weekly' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setReportPeriod('weekly')}
              style={{ padding: '6px 14px', fontSize: 12, fontWeight: 700 }}
            >
              Weekly Report
            </button>
            <button
              className={`btn btn-sm ${reportPeriod === 'monthly' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setReportPeriod('monthly')}
              style={{ padding: '6px 14px', fontSize: 12, fontWeight: 700 }}
            >
              Monthly Report
            </button>
          </div>

          <AIReportCard period={reportPeriod} />
        </motion.div>
      )}
    </div>
  );
}
