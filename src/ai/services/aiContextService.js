import { format, subDays, eachDayOfInterval } from 'date-fns';

/**
 * AI Context Aggregation and Sanitization Service
 * Extracts minimal, privacy-conscious data from TaskBar OS state.
 * Never exposes passwords, raw tokens, or excessive store trees.
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

/**
 * Prepares the complete, sanitized context payload for AI consultation.
 * Respects user AI privacy settings.
 */
export function prepareFullContext(state) {
  const privacy = state.settings?.aiPrivacy || {
    includeTasks: true,
    includeHabits: true,
    includeWorkouts: true,
    includeNutrition: true
  };

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const context = {
    today: todayStr,
    userLevel: state.gamification?.level || 1,
    rank: state.gamification?.rank || 'Recruit'
  };

  if (privacy.includeTasks !== false) {
    context.productivity = prepareProductivityContext(state, 7);
    // Include today's active tasks (titles and priorities only, no private notes)
    const todayTasks = (state.tasks?.[todayStr] || []).map(t => ({
      id: t.id,
      title: t.title,
      priority: t.priority || 'Medium',
      category: t.category || 'Work',
      completed: Boolean(t.completed),
      dueTime: t.dueTime || null
    }));
    context.todayTasks = todayTasks;
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

  return context;
}

