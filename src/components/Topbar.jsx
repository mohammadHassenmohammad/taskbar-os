import { Sun, Moon, Timer, Search, Menu, RefreshCw } from 'lucide-react';
import { useStore } from '../store/useStore';
import { format } from 'date-fns';

const PAGE_TITLES = {
  dashboard: 'Dashboard', today: "Today's Tasks", calendar: 'Calendar',
  analytics: 'Analytics', focus: 'Focus Mode', report: 'Monthly Report',
  settings: 'Settings', archive: 'Archive', ai: 'AI Insights',
  habits: 'Habits Tracker', routines: 'Daily Routines', gym: 'Fitness OS',
};

export default function Topbar({ onMobileMenuClick, onSearchOpen }) {
  const { theme, toggleTheme, currentPage, gamification, setPage } = useStore();
  const today = format(new Date(), 'EEEE, MMMM d');

  return (
    <div className="topbar">
      <button className="mobile-menu-btn haptic-touch" onClick={onMobileMenuClick}><Menu size={18} /></button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="topbar-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {PAGE_TITLES[currentPage] || 'Dashboard'}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{today}</div>
      </div>
      <div className="topbar-actions">
        <button className="btn btn-ghost btn-icon haptic-touch" onClick={() => window.location.reload()} title="Reload System">
          <RefreshCw size={16} />
        </button>
        <button className="btn btn-ghost btn-icon haptic-touch" onClick={onSearchOpen} title="Search (Ctrl+K)">
          <Search size={16} />
        </button>
        <button className="btn btn-ghost btn-icon haptic-touch" onClick={() => setPage('focus')} title="Focus Mode">
          <Timer size={16} />
        </button>
        {gamification.streak > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.2)', borderRadius: 'var(--radius-full)', padding: '4px 10px', fontSize: 12, fontWeight: 700, color: 'var(--color-warning)' }}>
            🔥 {gamification.streak}
          </div>
        )}
        <button className="btn btn-ghost btn-icon haptic-touch" onClick={toggleTheme} title="Toggle Theme">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </div>
  );
}
