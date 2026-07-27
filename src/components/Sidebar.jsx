import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, LayoutDashboard, CheckSquare, Calendar, BarChart3, Timer, Sparkles, FileText, Archive, Settings, Repeat, Target, Zap, Flame, X, Dumbbell, LogOut, HelpCircle, RefreshCw } from 'lucide-react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

const NAV_ITEMS = [
  { section: 'Main', items: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'today', label: 'Today', icon: CheckSquare },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'gym', label: 'Fitness OS', icon: Dumbbell },
  ]},
  { section: 'Productivity', items: [
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'focus', label: 'Focus Mode', icon: Timer },
    { id: 'routines', label: 'Routines', icon: Repeat },
    { id: 'ai', label: 'AI Insights', icon: Sparkles },
  ]},
  { section: 'Reports', items: [
    { id: 'report', label: 'Monthly Report', icon: FileText },
    { id: 'archive', label: 'Archive', icon: Archive },
  ]},
  { section: 'System', items: [
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'guide', label: 'Manual', icon: HelpCircle },
  ]},
];

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const { currentPage, setPage, sidebarCollapsed, toggleSidebar, gamification, getLevelInfo, logout, user } = useStore();
  const lvl = getLevelInfo();

  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const collapsed = isMobile ? false : sidebarCollapsed;

  const handleNav = (id) => {
    setPage(id);
    if (onMobileClose) onMobileClose();
  };

  const sidebarContent = (
    <motion.div
      className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
      initial={isMobile ? { x: -280, opacity: 1 } : false}
      animate={
        isMobile 
          ? { x: mobileOpen ? 0 : -280, opacity: 1 } 
          : { width: collapsed ? 68 : 240, x: 0, opacity: 1 }
      }
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      style={{ 
        zIndex: 99999, 
        opacity: 1,
        position: isMobile ? 'fixed' : 'relative',
        top: 0,
        left: 0,
        bottom: 0,
        height: isMobile ? undefined : '100vh',
        paddingBottom: isMobile ? 'env(safe-area-inset-bottom)' : 0,
        boxSizing: 'border-box'
      }}
    >
      <div className="sidebar-header" style={{ padding: collapsed ? '16px 0' : '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="logo-icon"><Zap size={18} fill="currentColor" /></div>
            <span className="logo-text">TaskBar <span style={{ opacity: 0.5, fontWeight: 400 }}>OS</span></span>
          </div>
        )}
        {collapsed && (
          <div className="logo-icon" style={{ margin: '0 auto' }}><Zap size={18} fill="currentColor" /></div>
        )}
        {isMobile && mobileOpen && (
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onMobileClose}>
            <X size={18} />
          </button>
        )}
      </div>

      <div 
        style={{ 
          flex: 1, 
          minHeight: 0,
          overflowY: 'auto', 
          overflowX: 'hidden',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          display: 'flex',
          flexDirection: 'column'
        }}
        className="sidebar-scroll-container"
      >
        <style>{`.sidebar-scroll-container::-webkit-scrollbar { display: none; }`}</style>
        
        {/* Navigation */}
        <nav className="sidebar-nav" style={{ padding: '16px 12px', flexShrink: 0 }}>
          {NAV_ITEMS.map((section) => (
            <div key={section.section} style={{ marginBottom: 12 }}>
              {!collapsed && <div className="nav-section-label" style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 800, marginBottom: 6 }}>{section.section}</div>}
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <div key={item.id} className={`nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleNav(item.id)} title={collapsed ? item.label : ''}
                    style={{ 
                      background: isActive ? 'linear-gradient(90deg, rgba(var(--accent-primary-rgb), 0.15) 0%, transparent 100%)' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
                      borderRadius: isActive ? '0 var(--radius-md) var(--radius-md) 0' : 'var(--radius-md)',
                      marginLeft: isActive ? -12 : 0,
                      paddingLeft: isActive ? 24 : 12,
                      fontWeight: isActive ? 700 : 500
                    }}
                  >
                    <span className="nav-icon" style={{ color: isActive ? 'var(--accent-primary)' : 'inherit' }}><Icon size={18} /></span>
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span className="nav-label"
                          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.15 }}>
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* XP bar — part of scroll to ensure footer doesn't overlap */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              style={{ padding: '24px 20px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(var(--accent-primary-rgb), 0.03)', marginTop: 'auto', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  style={{ 
                    width: 36, height: 36, borderRadius: 10, 
                    background: `linear-gradient(135deg, ${lvl.rankColor || 'var(--accent-primary)'}, var(--accent-secondary))`, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    fontSize: 16, flexShrink: 0, boxShadow: `0 0 15px ${lvl.rankColor}44` 
                  }}>
                  {lvl.level <= 3 ? '🌱' : lvl.level <= 6 ? '🔥' : lvl.level <= 10 ? '⭐' : lvl.level <= 15 ? '💎' : lvl.level <= 20 ? '👑' : lvl.level <= 30 ? '🌀' : '🌌'}
                </motion.div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: lvl.rankColor }}>{lvl.title}</span>
                    <span style={{ fontSize: 11, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Zap size={11} fill="var(--accent-primary)" /> {gamification.xp}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    LEVEL {lvl.level} OPERATIVE
                  </div>
                </div>
              </div>
              <div className="level-bar" style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 10, overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, lvl.progress)}%` }} transition={{ duration: 1 }} style={{ height: '100%', background: `linear-gradient(90deg, ${lvl.rankColor || 'var(--accent-primary)'}, var(--accent-secondary))`, borderRadius: 10 }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mission Safe Padding */}
        <div style={{ height: 20, flexShrink: 0 }} />
      </div>

      {/* Fixed Footer: Operative Profile */}
      <div style={{ flexShrink: 0, padding: '12px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
        {!collapsed && (
          <div style={{ padding: '12px', borderRadius: 16, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900 }}>
              {(user?.username || 'U')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.username || 'Operative'}</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700 }}>{lvl.title}</div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => window.location.reload()} title="Reload OS" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}><RefreshCw size={14} /></button>
              <button onClick={logout} title="Logout" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}><LogOut size={14} /></button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );

  if (isMobile) {
    return createPortal(sidebarContent, document.body);
  }

  return sidebarContent;
}
