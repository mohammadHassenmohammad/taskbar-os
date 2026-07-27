import { motion } from 'framer-motion';
import { HelpCircle, Zap, Target, Sparkles, Activity, Shield, TrendingUp, Info, Database, Layers, Layout, Calendar as CalIcon, Settings2, Download, Trophy } from 'lucide-react';

const GUIDE_SECTIONS = [
  {
    title: 'Tactical Keywords & Metrics',
    icon: <Zap size={20} color="var(--accent-primary)" />,
    items: [
      {
        key: 'Fitness Pulse',
        desc: 'A measure of your physical readiness. It tracks workout frequency over a 7-day rolling window. High pulse indicates optimal physiological priming.',
        integration: 'Synced with Analytics to correlate physical work with cognitive output.'
      },
      {
        key: 'Discipline Grade (S/A/B/C)',
        desc: 'A real-time evaluation of your mission adherence. "S" rank requires 90%+ task completion. Your grade determines your daily performance profile.',
        integration: 'Visible on Dashboard as a primary motivator for daily 100% completion.'
      },
      {
        key: 'Energy Pulse',
        desc: 'A self-reported metric of your cognitive energy levels (1-10) throughout the day. Essential for identifying your peak productivity windows.',
        integration: 'Visualized in the Analytics module as an "Energy Stability Index".'
      },
      {
        key: 'Neural Timeline',
        desc: 'A chronological map of your daily debriefs and scratchpad entries. It creates a "Mental Trace" of your session flow.',
        integration: 'Persistent record stored in the cloud for historical session analysis.'
      },
      {
        key: 'Neural Scratchpad',
        desc: 'A session-aware rapid capture tool. Perfect for "Brain Dumping" tactical thoughts without polluting your official mission list.',
        integration: 'Date-keyed entries that appear in both the Dashboard and the specific Day Details.'
      },
      {
        key: 'XP & Leveling',
        desc: 'Every mission completed, set performed, and water glass logged earns Experience Points (XP). Level up your operative profile to unlock elite ranks.',
        integration: 'Progress tracked in the Sidebar and Dashboard "Elite Status" cards.'
      }
    ]
  },
  {
    title: 'Core System Functions',
    icon: <Database size={20} color="var(--color-success)" />,
    items: [
      {
        key: 'Mission Debriefing',
        desc: 'The act of logging outcomes after a task. You can Edit and Delete logs directly in the timeline for maximum session speed.',
        usage: 'Double-click or use the pencil icon to refine your reflections. Click trash to instantly purge.'
      },
      {
        key: 'Body Composition Trend',
        desc: 'A weight-tracking system that visualizes your physical progress over time. It compares entries to identify upward or downward shifts.',
        usage: 'Log your weight daily in the Fitness OS (Gym) section to build high-resolution trend charts.'
      },
      {
        key: 'Sleep/Wake Protocol',
        desc: 'A state-aware biometric tracker. The "Sleep Now" button locks the system into rest mode until you confirm a "Wake Up" event.',
        usage: 'Used to calculate Recovery Quality and determine if you are fit for high-intensity missions.'
      },
      {
        key: 'Grand Strategic Debrief',
        desc: 'A monthly intelligence report that aggregates all operational data into a downloadable tactical overview.',
        usage: 'Navigate to Reports -> Monthly Report to generate and download your operational summary.'
      },
      {
        key: 'Routine Automation',
        desc: 'A system that automatically deploys recurring tasks based on the day of the week. Ensures you never miss a foundational protocol.',
        usage: 'Define your recurring habits in the "Routines" module; they will appear automatically on your daily mission list.'
      },
      {
        key: 'Zero-Flash Rehydration',
        desc: 'A persistence protocol that ensures you return to your exact page and data state upon browser refresh.',
        usage: 'Works automatically. Your "Current Page" and "Data Status" are mirrored in local and cloud storage.'
      }
    ]
  },
  {
    title: 'Operational Modules',
    icon: <Layers size={20} color="var(--accent-secondary)" />,
    items: [
      {
        key: 'Command Center (Dashboard)',
        desc: 'Aggregates the most critical data—Hydration, Fitness, Tasks, and Biometrics—into a single immersion interface.',
        usage: 'Your starting point for every session.'
      },
      {
        key: 'Tactical Ops (Today Tasks)',
        desc: 'The execution layer where daily missions are managed and routines are deployed.',
        usage: 'Assign, execute, and debrief your daily workload here.'
      },
      {
        key: 'Fitness OS (Gym)',
        desc: 'Your physical conditioning lab. Includes the Master Schedule and the Exercise Library.',
        usage: 'Manage your strength protocols and track your tonnage.'
      },
      {
        key: 'Intelligence (Analytics)',
        desc: 'The strategic layer. Visualizes your long-term progress across all operative metrics.',
        usage: 'Audit your performance data to find points of failure.'
      }
    ]
  }
];

export default function Guide() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 900, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', paddingTop: 20 }}
      >
        <div style={{ display: 'inline-flex', padding: '8px 16px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: 20, color: 'var(--accent-primary)', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>
           Operational Manual
        </div>
        <h1 style={{ fontSize: 42, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: -1.5, marginBottom: 12 }}>
          Mastering the <span style={{ color: 'var(--accent-primary)' }}>TaskBar OS</span>
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 600, margin: '0 auto', fontWeight: 500, lineHeight: 1.6 }}>
          Welcome to your high-fidelity productivity ecosystem. This manual explains the tactical logic and biometric integrations that power your performance.
        </p>
      </motion.div>

      {/* Grid of Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
        {GUIDE_SECTIONS.map((section, idx) => (
          <motion.section 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
              <div style={{ padding: 10, background: 'var(--bg-elevated)', borderRadius: 12 }}>{section.icon}</div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)' }}>{section.title}</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>
              {section.items.map((item, i) => (
                <div key={i} className="card-glass" style={{ padding: 24, borderRadius: 20, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--accent-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Info size={14} /> {item.key}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>{item.desc}</p>
                  
                  {item.integration && (
                    <div style={{ background: 'rgba(99, 102, 241, 0.05)', padding: 12, borderRadius: 12, borderLeft: '3px solid var(--accent-primary)' }}>
                      <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--accent-primary)', textTransform: 'uppercase', marginBottom: 4 }}>Neural Integration</div>
                      <div style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 600 }}>{item.integration}</div>
                    </div>
                  )}
                  
                  {item.usage && (
                    <div style={{ background: 'rgba(139, 92, 246, 0.05)', padding: 12, borderRadius: 12, borderLeft: '3px solid var(--accent-secondary)' }}>
                      <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--accent-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>Standard Usage</div>
                      <div style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 600 }}>{item.usage}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.section>
        ))}
      </div>

      {/* Final Call to Action */}
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        style={{ padding: 40, background: 'var(--bg-elevated)', borderRadius: 24, textAlign: 'center', border: '1px solid var(--accent-primary)' }}
      >
        <Trophy size={48} color="var(--accent-primary)" style={{ marginBottom: 20 }} />
        <h2 style={{ fontSize: 24, fontWeight: 900, color: 'white', marginBottom: 12 }}>Protocol Ready</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>You are now briefed on all core operational systems. Start your mission.</p>
        <button className="btn btn-primary" style={{ padding: '12px 32px', borderRadius: 14 }}>Initialize Dashboard</button>
      </motion.div>
    </div>
  );
}
