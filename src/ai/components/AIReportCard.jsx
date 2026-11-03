import React, { useState, useEffect } from 'react';
import { FileText, Award, RefreshCw, CheckCircle, AlertTriangle, TrendingUp, Calendar } from 'lucide-react';
import { aiService } from '../services/aiService';
import { prepareFullContext } from '../services/aiContextService';
import { useStore } from '../../store/useStore';
import toast from 'react-hot-toast';

export default function AIReportCard({ period = 'weekly' }) {
  const store = useStore();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadReport = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const fullContext = prepareFullContext(store);
      const res = await aiService.getReport(period, fullContext, force);
      setReport(res);
    } catch (err) {
      setError(err.message || 'Failed to load report');
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport(false);
  }, [period]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={18} color="var(--accent-primary)" />
            <span>{period === 'weekly' ? 'Weekly' : 'Monthly'} Strategic Debrief</span>
          </h3>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            Comprehensive performance audit across productivity, habits, and fitness
          </div>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => loadReport(true)}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>{loading ? 'Compiling…' : 'Regenerate Debrief'}</span>
        </button>
      </div>

      {loading && !report && (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
          <RefreshCw size={28} className="spin" color="var(--accent-primary)" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Compiling Operational Multi-Module Intelligence…</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Aggregating tasks, focus logs, workout volumes, and habit streaks.</div>
        </div>
      )}

      {error && !report && (
        <div style={{ padding: 18, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 14, color: 'var(--color-danger)', fontSize: 13 }}>
          {error}
        </div>
      )}

      {report && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Top Score Banner */}
          <div className="card" style={{ padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                  {report.period || 'Reporting Period'}
                </span>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', margin: '4px 0 0' }}>
                  {report.title}
                </h2>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Performance Grade</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--accent-primary)', lineHeight: 1 }}>
                    Grade {report.overallGrade}
                  </div>
                </div>
                <div style={{ height: 36, width: 1, background: 'var(--border-subtle)' }} />
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Score</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
                    {report.productivityScore}<span style={{ fontSize: 14, color: 'var(--text-muted)' }}>/100</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics Row */}
            {report.metrics && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 10 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>Missions Completed</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)' }}>{report.metrics.tasksCompleted ?? 0}</div>
                </div>
                <div style={{ padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 10 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>Deep Focus Time</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#8b5cf6' }}>{report.metrics.totalFocusMinutes ?? 0}m</div>
                </div>
                <div style={{ padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 10 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>Habit Adherence</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#10b981' }}>{report.metrics.habitsAdherencePct ?? 0}%</div>
                </div>
                <div style={{ padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 10 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>Workouts Logged</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#f59e0b' }}>{report.metrics.workoutsCompleted ?? 0}</div>
                </div>
              </div>
            )}
          </div>

          {/* Highlights & Lowlights */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <div className="card" style={{ padding: 20, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontSize: 13, fontWeight: 800, color: '#10b981', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase' }}>
                <CheckCircle size={16} /> Key Accomplishments
              </h4>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 6, lineHeight: 1.5 }}>
                {(report.highlights || []).map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>

            <div className="card" style={{ padding: 20, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontSize: 13, fontWeight: 800, color: '#f59e0b', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase' }}>
                <AlertTriangle size={16} /> Areas For Optimization
              </h4>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 6, lineHeight: 1.5 }}>
                {(report.lowlights || []).map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Report Body */}
          {report.markdownBody && (
            <div className="card" style={{ padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', lineHeight: 1.6, color: 'var(--text-secondary)', fontSize: 13 }}>
              {report.markdownBody.split('\n\n').map((para, idx) => (
                <p key={idx} style={{ margin: '8px 0' }}>{para}</p>
              ))}
            </div>
          )}

          {/* Strategic Next Week Priorities */}
          {(report.nextWeekPriorities || []).length > 0 && (
            <div className="card" style={{ padding: 20, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-primary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                🎯 Strategic Next Period Priorities
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {report.nextWeekPriorities.map((prio, idx) => (
                  <div key={idx} style={{ padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent-primary)' }}>0{idx + 1}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{prio}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
