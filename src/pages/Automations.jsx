import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Plus, Play, Trash2, Clock, CheckCircle2, AlertTriangle, 
  Settings, Power, History, Shield, ArrowRight 
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function Automations() {
  const { 
    automations = [], addAutomation, updateAutomation, deleteAutomation, 
    toggleAutomation, executeAutomation 
  } = useStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [runningId, setRunningId] = useState(null);

  // New automation form
  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState('schedule');
  const [triggerTime, setTriggerTime] = useState('08:00 AM');
  const [triggerEvent, setTriggerEvent] = useState('workout_completed');
  const [actionType, setActionType] = useState('apply_routines');
  const [taskTitle, setTaskTitle] = useState('');
  const [waterGlasses, setWaterGlasses] = useState(2);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Automation name is required');
      return;
    }

    const triggerConfig = triggerType === 'schedule'
      ? { time: triggerTime, days: [0, 1, 2, 3, 4, 5, 6] }
      : { event: triggerEvent };

    const actionPayload = actionType === 'add_task'
      ? { title: taskTitle.trim() || 'Automated Mission', priority: 'Medium' }
      : actionType === 'log_water'
        ? { glasses: Number(waterGlasses) || 2 }
        : { notification: true };

    addAutomation({
      name: name.trim(),
      triggerType,
      triggerConfig,
      actionType,
      actionPayload,
      enabled: true
    });

    setName('');
    setTaskTitle('');
    setShowAddModal(false);
  };

  const handleRunNow = async (id) => {
    setRunningId(id);
    await executeAutomation(id);
    setRunningId(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '0 4px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #e11d48, #be123c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, boxShadow: '0 4px 16px rgba(225,29,72,0.3)'
          }}>
            ⚡
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
              Autonomous Automation Engine
            </h1>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Deterministic event triggers, scheduled task generators & execution telemetry
            </div>
          </div>
        </div>

        <button 
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}
        >
          <Plus size={16} />
          <span>New Automation</span>
        </button>
      </div>

      {/* Automations List */}
      {automations.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center', background: 'var(--bg-card)', border: '1px dashed var(--border-subtle)' }}>
          <Zap size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>No Active Automations</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, maxWidth: 360, marginInline: 'auto' }}>
            Create automated background jobs to apply morning routines, prompt post-workout hydration, or schedule priority missions.
          </p>
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => setShowAddModal(true)}
            style={{ marginTop: 16 }}
          >
            Create First Automation
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
          {automations.map(auto => {
            const isRunning = runningId === auto.id;
            const history = auto.runHistory || [];
            const lastRunFormatted = auto.lastRun 
              ? format(new Date(auto.lastRun), 'MMM d, h:mm a') 
              : 'Never executed';

            return (
              <motion.div
                key={auto.id}
                className="card"
                style={{
                  padding: 20,
                  background: 'var(--bg-card)',
                  border: auto.enabled ? '1px solid var(--border-subtle)' : '1px solid var(--border-subtle)',
                  opacity: auto.enabled ? 1 : 0.65,
                  borderRadius: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14
                }}
                layout
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                      padding: '3px 8px', borderRadius: 6,
                      background: auto.triggerType === 'schedule' ? 'rgba(59,130,246,0.12)' : 'rgba(245,158,11,0.12)',
                      color: auto.triggerType === 'schedule' ? '#3b82f6' : '#f59e0b',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      {auto.triggerType === 'schedule' ? '⏰ Scheduled' : '⚡ Event Trigger'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      className={`btn btn-sm ${auto.enabled ? 'btn-ghost' : 'btn-secondary'}`}
                      onClick={() => toggleAutomation(auto.id)}
                      style={{ padding: '3px 8px', fontSize: 11 }}
                    >
                      <Power size={12} style={{ marginRight: 4 }} />
                      {auto.enabled ? 'Enabled' : 'Disabled'}
                    </button>

                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={() => {
                        if (confirm(`Delete automation "${auto.name}"?`)) {
                          deleteAutomation(auto.id);
                        }
                      }}
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                    {auto.name}
                  </h3>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <strong>Action:</strong> 
                    <code style={{ fontSize: 11, background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4 }}>
                      {auto.actionType}
                    </code>
                  </div>
                </div>

                {/* Last Run Info */}
                <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <History size={12} />
                  <span>Last Run: {lastRunFormatted}</span>
                </div>

                {/* History Log Snippet */}
                {history.length > 0 && (
                  <div style={{ padding: '8px 10px', background: 'var(--bg-elevated)', borderRadius: 8, fontSize: 11 }}>
                    <div style={{ fontWeight: 700, color: history[0].status === 'success' ? '#10b981' : 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={12} />
                      <span>{history[0].summary || 'Execution completed'}</span>
                    </div>
                  </div>
                )}

                {/* Run Now Trigger Button */}
                <div style={{ paddingTop: 10, borderTop: '1px solid var(--border-subtle)', marginTop: 'auto' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleRunNow(auto.id)}
                    disabled={isRunning}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 700 }}
                  >
                    <Play size={13} fill="currentColor" />
                    <span>{isRunning ? 'Executing…' : 'Trigger Run Now'}</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal: New Automation */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, padding: 16
        }}>
          <div className="card" style={{ maxWidth: 480, width: '100%', padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 16px' }}>
              Create Automation Protocol
            </h2>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Protocol Name *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Daily Morning Routine Synchronizer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Trigger Type</label>
                  <select className="input" value={triggerType} onChange={(e) => setTriggerType(e.target.value)}>
                    <option value="schedule">Scheduled Time</option>
                    <option value="event">System Event</option>
                  </select>
                </div>

                <div>
                  {triggerType === 'schedule' ? (
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Trigger Time</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="08:00 AM"
                        value={triggerTime}
                        onChange={(e) => setTriggerTime(e.target.value)}
                      />
                    </div>
                  ) : (
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Event Type</label>
                      <select className="input" value={triggerEvent} onChange={(e) => setTriggerEvent(e.target.value)}>
                        <option value="workout_completed">Workout Completed</option>
                        <option value="pomodoro_finished">Pomodoro Finished</option>
                        <option value="task_completed">High-Priority Task Completed</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Action To Execute</label>
                <select className="input" value={actionType} onChange={(e) => setActionType(e.target.value)}>
                  <option value="apply_routines">Synchronize Daily Routines</option>
                  <option value="log_water">Log Water Hydration</option>
                  <option value="add_task">Create Follow-Up Task</option>
                </select>
              </div>

              {actionType === 'add_task' && (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Task Title</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Complete 10m Post-Workout Stretch"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                  />
                </div>
              )}

              {actionType === 'log_water' && (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Glasses of Water</label>
                  <input
                    type="number"
                    className="input"
                    value={waterGlasses}
                    onChange={(e) => setWaterGlasses(e.target.value)}
                    min={1}
                    max={8}
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Deploy Automation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
