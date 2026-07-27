import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { useStore, CATEGORIES } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const PRIORITIES = ['Low', 'Medium', 'High'];
const PRIORITY_COLORS = { Low: 'var(--priority-low)', Medium: 'var(--priority-medium)', High: 'var(--priority-high)' };

export default function TaskModal({ isOpen, onClose, task = null, date }) {
  const { addTask, updateTask } = useStore();
  const isEdit = Boolean(task);

  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    category: 'Work',
    dueTime: '',
    progress: 0,
    estimatedTime: 0,
  });

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'Medium',
        category: task.category || 'Work',
        dueTime: task.dueTime || '',
        progress: task.progress || 0,
        estimatedTime: task.estimatedTime || 0,
      });
    } else {
      setForm({ title: '', description: '', priority: 'Medium', category: 'Work', dueTime: '', progress: 0, estimatedTime: 0 });
    }
  }, [task, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (isEdit) {
      updateTask(task.id, date, form);
      toast.success('Task updated!');
    } else {
      addTask(form, date);
      toast.success('Task created! +XP on completion 🎯');
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            className="modal"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="modal-header">
              <h2 className="modal-title">{isEdit ? 'Edit Task' : 'New Task'}</h2>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Title */}
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input
                    className="form-input"
                    placeholder="What needs to be done?"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    autoFocus
                  />
                </div>

                {/* Description */}
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Add more details..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                {/* Row: Priority + Category */}
                <div className="grid-2" style={{ gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {PRIORITIES.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setForm({ ...form, priority: p })}
                          style={{
                            flex: 1,
                            padding: '7px 8px',
                            borderRadius: 'var(--radius-md)',
                            border: `2px solid ${form.priority === p ? PRIORITY_COLORS[p] : 'var(--border-default)'}`,
                            background: form.priority === p ? `${PRIORITY_COLORS[p]}18` : 'transparent',
                            color: form.priority === p ? PRIORITY_COLORS[p] : 'var(--text-muted)',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            fontFamily: 'var(--font-sans)',
                          }}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row: Due Time + Progress */}
                <div className="grid-2" style={{ gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Due Time</label>
                    <input
                      type="time"
                      className="form-input"
                      value={form.dueTime}
                      onChange={(e) => setForm({ ...form, dueTime: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Est. Time (min)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g. 30"
                      value={form.estimatedTime || ''}
                      onChange={(e) => setForm({ ...form, estimatedTime: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Progress ({form.progress}%)</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={form.progress}
                    onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })}
                    style={{ width: '100%', marginTop: 8, accentColor: 'var(--accent-primary)' }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <Save size={14} />
                  {isEdit ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
