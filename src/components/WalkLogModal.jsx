import { useState } from 'react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Footprints, X, Check } from 'lucide-react';
import { WALKING_INTENSITIES, calculateWalkingFromSteps, calculateWalkingFromDistance, calculateWalkingFromDuration } from '../lib/activityCalculationService';
import { format } from 'date-fns';

export default function WalkLogModal({ isOpen, onClose, date }) {
  const { logWalkingActivity, dietActiveDate, dietGoals } = useStore();
  const targetDate = date || dietActiveDate || format(new Date(), 'yyyy-MM-dd');

  const [inputMode, setInputMode] = useState('steps'); // 'steps' | 'distance' | 'duration'
  const [stepsInput, setStepsInput] = useState('7500');
  const [distanceInput, setDistanceInput] = useState('5.0');
  const [durationInput, setDurationInput] = useState('60');
  const [intensity, setIntensity] = useState('normal');

  if (!isOpen) return null;

  const heightCm = dietGoals?.heightCm || 175;
  const weightKg = dietGoals?.weightKg || 70;

  let liveEstimate = { steps: 0, distanceKm: 0, durationMinutes: 0, estimatedCalories: 0 };
  if (inputMode === 'steps') {
    liveEstimate = calculateWalkingFromSteps({ steps: Number(stepsInput) || 0, heightCm, weightKg, intensityKey: intensity });
  } else if (inputMode === 'distance') {
    liveEstimate = calculateWalkingFromDistance({ distanceKm: Number(distanceInput) || 0, heightCm, weightKg, intensityKey: intensity });
  } else {
    liveEstimate = calculateWalkingFromDuration({ durationMinutes: Number(durationInput) || 0, heightCm, weightKg, intensityKey: intensity });
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    logWalkingActivity(targetDate, {
      inputMode,
      steps: liveEstimate.steps,
      distanceKm: liveEstimate.distanceKm,
      durationMinutes: liveEstimate.durationMinutes,
      intensity
    });
    if (onClose) onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)', zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          style={{
            background: 'var(--bg-card)', borderRadius: 24, padding: 28,
            maxWidth: 440, width: '100%', border: '1px solid var(--border-subtle)',
            boxShadow: '0 30px 60px rgba(0,0,0,0.6)'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                <Footprints size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>Log Walking & Activity</h3>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Target Date: {targetDate}</div>
              </div>
            </div>
            <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm"><X size={18}/></button>
          </div>

          {/* Input Method Selector */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
            {[
              { id: 'steps', label: '👟 Steps' },
              { id: 'distance', label: '📍 Distance' },
              { id: 'duration', label: '⏱ Duration' },
            ].map(mode => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setInputMode(mode.id)}
                style={{
                  padding: '10px 12px', borderRadius: 12, fontSize: 12, fontWeight: 800, cursor: 'pointer',
                  background: inputMode === mode.id ? '#10b981' : 'var(--bg-elevated)',
                  color: inputMode === mode.id ? 'white' : 'var(--text-secondary)',
                  border: inputMode === mode.id ? 'none' : '1px solid var(--border-subtle)',
                  transition: 'all 0.15s ease'
                }}
              >
                {mode.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {inputMode === 'steps' && (
              <div className="form-group">
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Steps Count</label>
                <input
                  type="number"
                  className="search-input"
                  value={stepsInput}
                  onChange={e => setStepsInput(e.target.value)}
                  placeholder="e.g. 8500"
                  required
                  min="1"
                />
              </div>
            )}

            {inputMode === 'distance' && (
              <div className="form-group">
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Distance (km)</label>
                <input
                  type="number"
                  step="0.1"
                  className="search-input"
                  value={distanceInput}
                  onChange={e => setDistanceInput(e.target.value)}
                  placeholder="e.g. 5.8"
                  required
                  min="0.1"
                />
              </div>
            )}

            {inputMode === 'duration' && (
              <div className="form-group">
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Duration (Minutes)</label>
                <input
                  type="number"
                  className="search-input"
                  value={durationInput}
                  onChange={e => setDurationInput(e.target.value)}
                  placeholder="e.g. 45"
                  required
                  min="1"
                />
              </div>
            )}

            {/* Intensity / Pace Selector */}
            <div className="form-group">
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Walking Pace / Intensity</label>
              <select className="search-input" value={intensity} onChange={e => setIntensity(e.target.value)}>
                {Object.entries(WALKING_INTENSITIES).map(([key, info]) => (
                  <option key={key} value={key}>{info.name}</option>
                ))}
              </select>
            </div>

            {/* Live Calculation Estimate Card */}
            <div style={{ padding: 14, background: 'rgba(16,185,129,0.08)', borderRadius: 14, border: '1px solid rgba(16,185,129,0.2)' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Estimated Activity Burn</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Steps</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-primary)' }}>{liveEstimate.steps.toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Distance</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#38bdf8' }}>{liveEstimate.distanceKm} km</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Est. Burn</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#f59e0b' }}>~{liveEstimate.estimatedCalories} kcal</div>
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 2, background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', fontWeight: 800 }}>
                <Check size={16} /> Save Activity
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
