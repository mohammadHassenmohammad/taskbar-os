import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { format, differenceInMinutes, parse } from 'date-fns';
import { motion } from 'framer-motion';
import { Moon, Sun, Zap, Activity, Info, ChevronRight, Save, Plus } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { toast } from 'react-hot-toast';

export default function BioHacker() {
  const { sleepLogs, energyLogs, logSleep, logEnergy, isSleeping, setSleeping } = useStore();
  const today = format(new Date(), 'yyyy-MM-dd');
  
  const currentSleep = sleepLogs[today] || { start: '22:30', end: '06:30', quality: 7, notes: '' };
  const currentEnergy = energyLogs[today] || [];
  
  const [sleepData, setSleepData] = useState(currentSleep);
  const [energyLevel, setEnergyLevel] = useState(7);

  const duration = useMemo(() => {
    try {
      const start = parse(sleepData.start, 'HH:mm', new Date());
      let end = parse(sleepData.end, 'HH:mm', new Date());
      if (end < start) end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
      const mins = differenceInMinutes(end, start);
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return { h, m, total: mins };
    } catch (e) { return { h: 0, m: 0, total: 0 }; }
  }, [sleepData]);

  const handleSaveSleep = () => {
    logSleep(today, sleepData);
    toast.success('Sleep intelligence synchronized! 🛡️', { icon: '🌙' });
  };

  const handleLogEnergy = () => {
    const time = format(new Date(), 'HH:mm');
    logEnergy(today, time, energyLevel);
    toast.success(`Energy pulse logged at ${energyLevel}/10! ⚡`);
  };

  const energyChartData = useMemo(() => {
    if (currentEnergy.length === 0) return [{ time: '08:00', level: 5 }, { time: '22:00', level: 5 }];
    return currentEnergy.map(l => ({ ...l, label: l.time }));
  }, [currentEnergy]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
      {/* Sleep Monitor Section */}
      <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ padding: 8, background: 'rgba(99, 102, 241, 0.1)', borderRadius: 12, color: 'var(--accent-primary)' }}>
              <Moon size={18} />
            </div>
            <div>
              <div className="section-title">Sleep Intelligence</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>RECOVERY PROTOCOL</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={handleSaveSleep} title="Save Recovery Data">
            <Save size={16} />
          </button>
        </div>

        <div style={{ margin: '20px 0', padding: 20, background: 'var(--bg-elevated)', borderRadius: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 40, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: -2 }}>
            {duration.h}<span style={{ fontSize: 18, color: 'var(--text-muted)', letterSpacing: 0, marginLeft: 4 }}>H</span> {duration.m}<span style={{ fontSize: 18, color: 'var(--text-muted)', letterSpacing: 0, marginLeft: 4 }}>M</span>
          </div>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>Total Duration</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
               <label className="form-label" style={{ fontSize: 10, margin: 0 }}>Bedtime</label>
               <button 
                disabled={isSleeping}
                onClick={() => {
                  setSleepData({ ...sleepData, start: format(new Date(), 'HH:mm') });
                  setSleeping(true);
                  toast.success('Entering Sleep Mode... 🌙');
                }}
                style={{ fontSize: 9, fontWeight: 900, background: isSleeping ? 'var(--bg-active)' : 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: 4, padding: '2px 6px', cursor: isSleeping ? 'default' : 'pointer', opacity: isSleeping ? 0.5 : 1 }}
               >
                 {isSleeping ? 'ASLEEP' : 'SLEEP NOW'}
               </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input type="time" className="form-input" value={sleepData.start} onChange={e => setSleepData({ ...sleepData, start: e.target.value })} />
              <Moon size={12} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
            </div>
          </div>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
               <label className="form-label" style={{ fontSize: 10, margin: 0 }}>Wake Time</label>
               <button 
                disabled={!isSleeping}
                onClick={() => {
                  setSleepData({ ...sleepData, end: format(new Date(), 'HH:mm') });
                  setSleeping(false);
                  toast.success('Welcome back, Operative! ☀️');
                }}
                style={{ fontSize: 9, fontWeight: 900, background: !isSleeping ? 'var(--bg-active)' : 'var(--color-success)', color: 'white', border: 'none', borderRadius: 4, padding: '2px 6px', cursor: !isSleeping ? 'default' : 'pointer', opacity: !isSleeping ? 0.5 : 1 }}
               >
                 WAKE NOW
               </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input type="time" className="form-input" value={sleepData.end} onChange={e => setSleepData({ ...sleepData, end: e.target.value })} />
              <Sun size={12} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
            </div>
          </div>
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="form-label" style={{ fontSize: 10 }}>Recovery Quality</label>
            <span style={{ fontSize: 12, fontWeight: 900, color: 'var(--accent-primary)' }}>{sleepData.quality}/10</span>
          </div>
          <input 
            type="range" min="1" max="10" step="1" 
            style={{ width: '100%', height: 6, borderRadius: 3, accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
            value={sleepData.quality} onChange={e => setSleepData({ ...sleepData, quality: parseInt(e.target.value) })} 
          />
        </div>
      </motion.div>

      {/* Energy Pulse Section */}
      <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <div className="section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ padding: 8, background: 'rgba(16, 185, 129, 0.1)', borderRadius: 12, color: 'var(--color-success)' }}>
              <Zap size={18} />
            </div>
            <div>
              <div className="section-title">Energy Pulse</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>BIOMETRIC FLOW</div>
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleLogEnergy} style={{ padding: '4px 12px' }}>
            Log <Plus size={14} />
          </button>
        </div>

        <div style={{ height: 120, minHeight: 120, margin: '15px 0' }}>
          <ResponsiveContainer width="99%" height="100%">
            <AreaChart data={energyChartData}>
              <defs>
                <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip 
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 10 }}
                labelFormatter={(v) => `Time: ${v}`}
              />
              <Area type="monotone" dataKey="level" stroke="var(--color-success)" strokeWidth={3} fill="url(#energyGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: 'var(--bg-elevated)', padding: 16, borderRadius: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pulse Intensity</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--color-success)' }}>{energyLevel}</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1,2,3,4,5,6,7,8,9,10].map(val => (
              <button 
                key={val}
                onClick={() => setEnergyLevel(val)}
                style={{ 
                  flex: 1, height: 30, borderRadius: 6, border: 'none',
                  background: energyLevel === val ? 'var(--color-success)' : 'var(--bg-active)',
                  color: energyLevel === val ? 'white' : 'var(--text-muted)',
                  fontSize: 10, fontWeight: 900, cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
           <div style={{ flex: 1, padding: 12, background: 'rgba(var(--accent-primary-rgb), 0.05)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 9, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Peak State</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
                {currentEnergy.length > 0 ? currentEnergy.reduce((prev, current) => (prev.level > current.level) ? prev : current).time : 'No Data'}
              </div>
           </div>
           <div style={{ flex: 1, padding: 12, background: 'rgba(var(--accent-primary-rgb), 0.05)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 9, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tactical Projection</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: sleepData.quality >= 7 ? 'var(--color-success)' : 'var(--color-warning)', marginTop: 2 }}>
                {sleepData.quality >= 8 ? '+15% Efficiency' : sleepData.quality >= 6 ? 'Standard Flow' : '-20% Friction'}
              </div>
           </div>
        </div>
      </motion.div>
    </div>
  );
}


