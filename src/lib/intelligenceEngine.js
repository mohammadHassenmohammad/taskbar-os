// Cross-Module Intelligence & Aggregation Engine for Fitness OS
// Serves as the Central Analytical Engine computing unified daily snapshots, cross-module correlations,
// smart priority queues, and actionable real-data AI insights.

import { format, subDays } from 'date-fns';
import { calculateDaySummary } from './nutritionEngine';
import { calculateDailyExpenditureSummary } from './calorieBurnService';

const todayStr = () => format(new Date(), 'yyyy-MM-dd');

/**
 * Computes a unified Daily Snapshot aggregating data across Workout, Diet, Water, Routines, and Focus.
 * 
 * @param {Object} state - Current Zustand store state
 * @param {string} dateKey - Target ISO date string (YYYY-MM-DD)
 * @returns {Object} Unified Daily Snapshot
 */
export function getDailySnapshot(state, dateKey = todayStr()) {
  const { 
    tasks = {}, workouts = {}, dietEntries = {}, waterCompletions = {}, 
    waterSchedule = [], dietGoals = {}, walkingLogs = {}
  } = state;

  // 1. WORKOUT METRICS & CENTRAL CALORIE EXPENDITURE
  const dayWorkout = workouts[dateKey] || null;
  const dayTasks = tasks[dateKey] || [];
  const gymTasks = dayTasks.filter(t => t.isGym);
  
  let workoutCompleted = false;
  let totalSets = 0;
  let completedSets = 0;
  let volumeKg = 0;
  let workoutDurationSec = 0;
  let workoutName = 'Rest / Recovery';
  let workoutCalories = 0;

  if (dayWorkout) {
    workoutCompleted = !!dayWorkout.completed;
    workoutName = dayWorkout.name || 'Workout Session';
    workoutCalories = Number(dayWorkout.estimatedCalories) || 0;
    (dayWorkout.exercises || []).forEach(ex => {
      workoutDurationSec += (ex.timeTaken || 0);
      (ex.sets || []).forEach(s => {
        totalSets++;
        if (s.completed) {
          completedSets++;
          const w = parseFloat(s.weight) || 0;
          const r = parseFloat(s.reps) || 0;
          volumeKg += (w * r);
        }
      });
    });
  } else if (gymTasks.length > 0) {
    workoutCompleted = gymTasks.every(t => t.completed);
    workoutName = gymTasks[0]?.title || 'Gym Session';
    totalSets = gymTasks.length;
    completedSets = gymTasks.filter(t => t.completed).length;
  }

  // 1B. WALKING METRICS
  const dayWalkingList = Array.isArray(walkingLogs[dateKey])
    ? walkingLogs[dateKey]
    : (walkingLogs[dateKey] ? [walkingLogs[dateKey]] : []);

  const walkingSteps = dayWalkingList.reduce((acc, l) => acc + (Number(l.steps) || 0), 0);
  const walkingDistanceKm = Math.round(dayWalkingList.reduce((acc, l) => acc + (Number(l.distanceKm) || 0), 0) * 100) / 100;
  const walkingDurationMins = dayWalkingList.reduce((acc, l) => acc + (Number(l.durationMinutes) || 0), 0);
  const walkingCalories = dayWalkingList.reduce((acc, l) => acc + (Number(l.estimatedCalories) || 0), 0);

  // Total Active Calories = Exercise + Walking
  const totalActiveCalories = workoutCalories + walkingCalories;

  // 2. DIET & NUTRITION METRICS
  const dayDietEntries = dietEntries[dateKey] || [];
  const dietSummary = calculateDaySummary(dayDietEntries);

  const calTarget = dietGoals.calories || 2000;
  const protTarget = dietGoals.protein || 120;
  const carbTarget = dietGoals.carbs || 250;
  const fatTarget = dietGoals.fat || 65;
  const fiberTarget = dietGoals.fiber || 30;
  const waterTargetMl = dietGoals.waterGoalMl || 3000;

  // 3. HYDRATION METRICS
  const waterDoneObj = waterCompletions[dateKey] || {};
  const waterDoneCount = Object.keys(waterDoneObj).length;
  const waterTotalCount = waterSchedule.length || 5;
  const loggedWaterMl = Math.round((waterDoneCount / Math.max(1, waterTotalCount)) * waterTargetMl);

  // 4. ROUTINES & TASKS METRICS
  const nonGymTasks = dayTasks.filter(t => !t.isGym);
  const totalTasks = nonGymTasks.length;
  const completedTasks = nonGymTasks.filter(t => t.completed).length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // 5. FOCUS METRICS
  const focusTimeTaken = nonGymTasks.reduce((acc, t) => acc + (t.timeTaken || 0), 0);
  const focusMinutes = Math.round(focusTimeTaken / 60);

  // 6. TRANSPARENT DAILY HEALTH & PERFORMANCE CONSISTENCY SCORE (0 - 100%)
  let workoutScore = workoutCompleted ? 100 : (totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0);
  let calScore = Math.max(0, 100 - Math.abs(Math.round(((dietSummary.calories - calTarget) / calTarget) * 100)));
  let protScore = Math.min(100, Math.round((dietSummary.protein / Math.max(1, protTarget)) * 100));
  let waterScore = Math.min(100, Math.round((loggedWaterMl / Math.max(1, waterTargetMl)) * 100));
  let routineScore = taskCompletionRate;
  let focusScore = Math.min(100, Math.round((focusMinutes / 60) * 100));

  const dailyHealthScore = Math.round(
    (workoutScore * 0.25) +
    (calScore * 0.20) +
    (protScore * 0.20) +
    (waterScore * 0.15) +
    (routineScore * 0.10) +
    (focusScore * 0.10)
  );

  let grade = 'F';
  if (dailyHealthScore >= 90) grade = 'S';
  else if (dailyHealthScore >= 80) grade = 'A';
  else if (dailyHealthScore >= 65) grade = 'B';
  else if (dailyHealthScore >= 45) grade = 'C';
  else if (dailyHealthScore >= 20) grade = 'D';

  return {
    date: dateKey,
    workout: {
      completed: workoutCompleted,
      name: workoutName,
      totalSets,
      completedSets,
      volumeKg: Math.round(volumeKg),
      durationSec: workoutDurationSec,
      calories: workoutCalories
    },
    walking: {
      steps: walkingSteps,
      distanceKm: walkingDistanceKm,
      durationMinutes: walkingDurationMins,
      calories: walkingCalories
    },
    activeExpenditure: {
      workoutCalories,
      walkingCalories,
      totalActiveCalories
    },
    energySummary: calculateDailyExpenditureSummary({
      userProfile: dietGoals,
      workoutCalories,
      walkingCalories,
      foodCalories: dietSummary.calories
    }),
    diet: {
      calories: dietSummary.calories,
      caloriesTarget: calTarget,
      protein: dietSummary.protein,
      proteinTarget: protTarget,
      carbs: dietSummary.carbs,
      carbsTarget: carbTarget,
      fat: dietSummary.fat,
      fatTarget: fatTarget,
      fiber: dietSummary.fiber,
      fiberTarget: fiberTarget,
      entryCount: dietSummary.entryCount
    },
    water: {
      loggedMl: loggedWaterMl,
      targetMl: waterTargetMl,
      completedCount: waterDoneCount,
      totalCount: waterTotalCount,
      pct: Math.min(100, Math.round((loggedWaterMl / waterTargetMl) * 100))
    },
    routines: {
      total: totalTasks,
      completed: completedTasks,
      rate: taskCompletionRate
    },
    focus: {
      minutes: focusMinutes,
      timeTakenSec: focusTimeTaken
    },
    score: dailyHealthScore,
    grade
  };
}

/**
 * Computes dynamic top 3 Priorities for today based on actual incomplete goals.
 * 
 * @param {Object} state - Zustand store state
 * @param {string} dateKey - Target date
 * @returns {Array} List of dynamic priority objects
 */
export function getTodayPriorities(state, dateKey = todayStr()) {
  const snapshot = getDailySnapshot(state, dateKey);
  const priorities = [];

  // Priority 1: Workout
  if (!snapshot.workout.completed) {
    priorities.push({
      id: 'p_workout',
      title: `Complete today's training: ${snapshot.workout.name}`,
      category: 'Fitness',
      icon: 'Dumbbell',
      actionTab: 'gym',
      actionLabel: 'Open Fitness OS'
    });
  }

  // Priority 2: Protein
  const protRemaining = snapshot.diet.proteinTarget - snapshot.diet.protein;
  if (protRemaining > 10) {
    priorities.push({
      id: 'p_protein',
      title: `${Math.round(protRemaining)}g protein remaining to hit daily target (${snapshot.diet.proteinTarget}g)`,
      category: 'Diet',
      icon: 'Utensils',
      actionTab: 'diet',
      actionLabel: '+ Log Protein'
    });
  }

  // Priority 3: Water Hydration
  const waterRemaining = snapshot.water.targetMl - snapshot.water.loggedMl;
  if (waterRemaining > 300) {
    priorities.push({
      id: 'p_water',
      title: `Hydration: Drink ${Math.round(waterRemaining)}ml more water today`,
      category: 'Hydration',
      icon: 'Droplets',
      actionTab: 'today',
      actionLabel: 'Log Water'
    });
  }

  // Priority 4: Routines / Tasks
  const remainingTasks = snapshot.routines.total - snapshot.routines.completed;
  if (remainingTasks > 0) {
    priorities.push({
      id: 'p_routines',
      title: `Complete remaining ${remainingTasks} routine tasks for today`,
      category: 'Routines',
      icon: 'CheckSquare',
      actionTab: 'today',
      actionLabel: 'View Today'
    });
  }

  // Priority 5: Focus session
  if (snapshot.focus.minutes < 30) {
    priorities.push({
      id: 'p_focus',
      title: `Complete a 25-minute deep focus session`,
      category: 'Productivity',
      icon: 'Timer',
      actionTab: 'focus',
      actionLabel: 'Start Focus'
    });
  }

  return priorities.slice(0, 3);
}

/**
 * Returns the #1 single dynamic Next Action card.
 * 
 * @param {Object} state - Zustand store state
 * @returns {Object} Primary Next Action item
 */
export function getNextAction(state, dateKey = todayStr()) {
  const priorities = getTodayPriorities(state, dateKey);
  if (priorities.length > 0) return priorities[0];

  return {
    id: 'p_complete',
    title: 'All daily objectives completed! Excellent discipline today.',
    category: 'Mastery',
    icon: 'CheckCircle2',
    actionTab: 'analytics',
    actionLabel: 'View Progress'
  };
}

/**
 * Generates actionable AI Insights strictly derived from real cross-module data.
 * 
 * @param {Object} state - Zustand store state
 * @param {string} dateKey - Target date
 * @returns {Array} List of actionable AI Insight objects
 */
export function generateCrossModuleInsights(state, dateKey = todayStr()) {
  const snapshot = getDailySnapshot(state, dateKey);
  const insights = [];

  // Insight 1: Workout & Protein recovery connection
  if (snapshot.workout.completed) {
    const protRemaining = snapshot.diet.proteinTarget - snapshot.diet.protein;
    if (protRemaining > 15) {
      insights.push({
        id: 'ins_1',
        type: 'warning',
        title: 'Post-Workout Protein Recovery Deficit',
        message: `Workout completed! However, you have consumed ${snapshot.diet.protein}g protein today against your target of ${snapshot.diet.proteinTarget}g (${Math.round(protRemaining)}g remaining). Consume chicken, eggs, soya, or whey for optimal muscle recovery.`,
        actionTab: 'diet',
        actionLabel: 'Log Protein Intake'
      });
    } else {
      insights.push({
        id: 'ins_1_ok',
        type: 'success',
        title: 'Optimal Muscle Recovery State 🏋️',
        message: `Workout completed and protein target achieved (${snapshot.diet.protein}g / ${snapshot.diet.proteinTarget}g). Your body has adequate amino acids for muscle synthesis.`,
        actionTab: 'diet',
        actionLabel: 'View Diet OS'
      });
    }
  }

  // Insight 2: Morning Routine & Focus Connection
  if (snapshot.routines.rate >= 80 && snapshot.focus.minutes >= 30) {
    insights.push({
      id: 'ins_2',
      type: 'success',
      title: 'High Discipline & Productivity Correlation ⚡',
      message: `On days when your routine completion is high (${snapshot.routines.rate}%), your deep focus hours increase significantly (${snapshot.focus.minutes} mins focused today).`,
      actionTab: 'focus',
      actionLabel: 'Open Focus Mode'
    });
  }

  // Insight 3: Calorie Balance vs Target
  const calDiff = snapshot.diet.calories - snapshot.diet.caloriesTarget;
  if (snapshot.diet.entryCount > 0) {
    if (calDiff < -350) {
      insights.push({
        id: 'ins_3_under',
        type: 'info',
        title: 'Calorie Budget Buffer Available',
        message: `You are ${Math.abs(calDiff)} kcal below your daily energy target (${snapshot.diet.calories} / ${snapshot.diet.caloriesTarget} kcal). Ensure adequate nourishment.`,
        actionTab: 'diet',
        actionLabel: 'Add Meal'
      });
    } else if (calDiff > 250) {
      insights.push({
        id: 'ins_3_over',
        type: 'warning',
        title: 'Energy Target Exceeded',
        message: `Intake is ${calDiff} kcal over your daily target (${snapshot.diet.calories} / ${snapshot.diet.caloriesTarget} kcal).`,
        actionTab: 'diet',
        actionLabel: 'Review Intake'
      });
    }
  }

  // Insight 4: Hydration
  if (snapshot.water.pct < 50) {
    insights.push({
      id: 'ins_4_water',
      type: 'warning',
      title: 'Hydration Level Below Target 💧',
      message: `You have logged ${snapshot.water.loggedMl}ml water today (${snapshot.water.pct}% of target). Drink ${snapshot.water.targetMl - snapshot.water.loggedMl}ml more to maintain cognitive focus and endurance.`,
      actionTab: 'today',
      actionLabel: 'Log Water'
    });
  }

  return insights;
}

/**
 * Computes empirical correlation analytics across historical days.
 * 
 * @param {Object} state - Zustand store state
 * @param {number} daysCount - Number of past days to analyze
 * @returns {Object} Empirical correlation observations
 */
export function calculateCorrelationData(state, daysCount = 14) {
  const days = [];
  const baseDate = new Date();

  let workoutDoneDays = 0;
  let highProteinOnWorkoutDays = 0;
  let highRoutineDays = 0;
  let highFocusOnRoutineDays = 0;

  for (let i = daysCount - 1; i >= 0; i--) {
    const dStr = format(subDays(baseDate, i), 'yyyy-MM-dd');
    const snap = getDailySnapshot(state, dStr);

    days.push(snap);

    if (snap.workout.completed) {
      workoutDoneDays++;
      if (snap.diet.protein >= (snap.diet.proteinTarget * 0.8)) {
        highProteinOnWorkoutDays++;
      }
    }

    if (snap.routines.rate >= 75) {
      highRoutineDays++;
      if (snap.focus.minutes >= 30) {
        highFocusOnRoutineDays++;
      }
    }
  }

  const workoutProteinRatio = workoutDoneDays > 0 ? Math.round((highProteinOnWorkoutDays / workoutDoneDays) * 100) : 0;
  const routineFocusRatio = highRoutineDays > 0 ? Math.round((highFocusOnRoutineDays / highRoutineDays) * 100) : 0;

  return {
    analyzedDays: daysCount,
    workoutDoneDays,
    workoutProteinRatio,
    routineFocusRatio,
    observationProtein: `You hit your protein target on ${workoutProteinRatio}% of training days.`,
    observationFocus: `Deep focus goals were achieved on ${routineFocusRatio}% of high-routine completion days.`
  };
}

/**
 * Computes streaks across all modules.
 * 
 * @param {Object} state - Zustand store state
 * @returns {Object} Streaks for Workout, Diet, Routines, and Focus
 */
export function getGlobalConsistencyStreaks(state) {
  const { gamification = {}, workouts = {}, dietEntries = {}, tasks = {} } = state;

  const baseDate = new Date();
  let workoutStreak = 0;
  let dietStreak = 0;
  let routineStreak = 0;

  // Calculate Workout Streak
  for (let i = 0; i < 60; i++) {
    const dStr = format(subDays(baseDate, i), 'yyyy-MM-dd');
    const w = workouts[dStr];
    if (w && w.completed) {
      workoutStreak++;
    } else if (i > 0) {
      break;
    }
  }

  // Calculate Diet Tracking Streak
  for (let i = 0; i < 60; i++) {
    const dStr = format(subDays(baseDate, i), 'yyyy-MM-dd');
    const entries = dietEntries[dStr] || [];
    if (entries.length > 0) {
      dietStreak++;
    } else if (i > 0) {
      break;
    }
  }

  // Calculate Routine Streak
  for (let i = 0; i < 60; i++) {
    const dStr = format(subDays(baseDate, i), 'yyyy-MM-dd');
    const dayTasks = tasks[dStr] || [];
    const done = dayTasks.filter(t => t.completed).length;
    if (dayTasks.length > 0 && done > 0) {
      routineStreak++;
    } else if (i > 0) {
      break;
    }
  }

  return {
    workoutStreak,
    dietStreak,
    routineStreak,
    overallStreak: gamification.streak || Math.max(workoutStreak, dietStreak, routineStreak)
  };
}
