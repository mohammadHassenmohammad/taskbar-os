import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderKanban, Plus, CheckCircle2, Circle, Trash2, Calendar, 
  Tag, Clock, AlertCircle, Edit3, ArrowRight, CheckSquare, Sparkles 
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';

export default function Projects() {
  const { 
    projects = [], addProject, updateProject, deleteProject, 
    addProjectMilestone, toggleProjectMilestone, deleteProjectMilestone,
    tasks = [], setPage
  } = useStore();

  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'completed' | 'all'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  // New project form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Work');
  const [deadline, setDeadline] = useState('');
  const [notes, setNotes] = useState('');
  const [initialMilestones, setInitialMilestones] = useState(['', '']);

  // Milestone input for existing project
  const [newMilestoneText, setNewMilestoneText] = useState({});

  const categories = ['Work', 'Personal', 'Learning', 'Health', 'Creative', 'Finance'];

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesTab = activeTab === 'all' 
        ? true 
        : activeTab === 'completed' 
          ? p.status === 'completed' 
          : p.status !== 'completed';
      const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesTab && matchesCat;
    });
  }, [projects, activeTab, selectedCategory]);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Project title is required');
      return;
    }

    const validMilestones = initialMilestones
      .filter(m => m.trim().length > 0)
      .map(m => ({ id: `m_${Date.now()}_${Math.random()}`, title: m.trim(), completed: false }));

    addProject({
      title: title.trim(),
      description: description.trim(),
      category,
      deadline: deadline || '',
      milestones: validMilestones,
      notes: notes.trim(),
      status: 'active'
    });

    setTitle('');
    setDescription('');
    setDeadline('');
    setNotes('');
    setInitialMilestones(['', '']);
    setShowNewModal(false);
  };

  const handleAddMilestone = (projectId) => {
    const text = newMilestoneText[projectId];
    if (!text || !text.trim()) return;
    addProjectMilestone(projectId, text.trim());
    setNewMilestoneText(prev => ({ ...prev, [projectId]: '' }));
  };

  const getDaysRemaining = (deadlineDate) => {
    if (!deadlineDate) return null;
    try {
      const days = differenceInDays(new Date(deadlineDate), new Date());
      if (days < 0) return { label: `${Math.abs(days)}d overdue`, isOverdue: true };
      if (days === 0) return { label: 'Due today', isToday: true };
      return { label: `${days}d remaining`, isUpcoming: true };
    } catch {
      return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '0 4px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, var(--accent-primary), #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, boxShadow: '0 4px 16px rgba(99,102,241,0.3)'
          }}>
            📁
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
              Project Management Centre
            </h1>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Strategic initiatives, milestone roadmaps & linked execution
            </div>
          </div>
        </div>

        <button 
          className="btn btn-primary"
          onClick={() => setShowNewModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}
        >
          <Plus size={16} />
          <span>New Project</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', background: 'var(--bg-elevated)', padding: 4, borderRadius: 10, border: '1px solid var(--border-subtle)', gap: 4 }}>
          {['active', 'completed', 'all'].map(tab => (
            <button
              key={tab}
              className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab(tab)}
              style={{ textTransform: 'capitalize', padding: '6px 14px', fontSize: 12, fontWeight: 700 }}
            >
              {tab} ({projects.filter(p => tab === 'all' ? true : tab === 'completed' ? p.status === 'completed' : p.status !== 'completed').length})
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${selectedCategory === 'all' ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={() => setSelectedCategory('all')}
            style={{ fontSize: 11, padding: '4px 10px' }}
          >
            All Categories
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              className={`btn btn-sm ${selectedCategory === cat ? 'btn-secondary' : 'btn-ghost'}`}
              onClick={() => setSelectedCategory(cat)}
              style={{ fontSize: 11, padding: '4px 10px' }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center', background: 'var(--bg-card)', border: '1px dashed var(--border-subtle)' }}>
          <FolderKanban size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>No Projects Found</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, maxWidth: 360, marginInline: 'auto' }}>
            {activeTab === 'completed' ? 'No completed projects yet.' : 'Initiate your first high-impact project roadmap.'}
          </p>
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => setShowNewModal(true)}
            style={{ marginTop: 16 }}
          >
            Create First Project
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {filteredProjects.map(proj => {
            const milestones = proj.milestones || [];
            const completedCount = milestones.filter(m => m.completed).length;
            const progress = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : (proj.status === 'completed' ? 100 : 0);
            const countdown = getDaysRemaining(proj.deadline);

            return (
              <motion.div
                key={proj.id}
                className="card"
                style={{
                  padding: 20,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  position: 'relative'
                }}
                layout
              >
                {/* Top Row: Category & Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: 'rgba(99,102,241,0.12)',
                    color: 'var(--accent-primary)',
                    border: '1px solid rgba(99,102,241,0.2)'
                  }}>
                    {proj.category}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {countdown && (
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: countdown.isOverdue ? 'rgba(239,68,68,0.15)' : 'var(--bg-elevated)',
                        color: countdown.isOverdue ? 'var(--color-danger)' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <Clock size={11} /> {countdown.label}
                      </span>
                    )}

                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={() => {
                        if (confirm(`Delete project "${proj.title}"?`)) {
                          deleteProject(proj.id);
                        }
                      }}
                      title="Delete Project"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                    {proj.title}
                  </h3>
                  {proj.description && (
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                      {proj.description}
                    </p>
                  )}
                </div>

                {/* Progress Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Progress</span>
                    <span style={{ color: progress === 100 ? 'var(--color-success)' : 'var(--accent-primary)' }}>{progress}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 4, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${progress}%`,
                      background: progress === 100 ? 'var(--color-success)' : 'linear-gradient(90deg, var(--accent-primary), #6366f1)',
                      borderRadius: 4,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>

                {/* Milestones Roadmap */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Milestones ({completedCount}/{milestones.length})
                  </div>
                  
                  {milestones.map(m => (
                    <div
                      key={m.id}
                      onClick={() => toggleProjectMilestone(proj.id, m.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        borderRadius: 8,
                        background: 'var(--bg-elevated)',
                        cursor: 'pointer',
                        fontSize: 12,
                        transition: 'background 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {m.completed ? (
                          <CheckCircle2 size={14} color="var(--color-success)" />
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

                      <button
                        className="btn btn-ghost btn-icon btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteProjectMilestone(proj.id, m.id);
                        }}
                        style={{ color: 'var(--text-muted)', padding: 2 }}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}

                  {/* Add Milestone Inline */}
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <input
                      type="text"
                      className="input input-sm"
                      placeholder="Add milestone…"
                      value={newMilestoneText[proj.id] || ''}
                      onChange={(e) => setNewMilestoneText({ ...newMilestoneText, [proj.id]: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddMilestone(proj.id);
                      }}
                      style={{ fontSize: 11, padding: '4px 8px' }}
                    />
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleAddMilestone(proj.id)}
                      style={{ padding: '4px 10px', fontSize: 11 }}
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Actions / Status Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border-subtle)', marginTop: 'auto' }}>
                  <button
                    className={`btn btn-sm ${proj.status === 'completed' ? 'btn-ghost' : 'btn-secondary'}`}
                    onClick={() => updateProject(proj.id, { status: proj.status === 'completed' ? 'active' : 'completed' })}
                    style={{ fontSize: 11, fontWeight: 700 }}
                  >
                    {proj.status === 'completed' ? 'Reopen Project' : 'Mark Completed'}
                  </button>

                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    Created {format(new Date(proj.createdAt || Date.now()), 'MMM d')}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal: New Project */}
      {showNewModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, padding: 16
        }}>
          <div className="card" style={{ maxWidth: 500, width: '100%', padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 16px' }}>
              Initiate New Project
            </h2>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Project Title *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Distributed Database Engine"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Description</label>
                <textarea
                  className="input"
                  placeholder="Brief high-level summary of goals and scope"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Category</label>
                  <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target Deadline</label>
                  <input
                    type="date"
                    className="input"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Initial Milestones</label>
                {initialMilestones.map((ms, idx) => (
                  <input
                    key={idx}
                    type="text"
                    className="input input-sm"
                    placeholder={`Milestone ${idx + 1}`}
                    value={ms}
                    onChange={(e) => {
                      const updated = [...initialMilestones];
                      updated[idx] = e.target.value;
                      setInitialMilestones(updated);
                    }}
                    style={{ marginBottom: 6 }}
                  />
                ))}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setInitialMilestones([...initialMilestones, ''])}
                  style={{ fontSize: 11, color: 'var(--accent-primary)' }}
                >
                  + Add another milestone
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
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

