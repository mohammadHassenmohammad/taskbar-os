import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { motion } from 'framer-motion';
import { 
  Clock, Timer, TrendingUp, CheckCircle, AlertTriangle, 
  BarChart2, Zap, ArrowRight, Shield, Layers 
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  CartesianGrid, PieChart, Pie, Cell 
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];

export default function TimeIntelligence() {
  const { getTimeIntelligenceMetrics, pomodoro, studySessions = [], tasks = [] } = useStore();

  const metrics7 = useMemo(() => {
    return getTimeIntelligenceMetrics(7);
  }, [getTimeIntelligenceMetrics, pomodoro, studySessions, tasks]);

  const plannedHours = (metrics7.plannedMinutes / 60).toFixed(1);
  const actualHours = (metrics7.actualMinutes / 60).toFixed(1);
  const pomodoroHours = (metrics7.pomodoroMinutes / 60).toFixed(1);
  const studyHours = (metrics7.studyMinutes / 60).toFixed(1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '0 4px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, boxShadow: '0 4px 16px rgba(245,158,11,0.3)'
          }}>
            ⏱️
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
              Time Intelligence & Allocation
            </h1>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Empirical planned vs actual time, Pomodoro telemetry & category bandwidth
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px',
          background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border-subtle)',
          fontSize: 12, fontWeight: 700
        }}>
          <span style={{ color: 'var(--text-muted)' }}>Workload Status:</span>
          <span style={{
            color: metrics7.workloadStatus === 'Optimal' ? '#10b981' : metrics7.workloadStatus === 'Heavy' ? '#f59e0b' : 'var(--text-primary)',
            fontWeight: 800
          }}>
            {metrics7.workloadStatus}
          </span>
        </div>
      </div>

      {/* Core Scorecards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div className="card" style={{ padding: 20, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Planned Demand (7d)</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', marginTop: 4 }}>
            {plannedHours} <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>hrs</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Aggregated from task estimates</div>
        </div>

        <div className="card" style={{ padding: 20, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Actual Execution (7d)</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#10b981', marginTop: 4 }}>
            {actualHours} <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>hrs</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Pomodoro focus + study time</div>
        </div>

        <div className="card" style={{ padding: 20, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Focus Efficiency</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--accent-primary)', marginTop: 4 }}>
            {metrics7.efficiency}%
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Actual vs planned ratio</div>
        </div>

        <div className="card" style={{ padding: 20, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Deep Study Share</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#3b82f6', marginTop: 4 }}>
            {studyHours} <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>hrs</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Verified study session logs</div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 16 }}>
        {/* Planned Time Category Breakdown */}
        <div className="card" style={{ padding: 20, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 14 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={16} color="var(--accent-primary)" />
            <span>Category Time Demand Allocation</span>
          </h3>

          {metrics7.categoryBreakdown.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No scheduled tasks with time estimates in the last 7 days.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {metrics7.categoryBreakdown.map((cat, idx) => (
                <div key={cat.category} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700 }}>
                    <span style={{ color: 'var(--text-primary)' }}>{cat.category}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{(cat.minutes / 60).toFixed(1)} hrs ({cat.percentage}%)</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${cat.percentage}%`,
                      background: COLORS[idx % COLORS.length],
                      borderRadius: 3
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tactical Recommendation */}
        <div className="card" style={{ padding: 20, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={16} color="#f59e0b" />
            <span>Empirical Workload Assessment</span>
          </h3>

          <div style={{ padding: 14, background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-subtle)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {metrics7.efficiency < 40 ? (
              <span>
                <strong>Planning Friction Detected:</strong> You planned {plannedHours} hours of tasks but executed {actualHours} hours of measured focus. Consider reducing your daily scheduled task volume to prioritize 1-2 essential objectives.
              </span>
            ) : metrics7.efficiency > 120 ? (
              <span>
                <strong>High Execution Velocity:</strong> Actual logged focus ({actualHours} hrs) significantly outpaced planned task estimates. Excellent focus discipline—ensure adequate recovery pauses.
              </span>
            ) : (
              <span>
                <strong>Balanced Cadence:</strong> Planned demand and recorded focus velocity are tightly synchronized ({metrics7.efficiency}% alignment). Maintain current pacing.
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Execution Summary
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Pomodoro Deep Work:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{pomodoroHours} hrs</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Academic / Skill Study:</span>
              <strong style={{ color: '#3b82f6' }}>{studyHours} hrs</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
