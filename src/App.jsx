import { useEffect, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { Plus, Search, X, CheckSquare, ArrowRight, Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { format, subDays, addMinutes } from 'date-fns';
import { useStore } from './store/useStore';
import { playNotificationSound } from './lib/audio';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import TaskModal from './components/TaskModal';
import Dashboard from './pages/Dashboard';
import TodayTasks from './pages/TodayTasks';
import Calendar from './pages/Calendar';
import Analytics from './pages/Analytics';
import FocusMode from './pages/FocusMode';
import MonthlyReport from './pages/MonthlyReport';
import Settings from './pages/Settings';
import Archive from './pages/Archive';
import Guide from './pages/Guide';
import AIInsights from './pages/AIInsights';
import Routines from './pages/Routines';
import Gym from './pages/Gym';
import Auth from './components/Auth';
import BottomNav from './components/BottomNav';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { NotificationService } from './lib/notifications';
import { App as CapApp } from '@capacitor/app';

// Helper for haptics — fails silently in browser
const triggerHaptic = async () => {
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch (e) {
    // Not on native — ignore
  }
};

// Helper to fire a web notification safely (not available on native WebView)
const fireWebNotification = (title, body) => {
  try {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  } catch (e) {
    // Ignore on native
  }
};

const PAGES = {
  dashboard: Dashboard, today: TodayTasks, calendar: Calendar,
  analytics: Analytics, focus: FocusMode, report: MonthlyReport,
  settings: Settings, archive: Archive, ai: AIInsights,
  routines: Routines, gym: Gym, guide: Guide,
};

function SearchOverlay({ onClose }) {
  const { tasks, setActiveDate, setPage } = useStore();
  const [query, setQuery] = useState('');

  const results = query.trim().length > 1
    ? Object.entries(tasks).flatMap(([date, dayTasks]) =>
        dayTasks
          .filter(t => t.title.toLowerCase().includes(query.toLowerCase()) || (t.description || '').toLowerCase().includes(query.toLowerCase()))
          .map(t => ({ ...t, date }))
      ).slice(0, 8)
    : [];

  useEffect(() => {
    const handle = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [onClose]);

  const PRIORITY_COLOR = { High: 'var(--priority-high)', Medium: 'var(--priority-medium)', Low: 'var(--priority-low)' };

  return (
    <motion.div className="search-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div className="search-box" initial={{ opacity: 0, y: -20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.96 }} transition={{ duration: 0.2 }}>
        <div className="search-input-wrap">
          <Search size={18} color="var(--text-muted)" />
          <input autoFocus className="search-input" placeholder="Search tasks across all days…" value={query} onChange={e => setQuery(e.target.value)} />
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={14} /></button>
        </div>
        <div className="search-results">
          {query.length > 1 && results.length === 0 && (
            <div className="search-empty">No tasks found for "{query}"</div>
          )}
          {results.map(task => (
            <div key={task.id} className="search-result-item" onClick={() => { setActiveDate(task.date); setPage('today'); onClose(); }}>
              <CheckSquare size={15} color={task.completed ? 'var(--color-success)' : 'var(--text-muted)'} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{task.date} · {task.category}</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: PRIORITY_COLOR[task.priority] }}>{task.priority}</span>
              <ArrowRight size={13} color="var(--text-muted)" />
            </div>
          ))}
          {query.length <= 1 && (
            <div className="search-empty">Type at least 2 characters to search…<br /><span style={{ fontSize: 10 }}>Tip: Press Ctrl+K anytime to open search</span></div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function App() {
  const { 
    theme, currentPage, setPage, focusMode, activeDate, applyRoutinesToDate, 
    applyGymScheduleForDate, user, setUser, loadUserData, authLoading, setAuthLoading,
    isDataLoaded, syncFirestore, tasks, workouts, gamification, journal, routines,
    waterLogs, waterSchedule, waterCompletions, moodLogs, bodyMetrics, personalRecords, 
    exerciseLibrary, settings, missionNotes, submittedDays, submitDay,
    syncError, bypassSync, logout
  } = useStore();

  const PageComponent = PAGES[currentPage] || Dashboard;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [fabTaskOpen, setFabTaskOpen] = useState(false);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  // Handle troubleshooting timeout for sync screen
  useEffect(() => {
    if (user && !isDataLoaded) {
      const timer = setTimeout(() => {
        setShowTroubleshooting(true);
      }, 5000); // 5 seconds
      return () => clearTimeout(timer);
    } else {
      setShowTroubleshooting(false);
    }
  }, [user, isDataLoaded]);

  // Theme + routines
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    applyRoutinesToDate(activeDate);
    applyGymScheduleForDate(activeDate);
  }, [theme, activeDate, applyRoutinesToDate, applyGymScheduleForDate]);

  // Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      try {
        if (u) {
          setUser(u);
          await loadUserData(u.uid);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('[Neural OS] Auth Handshake Failure:', err);
      } finally {
        setAuthLoading(false);
      }
    });
    return unsub;
  }, [setUser, loadUserData, setAuthLoading]);

  // Battery & Power Monitoring (Eco Mode)
  useEffect(() => {
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        const updateBattery = () => {
          // If unplugged and below 50%, or just unplugged, enable optimizations
          const isOptimized = !battery.charging || battery.level < 0.2;
          window.isBatteryOptimized = isOptimized;
          
          if (isOptimized) {
            document.documentElement.classList.add('eco-mode');
          } else {
            document.documentElement.classList.remove('eco-mode');
          }
        };
        battery.addEventListener('chargingchange', updateBattery);
        battery.addEventListener('levelchange', updateBattery);
        updateBattery();
      });
    }
  }, []);

  // Global Mission Notification Synchronizer
  useEffect(() => {
    if (!user || !isDataLoaded || !settings.notifications) {
      if (!settings.notifications) NotificationService.cancelAll().catch(() => {});
      return;
    }

    // Surgical Sync: Trigger on data change or every hour
    const performSync = async () => {
      const granted = await NotificationService.requestPermissions();
      if (granted) {
        useStore.getState().syncMissionNotifications().catch(err => 
          console.error('[Neural OS] Mission Sync Failed:', err)
        );
      } else {
        console.warn('[Neural OS] Notification permission denied.');
      }
    };

    performSync();
    
    // Background resync frequency depends on visibility
    const syncFreq = document.visibilityState === 'visible' ? 30 * 60 * 1000 : 60 * 60 * 1000;
    const interval = setInterval(performSync, syncFreq);
    return () => clearInterval(interval);
  }, [user, isDataLoaded, tasks, waterSchedule, waterCompletions, settings.notifications, workouts]);

  // Intelligent Resource & Performance Management
  useEffect(() => {
    if (!user || !settings.notifications) return;

    const notifiedRef = { current: new Set() };
    
    // Resource Monitor: Adjust polling frequency based on app state
    const getIntervalFrequency = () => {
      const isVisible = document.visibilityState === 'visible';
      const isLowPower = 'getBattery' in navigator && (window.isBatteryOptimized || false);
      
      if (!isVisible) return 60000; // Slow down to 1 minute when hidden (Zero CPU Impact)
      if (isLowPower) return 30000; // Slow down to 30s on battery
      return 10000; // Standard 10s check when active
    };

    let interval;
    const startSync = () => {
      clearInterval(interval);
      interval = setInterval(() => {
        const now = new Date();
        const minuteKey = format(now, 'yyyy-MM-dd HH:mm');
        const timeStr = format(now, 'HH:mm');
        const todayStr = format(now, 'yyyy-MM-dd');
        const normalize = (t) => (t || '').replace(/[:\s]/g, '').toLowerCase();
        const normNow = normalize(timeStr);

        const todayTasks = tasks[todayStr] || [];
        todayTasks.forEach(t => {
          const itemKey = `active-task-${t.id}-${minuteKey}`;
          if (normalize(t.reminderAt) === normNow && !t.completed && !notifiedRef.current.has(itemKey)) {
            toast(`🎯 Active Mission: ${t.title}`, { icon: '⚡', duration: 6000 });
            NotificationService.fireImmediate({
              id: Math.floor(Math.random() * 1000000),
              title: 'Active Mission ⚡',
              body: t.title
            });
            if (settings.sound) playNotificationSound(settings.notificationSound);
            notifiedRef.current.add(itemKey);
          }
        });

        if (now.getMinutes() === 0 && now.getSeconds() < 10) notifiedRef.current.clear();
      }, getIntervalFrequency());
    };

    // Listen for visibility changes to dynamically adjust power consumption
    document.addEventListener('visibilitychange', startSync);
    startSync();

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', startSync);
    };
  }, [user, tasks, settings.notifications, settings.sound, settings.notificationSound]);

  // Keyboard shortcuts (web only)
  useEffect(() => {
    const handle = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); setFabTaskOpen(true); }
      if (e.key === 'Escape') { setSearchOpen(false); setFabTaskOpen(false); setMobileOpen(false); }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []);

  // Native Android Back Button Handler
  useEffect(() => {
    let listenerHandle = null;

    CapApp.addListener('backButton', () => {
      const { goBack } = useStore.getState();
      if (searchOpen) { setSearchOpen(false); return; }
      if (fabTaskOpen) { setFabTaskOpen(false); return; }
      if (mobileOpen) { setMobileOpen(false); return; }
      
      const movedBack = goBack();
      if (!movedBack) {
        CapApp.exitApp();
      }
    }).then(handle => {
      listenerHandle = handle;
    }).catch(() => {});

    return () => {
      if (listenerHandle) listenerHandle.remove();
    };
  }, [currentPage, setPage, searchOpen, fabTaskOpen, mobileOpen]);

  // Splash / Auth Loading screen
  if (authLoading || (user && !isDataLoaded)) {
    const isError = !!syncError;
    const activeTroubleshoot = showTroubleshooting || isError;

    return (
      <div style={{ 
        width: '100vw', height: '100dvh', minHeight: '100vh', 
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
        background: '#0a0b10', position: 'fixed', inset: 0, zIndex: 99999, overflow: 'hidden' 
      }}>
        <div className="auth-mesh" style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ textAlign: 'center', zIndex: 2, padding: '20px', width: '100%', maxWidth: '440px' }}
        >
          <div className="loader-wrapper" style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 30px' }}>
            <motion.div 
              animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              style={{ position: 'absolute', inset: 0, border: '3px solid rgba(99, 102, 241, 0.1)', borderTop: '3px solid var(--accent-primary)', borderRadius: '50%' }}
            />
            <motion.div 
              animate={{ rotate: -360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="loader-inner-circle"
              style={{ position: 'absolute', inset: 15, border: '2px solid rgba(139, 92, 246, 0.1)', borderBottom: '2px solid var(--accent-secondary)', borderRadius: '50%' }}
            />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={40} color="var(--accent-primary)" fill="var(--accent-primary)" />
            </div>
          </div>
          <h2 className="loader-title" style={{ fontSize: 20, fontWeight: 900, color: 'white', letterSpacing: 2, textTransform: 'uppercase' }}>Synchronizing OS</h2>
          <p className="loader-subtitle" style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 12, fontWeight: 700 }}>
            {isError ? 'CLOUD PERMISSION ERROR' : 'VERIFYING NEURAL HANDSHAKE...'}
          </p>

          <AnimatePresence>
            {activeTroubleshoot && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                style={{ 
                  marginTop: '30px', 
                  padding: '20px', 
                  background: 'rgba(15, 23, 42, 0.65)', 
                  border: '1px solid rgba(255, 255, 255, 0.08)', 
                  borderRadius: '16px', 
                  backdropFilter: 'blur(12px)',
                  textAlign: 'left',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-danger)', boxShadow: '0 0 10px var(--color-danger)' }} />
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Troubleshooting Console</span>
                </div>
                
                {isError && (
                  <p style={{ fontSize: '11px', color: 'rgba(239, 68, 68, 0.85)', fontFamily: 'var(--font-mono)', margin: '0 0 16px 0', lineHeight: 1.5, background: 'rgba(239, 68, 68, 0.05)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.15)', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                    {syncError}
                  </p>
                )}
                
                {!isError && (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                    The neural handshake is taking longer than expected. You can run locally or change accounts.
                  </p>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button 
                    onClick={bypassSync} 
                    className="auth-btn-primary" 
                    style={{ 
                      width: '100%', 
                      padding: '10px 16px', 
                      fontSize: '13px', 
                      height: 'auto',
                      background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' 
                    }}
                  >
                    Proceed offline (Local Mode)
                  </button>
                  <button 
                    onClick={logout} 
                    className="auth-btn-ghost" 
                    style={{ 
                      width: '100%', 
                      padding: '10px 16px', 
                      fontSize: '13px', 
                      height: 'auto',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.7)'
                    }}
                  >
                    Sign Out / Change Identity
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        
        {!activeTroubleshoot && (
          <div style={{ position: 'absolute', bottom: 40, width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div className="loader-bar-container" style={{ width: 200, height: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 1, overflow: 'hidden' }}>
              <motion.div 
                animate={{ x: [-250, 250] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, transparent, var(--accent-primary), transparent)' }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!user) return <Auth />;

  return (
    <div className="app-layout" data-theme={theme}>
      {!focusMode && (
        <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      )}
      <div className="main-content">
        {!focusMode && (
          <Topbar onMobileMenuClick={() => setMobileOpen(true)} onSearchOpen={() => setSearchOpen(true)} />
        )}
        <div className="page-content">
          <PageComponent />
        </div>
        {!focusMode && <BottomNav />}
      </div>

      {/* FAB */}
      {!focusMode && currentPage !== 'gym' && (
        <motion.button 
          className="fab" 
          onClick={() => { triggerHaptic(); setFabTaskOpen(true); }} 
          whileHover={{ scale: 1.08 }} 
          whileTap={{ scale: 0.94 }} 
          title="New Task (Ctrl+N)"
        >
          <Plus size={22} strokeWidth={2.5} />
        </motion.button>
      )}

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
      </AnimatePresence>

      {/* FAB quick add modal */}
      <TaskModal isOpen={fabTaskOpen} onClose={() => setFabTaskOpen(false)} task={null} date={activeDate} />

      <Toaster position="bottom-right" toastOptions={{
        style: { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', fontSize: '13px', fontFamily: 'var(--font-sans)' },
        success: { iconTheme: { primary: 'var(--color-success)', secondary: 'var(--bg-card)' } },
        error: { iconTheme: { primary: 'var(--color-danger)', secondary: 'var(--bg-card)' } },
      }} />

      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="sidebar-overlay" 
            onClick={() => setMobileOpen(false)} 
            style={{ zIndex: 99998 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
