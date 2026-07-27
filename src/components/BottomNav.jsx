import { useStore } from '../store/useStore';
import { motion } from 'framer-motion';
import { Home, CheckSquare, Calendar, PieChart, Focus, Dumbbell } from 'lucide-react';

export default function BottomNav() {
  const { currentPage, setPage } = useStore();

  const NAV_ITEMS = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'today', label: 'Mission', icon: CheckSquare },
    { id: 'gym', label: 'Fitness', icon: Dumbbell },
    { id: 'calendar', label: 'Nexus', icon: Calendar },
    { id: 'analytics', label: 'Stats', icon: PieChart },
  ];

  return (
    <div className="bottom-nav-container">
      <div className="bottom-nav-glass">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <motion.button
              key={item.id}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setPage(item.id)}
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <div className="bottom-nav-icon-wrapper">
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {isActive && (
                  <motion.div 
                    layoutId="active-nav-glow"
                    className="bottom-nav-glow"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
              <span className="bottom-nav-label">{item.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
