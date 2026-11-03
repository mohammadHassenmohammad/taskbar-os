import { format, subDays, eachDayOfInterval } from 'date-fns';

/**
 * AI Context Aggregation and Sanitization Service
 * Extracts minimal, privacy-conscious data from TaskBar OS state.
 * Never exposes passwords, raw tokens, or sensitive store internals.
 */

export function prepareProductivityContext(state, daysWindow = 7) {
  const tasks = state.tasks || {};
  const baseDate = new Date();
  const dateInterval = eachDayOfInterval({
    start: subDays(baseDate, daysWindow - 1),
    end: baseDate
  });

  let totalTasks = 0;
  let completedTasks = 0;
  let overdueCount = 0;
  let focusSeconds = 0;
  const categoryCounts = {};
  const priorityCounts = { High: 0, Medium: 0, Low: 0 };
  const dailySummary = [];

  dateInterval.forEach(dateObj => {
    const dStr = format(dateObj, 'yyyy-MM-dd');
    const dayTasks = tasks[dStr] || [];
    let dayCompleted = 0;

    dayTasks.forEach(t => {
      totalTasks++;
      if (t.completed) dayCompleted++;
      else if (dateObj < baseDate) overdueCount++;

      focusSeconds += (t.timeTaken || 0);

      const cat = t.category || 'Work';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

      const prio = t.priority || 'Medium';
      if (priorityCounts[prio] !== undefined) priorityCounts[prio]++;
    });

    completedTasks += dayCompleted;
    dailySummary.push({
      date: dStr,
      day: format(dateObj, 'EEE'),
      total: dayTasks.length,
      completed: dayCompleted
    });
  });

  return {
    windowDays: daysWindow,
    totalTasks,
    completedTasks,
    completionRatePct: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    overdueCount,
    focusMinutes: Math.round(focusSeconds / 60),
    categoryBreakdown: categoryCounts,
    priorityBreakdown: priorityCounts,
    dailySummary
  };
}

export function prepareHabitContext(state) {
  const habits = (state.habits || []).filter(h => !h.archived);
  const habitLogs = state.habitLogs || {};
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const habitsSummary = habits.map(h => {
    return {
      title: h.title,
      category: h.category || 'General',
      streak: h.streak || 0,
      completedToday: Boolean(habitLogs[todayStr]?.[h.id]),
      schedule: h.schedule || 'daily'
    };
  });

  return {
    activeHabitsCount: habits.length,
    habits: habitsSummary
  };
}

export function prepareWorkoutContext(state, daysWindow = 14) {
  const workouts = state.workouts || {};
  const baseDate = new Date();
  const dateInterval = eachDayOfInterval({
    start: subDays(baseDate, daysWindow - 1),
    end: baseDate
  });

  let sessionCount = 0;
  let totalVolumeKg = 0;
  const recentSessions = [];

  dateInterval.forEach(d => {
    const dStr = format(d, 'yyyy-MM-dd');
    const w = workouts[dStr];
    if (w && w.completed) {
      sessionCount++;
      let sessionVol = 0;
      (w.exercises || []).forEach(ex => {
        (ex.sets || []).forEach(s => {
          if (s.completed) {
            sessionVol += (parseFloat(s.weight) || 0) * (parseFloat(s.reps) || 0);
          }
        });
      });
      totalVolumeKg += sessionVol;
      recentSessions.push({
        date: dStr,
        name: w.name || 'Workout',
        volumeKg: Math.round(sessionVol),
        exercisesCount: (w.exercises || []).length
      });
    }
  });

  return {
    windowDays: daysWindow,
    sessionCount,
    totalVolumeKg: Math.round(totalVolumeKg),
    recentSessions
  };
}

export function prepareNutritionContext(state, daysWindow = 7) {
  const dietEntries = state.dietEntries || {};
  const dietGoals = state.dietGoals || {};
  const baseDate = new Date();
  const dateInterval = eachDayOfInterval({
    start: subDays(baseDate, daysWindow - 1),
    end: baseDate
  });

  let totalCalories = 0;
  let totalProtein = 0;
  let loggedDays = 0;

  dateInterval.forEach(d => {
    const dStr = format(d, 'yyyy-MM-dd');
    const dayEntries = dietEntries[dStr] || [];
    if (dayEntries.length > 0) {
      loggedDays++;
      dayEntries.forEach(e => {
        totalCalories += (e.calculatedNutrients?.calories || 0);
        totalProtein += (e.calculatedNutrients?.protein || 0);
      });
    }
  });

  return {
    targetCalories: dietGoals.calories || 2000,
    targetProtein: dietGoals.protein || 120,
    loggedDays,
    avgCalories: loggedDays > 0 ? Math.round(totalCalories / loggedDays) : 0,
    avgProtein: loggedDays > 0 ? Math.round(totalProtein / loggedDays) : 0
  };
}

export function prepareRoutinesContext(state) {
  const routines = state.routines || [];
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayTasks = state.tasks?.[todayStr] || [];

  return routines.map(r => {
    const routineTask = todayTasks.find(t => t.isRoutine && t.routineId === r.id);
    return {
      id: r.id,
      title: r.title,
      category: r.category || 'General',
      priority: r.priority || 'Medium',
      enabled: r.enabled !== false,
      completedToday: Boolean(routineTask?.completed)
    };
  });
}

export function prepareWellnessContext(state) {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  // Hydration
  const waterLogs = state.waterLogs || {};
  const waterCompletions = state.waterCompletions || {};
  const waterSchedule = state.waterSchedule || [];
  const waterGlasses = waterLogs[todayStr] || 0;
  const scheduleDone = Object.keys(waterCompletions[todayStr] || {}).length;
  const waterGoal = state.waterGoal || 8;

  // Sleep (check today or last night)
  const sleepLogs = state.sleepLogs || {};
  const sleepToday = sleepLogs[todayStr] || sleepLogs[yesterdayStr] || null;

  // Mood & Energy
  const moodLogs = state.moodLogs || {};
  const energyLogs = state.energyLogs || {};
  const todayMood = moodLogs[todayStr] || null;
  const todayEnergy = energyLogs[todayStr] || {};

  // Walking & Steps
  const walkingLogs = state.walkingLogs || {};
  const dayWalking = Array.isArray(walkingLogs[todayStr]) 
    ? walkingLogs[todayStr] 
    : (walkingLogs[todayStr] ? [walkingLogs[todayStr]] : []);
  const totalSteps = dayWalking.reduce((acc, l) => acc + (Number(l.steps) || 0), 0);
  const totalKm = dayWalking.reduce((acc, l) => acc + (Number(l.distanceKm) || 0), 0);

  return {
    hydration: {
      glassesLogged: waterGlasses,
      scheduleCompleted: scheduleDone,
      scheduleTotal: waterSchedule.length || 5,
      goalGlasses: waterGoal
    },
    sleep: sleepToday ? {
      hours: sleepToday.hours,
      quality: sleepToday.quality,
      deepSleepHours: sleepToday.deepSleepHours
    } : null,
    mood: todayMood ? todayMood.mood : null,
    energyLevelsCount: Object.keys(todayEnergy).length,
    walking: {
      steps: totalSteps,
      distanceKm: Math.round(totalKm * 10) / 10
    }
  };
}

/**
 * Prepares the complete, sanitized context payload for AI consultation.
 * Respects user AI privacy settings.
 */
export function prepareFullContext(state) {
  const privacy = state.settings?.aiPrivacy || {
    includeTasks: true,
    includeHabits: true,
    includeWorkouts: true,
    includeNutrition: true,
    includeWellness: true
  };

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const context = {
    today: todayStr,
    userLevel: state.gamification?.level || 1,
    rank: state.gamification?.rank || 'Recruit',
    xp: state.gamification?.xp || 0,
    dailyStreak: state.gamification?.streak || 0,
    dailyFocus: state.dailyFocus?.[todayStr] || null
  };

  if (privacy.includeTasks !== false) {
    context.productivity = prepareProductivityContext(state, 7);
    const todayTasks = (state.tasks?.[todayStr] || []).map(t => ({
      id: t.id,
      title: t.title,
      priority: t.priority || 'Medium',
      category: t.category || 'Work',
      completed: Boolean(t.completed),
      dueTime: t.dueTime || null
    }));
    context.todayTasks = todayTasks;
    
    // Prune tasks dictionary: strictly lightweight 7-day window & overdue tasks to keep payload < 10KB
    const prunedTasks = {};
    const dateInterval = eachDayOfInterval({
      start: subDays(new Date(), 7),
      end: new Date()
    });
    dateInterval.forEach(d => {
      const dStr = format(d, 'yyyy-MM-dd');
      if (state.tasks?.[dStr]) {
        prunedTasks[dStr] = state.tasks[dStr].map(t => ({
          id: t.id,
          title: t.title,
          priority: t.priority || 'Medium',
          category: t.category || 'General',
          completed: Boolean(t.completed)
        }));
      }
    });
    context.tasks = prunedTasks;
  }

  if (privacy.includeHabits !== false) {
    context.habits = prepareHabitContext(state);
  }

  if (privacy.includeWorkouts !== false) {
    context.workouts = prepareWorkoutContext(state, 14);
  }

  if (privacy.includeNutrition !== false) {
    context.nutrition = prepareNutritionContext(state, 7);
  }

  // Include routines if present
  if (state.routines && state.routines.length > 0) {
    context.routines = prepareRoutinesContext(state);
  }

  // Include wellness metrics
  if (privacy.includeWellness !== false) {
    context.wellness = prepareWellnessContext(state);
  }

  return context;
}

/**
 * Returns human-readable badges for the Chat Context Indicator
 */
export function getContextBadges(state) {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayTasks = state.tasks?.[todayStr] || [];
  const activeHabits = (state.habits || []).filter(h => !h.archived);
  const workoutsCount = Object.keys(state.workouts || {}).length;
  const dietCount = (state.dietEntries?.[todayStr] || []).length;
  const hasWellness = (state.waterLogs?.[todayStr] || 0) > 0 || !!state.sleepLogs?.[todayStr];

  return [
    { label: `Tasks (${todayTasks.length})`, active: todayTasks.length > 0, type: 'tasks' },
    { label: `Habits (${activeHabits.length})`, active: activeHabits.length > 0, type: 'habits' },
    { label: `Workouts (${workoutsCount})`, active: workoutsCount > 0, type: 'workouts' },
    { label: `Diet (${dietCount})`, active: dietCount > 0, type: 'diet' },
    { label: 'Wellness', active: hasWellness, type: 'wellness' }
  ];
}
