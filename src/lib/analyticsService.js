import { format, subDays, eachDayOfInterval } from 'date-fns';
import { calculateDaySummary } from './nutritionEngine.js';

/**
 * TASKBAR OS / NEURAL OS — CENTRAL AUTHORITATIVE ANALYTICS & AGGREGATION ENGINE
 * 
 * Provides unified, single-source-of-truth calculations across:
 * - Dashboard
 * - Analytics Workspace
 * - Grand Strategic Debrief (Reports)
 * - Administrative Console
 * 
 * Guarantees zero hardcoded demo data, transparent denominators,
 * period-consistent attribution, and graceful handling of missing or partial records.
 */

/**
 * Generates an array of formatted date keys for a rolling window of N days ending today.
 */
export const getRollingDateInterval = (daysCount = 30) => {
  const end = new Date();
  const start = subDays(end, Math.max(0, daysCount - 1));
  return eachDayOfInterval({ start, end }).map(d => format(d, 'yyyy-MM-dd'));
};

/**
 * Computes centralized productivity metrics for a given date range.
 * 
 * @param {Object} tasks - Stored tasks map { [dateKey]: Task[] }
 * @param {Array<string>} dateKeys - Target date keys in the period
 * @returns {Object} Authoritative productivity aggregation
 */
export const computeProductivityMetrics = (tasks = {}, dateKeys = []) => {
  let createdCount = 0;
  let completedCount = 0;
  let overdueCount = 0;
  let totalTimeInvestedSec = 0;
  const categoryMap = {};
  const dailyBreakdown = [];
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  dateKeys.forEach(date => {
    const dayTasks = tasks[date] || [];
    let dayCompleted = 0;
    let dayTotal = dayTasks.length;

    dayTasks.forEach(task => {
      createdCount++;
      if (task.completed) {
        completedCount++;
        dayCompleted++;
      } else if (date < todayStr) {
        overdueCount++;
      }

      if (task.timeTaken) {
        totalTimeInvestedSec += Number(task.timeTaken) || 0;
      }

      const cat = task.category || 'Other';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });

    const dayRate = dayTotal > 0 ? Math.round((dayCompleted / dayTotal) * 100) : null;
    dailyBreakdown.push({
      date,
      total: dayTotal,
      completed: dayCompleted,
      completionRate: dayRate,
      hasData: dayTotal > 0
    });
  });

  // Completion Rate: completed tasks divided by all eligible tasks created/due during this period
  const completionRate = createdCount > 0 ? Math.round((completedCount / createdCount) * 100) : 0;
  const focusMinutes = Math.round(totalTimeInvestedSec / 60);

  return {
    createdCount,
    completedCount,
    overdueCount,
    completionRate,
    totalTimeInvestedSec,
    focusMinutes,
    focusHours: (focusMinutes / 60).toFixed(1),
    categoryMap,
    dailyBreakdown,
    activeDays: dailyBreakdown.filter(d => d.hasData).length
  };
};

/**
 * Computes centralized fitness & strength metrics for a given date range.
 * 
 * @param {Object} workouts - Stored workouts map { [dateKey]: Workout }
 * @param {Array<string>} dateKeys - Target date keys in the period
 * @returns {Object} Authoritative fitness aggregation
 */
export const computeFitnessMetrics = (workouts = {}, dateKeys = []) => {
  let workoutsCompleted = 0;
  let totalSets = 0;
  let completedSets = 0;
  let totalExternalVolumeKg = 0;
  let estimatedCaloriesBurned = 0;
  const muscleDistribution = {};

  dateKeys.forEach(date => {
    const workout = workouts[date];
    if (!workout) return;

    if (workout.completed) {
      workoutsCompleted++;
    }

    (workout.exercises || []).forEach(ex => {
      const muscle = ex.muscle || 'Full Body';
      muscleDistribution[muscle] = (muscleDistribution[muscle] || 0) + 1;

      (ex.sets || []).forEach(st => {
        totalSets++;
        if (st.completed) {
          completedSets++;
          const weight = Number(st.weight) || 0;
          const reps = Number(st.reps) || 0;
          if (weight > 0 && reps > 0) {
            totalExternalVolumeKg += (weight * reps);
          }
        }
      });
    });

    if (workout.estimatedCalories) {
      estimatedCaloriesBurned += Number(workout.estimatedCalories) || 0;
    }
  });

  const periodWeeks = Math.max(1, dateKeys.length / 7);
  const trainingFrequencyPerWeek = parseFloat((workoutsCompleted / periodWeeks).toFixed(1));

  return {
    workoutsCompleted,
    totalSets,
    completedSets,
    setCompletionRate: totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0,
    totalExternalVolumeKg: Math.round(totalExternalVolumeKg),
    estimatedCaloriesBurned: Math.round(estimatedCaloriesBurned),
    trainingFrequencyPerWeek,
    muscleDistribution
  };
};

/**
 * Computes centralized nutrition & hydration metrics for a given date range.
 * 
 * @param {Object} dietEntries - Stored diet entries { [dateKey]: Entry[] }
 * @param {Object} waterCompletions - Stored water completions { [dateKey]: { [id]: boolean } }
 * @param {Array} waterSchedule - Configured water schedule items
 * @param {Object} dietGoals - Configured diet goals
 * @param {Array<string>} dateKeys - Target date keys in the period
 * @returns {Object} Authoritative nutrition aggregation
 */
export const computeNutritionMetrics = (dietEntries = {}, waterCompletions = {}, waterSchedule = [], dietGoals = {}, dateKeys = []) => {
  let loggedDaysCount = 0;
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalFiber = 0;

  let totalWaterSlots = 0;
  let completedWaterSlots = 0;

  const targetSlotsPerDay = Math.max(1, waterSchedule.length || 5);
  const targetWaterMl = dietGoals.waterGoalMl || 3000;

  dateKeys.forEach(date => {
    const dayEntries = dietEntries[date] || [];
    if (dayEntries.length > 0) {
      loggedDaysCount++;
      const daySum = calculateDaySummary(dayEntries);
      totalCalories += daySum.calories;
      totalProtein += daySum.protein;
      totalCarbs += daySum.carbs;
      totalFat += daySum.fat;
      totalFiber += daySum.fiber;
    }

    const dayWater = waterCompletions[date] || {};
    const dayDoneCount = Object.keys(dayWater).length;
    totalWaterSlots += targetSlotsPerDay;
    completedWaterSlots += dayDoneCount;
  });

  const avgCalories = loggedDaysCount > 0 ? Math.round(totalCalories / loggedDaysCount) : 0;
  const avgProtein = loggedDaysCount > 0 ? Math.round(totalProtein / loggedDaysCount) : 0;
  const avgCarbs = loggedDaysCount > 0 ? Math.round(totalCarbs / loggedDaysCount) : 0;
  const avgFat = loggedDaysCount > 0 ? Math.round(totalFat / loggedDaysCount) : 0;
  const avgFiber = loggedDaysCount > 0 ? Math.round(totalFiber / loggedDaysCount) : 0;

  const waterAdherenceRate = totalWaterSlots > 0 ? Math.round((completedWaterSlots / totalWaterSlots) * 100) : 0;
  const avgDailyWaterMl = dateKeys.length > 0 
    ? Math.round((completedWaterSlots / Math.max(1, dateKeys.length * targetSlotsPerDay)) * targetWaterMl)
    : 0;

  return {
    loggedDaysCount,
    totalCalories,
    totalProtein: Math.round(totalProtein * 10) / 10,
    totalCarbs: Math.round(totalCarbs * 10) / 10,
    totalFat: Math.round(totalFat * 10) / 10,
    totalFiber: Math.round(totalFiber * 10) / 10,
    avgCalories,
    avgProtein,
    avgCarbs,
    avgFat,
    avgFiber,
    targetCalories: dietGoals.calories || 2000,
    targetProtein: dietGoals.protein || 120,
    waterAdherenceRate,
    avgDailyWaterMl,
    totalWaterSlots,
    completedWaterSlots
  };
};

/**
 * Computes centralized lifestyle, sleep, and recovery metrics.
 * 
 * @param {Object} sleepLogs - Stored sleep logs { [dateKey]: { start, end, quality, notes } }
 * @param {Object} energyLogs - Stored energy logs { [dateKey]: Array<{ time, level }> }
 * @param {Array<string>} dateKeys - Target date keys in the period
 * @returns {Object} Authoritative lifestyle aggregation
 */
export const computeLifestyleMetrics = (sleepLogs = {}, energyLogs = {}, dateKeys = []) => {
  let loggedSleepDays = 0;
  let totalSleepQuality = 0;
  let totalEnergyReadings = 0;
  let sumEnergyLevels = 0;

  dateKeys.forEach(date => {
    const sleep = sleepLogs[date];
    if (sleep && typeof sleep.quality === 'number') {
      loggedSleepDays++;
      totalSleepQuality += sleep.quality;
    }

    const energyList = energyLogs[date] || [];
    energyList.forEach(e => {
      if (typeof e.level === 'number') {
        totalEnergyReadings++;
        sumEnergyLevels += e.level;
      }
    });
  });

  const avgSleepQuality = loggedSleepDays > 0 ? parseFloat((totalSleepQuality / loggedSleepDays).toFixed(1)) : null;
  const avgEnergyLevel = totalEnergyReadings > 0 ? parseFloat((sumEnergyLevels / totalEnergyReadings).toFixed(1)) : null;
  const energyStabilityScore = avgEnergyLevel !== null ? Math.round((avgEnergyLevel / 10) * 100) : null;

  return {
    loggedSleepDays,
    avgSleepQuality,
    totalEnergyReadings,
    avgEnergyLevel,
    energyStabilityScore,
    hasSleepData: loggedSleepDays > 0,
    hasEnergyData: totalEnergyReadings > 0
  };
};

/**
 * Generates an aggregated Grand Operational Summary across all domains for a period.
 * 
 * @param {Object} state - Current Zustand application state
 * @param {number} daysCount - Duration of period (7, 30, 90)
 * @returns {Object} Unified strategic intelligence report
 */
export const generateGrandOperationalReport = (state, daysCount = 30) => {
  const dateKeys = getRollingDateInterval(daysCount);
  const {
    tasks = {}, workouts = {}, dietEntries = {}, 
    waterCompletions = {}, waterSchedule = [], dietGoals = {},
    sleepLogs = {}, energyLogs = {}, gamification = {}
  } = state;

  const productivity = computeProductivityMetrics(tasks, dateKeys);
  const fitness = computeFitnessMetrics(workouts, dateKeys);
  const nutrition = computeNutritionMetrics(dietEntries, waterCompletions, waterSchedule, dietGoals, dateKeys);
  const lifestyle = computeLifestyleMetrics(sleepLogs, energyLogs, dateKeys);

  // Overall platform discipline score (0-100)
  const taskWeight = productivity.completionRate * 0.40;
  const fitnessWeight = (Math.min(100, (fitness.workoutsCompleted / Math.max(1, (daysCount / 7) * 3)) * 100)) * 0.25;
  const waterWeight = nutrition.waterAdherenceRate * 0.20;
  const lifestyleWeight = (lifestyle.energyStabilityScore || 70) * 0.15;
  const overallDisciplineScore = Math.round(taskWeight + fitnessWeight + waterWeight + lifestyleWeight);

  return {
    periodDays: daysCount,
    startDate: dateKeys[0],
    endDate: dateKeys[dateKeys.length - 1],
    generatedAt: new Date().toISOString(),
    overallDisciplineScore,
    disciplineGrade: overallDisciplineScore >= 90 ? 'S' : overallDisciplineScore >= 75 ? 'A' : overallDisciplineScore >= 60 ? 'B' : 'C',
    productivity,
    fitness,
    nutrition,
    lifestyle,
    currentStreak: gamification.streak || 0,
    lifetimeXp: gamification.xp || 0
  };
};
