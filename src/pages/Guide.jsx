import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, CheckSquare, Calendar, Dumbbell, Utensils, Timer, 
  Repeat, BarChart3, Zap, RefreshCw, Settings, BookOpen, 
  ChevronRight, ArrowLeft
} from 'lucide-react';
import { useStore } from '../store/useStore';

const HELP_SECTIONS = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: BookOpen,
    color: '#6865F5',
    summary: 'Core concepts, navigation, and overview of TaskBar OS.',
    articles: [
      {
        q: 'What is TaskBar OS?',
        a: 'TaskBar OS is an integrated productivity and lifestyle operating system designed for daily execution, fitness tracking, nutrition management, focus sessions, and habits in a single dark-themed environment.'
      },
      {
        q: 'How does Local-First storage work?',
        a: 'Your data is instantly stored in local browser state and persisted to localStorage. When authenticated with Firebase, changes automatically synchronize to Cloud Firestore in the background.'
      }
    ]
  },
  {
    id: 'tasks',
    title: 'Tasks & Priorities',
    icon: CheckSquare,
    color: '#22C58B',
    summary: 'Creating, scheduling, categorizing, and completing daily tasks.',
    articles: [
      {
        q: 'How do task priorities work?',
        a: 'Tasks can be categorized into High, Medium, or Low priority. Completing a High priority task awards 50 XP, Medium awards 25 XP, and Low awards 10 XP.'
      },
      {
        q: 'How do I filter and organize tasks?',
        a: 'In the Today view, filter tasks by status (All, Active, Completed) or priority. Use the search overlay (Ctrl+K) to find tasks across past and future dates.'
      }
    ]
  },
  {
    id: 'calendar',
    title: 'Calendar',
    icon: Calendar,
    color: '#38BDF8',
    summary: 'Monthly schedules, day views, and historical records.',
    articles: [
      {
        q: 'How does calendar navigation work?',
        a: 'Navigate between months using the left and right controls. Selecting any date highlights scheduled tasks and activities for that specific day.'
      },
      {
        q: 'Can I add tasks directly to future dates?',
        a: 'Yes. Select the target day on the calendar and create a task. It will automatically be assigned to that specific date.'
      }
    ]
  },
  {
    id: 'fitness',
    title: 'Fitness OS',
    icon: Dumbbell,
    color: '#F5AE45',
    summary: 'Workout logging, exercise library, set tracking, and volume.',
    articles: [
      {
        q: 'How are workout sets and volume recorded?',
        a: 'Log completed repetitions and weight for each exercise. Total session volume is calculated by summing Weight (kg) × Repetitions across all completed sets.'
      },
      {
        q: 'How does the Exercise Library work?',
        a: 'Fitness OS includes a catalog of 38 standard exercises categorized by muscle groups (Chest, Back, Legs, Arms, Core, Shoulders). You can add exercises from the library directly to your workout schedule.'
      }
    ]
  },
  {
    id: 'nutrition',
    title: 'Diet OS',
    icon: Utensils,
    color: '#EC4899',
    summary: 'Calorie targets, macro nutrients, meal logging, and water intake.',
    articles: [
      {
        q: 'How are daily calories and macros calculated?',
        a: 'Logged meals aggregate Calories, Protein, Carbohydrates, and Fats. Real progress bars on the dashboard compare actual intake against your configured daily targets.'
      },
      {
        q: 'How do I log hydration?',
        a: 'Log water intake using the hydration schedule or quick action bar. Meeting your daily target awards XP.'
      }
    ]
  },
  {
    id: 'focus',
    title: 'Focus Mode',
    icon: Timer,
    color: '#8B5CF6',
    summary: 'Distraction-free Pomodoro timer and elapsed-time tracking.',
    articles: [
      {
        q: 'How does the focus timer calculate elapsed time?',
        a: 'The timer computes elapsed time using timestamp deltas so that switching tabs or backgrounding the window maintains accurate minute tracking.'
      },
      {
        q: 'Are focus sessions rewarded?',
        a: 'Completing a full focus session awards 25 XP. Prematurely cancelled sessions do not award duplicate or unearned XP.'
      }
    ]
  },
  {
    id: 'routines',
    title: 'Routines',
    icon: Repeat,
    color: '#10B981',
    summary: 'Recurring daily habits, completion rules, and streak tracking.',
    articles: [
      {
        q: 'How do recurring routines work?',
        a: 'Routines automatically populate into your daily task list on their scheduled days of the week. Completing them updates your active habit streak.'
      },
      {
        q: 'How are streaks calculated?',
        a: 'Streaks track consecutive scheduled days completed. Non-scheduled rest days do not penalize your streak.'
      }
    ]
  },
  {
    id: 'analytics',
    title: 'Analytics',
    icon: BarChart3,
    color: '#6366F1',
    summary: 'Productivity trends, fitness volume, and correlation insights.',
    articles: [
      {
        q: 'Where do analytics metrics come from?',
        a: 'All charts and metrics are computed from genuine recorded entries. When there is insufficient data for a metric, the system displays "Not enough data yet" instead of synthetic numbers.'
      }
    ]
  },
  {
    id: 'levels-xp',
    title: 'Levels & XP',
    icon: Zap,
    color: '#F59E0B',
    summary: 'Gamification rules, level thresholds, and progression ranks.',
    articles: [
      {
        q: 'How do I level up?',
        a: 'Earn Experience Points (XP) through tasks, workouts, focus sessions, and hydration. As your lifetime XP accumulates, your profile advances across verified ranks.'
      },
      {
        q: 'Can XP be farmed or duplicated?',
        a: 'No. The authoritative XP engine uses idempotency keys and an audit ledger to prevent double-awarding XP on repeated toggles.'
      }
    ]
  },
  {
    id: 'sync-backup',
    title: 'Sync & Backup',
    icon: RefreshCw,
    color: '#3B82F6',
    summary: 'Cloud synchronization, offline storage, and data backup.',
    articles: [
      {
        q: 'What do the sync states mean?',
        a: '• Synced: Cloud and local state are aligned.\n• Syncing: Changes are being uploaded.\n• Offline: Running in local-first mode.\n• Local Only: Operating as a guest account without cloud storage.'
      }
    ]
  },
  {
    id: 'account-settings',
    title: 'Account Settings',
    icon: Settings,
    color: '#64748B',
    summary: 'Profile customization, theme preferences, and credentials.',
    articles: [
      {
        q: 'How do I adjust personal goals?',
        a: 'Visit the Settings module to configure custom calorie targets, protein goals, hydration targets, and notification preferences.'
      }
    ]
  }
];

export default function Guide() {
  const { setPage } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState(null);

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return HELP_SECTIONS;
    const q = searchQuery.toLowerCase();
    return HELP_SECTIONS.map(sec => {
      const matchSection = sec.title.toLowerCase().includes(q) || sec.summary.toLowerCase().includes(q);
      const filteredArticles = sec.articles.filter(
        art => art.q.toLowerCase().includes(q) || art.a.toLowerCase().includes(q)
      );
      if (matchSection || filteredArticles.length > 0) {
        return {
          ...sec,
          articles: filteredArticles.length > 0 ? filteredArticles : sec.articles
        };
      }
      return null;
    }).filter(Boolean);
  }, [searchQuery]);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', paddingBottom: 60, display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Top Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }}
        style={{ 
          background: 'var(--bg-card)', padding: '28px 32px', borderRadius: 'var(--radius-xl)', 
          border: '1px solid var(--border-subtle)', textAlign: 'center' 
        }}
      >
        <span style={{ 
          fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5, 
          padding: '4px 12px', borderRadius: 20, background: 'rgba(99, 102, 241, 0.12)', 
          color: 'var(--accent-primary)', display: 'inline-block', marginBottom: 12 
        }}>
          Help Center & Documentation
        </span>

        <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 10px' }}>
          TaskBar OS Knowledge Base
        </h1>

        <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 580, margin: '0 auto 20px', lineHeight: 1.6 }}>
          Explore detailed guides on task execution, fitness routines, nutrition management, gamification formulas, and synchronization.
        </p>

        {/* Search Input */}
        <div style={{ position: 'relative', maxWidth: 480, margin: '0 auto' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: 12 }} />
          <input 
            type="text"
            placeholder="Search articles, formulas, features..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input"
            style={{ width: '100%', paddingLeft: 40, height: 42, fontSize: 14 }}
          />
        </div>
      </motion.div>

      {/* Detail Section Modal / View */}
      {selectedSection && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          className="card"
          style={{ padding: 28, borderRadius: 'var(--radius-xl)' }}
        >
          <button 
            className="btn btn-ghost btn-sm"
            onClick={() => setSelectedSection(null)}
            style={{ marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <ArrowLeft size={14} /> Back to All Topics
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ padding: 10, borderRadius: 12, background: `${selectedSection.color}20`, color: selectedSection.color }}>
              <selectedSection.icon size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                {selectedSection.title}
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                {selectedSection.summary}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
            {selectedSection.articles.map((art, idx) => (
              <div key={idx} style={{ padding: 18, borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>
                  {art.q}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' }}>
                  {art.a}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Grid of Topics */}
      {!selectedSection && (
        <div className="grid-3" style={{ gap: 16 }}>
          {filteredSections.map(section => {
            const Icon = section.icon;
            return (
              <motion.div
                key={section.id}
                className="card"
                whileHover={{ y: -3, borderColor: 'var(--accent-primary)' }}
                onClick={() => setSelectedSection(section)}
                style={{ 
                  padding: 22, borderRadius: 'var(--radius-lg)', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  border: '1px solid var(--border-subtle)', background: 'var(--bg-card)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ padding: 8, borderRadius: 10, background: `${section.color}15`, color: section.color }}>
                      <Icon size={20} />
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>
                      {section.articles.length} articles
                    </span>
                  </div>

                  <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                    {section.title}
                  </h3>

                  <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    {section.summary}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent-primary)', fontSize: 12, fontWeight: 700, marginTop: 16 }}>
                  <span>Read Guide</span>
                  <ChevronRight size={14} />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Bottom return link */}
      <div style={{ textAlign: 'center', marginTop: 12 }}>
        <button 
          className="btn btn-ghost btn-sm"
          onClick={() => setPage('dashboard')}
          style={{ color: 'var(--text-muted)' }}
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
