import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Utensils, Droplets, Footprints, Dumbbell, Scale, Timer, X } from 'lucide-react';
import WalkLogModal from './WalkLogModal';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

export default function QuickLogBar() {
  const { currentPage, setPage, setDietActiveDate, setGymActiveDate, logBodyMetrics } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showWalkModal, setShowWalkModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [weightInput, setWeightInput] = useState('70');

  // Contextual visibility: Do not render on administrative, settings, reports, or focus views
  const HIDDEN_PAGES = ['admin', 'settings', 'guide', 'archive', 'report', 'focus'];
  if (HIDDEN_PAGES.includes(currentPage)) {
    return null;
  }

  const today = format(new Date(), 'yyyy-MM-dd');

  const handleQuickWater = () => {
    setPage('today');
    toast.success('Logged Hydration session!', { icon: '💧' });
  };

  const handleQuickWeightSubmit = (e) => {
    e.preventDefault();
    const w = parseFloat(weightInput);
    if (w > 0) {
      logBodyMetrics(today, { weight: w });
      toast.success(`Weight recorded: ${w} kg`, { icon: '⚖️' });
      setShowWeightModal(false);
    }
  };

  return (
    <>
      {/* Floating Action Trigger Button */}
      <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9999 }}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent-primary), #4f46e5)',
            color: 'white', border: 'none', cursor: 'pointer',
            boxShadow: '0 10px 30px rgba(99,102,241,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transform: isOpen ? 'rotate(45deg)' : 'scale(1)'
          }}
          title="Quick Log Actions"
        >
          <Plus size={26} />
        </button>

        {/* Action Menu Pills */}
        {isOpen && (
          <div
            style={{
              position: 'absolute', bottom: 70, right: 0,
              display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            {[
              { id: 'food', label: '+ Log Food', icon: Utensils, color: '#6366f1', action: () => { setDietActiveDate(today); setPage('diet'); setIsOpen(false); } },
              { id: 'water', label: '+ Log Water', icon: Droplets, color: '#0ea5e9', action: () => { handleQuickWater(); setIsOpen(false); } },
              { id: 'walk', label: '+ Log Walk', icon: Footprints, color: '#10b981', action: () => { setShowWalkModal(true); setIsOpen(false); } },
              { id: 'workout', label: '+ Workout', icon: Dumbbell, color: '#f59e0b', action: () => { setGymActiveDate(today); setPage('gym'); setIsOpen(false); } },
              { id: 'weight', label: '+ Weight', icon: Scale, color: '#ec4899', action: () => { setShowWeightModal(true); setIsOpen(false); } },
              { id: 'focus', label: '+ Start Focus', icon: Timer, color: '#8b5cf6', action: () => { setPage('focus'); setIsOpen(false); } },
            ].map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 16px', borderRadius: 24,
                    background: 'var(--bg-card)', color: 'var(--text-primary)',
                    border: `1px solid ${item.color}40`, boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
                    cursor: 'pointer', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap'
                  }}
                >
                  <Icon size={16} color={item.color} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Walk Log Modal */}
      <WalkLogModal isOpen={showWalkModal} onClose={() => setShowWalkModal(false)} date={today} />

      {/* Weight Modal */}
      {showWeightModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 24, padding: 28, maxWidth: 360, width: '100%', border: '1px solid var(--border-subtle)', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 900, color: 'var(--text-primary)' }}>
                <Scale size={20} color="#ec4899" />
                <span>Log Body Weight</span>
              </div>
              <button onClick={() => setShowWeightModal(false)} className="btn btn-ghost btn-icon btn-sm"><X size={18}/></button>
            </div>
            <form onSubmit={handleQuickWeightSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Weight (Kilograms)</label>
                <input type="number" step="0.1" className="search-input" value={weightInput} onChange={e => setWeightInput(e.target.value)} placeholder="e.g. 70.5" required min="30" max="300" />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowWeightModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, background: '#ec4899' }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
