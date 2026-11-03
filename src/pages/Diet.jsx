import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { INITIAL_FOOD_DATABASE, MEAL_TYPES, GOAL_TYPES, ACTIVITY_LEVELS, UNIT_LABEL_MAP } from '../lib/foodDatabase';
import { 
  calculateEntryNutrients, 
  calculateDaySummary, 
  generateDietInsights, 
  calculatePersonalNutritionGoals
} from '../lib/nutritionEngine';
import { 
  Utensils, Plus, Search, Trash2, RotateCcw, Heart, Flame, 
  ChevronLeft, ChevronRight, Calendar, Sparkles, 
  BookOpen, PieChart as PieIcon, Sliders, Check, Info, AlertTriangle, User, Zap,
  Footprints, X, Edit2, Bookmark
} from 'lucide-react';
import { format, subDays, addDays, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { calculateDailyExpenditureSummary } from '../lib/calorieBurnService';
import { 
  WALKING_INTENSITIES, 
  calculateWalkingFromSteps, 
  calculateWalkingFromDistance, 
  calculateWalkingFromDuration 
} from '../lib/activityCalculationService';

const MACRO_COLORS = {
  protein: '#6366f1', // Indigo
  carbs: '#38bdf8',   // Sky
  fat: '#f59e0b',     // Amber
  fiber: '#10b981',   // Emerald
  water: '#0ea5e9'    // Cyan
};

export default function Diet() {
  const { 
    dietEntries, customFoods, favoriteFoods, dietGoals,
    dietActiveDate, setDietActiveDate, addDietEntry, deleteDietEntry,
    updateDietEntry, addCustomFood, toggleFavoriteFood,
    updateDietGoals, savedMeals = [], saveMealTemplate, deleteMealTemplate,
    walkingLogs, logWalkingActivity, deleteWalkingLog, workouts
  } = useStore();

  const activeDate = dietActiveDate || format(new Date(), 'yyyy-MM-dd');

  // Sub-navigation tab state: 'tracker' | 'add' | 'productivity' | 'analytics' | 'goals'
  const [activeTab, setActiveTab] = useState('tracker');

  // Walking Activity modal state
  const [showWalkModal, setShowWalkModal] = useState(false);
  const [walkForm, setWalkForm] = useState({
    inputMode: 'steps',
    steps: '5000',
    distanceKm: '3.5',
    durationMinutes: '45',
    intensity: 'normal'
  });

  // Modal / Selection states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedFood, setSelectedFood] = useState(null);
  const [quantityInput, setQuantityInput] = useState('100');
  const [selectedUnit, setSelectedUnit] = useState('g');
  const [selectedMeal, setSelectedMeal] = useState('Lunch');

  // Edit Entry state
  const [editingEntry, setEditingEntry] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ quantity: '100', unit: 'g', meal: 'Lunch' });

  // Custom Food state
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customForm, setCustomForm] = useState({
    name: '', category: 'Grains & Rice', rawOrCooked: 'cooked',
    servingSize: '100', servingUnit: 'g', calories: '', protein: '', carbs: '', fat: '', fiber: '', sugar: '', sodium: ''
  });

  // Master food list combining standardized database + user custom foods
  const allFoods = useMemo(() => {
    return [...(customFoods || []), ...INITIAL_FOOD_DATABASE];
  }, [customFoods]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(allFoods.map(f => f.category || 'Other'));
    return ['All', 'Favorites', 'Recent', 'Custom', ...Array.from(set)];
  }, [allFoods]);

  // Current day entries & summary
  const currentEntries = useMemo(() => {
    return dietEntries[activeDate] || [];
  }, [dietEntries, activeDate]);

  const summary = useMemo(() => {
    return calculateDaySummary(currentEntries);
  }, [currentEntries]);

  // Centralized Daily Expenditure Summary (BMR + Workout + Walking)
  const dailyExpenditure = useMemo(() => {
    const dayWalking = walkingLogs?.[activeDate] || [];
    const totalSteps = dayWalking.reduce((acc, log) => acc + (log.steps || 0), 0);
    const walkingCalories = dayWalking.reduce((acc, log) => acc + (log.estimatedCalories || 0), 0);
    
    const dayWorkout = workouts?.[activeDate];
    const workoutCalories = dayWorkout?.completed ? (dayWorkout.estimatedCalories || 0) : 0;

    const summaryExp = calculateDailyExpenditureSummary({
      userProfile: dietGoals,
      workoutCalories,
      walkingCalories
    });

    const netCalories = summary.calories - summaryExp.totalDailyExpenditure;

    return {
      ...summaryExp,
      totalSteps,
      walkingCalories,
      workoutCalories,
      dayWalking,
      netCalories
    };
  }, [walkingLogs, activeDate, workouts, dietGoals, summary.calories]);

  // Dynamic insights
  const insights = useMemo(() => {
    return generateDietInsights(summary, dietGoals);
  }, [summary, dietGoals]);

  // Recent foods logged by user across last 30 days
  const recentFoods = useMemo(() => {
    const list = [];
    const seen = new Set();
    Object.values(dietEntries).flat().reverse().forEach(entry => {
      if (!seen.has(entry.foodId)) {
        seen.add(entry.foodId);
        const f = allFoods.find(food => food.id === entry.foodId) || {
          id: entry.foodId, name: entry.foodName, category: entry.category,
          servingSize: entry.quantity, servingUnit: entry.unit,
          calories: entry.calculatedNutrients?.calories || 0,
          protein: entry.calculatedNutrients?.protein || 0,
          carbs: entry.calculatedNutrients?.carbs || 0,
          fat: entry.calculatedNutrients?.fat || 0,
          rawOrCooked: entry.rawOrCooked
        };
        list.push(f);
      }
    });
    return list.slice(0, 10);
  }, [dietEntries, allFoods]);

  // Filtered food list for search
  const filteredFoods = useMemo(() => {
    return allFoods.filter(food => {
      const matchesSearch = food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (food.category || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      if (categoryFilter === 'All') return true;
      if (categoryFilter === 'Favorites') return (favoriteFoods || []).includes(food.id);
      if (categoryFilter === 'Custom') return food.isCustom;
      if (categoryFilter === 'Recent') return recentFoods.some(r => r.id === food.id);
      return food.category === categoryFilter;
    });
  }, [allFoods, searchQuery, categoryFilter, favoriteFoods, recentFoods]);

  // Real-time calculated nutrient preview for selected food in Add flow
  const livePreview = useMemo(() => {
    if (!selectedFood) return null;
    const qty = parseFloat(quantityInput) || 0;
    return calculateEntryNutrients(selectedFood, qty, selectedUnit);
  }, [selectedFood, quantityInput, selectedUnit]);

  // Date Navigation handlers
  const handlePrevDay = () => {
    const prev = format(subDays(parseISO(activeDate), 1), 'yyyy-MM-dd');
    setDietActiveDate(prev);
  };
  const handleNextDay = () => {
    const next = format(addDays(parseISO(activeDate), 1), 'yyyy-MM-dd');
    setDietActiveDate(next);
  };

  // Add Food submit
  const handleAddFoodSubmit = (e) => {
    if (e) e.preventDefault();
    if (!selectedFood) {
      toast.error('Please select a food item');
      return;
    }
    const qty = parseFloat(quantityInput);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Please enter a valid positive quantity');
      return;
    }

    addDietEntry({
      food: selectedFood,
      quantity: qty,
      unit: selectedUnit,
      meal: selectedMeal
    }, activeDate);

    // Reset selection & switch to tracker
    setSelectedFood(null);
    setQuantityInput('100');
    setActiveTab('tracker');
  };

  // Quick Add Again
  const handleAddAgain = (entry) => {
    const foodObj = allFoods.find(f => f.id === entry.foodId) || {
      id: entry.foodId,
      name: entry.foodName,
      category: entry.category,
      servingSize: entry.quantity,
      servingUnit: entry.unit,
      calories: entry.calculatedNutrients.calories,
      protein: entry.calculatedNutrients.protein,
      carbs: entry.calculatedNutrients.carbs,
      fat: entry.calculatedNutrients.fat,
      fiber: entry.calculatedNutrients.fiber,
      sugar: entry.calculatedNutrients.sugar,
      sodium: entry.calculatedNutrients.sodium,
      rawOrCooked: entry.rawOrCooked
    };

    addDietEntry({
      food: foodObj,
      quantity: entry.quantity,
      unit: entry.unit,
      meal: entry.meal
    }, activeDate);
  };

  // Custom food submit
  const handleCustomFoodSubmit = (e) => {
    e.preventDefault();
    if (!customForm.name.trim()) {
      toast.error('Food name is required');
      return;
    }
    addCustomFood(customForm);
    setShowCustomModal(false);
    setCustomForm({
      name: '', category: 'Grains & Rice', rawOrCooked: 'cooked',
      servingSize: '100', servingUnit: 'g', calories: '', protein: '', carbs: '', fat: '', fiber: '', sugar: '', sodium: ''
    });
  };

  // Weekly analytics data preparation
  const weeklyAnalyticsData = useMemo(() => {
    const daysArr = [];
    const baseDate = parseISO(activeDate);
    for (let i = 6; i >= 0; i--) {
      const dStr = format(subDays(baseDate, i), 'yyyy-MM-dd');
      const dayEnts = dietEntries[dStr] || [];
      const sum = calculateDaySummary(dayEnts);
      daysArr.push({
        date: format(parseISO(dStr), 'MMM dd'),
        calories: sum.calories,
        protein: sum.protein,
        carbs: sum.carbs,
        fat: sum.fat,
        targetCalories: dietGoals.calories || 2000,
        targetProtein: dietGoals.protein || 120
      });
    }
    return daysArr;
  }, [dietEntries, activeDate, dietGoals]);

  // Macro Distribution Data for Pie Chart
  const pieMacroData = useMemo(() => {
    const pCals = summary.protein * 4;
    const cCals = summary.carbs * 4;
    const fCals = summary.fat * 9;
    const totalCals = pCals + cCals + fCals || 1;

    return [
      { name: 'Protein', value: Math.round(pCals), grams: summary.protein, pct: Math.round((pCals / totalCals) * 100), color: MACRO_COLORS.protein },
      { name: 'Carbs', value: Math.round(cCals), grams: summary.carbs, pct: Math.round((cCals / totalCals) * 100), color: MACRO_COLORS.carbs },
      { name: 'Fat', value: Math.round(fCals), grams: summary.fat, pct: Math.round((fCals / totalCals) * 100), color: MACRO_COLORS.fat },
    ];
  }, [summary]);

  return (
    <div className="diet-workspace" style={{ padding: '0 12px 40px 12px', maxWidth: 1280, margin: '0 auto' }}>
      
      {/* --- TOP HEADER & NAVIGATION BAR --- */}
      <motion.div 
        className="card" 
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ padding: '20px 24px', marginBottom: 24, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          {/* Module Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 44, height: 44, borderRadius: 'var(--radius-md)', 
              background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(16,185,129,0.2) 100%)',
              border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent-primary)'
            }}>
              <Utensils size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: -0.5, margin: 0 }}>
                  Diet OS
                </h1>
                <span className="badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', fontSize: 10, fontWeight: 800 }}>
                  NUTRITION PROTOCOL
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                Precision intake tracking, macronutrients, and centralized calculation engine
              </p>
            </div>
          </div>

          {/* Active Date Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={handlePrevDay} title="Previous Day">
              <ChevronLeft size={16} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              <Calendar size={14} color="var(--accent-primary)" />
              <span>{format(parseISO(activeDate), 'EEEE, MMM dd, yyyy')}</span>
            </div>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={handleNextDay} title="Next Day">
              <ChevronRight size={16} />
            </button>
            {activeDate !== format(new Date(), 'yyyy-MM-dd') && (
              <button 
                className="btn btn-ghost btn-sm" 
                onClick={() => setDietActiveDate(format(new Date(), 'yyyy-MM-dd'))}
                style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent-primary)', marginLeft: 4 }}
              >
                Today
              </button>
            )}
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div style={{ display: 'flex', gap: 8, marginTop: 20, overflowX: 'auto', paddingBottom: 4 }}>
          {[
            { id: 'tracker', label: "Today's Intake", icon: Flame },
            { id: 'add', label: '+ Add Food', icon: Plus },
            { id: 'productivity', label: 'Meals & Recipes', icon: BookOpen },
            { id: 'analytics', label: 'Analytics & Trends', icon: PieIcon },
            { id: 'goals', label: 'Nutrition Goals', icon: Sliders },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="btn btn-sm"
                style={{
                  background: isActive ? 'var(--accent-primary)' : 'rgba(255,255,255,0.03)',
                  color: isActive ? 'white' : 'var(--text-secondary)',
                  border: isActive ? 'none' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: isActive ? 700 : 500,
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', transition: 'all 0.2s ease'
                }}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>


      {/* ==================================================================== */}
      {/* TAB 1: TRACKER / DASHBOARD                                          */}
      {/* ==================================================================== */}
      {activeTab === 'tracker' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* MACRO TARGET PROGRESS CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            
            {/* Calories Card */}
            <div className="card" style={{ padding: 18, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Energy Intake
                </span>
                <Flame size={18} color="#ef4444" />
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                {summary.calories} <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>/ {dietGoals.calories || 2000} kcal</span>
              </div>
              <div style={{ marginTop: 10, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${Math.min(100, (summary.calories / (dietGoals.calories || 2000)) * 100)}%` }} 
                  style={{ height: '100%', background: 'linear-gradient(90deg, #f59e0b, #ef4444)' }}
                />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6, fontWeight: 600 }}>
                {dietGoals.calories - summary.calories >= 0 
                  ? `${Math.round(dietGoals.calories - summary.calories)} kcal remaining`
                  : `${Math.abs(Math.round(dietGoals.calories - summary.calories))} kcal over target`}
              </div>
            </div>

            {/* Protein Card */}
            <div className="card" style={{ padding: 18, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Protein
                </span>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: MACRO_COLORS.protein }} />
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                {summary.protein}g <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>/ {dietGoals.protein || 120}g</span>
              </div>
              <div style={{ marginTop: 10, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${Math.min(100, (summary.protein / (dietGoals.protein || 120)) * 100)}%` }} 
                  style={{ height: '100%', background: MACRO_COLORS.protein }}
                />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6, fontWeight: 600 }}>
                {dietGoals.protein - summary.protein > 0
                  ? `${Math.round(dietGoals.protein - summary.protein)}g remaining`
                  : 'Target Met! 🎉'}
              </div>
            </div>

            {/* Carbohydrates Card */}
            <div className="card" style={{ padding: 18, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Carbohydrates
                </span>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: MACRO_COLORS.carbs }} />
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                {summary.carbs}g <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>/ {dietGoals.carbs || 250}g</span>
              </div>
              <div style={{ marginTop: 10, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${Math.min(100, (summary.carbs / (dietGoals.carbs || 250)) * 100)}%` }} 
                  style={{ height: '100%', background: MACRO_COLORS.carbs }}
                />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6, fontWeight: 600 }}>
                {summary.carbs * 4} kcal from carbs
              </div>
            </div>

            {/* Fats Card */}
            <div className="card" style={{ padding: 18, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Fats
                </span>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: MACRO_COLORS.fat }} />
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                {summary.fat}g <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>/ {dietGoals.fat || 65}g</span>
              </div>
              <div style={{ marginTop: 10, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${Math.min(100, (summary.fat / (dietGoals.fat || 65)) * 100)}%` }} 
                  style={{ height: '100%', background: MACRO_COLORS.fat }}
                />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6, fontWeight: 600 }}>
                {summary.fat * 9} kcal from fats
              </div>
            </div>

            {/* Fiber Card */}
            <div className="card" style={{ padding: 18, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Dietary Fiber
                </span>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: MACRO_COLORS.fiber }} />
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                {summary.fiber}g <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>/ {dietGoals.fiber || 30}g</span>
              </div>
              <div style={{ marginTop: 10, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${Math.min(100, (summary.fiber / (dietGoals.fiber || 30)) * 100)}%` }} 
                  style={{ height: '100%', background: MACRO_COLORS.fiber }}
                />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6, fontWeight: 600 }}>
                Digestive & Gut Health
              </div>
            </div>

          </div>


          {/* ── CENTRAL ENERGY EXPENDITURE & WALKING INTEGRATION ROW ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            
            {/* Daily Energy Balance Card */}
            <div className="card" style={{ padding: 20, background: 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(245,158,11,0.05) 100%)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Flame size={18} color="#ef4444" />
                  <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Daily Energy Expenditure
                  </span>
                </div>
                <span className="badge" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: 10, fontWeight: 800 }}>
                  MET ENGINE
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
                <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>Base BMR</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--text-primary)' }}>{dailyExpenditure.bmr} <span style={{ fontSize: 9 }}>kcal</span></div>
                </div>
                <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>Workout Burn</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#f59e0b' }}>+{dailyExpenditure.workoutCalories} <span style={{ fontSize: 9 }}>kcal</span></div>
                </div>
                <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>Walking Burn</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#10b981' }}>+{dailyExpenditure.walkingCalories} <span style={{ fontSize: 9 }}>kcal</span></div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(0,0,0,0.25)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Total Burned vs Consumed</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)' }}>
                    {dailyExpenditure.totalDailyExpenditure} kcal burned <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>/ {summary.calories} in</span>
                  </div>
                </div>
                <div style={{
                  padding: '6px 12px', borderRadius: 20, fontWeight: 900, fontSize: 12,
                  background: dailyExpenditure.netCalories <= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                  color: dailyExpenditure.netCalories <= 0 ? '#10b981' : '#f59e0b',
                  border: `1px solid ${dailyExpenditure.netCalories <= 0 ? '#10b98140' : '#f59e0b40'}`
                }}>
                  {dailyExpenditure.netCalories <= 0
                    ? `${Math.abs(dailyExpenditure.netCalories)} kcal Deficit`
                    : `+${dailyExpenditure.netCalories} kcal Surplus`}
                </div>
              </div>
            </div>

            {/* Walking Activity Tracker Card */}
            <div className="card" style={{ padding: 20, background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(56,189,248,0.05) 100%)', border: '1px solid rgba(16,185,129,0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Footprints size={18} color="#10b981" />
                  <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Walking & Activity Log
                  </span>
                </div>
                <button
                  onClick={() => setShowWalkModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, background: '#10b981', color: 'white', border: 'none', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}
                >
                  <Plus size={12} /> Log Walk / Steps
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>Total Steps</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#10b981' }}>{dailyExpenditure.totalSteps.toLocaleString()}</div>
                </div>
                <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>Est. Distance</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#38bdf8' }}>
                    {((dailyExpenditure.totalSteps * 0.725) / 1000).toFixed(1)} <span style={{ fontSize: 10 }}>km</span>
                  </div>
                </div>
                <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>Calories Burned</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#f59e0b' }}>~{dailyExpenditure.walkingCalories} <span style={{ fontSize: 10 }}>kcal</span></div>
                </div>
              </div>

              {/* Logged Activities List */}
              {dailyExpenditure.dayWalking.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {dailyExpenditure.dayWalking.map(log => (
                    <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border-subtle)', fontSize: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>🚶</span>
                        <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{log.steps?.toLocaleString()} steps</span>
                        <span style={{ color: 'var(--text-muted)' }}>({log.distanceKm} km · {log.durationMinutes} min)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 900, color: '#10b981' }}>~{log.estimatedCalories} kcal</span>
                        <button onClick={() => deleteWalkingLog(activeDate, log.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '6px 0', fontStyle: 'italic' }}>
                  No walking sessions logged for this date. Click "+ Log Walk / Steps" to record.
                </div>
              )}
            </div>

          </div>


          {/* DATA INSIGHTS BANNER */}
          {insights.length > 0 && (
            <div className="card" style={{ padding: '16px 20px', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 12, fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: 1 }}>
                <Sparkles size={16} />
                <span>Nutrition Insights & Recommendations</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {insights.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'var(--text-primary)' }}>
                    {item.type === 'warning' && <AlertTriangle size={16} color="#f59e0b" style={{ marginTop: 2, flexShrink: 0 }} />}
                    {item.type === 'success' && <Check size={16} color="#10b981" style={{ marginTop: 2, flexShrink: 0 }} />}
                    {item.type === 'info' && <Info size={16} color="#38bdf8" style={{ marginTop: 2, flexShrink: 0 }} />}
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>{item.title}: </strong>
                      <span style={{ color: 'var(--text-secondary)' }}>{item.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* TODAY'S FOOD TIMELINE BY MEALS */}
          <div className="card" style={{ padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Utensils size={18} color="var(--accent-primary)" />
                <span>Today's Meal Timeline</span>
              </h3>
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => setActiveTab('add')}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
              >
                <Plus size={15} />
                <span>Add Food</span>
              </button>
            </div>

            {currentEntries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <Utensils size={36} strokeWidth={1.5} style={{ opacity: 0.4, marginBottom: 12 }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>No food entries recorded for this day</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Click "+ Add Food" to log your breakfast, lunch, dinner or snacks.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {MEAL_TYPES.map(mealType => {
                  const mealEntries = currentEntries.filter(e => e.meal === mealType);
                  if (mealEntries.length === 0) return null;

                  const mealSum = calculateDaySummary(mealEntries);

                  return (
                    <div key={mealType} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', padding: 16, border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>{mealType}</span>
                          <span className="badge" style={{ fontSize: 10, background: 'rgba(99,102,241,0.1)', color: 'var(--accent-primary)' }}>
                            {mealEntries.length} {mealEntries.length === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
                            {mealSum.calories} kcal · <span style={{ color: MACRO_COLORS.protein }}>P: {mealSum.protein}g</span> · <span style={{ color: MACRO_COLORS.carbs }}>C: {mealSum.carbs}g</span> · <span style={{ color: MACRO_COLORS.fat }}>F: {mealSum.fat}g</span>
                          </div>
                          <button
                            className="btn btn-ghost btn-xs"
                            title="Save this meal as a template"
                            onClick={() => {
                              saveMealTemplate({
                                name: `${mealType} (${format(parsedDate, 'MMM d')})`,
                                items: mealEntries.map(e => ({
                                  food: allFoods.find(f => f.id === e.foodId) || {
                                    id: e.foodId, name: e.foodName, category: e.category,
                                    servingSize: e.quantity, servingUnit: e.unit,
                                    calories: e.calculatedNutrients.calories,
                                    protein: e.calculatedNutrients.protein,
                                    carbs: e.calculatedNutrients.carbs,
                                    fat: e.calculatedNutrients.fat,
                                    rawOrCooked: e.rawOrCooked
                                  },
                                  quantity: e.quantity,
                                  unit: e.unit,
                                  meal: e.meal
                                }))
                              });
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', fontSize: 11, color: 'var(--text-secondary)' }}
                          >
                            <Bookmark size={12} />
                            <span>Save Template</span>
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {mealEntries.map(entry => (
                          <div 
                            key={entry.id} 
                            style={{ 
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
                              padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-subtle)' 
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 200 }}>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                                  {entry.foodName}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                                  <span>{entry.quantity} {entry.unit}</span>
                                  <span>·</span>
                                  <span style={{ textTransform: 'capitalize', color: entry.rawOrCooked === 'raw' || entry.rawOrCooked === 'dry' ? '#f59e0b' : 'var(--text-muted)' }}>
                                    {entry.rawOrCooked}
                                  </span>
                                  <span>·</span>
                                  <span>{entry.category}</span>
                                </div>
                              </div>
                            </div>

                            {/* Calculated Nutrients Pill */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, fontWeight: 700 }}>
                              <span style={{ color: 'var(--text-primary)' }}>{entry.calculatedNutrients?.calories || 0} kcal</span>
                              <span style={{ color: MACRO_COLORS.protein }}>{entry.calculatedNutrients?.protein || 0}g P</span>
                              <span style={{ color: MACRO_COLORS.carbs }}>{entry.calculatedNutrients?.carbs || 0}g C</span>
                              <span style={{ color: MACRO_COLORS.fat }}>{entry.calculatedNutrients?.fat || 0}g F</span>
                            </div>

                            {/* Item Actions */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <button 
                                className="btn btn-ghost btn-icon btn-sm" 
                                onClick={() => {
                                  setEditingEntry(entry);
                                  setEditForm({
                                    quantity: String(entry.quantity),
                                    unit: entry.unit || 'g',
                                    meal: entry.meal || 'Lunch'
                                  });
                                  setShowEditModal(true);
                                }}
                                title="Edit Entry"
                              >
                                <Edit2 size={14} color="var(--text-secondary)" />
                              </button>
                              <button 
                                className="btn btn-ghost btn-icon btn-sm" 
                                onClick={() => handleAddAgain(entry)} 
                                title="Add Again Today"
                              >
                                <RotateCcw size={14} color="var(--accent-primary)" />
                              </button>
                              <button 
                                className="btn btn-ghost btn-icon btn-sm" 
                                onClick={() => deleteDietEntry(entry.id, activeDate)} 
                                title="Delete Entry"
                              >
                                <Trash2 size={14} color="#ef4444" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Saved Meal Templates Panel */}
          <div className="card" style={{ padding: 20, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Saved Meal Templates
                </h4>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Reusable meal combinations for fast, reliable logging
                </p>
              </div>
              <span className="badge" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--accent-primary)', fontSize: 11, fontWeight: 700 }}>
                {(savedMeals || []).length} Saved
              </span>
            </div>

            {(savedMeals || []).length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '28px 20px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-subtle)' }}>
                <Bookmark size={24} style={{ opacity: 0.4, marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                No meal templates saved yet. Head to your Daily Timeline and click "Save Template" on any meal category!
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {savedMeals.map(template => {
                  const totalCalories = (template.items || []).reduce((sum, it) => {
                    const cal = it.food?.calories || 0;
                    const ratio = (it.food?.servingSize && it.food.servingSize > 0) ? (Number(it.quantity) || 0) / it.food.servingSize : 1;
                    return sum + Math.round(cal * ratio);
                  }, 0);
                  const totalProtein = (template.items || []).reduce((sum, it) => {
                    const prot = it.food?.protein || 0;
                    const ratio = (it.food?.servingSize && it.food.servingSize > 0) ? (Number(it.quantity) || 0) / it.food.servingSize : 1;
                    return sum + Math.round(prot * ratio);
                  }, 0);

                  return (
                    <div key={template.id} style={{ padding: 14, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{template.name}</span>
                          <button
                            className="btn btn-ghost btn-xs text-danger"
                            title="Delete template"
                            onClick={() => deleteMealTemplate(template.id)}
                            style={{ padding: 2 }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
                          {totalCalories} kcal · {totalProtein}g protein · {(template.items || []).length} items
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                          {(template.items || []).slice(0, 4).map((it, idx) => (
                            <div key={idx} style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                                • {it.food?.name || 'Food item'}
                              </span>
                              <span style={{ color: 'var(--text-muted)' }}>{it.quantity}{it.unit || 'g'}</span>
                            </div>
                          ))}
                          {(template.items || []).length > 4 && (
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              +{(template.items || []).length - 4} more items
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 700 }}
                        onClick={() => {
                          (template.items || []).forEach(it => {
                            addDietEntry({
                              food: it.food,
                              quantity: it.quantity,
                              unit: it.unit,
                              meal: it.meal || 'Lunch'
                            }, activeDate);
                          });
                          toast.success(`Logged "${template.name}" to ${activeDate}!`, { icon: '🍱' });
                          setActiveTab('tracker');
                        }}
                      >
                        <Plus size={14} />
                        <span>Log to {format(parsedDate, 'MMM d')}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}


      {/* ==================================================================== */}
      {/* TAB 2: + ADD FOOD FLOW                                               */}
      {/* ==================================================================== */}
      {activeTab === 'add' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
          
          {/* LEFT: SEARCH & SELECT FOOD */}
          <div className="card" style={{ padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>
              Select Food Item
            </h3>

            {/* Search Bar */}
            <div className="search-input-wrap" style={{ marginBottom: 16 }}>
              <Search size={16} color="var(--text-muted)" />
              <input 
                className="search-input" 
                placeholder="Search food database (e.g., Chicken, Rice, Egg, Oats, Soya)..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category Filter Badges */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className="btn btn-sm"
                  style={{
                    fontSize: 11, fontWeight: categoryFilter === cat ? 700 : 500,
                    background: categoryFilter === cat ? 'var(--accent-primary)' : 'rgba(255,255,255,0.03)',
                    color: categoryFilter === cat ? 'white' : 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-full)',
                    padding: '4px 12px'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Food Grid / List */}
            <div style={{ maxHeight: 420, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
              {filteredFoods.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
                  No foods match "{searchQuery}". Try adding a custom food below!
                </div>
              ) : (
                filteredFoods.map(food => {
                  const isSelected = selectedFood?.id === food.id;
                  const isFav = (favoriteFoods || []).includes(food.id);

                  return (
                    <div
                      key={food.id}
                      onClick={() => {
                        setSelectedFood(food);
                        setSelectedUnit(food.servingUnit || 'g');
                        setQuantityInput(String(food.servingSize || 100));
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 16px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                        background: isSelected ? 'rgba(99,102,241,0.15)' : 'var(--bg-elevated)',
                        border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>{food.name}</span>
                          {food.rawOrCooked && (
                            <span className="badge" style={{ 
                              fontSize: 9, 
                              background: food.rawOrCooked === 'raw' || food.rawOrCooked === 'dry' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                              color: food.rawOrCooked === 'raw' || food.rawOrCooked === 'dry' ? '#f59e0b' : '#10b981',
                              textTransform: 'uppercase'
                            }}>
                              {food.rawOrCooked}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          Per {food.servingSize} {food.servingUnit} · {food.category}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right' }}>
                          <div>{food.calories} kcal</div>
                          <div style={{ fontSize: 10, color: MACRO_COLORS.protein }}>P: {food.protein}g</div>
                        </div>
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={(e) => { e.stopPropagation(); toggleFavoriteFood(food.id); }}
                        >
                          <Heart size={14} fill={isFav ? '#ef4444' : 'none'} color={isFav ? '#ef4444' : 'var(--text-muted)'} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ marginTop: 16, pt: 12, borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Can't find your food?</span>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => setShowCustomModal(true)}
              >
                + Create Custom Food
              </button>
            </div>
          </div>


          {/* RIGHT: QUANTITY, MEAL & LIVE PREVIEW PANEL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ padding: 20, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>
                Log Food Entry
              </h4>

              {selectedFood ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ background: 'rgba(99,102,241,0.08)', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid rgba(99,102,241,0.2)' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-primary)' }}>{selectedFood.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Status: {selectedFood.rawOrCooked}</div>
                  </div>

                  {/* Quantity & Unit Inputs */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                        Quantity
                      </label>
                      <input 
                        type="number"
                        min="0.1"
                        step="any"
                        className="search-input"
                        value={quantityInput}
                        onChange={e => setQuantityInput(e.target.value)}
                        style={{ padding: '8px 12px' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                        Unit
                      </label>
                      <select 
                        className="search-input"
                        value={selectedUnit}
                        onChange={e => setSelectedUnit(e.target.value)}
                        style={{ padding: '8px 12px', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                      >
                        {Object.keys(UNIT_LABEL_MAP).map(u => (
                          <option key={u} value={u}>{UNIT_LABEL_MAP[u]}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Meal Selector */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                      Meal Type
                    </label>
                    <select 
                      className="search-input"
                      value={selectedMeal}
                      onChange={e => setSelectedMeal(e.target.value)}
                      style={{ padding: '8px 12px', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                    >
                      {MEAL_TYPES.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  {/* Real-time Calculated Nutrition Preview */}
                  {livePreview && (
                    <div style={{ background: 'var(--bg-elevated)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                        Calculated Nutrition Preview
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 8 }}>
                        {livePreview.calories} <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>kcal</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11, fontWeight: 700 }}>
                        <div style={{ color: MACRO_COLORS.protein }}>Protein: {livePreview.protein}g</div>
                        <div style={{ color: MACRO_COLORS.carbs }}>Carbs: {livePreview.carbs}g</div>
                        <div style={{ color: MACRO_COLORS.fat }}>Fat: {livePreview.fat}g</div>
                        <div style={{ color: MACRO_COLORS.fiber }}>Fiber: {livePreview.fiber}g</div>
                      </div>
                    </div>
                  )}

                  <button 
                    className="btn btn-primary"
                    onClick={handleAddFoodSubmit}
                    style={{ width: '100%', padding: 12, fontWeight: 800 }}
                  >
                    Add Food to Entry
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: 12 }}>
                  Select any food item from the list on the left to set quantity and log.
                </div>
              )}
            </div>
          </div>

        </motion.div>
      )}


      {/* ==================================================================== */}
      {/* TAB 3: PRODUCTIVITY (CUSTOM FOODS, MEALS & RECIPES)                  */}
      {/* ==================================================================== */}
      {activeTab === 'productivity' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            
            {/* Custom Foods Panel */}
            <div className="card" style={{ padding: 20, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Custom Foods Library
                </h4>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowCustomModal(true)}
                >
                  + Add Custom
                </button>
              </div>

              {(customFoods || []).length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
                  No custom foods created yet. Click "+ Add Custom" to add your own packaged or special foods.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                  {customFoods.map(food => (
                    <div key={food.id} style={{ padding: 10, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{food.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{food.calories} kcal / {food.servingSize}{food.servingUnit} · {food.protein}g Protein</div>
                      </div>
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          setSelectedFood(food);
                          setActiveTab('add');
                        }}
                      >
                        Log
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Favorite & Recent Quick Log */}
            <div className="card" style={{ padding: 20, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>
                Recent & Favorite Quick-Add
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                {recentFoods.length === 0 ? (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
                    As you log foods, your recent items will appear here for fast 1-click re-logging.
                  </div>
                ) : (
                  recentFoods.map(food => (
                    <div key={food.id} style={{ padding: 10, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{food.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{food.calories} kcal per {food.servingSize}{food.servingUnit}</div>
                      </div>
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          setSelectedFood(food);
                          setActiveTab('add');
                        }}
                      >
                        + Add
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Saved Meal Templates Panel */}
          <div className="card" style={{ padding: 20, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Saved Meal Templates
                </h4>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Reusable meal combinations for fast, reliable logging
                </p>
              </div>
              <span className="badge" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--accent-primary)', fontSize: 11, fontWeight: 700 }}>
                {(savedMeals || []).length} Saved
              </span>
            </div>

            {(savedMeals || []).length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '28px 20px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-subtle)' }}>
                <Bookmark size={24} style={{ opacity: 0.4, marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                No meal templates saved yet. Head to your Daily Timeline and click "Save Template" on any meal category!
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {savedMeals.map(template => {
                  const totalCalories = (template.items || []).reduce((sum, it) => {
                    const cal = it.food?.calories || 0;
                    const ratio = (it.food?.servingSize && it.food.servingSize > 0) ? (Number(it.quantity) || 0) / it.food.servingSize : 1;
                    return sum + Math.round(cal * ratio);
                  }, 0);
                  const totalProtein = (template.items || []).reduce((sum, it) => {
                    const prot = it.food?.protein || 0;
                    const ratio = (it.food?.servingSize && it.food.servingSize > 0) ? (Number(it.quantity) || 0) / it.food.servingSize : 1;
                    return sum + Math.round(prot * ratio);
                  }, 0);

                  return (
                    <div key={template.id} style={{ padding: 14, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{template.name}</span>
                          <button
                            className="btn btn-ghost btn-xs text-danger"
                            title="Delete template"
                            onClick={() => deleteMealTemplate(template.id)}
                            style={{ padding: 2 }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
                          {totalCalories} kcal · {totalProtein}g protein · {(template.items || []).length} items
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                          {(template.items || []).slice(0, 4).map((it, idx) => (
                            <div key={idx} style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                                • {it.food?.name || 'Food item'}
                              </span>
                              <span style={{ color: 'var(--text-muted)' }}>{it.quantity}{it.unit || 'g'}</span>
                            </div>
                          ))}
                          {(template.items || []).length > 4 && (
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              +{(template.items || []).length - 4} more items
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 700 }}
                        onClick={() => {
                          (template.items || []).forEach(it => {
                            addDietEntry({
                              food: it.food,
                              quantity: it.quantity,
                              unit: it.unit,
                              meal: it.meal || 'Lunch'
                            }, activeDate);
                          });
                          toast.success(`Logged "${template.name}" to ${activeDate}!`, { icon: '🍱' });
                          setActiveTab('tracker');
                        }}
                      >
                        <Plus size={14} />
                        <span>Log to {format(parsedDate, 'MMM d')}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}


      {/* ==================================================================== */}
      {/* TAB 4: ANALYTICS & TRENDS                                            */}
      {/* ==================================================================== */}
      {activeTab === 'analytics' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
            
            {/* Weekly Calorie & Protein Chart */}
            <div className="card" style={{ padding: 20, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>
                7-Day Calorie & Protein Intake Trends
              </h4>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyAnalyticsData}>
                    <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} />
                    <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'white' }} />
                    <Legend />
                    <Bar dataKey="calories" name="Calories (kcal)" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="protein" name="Protein (g)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Macro Distribution Donut Chart */}
            <div className="card" style={{ padding: 20, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16, width: '100%' }}>
                Today's Macro Ratio
              </h4>
              <div style={{ width: '100%', height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieMacroData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4}>
                      {pieMacroData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'white' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 11, fontWeight: 700, marginTop: 8 }}>
                {pieMacroData.map(m => (
                  <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.color }} />
                    <span>{m.name}: {m.grams}g</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </motion.div>
      )}


      {/* ==================================================================== */}
      {/* TAB 5: NUTRITION GOALS & PERSONAL CALCULATOR                        */}
      {/* ==================================================================== */}
      {activeTab === 'goals' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* PERSONAL METRICS & BMR/TDEE AUTO CALCULATOR */}
          <div className="card" style={{ padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ padding: 8, background: 'rgba(99,102,241,0.1)', borderRadius: 'var(--radius-md)', color: 'var(--accent-primary)' }}>
                <User size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                  Personal Body Metrics & Goal Calculator
                </h3>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                  Automatically calculates BMR (Basal Metabolic Rate) and TDEE (Daily Energy) using Mifflin-St Jeor formula
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              
              {/* Row 1: Age, Gender, Weight, Height */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    Age (yrs)
                  </label>
                  <input 
                    type="number"
                    min="10"
                    max="100"
                    className="search-input"
                    value={dietGoals.age || 25}
                    onChange={e => updateDietGoals({ age: Number(e.target.value) })}
                    style={{ padding: '8px 12px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    Gender
                  </label>
                  <select 
                    className="search-input"
                    value={dietGoals.gender || 'male'}
                    onChange={e => updateDietGoals({ gender: e.target.value })}
                    style={{ padding: '8px 12px', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    Weight (kg)
                  </label>
                  <input 
                    type="number"
                    step="any"
                    className="search-input"
                    value={dietGoals.weightKg || 70}
                    onChange={e => updateDietGoals({ weightKg: Number(e.target.value) })}
                    style={{ padding: '8px 12px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    Height (cm)
                  </label>
                  <input 
                    type="number"
                    step="any"
                    className="search-input"
                    value={dietGoals.heightCm || 175}
                    onChange={e => updateDietGoals({ heightCm: Number(e.target.value) })}
                    style={{ padding: '8px 12px' }}
                  />
                </div>
              </div>

              {/* Row 2: Activity Level & Goal Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    Activity Level
                  </label>
                  <select 
                    className="search-input"
                    value={dietGoals.activityLevel || 'moderately_active'}
                    onChange={e => updateDietGoals({ activityLevel: e.target.value })}
                    style={{ padding: '8px 12px', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                  >
                    {ACTIVITY_LEVELS.map(a => (
                      <option key={a.id} value={a.id}>{a.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    Primary Aim / Goal
                  </label>
                  <select 
                    className="search-input"
                    value={dietGoals.goalType || 'muscle_gain'}
                    onChange={e => updateDietGoals({ goalType: e.target.value })}
                    style={{ padding: '8px 12px', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                  >
                    {GOAL_TYPES.map(g => (
                      <option key={g.id} value={g.id}>{g.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Auto-Calculate Action Button */}
              <button 
                className="btn btn-primary"
                onClick={() => {
                  const computed = calculatePersonalNutritionGoals({
                    age: dietGoals.age || 25,
                    gender: dietGoals.gender || 'male',
                    weightKg: dietGoals.weightKg || 70,
                    heightCm: dietGoals.heightCm || 175,
                    activityLevel: dietGoals.activityLevel || 'moderately_active',
                    goalType: dietGoals.goalType || 'muscle_gain'
                  });

                  updateDietGoals({
                    ...computed,
                    isAutoCalculated: true
                  });

                  toast.success(`Calculated: BMR ${computed.bmr} kcal | TDEE ${computed.tdee} kcal | Target ${computed.calories} kcal!`, { icon: '⚡' });
                }}
                style={{ padding: '12px 18px', fontWeight: 800, marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <Zap size={16} />
                <span>Auto-Calculate Target Nutrition Goals</span>
              </button>

              {/* Calculated BMR & TDEE Status Card */}
              {dietGoals.bmr && dietGoals.tdee && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: 'rgba(99,102,241,0.06)', padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Basal Metabolic Rate (BMR)</span>
                    <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)' }}>{dietGoals.bmr} <span style={{ fontSize: 10 }}>kcal/day</span></div>
                  </div>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Daily Energy (TDEE)</span>
                    <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--accent-primary)' }}>{dietGoals.tdee} <span style={{ fontSize: 10 }}>kcal/day</span></div>
                  </div>
                </div>
              )}

            </div>
          </div>


          {/* MANUAL TARGET OVERRIDE & TARGET DISPLAY */}
          <div className="card" style={{ padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Daily Target Values (Manual Customization)
                </h3>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                  Modify any value below to your exact personal preference
                </p>
              </div>
              <span className="badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: 10, fontWeight: 800 }}>
                Customizable
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    Daily Calories Target (kcal)
                  </label>
                  <input 
                    type="number"
                    className="search-input"
                    value={dietGoals.calories || 2000}
                    onChange={e => updateDietGoals({ calories: Number(e.target.value), isAutoCalculated: false })}
                    style={{ padding: '10px 14px', fontWeight: 800 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    Daily Protein Target (g)
                  </label>
                  <input 
                    type="number"
                    className="search-input"
                    value={dietGoals.protein || 120}
                    onChange={e => updateDietGoals({ protein: Number(e.target.value), isAutoCalculated: false })}
                    style={{ padding: '10px 14px', fontWeight: 800, color: MACRO_COLORS.protein }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    Carbs Goal (g)
                  </label>
                  <input 
                    type="number"
                    className="search-input"
                    value={dietGoals.carbs || 250}
                    onChange={e => updateDietGoals({ carbs: Number(e.target.value), isAutoCalculated: false })}
                    style={{ padding: '8px 12px', color: MACRO_COLORS.carbs }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    Fat Goal (g)
                  </label>
                  <input 
                    type="number"
                    className="search-input"
                    value={dietGoals.fat || 65}
                    onChange={e => updateDietGoals({ fat: Number(e.target.value), isAutoCalculated: false })}
                    style={{ padding: '8px 12px', color: MACRO_COLORS.fat }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    Fiber Goal (g)
                  </label>
                  <input 
                    type="number"
                    className="search-input"
                    value={dietGoals.fiber || 30}
                    onChange={e => updateDietGoals({ fiber: Number(e.target.value), isAutoCalculated: false })}
                    style={{ padding: '8px 12px', color: MACRO_COLORS.fiber }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Daily Water Goal (ml)
                </label>
                <input 
                  type="number"
                  className="search-input"
                  value={dietGoals.waterGoalMl || 3000}
                  onChange={e => updateDietGoals({ waterGoalMl: Number(e.target.value), isAutoCalculated: false })}
                  style={{ padding: '8px 12px', color: MACRO_COLORS.water }}
                />
              </div>

              <div style={{ marginTop: 12, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    toast.success('Saved nutrition goals & profile!');
                    setActiveTab('tracker');
                  }}
                  style={{ width: '100%', padding: 12, fontWeight: 800 }}
                >
                  Save & Apply Targets
                </button>
              </div>
            </div>
          </div>

        </motion.div>
      )}


      {/* --- CREATE CUSTOM FOOD MODAL --- */}
      {showCustomModal && (
        <div className="search-overlay" onClick={() => setShowCustomModal(false)}>
          <div className="search-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>
              Create Custom Food Item
            </h3>

            <form onSubmit={handleCustomFoodSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Food Name *</label>
                <input 
                  required
                  className="search-input" 
                  placeholder="e.g. Homemade Protein Bar"
                  value={customForm.name}
                  onChange={e => setCustomForm({ ...customForm, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Serving Size</label>
                  <input 
                    type="number"
                    className="search-input"
                    value={customForm.servingSize}
                    onChange={e => setCustomForm({ ...customForm, servingSize: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Serving Unit</label>
                  <select 
                    className="search-input"
                    value={customForm.servingUnit}
                    onChange={e => setCustomForm({ ...customForm, servingUnit: e.target.value })}
                  >
                    {Object.keys(UNIT_LABEL_MAP).map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Calories (kcal)</label>
                  <input 
                    type="number"
                    className="search-input"
                    value={customForm.calories}
                    onChange={e => setCustomForm({ ...customForm, calories: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Protein (g)</label>
                  <input 
                    type="number"
                    step="any"
                    className="search-input"
                    value={customForm.protein}
                    onChange={e => setCustomForm({ ...customForm, protein: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Carbs (g)</label>
                  <input 
                    type="number"
                    step="any"
                    className="search-input"
                    value={customForm.carbs}
                    onChange={e => setCustomForm({ ...customForm, carbs: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Fat (g)</label>
                  <input 
                    type="number"
                    step="any"
                    className="search-input"
                    value={customForm.fat}
                    onChange={e => setCustomForm({ ...customForm, fat: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Fiber (g)</label>
                  <input 
                    type="number"
                    step="any"
                    className="search-input"
                    value={customForm.fiber}
                    onChange={e => setCustomForm({ ...customForm, fiber: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowCustomModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Save Custom Food</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT DIET ENTRY MODAL ── */}
      <AnimatePresence>
        {showEditModal && editingEntry && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              style={{ background: 'var(--bg-card)', borderRadius: 24, padding: 24, maxWidth: 440, width: '100%', border: '1px solid var(--border-subtle)', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>Edit Food Entry</h3>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{editingEntry.foodName}</div>
                </div>
                <button onClick={() => setShowEditModal(false)} className="btn btn-ghost btn-icon btn-sm"><X size={18}/></button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const q = parseFloat(editForm.quantity);
                if (!q || q <= 0) {
                  toast.error('Please enter a valid quantity');
                  return;
                }
                updateDietEntry(editingEntry.id, activeDate, {
                  quantity: q,
                  unit: editForm.unit,
                  meal: editForm.meal
                });
                setShowEditModal(false);
                setEditingEntry(null);
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Meal Category</label>
                    <select
                      className="form-select"
                      value={editForm.meal}
                      onChange={e => setEditForm({ ...editForm, meal: e.target.value })}
                    >
                      {MEAL_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>

                  <div className="grid-2" style={{ gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label">Quantity</label>
                      <input
                        type="number"
                        step="any"
                        min="0.1"
                        className="form-input"
                        value={editForm.quantity}
                        onChange={e => setEditForm({ ...editForm, quantity: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Unit</label>
                      <select
                        className="form-select"
                        value={editForm.unit}
                        onChange={e => setEditForm({ ...editForm, unit: e.target.value })}
                      >
                        {Object.entries(UNIT_LABEL_MAP).map(([k, label]) => (
                          <option key={k} value={k}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowEditModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>Save Changes</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── WALKING & ACTIVITY LOG MODAL ── */}
      <AnimatePresence>
        {showWalkModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              style={{ background: 'var(--bg-card)', borderRadius: 24, padding: 28, maxWidth: 440, width: '100%', border: '1px solid var(--border-subtle)', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Footprints size={22} color="#10b981" />
                  <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>Log Walking & Activity</h3>
                </div>
                <button onClick={() => setShowWalkModal(false)} className="btn btn-ghost btn-icon btn-sm"><X size={18}/></button>
              </div>

              {/* Mode Tabs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 18 }}>
                {[
                  { id: 'steps', label: '👟 Steps' },
                  { id: 'distance', label: '📍 Distance' },
                  { id: 'duration', label: '⏱ Duration' },
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setWalkForm({ ...walkForm, inputMode: mode.id })}
                    style={{
                      padding: '8px 12px', borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: 'pointer',
                      background: walkForm.inputMode === mode.id ? '#10b981' : 'var(--bg-elevated)',
                      color: walkForm.inputMode === mode.id ? 'white' : 'var(--text-secondary)',
                      border: walkForm.inputMode === mode.id ? 'none' : '1px solid var(--border-subtle)'
                    }}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                logWalkingActivity(activeDate, {
                  inputMode: walkForm.inputMode,
                  steps: Number(walkForm.steps) || 0,
                  distanceKm: Number(walkForm.distanceKm) || 0,
                  durationMinutes: Number(walkForm.durationMinutes) || 0,
                  intensity: walkForm.intensity
                });
                setShowWalkModal(false);
              }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {walkForm.inputMode === 'steps' && (
                  <div className="form-group">
                    <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Number of Steps</label>
                    <input type="number" className="search-input" value={walkForm.steps} onChange={e => setWalkForm({ ...walkForm, steps: e.target.value })} placeholder="e.g. 7500" required />
                  </div>
                )}

                {walkForm.inputMode === 'distance' && (
                  <div className="form-group">
                    <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Distance (Kilometers)</label>
                    <input type="number" step="0.1" className="search-input" value={walkForm.distanceKm} onChange={e => setWalkForm({ ...walkForm, distanceKm: e.target.value })} placeholder="e.g. 4.2" required />
                  </div>
                )}

                {walkForm.inputMode === 'duration' && (
                  <div className="form-group">
                    <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Duration (Minutes)</label>
                    <input type="number" className="search-input" value={walkForm.durationMinutes} onChange={e => setWalkForm({ ...walkForm, durationMinutes: e.target.value })} placeholder="e.g. 45" required />
                  </div>
                )}

                <div className="form-group">
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Pace / Intensity</label>
                  <select className="search-input" value={walkForm.intensity} onChange={e => setWalkForm({ ...walkForm, intensity: e.target.value })}>
                    {Object.entries(WALKING_INTENSITIES).map(([key, info]) => (
                      <option key={key} value={key}>{info.name}</option>
                    ))}
                  </select>
                </div>

                {/* Live Estimate Preview Card */}
                {(() => {
                  let est;
                  const h = dietGoals?.heightCm || 175;
                  const w = dietGoals?.weightKg || 70;
                  if (walkForm.inputMode === 'distance') {
                    est = calculateWalkingFromDistance({ distanceKm: walkForm.distanceKm, heightCm: h, weightKg: w, intensityKey: walkForm.intensity });
                  } else if (walkForm.inputMode === 'duration') {
                    est = calculateWalkingFromDuration({ durationMinutes: walkForm.durationMinutes, heightCm: h, weightKg: w, intensityKey: walkForm.intensity });
                  } else {
                    est = calculateWalkingFromSteps({ steps: walkForm.steps, heightCm: h, weightKg: w, intensityKey: walkForm.intensity });
                  }

                  return (
                    <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 14, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 900, color: '#10b981', textTransform: 'uppercase', letterSpacing: 1 }}>ESTIMATED OUTPUT</div>
                        <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 700, marginTop: 2 }}>
                          {est.steps?.toLocaleString()} steps · {est.distanceKm} km · {est.durationMinutes} min
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 18, fontWeight: 950, color: '#10b981' }}>~{est.estimatedCalories}</div>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Est. Calories</div>
                      </div>
                    </div>
                  );
                })()}

                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowWalkModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 2, background: 'linear-gradient(135deg, #10b981, #059669)' }}>✓ Save Activity</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
