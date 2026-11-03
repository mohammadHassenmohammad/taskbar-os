import { useState, useEffect, useRef, useMemo } from 'react';
import { useStore, today } from '../store/useStore';
import { 
  Search, X, CheckSquare, ArrowRight, Zap, Target, 
  Dumbbell, Utensils, Clock, Calendar, BarChart2, 
  Settings, Shield, Plus, Droplets, Sun, Moon, Sparkles,
  Command, ChevronRight, Hash, Brain, Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CommandPalette({ onClose, onOpenCreateTask }) {
  const { 
    tasks, habits = [], routines = [], workouts = {}, dietEntries = {},
    setActiveDate, setPage, theme, toggleTheme, logWater, startPomodoro 
  } = useStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Navigation pages list
  const pages = useMemo(() => [
    { id: 'dashboard', label: 'Dashboard', icon: Zap, category: 'Navigation', shortcut: 'G D' },
    { id: 'jarvis', label: 'JARVIS Control Centre', icon: Bot, category: 'Navigation', shortcut: 'G J' },
    { id: 'today', label: 'Today Tasks', icon: CheckSquare, category: 'Navigation', shortcut: 'G T' },
    { id: 'habits', label: 'Habit Tracker', icon: Target, category: 'Navigation', shortcut: 'G H' },
    { id: 'gym', label: 'Fitness OS', icon: Dumbbell, category: 'Navigation', shortcut: 'G W' },
    { id: 'diet', label: 'Diet OS', icon: Utensils, category: 'Navigation', shortcut: 'G N' },
    { id: 'focus', label: 'Focus Mode', icon: Clock, category: 'Navigation', shortcut: 'G F' },
    { id: 'calendar', label: 'Calendar', icon: Calendar, category: 'Navigation', shortcut: 'G C' },
    { id: 'analytics', label: 'Analytics', icon: BarChart2, category: 'Navigation', shortcut: 'G A' },
    { id: 'routines', label: 'Routines', icon: Sparkles, category: 'Navigation', shortcut: 'G R' },
    { id: 'ai', label: 'AI Insights & Reports', icon: Brain, category: 'Navigation', shortcut: 'G I' },
    { id: 'settings', label: 'Settings', icon: Settings, category: 'Navigation', shortcut: 'G S' },
    { id: 'admin', label: 'Admin Console', icon: Shield, category: 'Navigation', shortcut: 'G X' },
  ], []);

  // Quick actions list
  const quickActions = useMemo(() => [
    {
      id: 'action-consult-jarvis',
      label: 'Open JARVIS Autonomous Control',
      subtitle: 'Execute natural-language commands & chat',
      icon: Bot,
      category: 'Actions',
      action: () => {
        setPage('jarvis');
        onClose();
      }
    },
    {
      id: 'action-consult-ai',
      label: 'Consult AI Daily Planner',
      subtitle: 'Synthesize optimal daily schedules',
      icon: Brain,
      category: 'Actions',
      action: () => {
        setPage('ai');
        onClose();
      }
    },
    {
      id: 'action-create-task',
      label: 'Create New Task',
      subtitle: 'Add a new mission to your day',
      icon: Plus,
      category: 'Actions',
      action: () => {
        onClose();
        if (onOpenCreateTask) onOpenCreateTask();
      }
    },
    {
      id: 'action-start-focus',
      label: 'Start 25m Pomodoro Focus Session',
      subtitle: 'Ignite deep work state with tactical timer',
      icon: Clock,
      category: 'Actions',
      action: () => {
        setPage('focus');
        startPomodoro();
        onClose();
      }
    },
    {
      id: 'action-quick-hydration',
      label: 'Log Quick Hydration (+250ml)',
      subtitle: 'Record 1 standard glass of water',
      icon: Droplets,
      category: 'Actions',
      action: () => {
        const t = today();
        const nowTime = new Date().toTimeString().slice(0, 5);
        logWater(t, nowTime);
        onClose();
      }
    },
    {
      id: 'action-toggle-theme',
      label: `Switch Theme (Current: ${theme})`,
      subtitle: theme === 'dark' ? 'Change to tactical high-contrast light' : 'Change to stealth dark',
      icon: theme === 'dark' ? Sun : Moon,
      category: 'Actions',
      action: () => {
        toggleTheme();
        onClose();
      }
    },
    {
      id: 'action-go-today',
      label: 'Jump to Today Date',
      subtitle: `Reset active date to ${today()}`,
      icon: Calendar,
      category: 'Actions',
      action: () => {
        setActiveDate(today());
        setPage('today');
        onClose();
      }
    }
  ], [onClose, onOpenCreateTask, setPage, startPomodoro, theme, toggleTheme, logWater, setActiveDate]);

  // Matching cross-module records (Tasks, Habits, Routines, Workouts)
  const matchingRecords = useMemo(() => {
    if (!query.trim() || query.trim().length < 2) return [];
    const q = query.toLowerCase();
    const list = [];

    // 1. Tasks
    Object.entries(tasks || {}).forEach(([date, dayTasks]) => {
      (dayTasks || []).forEach(t => {
        if (
          (t.title && t.title.toLowerCase().includes(q)) || 
          (t.description && t.description.toLowerCase().includes(q)) ||
          (t.category && t.category.toLowerCase().includes(q))
        ) {
          list.push({
            id: `task-${t.id}`,
            label: t.title,
            subtitle: `${date} · ${t.category || 'General'} · Priority: ${t.priority || 'Medium'}`,
            completed: t.completed,
            priority: t.priority,
            category: 'Tasks',
            icon: CheckSquare,
            action: () => {
              setActiveDate(date);
              setPage('today');
              onClose();
            }
          });
        }
      });
    });

    // 2. Habits
    (habits || []).forEach(h => {
      const name = h.name || h.title || '';
      if (name.toLowerCase().includes(q) || (h.category && h.category.toLowerCase().includes(q))) {
        list.push({
          id: `habit-${h.id}`,
          label: `${h.icon || '🌟'} ${name}`,
          subtitle: `Streak: ${h.streak || 0} days · ${h.category || 'Habit'}`,
          category: 'Habits',
          icon: Target,
          action: () => {
            setPage('habits');
            onClose();
          }
        });
      }
    });

    // 3. Routines
    (routines || []).forEach(r => {
      if (r.title && r.title.toLowerCase().includes(q)) {
        list.push({
          id: `routine-${r.id}`,
          label: r.title,
          subtitle: `Routine Protocol · ${r.priority || 'Medium'}`,
          category: 'Routines',
          icon: Sparkles,
          action: () => {
            setPage('routines');
            onClose();
          }
        });
      }
    });

    // 4. Workouts
    Object.entries(workouts || {}).forEach(([date, w]) => {
      if (w && w.name && w.name.toLowerCase().includes(q)) {
        list.push({
          id: `workout-${date}`,
          label: w.name,
          subtitle: `${date} · ${w.completed ? 'Completed' : 'Planned Session'}`,
          category: 'Fitness',
          icon: Dumbbell,
          action: () => {
            setActiveDate(date);
            setPage('gym');
            onClose();
          }
        });
      }
    });

    return list.slice(0, 10);
  }, [query, tasks, habits, routines, workouts, setActiveDate, setPage, onClose]);

  // Combined filtered items
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Default: show quick actions and top navigation
      return [
        ...quickActions,
        ...pages.map(p => ({
          ...p,
          action: () => {
            setPage(p.id);
            onClose();
          }
        }))
      ];
    }

    // Filter pages
    const matchedPages = pages
      .filter(p => p.label.toLowerCase().includes(q) || p.id.toLowerCase().includes(q))
      .map(p => ({
        ...p,
        action: () => {
          setPage(p.id);
          onClose();
        }
      }));

    // Filter actions
    const matchedActions = quickActions.filter(a => 
      a.label.toLowerCase().includes(q) || (a.subtitle && a.subtitle.toLowerCase().includes(q))
    );

    return [...matchedActions, ...matchedPages, ...matchingRecords];
  }, [query, pages, quickActions, matchingRecords, setPage, onClose]);

  // Keep selected index in bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredItems, selectedIndex, onClose]);

  const PRIORITY_COLOR = { High: 'var(--priority-high)', Medium: 'var(--priority-medium)', Low: 'var(--priority-low)' };

  return (
    <motion.div 
      className="search-overlay" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '80px 16px 24px',
      }}
    >
      <motion.div 
        className="search-box" 
        initial={{ opacity: 0, y: -20, scale: 0.96 }} 
        animate={{ opacity: 1, y: 0, scale: 1 }} 
        exit={{ opacity: 0, y: -20, scale: 0.96 }} 
        transition={{ duration: 0.18, ease: 'easeOut' }}
        style={{
          width: '100%',
          maxWidth: 620,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg, 16px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 140px)'
        }}
      >
        {/* Command Input Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 18px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <Search size={19} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
          <input 
            ref={inputRef}
            autoFocus 
            className="search-input" 
            placeholder="Search commands, tasks, pages, or tools (↑↓ to navigate, ↵ to select)…" 
            value={query} 
            onChange={e => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: 15,
              fontWeight: 500,
              fontFamily: 'inherit'
            }}
          />
          {query && (
            <button 
              className="btn btn-ghost btn-icon btn-xs" 
              onClick={() => setQuery('')}
              style={{ color: 'var(--text-muted)' }}
            >
              <X size={14} />
            </button>
          )}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 6px',
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.08)',
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--text-muted)'
          }}>
            ESC
          </div>
        </div>

        {/* Results List */}
        <div style={{
          overflowY: 'auto',
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4
        }}>
          {filteredItems.length === 0 ? (
            <div style={{
              padding: '36px 20px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: 13
            }}>
              No matching commands, pages, or tasks found for <strong style={{ color: 'var(--text-primary)' }}>"{query}"</strong>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon || Hash;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(index)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md, 10px)',
                    cursor: 'pointer',
                    background: isSelected ? 'var(--bg-elevated)' : 'transparent',
                    border: isSelected ? '1px solid var(--accent-primary)' : '1px solid transparent',
                    transition: 'all 0.1s ease',
                  }}
                >
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                    color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    flexShrink: 0
                  }}>
                    <Icon size={16} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}>
                      <span style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: isSelected ? 'var(--text-primary)' : 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {item.label}
                      </span>
                      {item.completed !== undefined && (
                        <span style={{
                          fontSize: 9,
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: 4,
                          background: item.completed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: item.completed ? '#10b981' : '#f59e0b'
                        }}>
                          {item.completed ? 'COMPLETED' : 'PENDING'}
                        </span>
                      )}
                    </div>
                    {item.subtitle && (
                      <div style={{
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        marginTop: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {item.subtitle}
                      </div>
                    )}
                  </div>

                  {item.category && (
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5
                    }}>
                      {item.category}
                    </span>
                  )}

                  {item.shortcut && (
                    <span style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: '2px 5px',
                      borderRadius: 4,
                      background: 'rgba(255, 255, 255, 0.06)',
                      color: 'var(--text-muted)'
                    }}>
                      {item.shortcut}
                    </span>
                  )}

                  <ChevronRight 
                    size={14} 
                    style={{ 
                      color: isSelected ? 'var(--accent-primary)' : 'var(--text-muted)',
                      opacity: isSelected ? 1 : 0.3
                    }} 
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div style={{
          padding: '8px 16px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'rgba(0, 0, 0, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 11,
          color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span><kbd style={{ padding: '1px 4px', borderRadius: 3, background: 'rgba(255,255,255,0.08)' }}>↑↓</kbd> Navigate</span>
            <span><kbd style={{ padding: '1px 4px', borderRadius: 3, background: 'rgba(255,255,255,0.08)' }}>↵</kbd> Select</span>
            <span><kbd style={{ padding: '1px 4px', borderRadius: 3, background: 'rgba(255,255,255,0.08)' }}>ESC</kbd> Close</span>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-primary)', letterSpacing: 0.5 }}>
            TASKBAR COMMAND OS
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
