import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SlidersHorizontal, FolderKanban, Flag, CheckCircle2, Zap, Flame, TrendingUp, ArrowRight, Activity, 
  Sparkles, Target, Dumbbell, Utensils, Droplets, Timer, CheckSquare, 
  ChevronRight, HelpCircle, Footprints, X
} from 'lucide-react';
import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import BioHacker from '../components/BioHacker';
import NeuralScratchpad from '../components/NeuralScratchpad';

export default function Dashboard() {
  const { 
    getLevelInfo, setPage, 
    dietEntries, user,
    getDailySnapshot, getTodayPriorities, getNextAction, getCrossModuleInsights,
    getGlobalConsistencyStreaks, setDietActiveDate, setGymActiveDate,
    habits = [], habitLogs = {}, logHabit,
    projects = [], goals = [], dashboardWidgets = [], toggleDashboardWidget, resetDashboardLayout
  } = useStore();
  const [showLayoutModal, setShowLayoutModal] = useState(false);
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const snapshot = useMemo(() => getDailySnapshot(today), [getDailySnapshot, today]);
  const priorities = useMemo(() => getTodayPriorities(today), [getTodayPriorities, today]);
  const nextAction = useMemo(() => getNextAction(today), [getNextAction, today]);
  const crossInsights = useMemo(() => getCrossModuleInsights(today), [getCrossModuleInsights, today]);
  const streaks = useMemo(() => getGlobalConsistencyStreaks(), [getGlobalConsistencyStreaks]);
  
  const lvl = getLevelInfo();
  
  const [showEnergyTooltip, setShowEnergyTooltip] = useState(false);

  // Chronological Daily Fitness Timeline Events
  const timelineEvents = useMemo(() => {
    const events = [];
    
    // Diet entries
    (dietEntries[today] || []).forEach(e => {
      events.push({
        time: e.meal || 'Diet Entry',
        title: `${e.foodName} (${e.quantity}${e.unit})`,
        meta: `~${e.calculatedNutrients?.calories || 0} kcal · ${e.calculatedNutrients?.protein || 0}g P`,
        type: 'diet',
        icon: Utensils,
        color: '#6366f1'
      });
    });

    // Walking logs
    if (snapshot.walking.steps > 0) {
      events.push({
        time: 'Activity Log',
        title: `Logged Walk: ${snapshot.walking.steps.toLocaleString()} steps`,
        meta: `${snapshot.walking.distanceKm} km · ~${snapshot.walking.calories} kcal burned`,
        type: 'walking',
        icon: Footprints,
        color: '#10b981'
      });
    }

    // Workout
    if (snapshot.workout.completed) {
      events.push({
        time: 'Workout Protocol',
        title: `Workout Completed: ${snapshot.workout.name}`,
        meta: `${snapshot.workout.completedSets} sets · ${snapshot.workout.volumeKg.toLocaleString()} kg volume · ~${snapshot.workout.calories} kcal`,
        type: 'gym',
        icon: Dumbbell,
        color: '#f59e0b'
      });
    }

    // Hydration
    if (snapshot.water.loggedMl > 0) {
      events.push({
        time: 'Hydration',
        title: `Water Intake Recorded: ${snapshot.water.loggedMl} ml`,
        meta: `${snapshot.water.pct}% of daily hydration target`,
        type: 'water',
        icon: Droplets,
        color: '#0ea5e9'
      });
    }

    // Routines
    if (snapshot.routines.completed > 0) {
      events.push({
        time: 'Routines',
        title: `Routines Completed (${snapshot.routines.completed}/${snapshot.routines.total})`,
        meta: `${snapshot.routines.rate}% consistency score`,
        type: 'routine',
        icon: CheckSquare,
        color: '#38bdf8'
      });
    }

    return events;
  }, [dietEntries, today, snapshot]);

  // 7-day health score trend data
  const weekData = useMemo(() => {
    const start = subDays(new Date(), 6);
    return eachDayOfInterval({ start, end: new Date() }).map((d) => {
      const key = format(d, 'yyyy-MM-dd');
      const snap = getDailySnapshot(key);
      return {
        day: format(d, 'EEE'),
        score: snap.score,
        calories: snap.diet.calories,
        protein: snap.diet.protein,
        workout: snap.workout.completed ? 100 : 0
      };
    });
  }, [getDailySnapshot]);

  const handleActionClick = (targetTab) => {
    if (targetTab === 'diet') setDietActiveDate(today);
    if (targetTab === 'gym') setGymActiveDate(today);
    setPage(targetTab || 'today');
  };

  return (
    <div className="dashboard-container" style={{ padding: '0 8px 40px 8px' }}>
      
      {/* --- WELCOME HERO BANNER --- */}
      <motion.div 
        className="card hero-card"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ 
          padding: '24px 28px', marginBottom: 24, 
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(16,185,129,0.1) 100%)',
          border: '1px solid rgba(99,102,241,0.3)', display: 'flex', flexWrap: 'wrap',
          alignItems: 'center', justifyContent: 'space-between', gap: 20 
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span className="badge" style={{ background: 'var(--accent-primary)', color: 'white', fontWeight: 800, fontSize: 10 }}>
              LEVEL {lvl.level} · {lvl.title?.toUpperCase() || 'OPERATIVE'}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Level {lvl.level}</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: -0.5, margin: 0 }}>
            Welcome back, {user?.displayName || user?.username || user?.email?.split('@')[0] || 'User'}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            {format(new Date(), 'EEEE, MMMM d, yyyy')} · Daily Overview
          </p>
        </div>

        {/* Customize Layout Button & Daily Score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => setShowLayoutModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
          >
            <SlidersHorizontal size={14} />
            <span>Customize Layout</span>
          </button>

          {/* Daily Score & Grade Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(0,0,0,0.3)', padding: '12px 20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Daily Health Score</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--accent-primary)', fontVariantNumeric: 'tabular-nums' }}>
              {snapshot?.score ?? 0} <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/ 100</span>
            </div>
          </div>
          <div style={{ 
            width: 44, height: 44, borderRadius: '50%', 
            background: snapshot?.grade === 'S' || snapshot?.grade === 'A' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
            border: snapshot?.grade === 'S' || snapshot?.grade === 'A' ? '2px solid #10b981' : '2px solid #f59e0b',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 900, color: snapshot?.grade === 'S' || snapshot?.grade === 'A' ? '#10b981' : '#f59e0b'
          }}>
            {snapshot?.grade || '—'}
          </div>
        </div>
      </div>
    </motion.div>


      {/* --- TODAY'S OVERVIEW BAR (6 CORE METRICS) --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16, marginBottom: 24 }}>
        
        {/* Calories Card */}
        <motion.div className="stat-card" whileHover={{ y: -4 }} onClick={() => handleActionClick('diet')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Energy (kcal)</span>
            <Flame size={16} color="#ef4444" />
          </div>
          <div className="stat-value" style={{ marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>
            {snapshot?.diet?.calories || 0} <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>/ {snapshot?.diet?.caloriesTarget || 2000}</span>
          </div>
          <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, ((snapshot?.diet?.calories || 0) / Math.max(1, snapshot?.diet?.caloriesTarget || 2000)) * 100)}%`, height: '100%', background: '#ef4444' }} />
          </div>
        </motion.div>

        {/* Protein Card */}
        <motion.div className="stat-card" whileHover={{ y: -4 }} onClick={() => handleActionClick('diet')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Protein (g)</span>
            <Utensils size={16} color="#6366f1" />
          </div>
          <div className="stat-value" style={{ marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>
            {snapshot?.diet?.protein || 0}g <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>/ {snapshot?.diet?.proteinTarget || 120}g</span>
          </div>
          <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, ((snapshot?.diet?.protein || 0) / Math.max(1, snapshot?.diet?.proteinTarget || 120)) * 100)}%`, height: '100%', background: '#6366f1' }} />
          </div>
        </motion.div>

        {/* Water Card */}
        <motion.div className="stat-card" whileHover={{ y: -4 }} onClick={() => handleActionClick('today')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Hydration</span>
            <Droplets size={16} color="#0ea5e9" />
          </div>
          <div className="stat-value" style={{ marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>
            {snapshot?.water?.loggedMl || 0}ml <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>/ {snapshot?.water?.targetMl || 3000}ml</span>
          </div>
          <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
            <div style={{ width: `${snapshot?.water?.pct || 0}%`, height: '100%', background: '#0ea5e9' }} />
          </div>
        </motion.div>

        {/* Workout Card */}
        <motion.div className="stat-card" whileHover={{ y: -4 }} onClick={() => handleActionClick('gym')} style={{ cursor: 'pointer' }}>
          {(() => {
            const isRest = snapshot.workout.name?.toLowerCase().includes('rest');
            const isCompleted = snapshot.workout.completed;
            const inProgress = !isCompleted && snapshot.workout.completedSets > 0;
            const color = isCompleted ? '#10b981' : (isRest ? '#8b5cf6' : (inProgress ? '#3b82f6' : '#f59e0b'));
            const statusText = isCompleted ? 'Completed ⚡' : (isRest ? 'Rest Day 🧘' : (inProgress ? `In Progress (${snapshot.workout.completedSets}/${snapshot.workout.totalSets})` : 'Pending'));
            return (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="stat-label">Workout</span>
                  <Dumbbell size={16} color={color} />
                </div>
                <div className="stat-value" style={{ marginTop: 8, fontSize: 15, color }}>
                  {statusText}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {snapshot.workout.name}
                </div>
              </>
            );
          })()}
        </motion.div>

        {/* Focus Card */}
        <motion.div className="stat-card" whileHover={{ y: -4 }} onClick={() => handleActionClick('focus')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Deep Focus</span>
            <Timer size={16} color="#8b5cf6" />
          </div>
          <div className="stat-value" style={{ marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>
            {snapshot.focus.minutes} <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>mins</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Concentrated effort
          </div>
        </motion.div>

        {/* Routine Card */}
        <motion.div className="stat-card" whileHover={{ y: -4 }} onClick={() => handleActionClick('routines')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Routines</span>
            <CheckSquare size={16} color="#10b981" />
          </div>
          <div className="stat-value" style={{ marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>
            {snapshot.routines.rate}% <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>done</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            {snapshot.routines.completed} of {snapshot.routines.total} tasks
          </div>
        </motion.div>

        {/* Habits Card */}
        <motion.div className="stat-card" whileHover={{ y: -4 }} onClick={() => handleActionClick('habits')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Habits</span>
            <Target size={16} color="var(--accent-primary)" />
          </div>
          <div className="stat-value" style={{ marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>
            {snapshot.habits?.completed || 0}/{snapshot.habits?.total || 0}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            {snapshot.habits?.rate || 0}% active done
          </div>
        </motion.div>

      </div>


      {/* ── ENERGY OVERVIEW CARD (AUDITED & SEPARATED) ── */}
      <motion.div 
        className="card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ 
          padding: 24, marginBottom: 24, background: 'var(--bg-card)', 
          border: '1px solid var(--border-subtle)', position: 'relative' 
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
              <Flame size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                Energy Overview & Expenditure
              </h3>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                Separates Resting Energy (BMR), Tracked Activity, and Food Intake
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setShowEnergyTooltip(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, background: 'rgba(99,102,241,0.1)', color: 'var(--accent-primary)', border: '1px solid rgba(99,102,241,0.25)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
            >
              <HelpCircle size={14} /> What does this mean?
            </button>
            <span className="badge" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', fontSize: 10, fontWeight: 800 }}>
              MET ENGINE
            </span>
          </div>
        </div>

        {/* 4 Metric Columns Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
          
          {/* 1. Food Intake */}
          <div style={{ padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
              Food Intake
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)' }}>
              {snapshot.diet.calories} <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>kcal</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>
              Target: {snapshot.diet.caloriesTarget} kcal
            </div>
          </div>

          {/* 2. Activity Burn */}
          <div style={{ padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
              Activity Burn
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#10b981' }}>
              +{snapshot.activeExpenditure.totalActiveCalories} <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>kcal</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
              Gym: {snapshot.activeExpenditure.workoutCalories} kcal · Walk: {snapshot.activeExpenditure.walkingCalories} kcal
            </div>
          </div>

          {/* 3. Baseline BMR */}
          <div style={{ padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
              Baseline BMR
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#f59e0b' }}>
              {snapshot.energySummary?.bmr || 1674} <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>kcal</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
              Resting energy need
            </div>
          </div>

          {/* 4. Total Daily Expenditure */}
          <div style={{ padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
              Est. Total Expenditure
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--accent-primary)' }}>
              ~{snapshot.energySummary?.totalDailyExpenditure || 1674} <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>kcal</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
              BMR + Activity
            </div>
          </div>

        </div>

        {/* Energy Balance Banner */}
        <div style={{ 
          padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.25)', 
          border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Net Energy Balance
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              {snapshot.energySummary?.hasFoodLogged
                ? 'Comparison of recorded food intake against estimated expenditure'
                : 'Logging food entries is required to calculate energy balance'}
            </div>
          </div>

          <div style={{
            padding: '8px 16px', borderRadius: 20, fontWeight: 900, fontSize: 13,
            background: snapshot.energySummary?.hasFoodLogged
              ? (snapshot.energySummary.netCalories <= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)')
              : 'rgba(255,255,255,0.05)',
            color: snapshot.energySummary?.hasFoodLogged
              ? (snapshot.energySummary.netCalories <= 0 ? '#10b981' : '#f59e0b')
              : 'var(--text-muted)',
            border: `1px solid ${snapshot.energySummary?.hasFoodLogged
              ? (snapshot.energySummary.netCalories <= 0 ? '#10b98140' : '#f59e0b40')
              : 'var(--border-subtle)'}`
          }}>
            {snapshot.energySummary?.balanceLabel || 'Not available — no food intake logged'}
          </div>
        </div>
      </motion.div>


      {/* ── ENERGY EXPLANATION MODAL (TOOLTIP) ── */}
      <AnimatePresence>
        {showEnergyTooltip && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              style={{ background: 'var(--bg-card)', borderRadius: 24, padding: 28, maxWidth: 460, width: '100%', border: '1px solid var(--border-subtle)', boxShadow: '0 30px 60px rgba(0,0,0,0.6)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <HelpCircle size={22} color="var(--accent-primary)" />
                  <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>Energy Metrics Guide</h3>
                </div>
                <button onClick={() => setShowEnergyTooltip(false)} className="btn btn-ghost btn-icon btn-sm"><X size={18}/></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13 }}>
                <div style={{ padding: 12, background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontWeight: 800, color: '#f59e0b', marginBottom: 4 }}>🔥 Baseline BMR (Resting Energy Need)</div>
                  <div style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Estimated calories your body expends at complete rest to maintain vital life functions (heart rate, breathing, cell repair). Calculated via the Mifflin-St Jeor formula based on age, gender, height, and weight.
                  </div>
                </div>

                <div style={{ padding: 12, background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontWeight: 800, color: '#10b981', marginBottom: 4 }}>🏃 Activity Burn</div>
                  <div style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Estimated energy burned through physical movement, including completed workouts and logged walking/steps. Uses Adult Compendium MET intensity multipliers.
                  </div>
                </div>

                <div style={{ padding: 12, background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>🥗 Food Intake</div>
                  <div style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Total caloric energy consumed from meals and snacks logged in Diet OS.
                  </div>
                </div>

                <div style={{ padding: 12, background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontWeight: 800, color: 'var(--accent-primary)', marginBottom: 4 }}>⚖️ Net Energy Balance</div>
                  <div style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    The difference between total food calories consumed and total expenditure (BMR + Activity). <strong>Only calculated when food intake has been logged</strong> to prevent misleading deficit readings.
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowEnergyTooltip(false)}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 20, padding: 12, fontWeight: 800 }}
              >
                Understood
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* --- GRID: NEXT ACTION & TODAY'S PRIORITIES --- */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, marginBottom: 24 }}>
        
        {/* LEFT: NEXT ACTION HIGHLIGHT & REAL-DATA AI INSIGHTS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Primary Next Action Card */}
          <motion.div 
            className="card"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ 
              padding: 24, background: 'var(--bg-card)', 
              border: '1px solid var(--accent-primary)',
              boxShadow: '0 0 25px rgba(99,102,241,0.15)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>
              <Zap size={14} />
              <span>Recommended Next Action</span>
            </div>
            
            <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 12 }}>
              {nextAction.title}
            </h3>

            <button 
              className="btn btn-primary"
              onClick={() => handleActionClick(nextAction.actionTab)}
              style={{ padding: '10px 20px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <span>{nextAction.actionLabel}</span>
              <ArrowRight size={16} />
            </button>
          </motion.div>

          {/* Today's Habits Execution Bar */}
          {habits.filter(h => !h.archived).length > 0 && (
            <motion.div 
              className="card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ padding: '18px 20px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Target size={16} color="var(--accent-primary)" />
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Daily Habits Tracker
                  </span>
                </div>
                <button 
                  className="btn btn-ghost btn-xs"
                  onClick={() => setPage('habits')}
                  style={{ fontSize: 11, color: 'var(--accent-primary)', fontWeight: 700 }}
                >
                  Manage Habits →
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                {habits.filter(h => !h.archived).slice(0, 6).map(h => {
                  const isDone = !!habitLogs[today]?.[h.id];
                  return (
                    <div
                      key={h.id}
                      onClick={() => logHabit(h.id, today)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md, 10px)',
                        background: isDone ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-elevated)',
                        border: isDone ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: isDone ? '#10b981' : 'rgba(255,255,255,0.06)',
                          color: isDone ? 'white' : 'var(--text-muted)',
                          fontSize: 12, flexShrink: 0
                        }}>
                          {isDone ? '✓' : ''}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textDecoration: isDone ? 'line-through' : 'none', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {h.title}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                            {h.streak || 0}d streak · {h.category}
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 800, color: isDone ? '#10b981' : 'var(--text-muted)' }}>
                        {isDone ? '+15 XP' : '○'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Active Projects Widget */}
          {projects.filter(p => p.status !== 'completed').length > 0 && (
            <motion.div 
              className="card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ padding: '18px 20px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FolderKanban size={16} color="var(--accent-primary)" />
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Active Strategic Projects
                  </span>
                </div>
                <button 
                  className="btn btn-ghost btn-xs"
                  onClick={() => setPage('projects')}
                  style={{ fontSize: 11, color: 'var(--accent-primary)', fontWeight: 700 }}
                >
                  All Projects →
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {projects.filter(p => p.status !== 'completed').slice(0, 3).map(p => {
                  const ms = p.milestones || [];
                  const done = ms.filter(m => m.completed).length;
                  const pct = ms.length > 0 ? Math.round((done / ms.length) * 100) : 0;

                  return (
                    <div key={p.id} onClick={() => setPage('projects')} style={{ padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 8, cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{p.title}</span>
                        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent-primary)' }}>{pct}%</span>
                      </div>
                      <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent-primary)' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Strategic Goals Widget */}
          {goals.length > 0 && (
            <motion.div 
              className="card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ padding: '18px 20px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Flag size={16} color="#10b981" />
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Strategic Horizons & Goals
                  </span>
                </div>
                <button 
                  className="btn btn-ghost btn-xs"
                  onClick={() => setPage('goals')}
                  style={{ fontSize: 11, color: '#10b981', fontWeight: 700 }}
                >
                  All Goals →
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {goals.slice(0, 3).map(g => (
                  <div key={g.id} onClick={() => setPage('goals')} style={{ padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 8, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{g.title}</span>
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#10b981', textTransform: 'uppercase' }}>{g.timeHorizon?.replace('_', ' ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Real Cross-Module AI Insights */}
          {crossInsights.length > 0 && (
            <div className="card" style={{ padding: 20, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
                <Sparkles size={14} />
                <span>Cross-Module Intelligence & Recovery Advisory</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {crossInsights.map(ins => (
                  <div key={ins.id} style={{ padding: 14, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
                      {ins.title}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: 10 }}>
                      {ins.message}
                    </div>
                    <button 
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleActionClick(ins.actionTab)}
                      style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent-primary)', padding: 0 }}
                    >
                      {ins.actionLabel} →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT: TODAY'S DYNAMIC PRIORITIES LIST */}
        <div className="card" style={{ padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Target size={18} color="var(--accent-primary)" />
              <span>Today's Priorities</span>
            </h3>
            <span className="badge" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--accent-primary)', fontSize: 10, fontWeight: 800 }}>
              DYNAMIC QUEUE
            </span>
          </div>

          {priorities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)', fontSize: 13 }}>
              <CheckCircle2 size={36} color="#10b981" style={{ marginBottom: 10 }} />
              <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>All Priorities Completed!</div>
              <div>Great job maintaining high discipline today.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {priorities.map((item, idx) => (
                <div 
                  key={item.id}
                  onClick={() => handleActionClick(item.actionTab)}
                  style={{ 
                    padding: 14, borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'all 0.15s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', color: 'var(--accent-primary)', fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {idx + 1}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </div>
                  </div>
                  <ChevronRight size={16} color="var(--text-muted)" />
                </div>
              ))}
            </div>
          )}

          {/* Cross-Module Consistency Streaks */}
          <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Workout Streak</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#f59e0b' }}>🔥 {streaks.workoutStreak}d</div>
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Diet Streak</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#10b981' }}>🥗 {streaks.dietStreak}d</div>
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Routine Streak</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#38bdf8' }}>⚡ {streaks.routineStreak}d</div>
            </div>
          </div>

        </div>

      </div>


      {/* ── DAILY FITNESS & ACTIVITY TIMELINE ── */}
      <div className="card" style={{ padding: 24, marginBottom: 24, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={18} color="var(--accent-primary)" />
            <span>Today's Fitness Timeline</span>
          </h3>
          <span className="badge" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--accent-primary)', fontSize: 10, fontWeight: 800 }}>
            CHRONOLOGICAL LOG
          </span>
        </div>

        {timelineEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic' }}>
            No activities recorded yet for today. Use the "+ Quick Log" button at bottom right to record food, walks, workouts, or water!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', paddingLeft: 10 }}>
            {timelineEvents.map((evt, idx) => {
              const Icon = evt.icon;
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, position: 'relative' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: `${evt.color}15`, border: `1px solid ${evt.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={16} color={evt.color} />
                  </div>
                  <div style={{ flex: 1, padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>{evt.title}</div>
                      <span className="badge" style={{ fontSize: 9, background: `${evt.color}15`, color: evt.color, border: `1px solid ${evt.color}30` }}>
                        {evt.time}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                      {evt.meta}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- LIFESTYLE BIOMETRICS & NEURAL SCRATCHPAD --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 24 }}>
        <BioHacker />
        <NeuralScratchpad />
      </div>

      {/* --- 7-DAY UNIFIED HEALTH TREND CHART --- */}
      <div className="card" style={{ padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={18} color="var(--accent-primary)" />
          <span>7-Day Unified Performance & Health Trend</span>
        </h3>
        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weekData}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'white', borderRadius: 8 }} />
              <Area type="monotone" dataKey="score" name="Health Score (%)" stroke="var(--accent-primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#scoreGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    
      {/* Custom Dashboard Builder Modal */}
      {showLayoutModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, padding: 16
        }}>
          <div className="card" style={{ maxWidth: 480, width: '100%', padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                Custom Dashboard Layout
              </h2>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowLayoutModal(false)}>
                <X size={16} />
              </button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Configure active modular widgets displayed on your primary command dashboard.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {(dashboardWidgets || []).map(w => (
                <div
                  key={w.id}
                  onClick={() => toggleDashboardWidget(w.id)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 10,
                    cursor: 'pointer', border: w.visible ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)'
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: w.visible ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {w.title}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 999,
                    background: w.visible ? 'rgba(99,102,241,0.2)' : 'var(--bg-card)',
                    color: w.visible ? 'var(--accent-primary)' : 'var(--text-muted)'
                  }}>
                    {w.visible ? 'Visible' : 'Hidden'}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={resetDashboardLayout}
                style={{ fontSize: 11, color: 'var(--text-muted)' }}
              >
                Reset Default
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowLayoutModal(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}