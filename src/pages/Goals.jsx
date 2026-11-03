import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Plus, CheckCircle2, Circle, Trash2, Calendar, 
  Flag, Sparkles, TrendingUp, Link as LinkIcon, Compass, CheckSquare 
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';

export default function Goals() {
  const { 
    goals = [], addGoal, updateGoal, deleteGoal, 
    addGoalMilestone, toggleGoalMilestone,
    projects = [], habits = []
  } = useStore();

  const [activeHorizon, setActiveHorizon] = useState('all'); // 'all' | 'short_term' | 'long_term' | 'vision'
  const [showNewModal, setShowNewModal] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeHorizon, setTimeHorizon] = useState('short_term');
  const [category, setCategory] = useState('Personal');
  const [targetDate, setTargetDate] = useState('');
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [selectedHabits, setSelectedHabits] = useState([]);
  const [milestonesInput, setMilestonesInput] = useState(['', '']);

  const [newMilestoneText, setNewMilestoneText] = useState({});

  const categories = ['Personal', 'Career', 'Learning', 'Health & Fitness', 'Financial', 'Creative'];

  const filteredGoals = useMemo(() => {
    return goals.filter(g => {
      if (activeHorizon === 'all') return true;
      return g.timeHorizon === activeHorizon;
    });
  }, [goals, activeHorizon]);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Goal title is required');
      return;
    }

    const validMilestones = milestonesInput
      .filter(m => m.trim().length > 0)
      .map(m => ({ id: `gm_${Date.now()}_${Math.random()}`, title: m.trim(), completed: false }));

    addGoal({
      title: title.trim(),
      description: description.trim(),
      timeHorizon,
      category,
      targetDate: targetDate || '',
      milestones: validMilestones,
      linkedProjects: selectedProjects,
      linkedHabits: selectedHabits,
      progress: 0
    });

    setTitle('');
    setDescription('');
    setTargetDate('');
    setSelectedProjects([]);
    setSelectedHabits([]);
    setMilestonesInput(['', '']);
    setShowNewModal(false);
  };

  const handleAddMilestone = (goalId) => {
    const text = newMilestoneText[goalId];
    if (!text || !text.trim()) return;
    addGoalMilestone(goalId, text.trim());
    setNewMilestoneText(prev => ({ ...prev, [goalId]: '' }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '0 4px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, boxShadow: '0 4px 16px rgba(16,185,129,0.3)'
          }}>
            🎯
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
              Goal and Vision Planner
            </h1>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Horizon mapping, compound habits & empirical milestone progress
            </div>
          </div>
        </div>

        <button 
          className="btn btn-primary"
          onClick={() => setShowNewModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}
        >
          <Plus size={16} />
          <span>New Goal</span>
        </button>
      </div>

      {/* Horizon Switcher */}
      <div style={{ display: 'flex', background: 'var(--bg-elevated)', padding: 4, borderRadius: 10, border: '1px solid var(--border-subtle)', gap: 4, width: 'fit-content' }}>
        {[
          { id: 'all', label: 'All Horizons' },
          { id: 'short_term', label: 'Short-Term (< 1y)' },
          { id: 'long_term', label: 'Long-Term (1-3y)' },
          { id: 'vision', label: 'Vision (5y+)' }
        ].map(tab => (
          <button
            key={tab.id}
            className={`btn btn-sm ${activeHorizon === tab.id ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveHorizon(tab.id)}
            style={{ padding: '6px 14px', fontSize: 12, fontWeight: 700 }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Goals Grid */}
      {filteredGoals.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center', background: 'var(--bg-card)', border: '1px dashed var(--border-subtle)' }}>
          <Compass size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>No Goals in this Horizon</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, maxWidth: 360, marginInline: 'auto' }}>
            Set a measurable milestone to align your daily tasks and habit execution.
          </p>
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => setShowNewModal(true)}
            style={{ marginTop: 16 }}
          >
            Define First Goal
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 16 }}>
          {filteredGoals.map(goal => {
            const milestones = goal.milestones || [];
            const completedCount = milestones.filter(m => m.completed).length;
            const progress = milestones.length > 0 
              ? Math.round((completedCount / milestones.length) * 100) 
              : Number(goal.progress) || 0;

            const horizonLabel = goal.timeHorizon === 'short_term' 
              ? 'Short-Term' 
              : goal.timeHorizon === 'long_term' 
                ? 'Long-Term' 
                : 'Vision';

            return (
              <motion.div
                key={goal.id}
                className="card"
                style={{
                  padding: 20,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14
                }}
                layout
              >
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: 'rgba(16,185,129,0.12)',
                      color: '#10b981',
                      border: '1px solid rgba(16,185,129,0.2)'
                    }}>
                      {horizonLabel}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>
                      • {goal.category}
                    </span>
                  </div>

                  <button
                    className="btn btn-ghost btn-icon btn-sm"
                    onClick={() => {
                      if (confirm(`Delete goal "${goal.title}"?`)) {
                        deleteGoal(goal.id);
                      }
                    }}
                    title="Delete Goal"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Title */}
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                    {goal.title}
                  </h3>
                  {goal.description && (
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                      {goal.description}
                    </p>
                  )}
                </div>

                {/* Dynamic Progress */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Empirical Progress</span>
                    <span style={{ color: progress >= 100 ? '#10b981' : 'var(--accent-primary)' }}>{progress}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 4, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${progress}%`,
                      background: progress >= 100 ? '#10b981' : 'linear-gradient(90deg, #10b981, #06b6d4)',
                      borderRadius: 4,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>

                {/* Milestones */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Milestones ({completedCount}/{milestones.length})
                  </div>

                  {milestones.map(m => (
                    <div
                      key={m.id}
                      onClick={() => toggleGoalMilestone(goal.id, m.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 8px',
                        borderRadius: 8,
                        background: 'var(--bg-elevated)',
                        cursor: 'pointer',
                        fontSize: 12
                      }}
                    >
                      {m.completed ? (
                        <CheckCircle2 size={14} color="#10b981" />
                      ) : (
                        <Circle size={14} color="var(--text-muted)" />
                      )}
                      <span style={{
                        color: m.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                        textDecoration: m.completed ? 'line-through' : 'none'
                      }}>
                        {m.title}
                      </span>
                    </div>
                  ))}

                  {/* Add Milestone */}
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <input
                      type="text"
                      className="input input-sm"
                      placeholder="Add milestone…"
                      value={newMilestoneText[goal.id] || ''}
                      onChange={(e) => setNewMilestoneText({ ...newMilestoneText, [goal.id]: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddMilestone(goal.id);
                      }}
                      style={{ fontSize: 11, padding: '4px 8px' }}
                    />
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleAddMilestone(goal.id)}
                      style={{ padding: '4px 10px', fontSize: 11 }}
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Linked Systems */}
                {((goal.linkedProjects || []).length > 0 || (goal.linkedHabits || []).length > 0) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
                    {(goal.linkedProjects || []).map(pid => {
                      const proj = projects.find(p => p.id === pid);
                      return proj ? (
                        <span key={pid} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                          📁 {proj.title}
                        </span>
                      ) : null;
                    })}
                    {(goal.linkedHabits || []).map(hid => {
                      const hab = habits.find(h => h.id === hid);
                      return hab ? (
                        <span key={hid} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                          🔥 {hab.title}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal: New Goal */}
      {showNewModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, padding: 16
        }}>
          <div className="card" style={{ maxWidth: 500, width: '100%', padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 16px' }}>
              Define Strategic Goal
            </h2>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Goal Title *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Master Autonomous AI Engineering"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Description / Why it matters</label>
                <textarea
                  className="input"
                  placeholder="Define the clear qualitative outcome"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Time Horizon</label>
                  <select className="input" value={timeHorizon} onChange={(e) => setTimeHorizon(e.target.value)}>
                    <option value="short_term">Short-Term (&lt; 1 Year)</option>
                    <option value="long_term">Long-Term (1-3 Years)</option>
                    <option value="vision">Vision (5+ Years)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Category</label>
                  <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Milestones</label>
                {milestonesInput.map((ms, idx) => (
                  <input
                    key={idx}
                    type="text"
                    className="input input-sm"
                    placeholder={`Milestone ${idx + 1}`}
                    value={ms}
                    onChange={(e) => {
                      const updated = [...milestonesInput];
                      updated[idx] = e.target.value;
                      setMilestonesInput(updated);
                    }}
                    style={{ marginBottom: 6 }}
                  />
                ))}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setMilestonesInput([...milestonesInput, ''])}
                  style={{ fontSize: 11, color: '#10b981' }}
                >
                  + Add milestone
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowNewModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

