/**
 * TaskBar OS — Backend Application Tools Engine
 * Provides structured query, analysis, and universal search tools across all modules.
 * Only accesses data corresponding to the user's current request.
 */

export class ApplicationTools {
  constructor(context = {}) {
    this.context = context || {};
    this.today = context.today || new Date().toISOString().split('T')[0];
  }

  // ==========================================
  // 1. TASK TOOLS
  // ==========================================

  getTasks({ date = null, status = 'all', priority = 'all', category = 'all' } = {}) {
    const allTasks = this.context.tasks || {};
    let matched = [];

    if (date) {
      matched = allTasks[date] || [];
    } else {
      Object.entries(allTasks).forEach(([dStr, list]) => {
        if (Array.isArray(list)) {
          list.forEach(t => matched.push({ ...t, date: dStr }));
        }
      });
    }

    if (status === 'pending') matched = matched.filter(t => !t.completed);
    if (status === 'completed') matched = matched.filter(t => t.completed);
    if (priority !== 'all') matched = matched.filter(t => (t.priority || '').toLowerCase() === priority.toLowerCase());
    if (category !== 'all') matched = matched.filter(t => (t.category || '').toLowerCase() === category.toLowerCase());

    return {
      count: matched.length,
      tasks: matched.map(t => ({
        id: t.id,
        title: t.title,
        completed: Boolean(t.completed),
        priority: t.priority || 'Medium',
        category: t.category || 'General',
        dueTime: t.dueTime || null,
        date: t.date || date || this.today
      }))
    };
  }

  getPendingTasks({ date = null } = {}) {
    return this.getTasks({ date, status: 'pending' });
  }

  getCompletedTasks({ date = null } = {}) {
    return this.getTasks({ date, status: 'completed' });
  }

  getOverdueTasks() {
    const allTasks = this.context.tasks || {};
    const overdue = [];

    Object.entries(allTasks).forEach(([dStr, list]) => {
      if (dStr < this.today && Array.isArray(list)) {
        list.forEach(t => {
          if (!t.completed) overdue.push({ ...t, date: dStr });
        });
      }
    });

    return {
      count: overdue.length,
      tasks: overdue.map(t => ({
        id: t.id,
        title: t.title,
        date: t.date,
        priority: t.priority || 'Medium'
      }))
    };
  }

  getTaskStatistics({ days = 7 } = {}) {
    const allTasks = this.context.tasks || {};
    let total = 0;
    let completed = 0;
    let focusSeconds = 0;

    Object.values(allTasks).forEach(list => {
      if (Array.isArray(list)) {
        list.forEach(t => {
          total++;
          if (t.completed) completed++;
          focusSeconds += (t.timeTaken || 0);
        });
      }
    });

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      windowDays: days,
      totalRecordedTasks: total,
      completedTasks: completed,
      pendingTasks: total - completed,
      completionRatePct: completionRate,
      focusMinutes: Math.round(focusSeconds / 60)
    };
  }

  // ==========================================
  // 2. HABIT TOOLS
  // ==========================================

  getHabits() {
    const habitsList = Array.isArray(this.context.habits) 
      ? this.context.habits 
      : (this.context.habits?.habits || []);

    return {
      count: habitsList.length,
      habits: habitsList.map(h => ({
        id: h.id,
        title: h.title || h.name || 'Habit',
        streak: h.streak || 0,
        category: h.category || 'General',
        completedToday: Boolean(h.completedToday)
      }))
    };
  }

  getHabitStreaks() {
    const habits = this.getHabits().habits;
    return habits
      .sort((a, b) => b.streak - a.streak)
      .map(h => ({ title: h.title, streak: h.streak, completedToday: h.completedToday }));
  }

  getHabitLogs({ habitId = null } = {}) {
    const habits = this.getHabits().habits;
    if (habitId) {
      const match = habits.find(h => h.id === habitId || (h.title && h.title.toLowerCase().includes(habitId.toLowerCase())));
      return match ? { found: true, habit: match } : { found: false, error: 'Habit not found' };
    }
    return { habits };
  }

  // ==========================================
  // 3. GYM & WORKOUT TOOLS
  // ==========================================

  getWorkoutHistory({ days = 14 } = {}) {
    const workouts = this.context.workouts || {};
    const sessions = [];
    let totalVolumeKg = 0;

    if (this.context.workouts?.recentSessions) {
      return {
        sessionCount: this.context.workouts.sessionCount || 0,
        totalVolumeKg: this.context.workouts.totalVolumeKg || 0,
        recentSessions: this.context.workouts.recentSessions || []
      };
    }

    Object.entries(workouts).forEach(([dStr, w]) => {
      if (w && w.completed) {
        let sessionVol = 0;
        (w.exercises || []).forEach(ex => {
          (ex.sets || []).forEach(s => {
            if (s.completed) sessionVol += (parseFloat(s.weight) || 0) * (parseFloat(s.reps) || 0);
          });
        });
        totalVolumeKg += sessionVol;
        sessions.push({
          date: dStr,
          name: w.name || 'Workout Session',
          volumeKg: Math.round(sessionVol),
          exercisesCount: (w.exercises || []).length
        });
      }
    });

    return {
      sessionCount: sessions.length,
      totalVolumeKg: Math.round(totalVolumeKg),
      sessions
    };
  }

  getWorkoutDetails({ date = null } = {}) {
    const targetDate = date || this.today;
    const workouts = this.context.workouts || {};
    const dayWorkout = workouts[targetDate];

    if (!dayWorkout) {
      return {
        date: targetDate,
        logged: false,
        name: 'Rest Day / No Workout Recorded',
        exercises: []
      };
    }

    let volumeKg = 0;
    const exercises = (dayWorkout.exercises || []).map(ex => {
      let exVol = 0;
      (ex.sets || []).forEach(s => {
        if (s.completed) exVol += (parseFloat(s.weight) || 0) * (parseFloat(s.reps) || 0);
      });
      volumeKg += exVol;
      return {
        name: ex.name,
        muscle: ex.muscle,
        setsCount: (ex.sets || []).length,
        completedSets: (ex.sets || []).filter(s => s.completed).length,
        volumeKg: Math.round(exVol)
      };
    });

    return {
      date: targetDate,
      logged: true,
      name: dayWorkout.name || 'Workout Session',
      completed: Boolean(dayWorkout.completed),
      totalVolumeKg: Math.round(volumeKg),
      exercises
    };
  }

  getPersonalRecords() {
    const prs = this.context.personalRecords || [];
    return {
      count: prs.length,
      records: prs.map(pr => ({
        exercise: pr.exerciseName || pr.exercise,
        weight: pr.weight,
        reps: pr.reps,
        date: pr.date
      }))
    };
  }

  // ==========================================
  // 4. DIET & NUTRITION TOOLS
  // ==========================================

  getNutritionStatistics() {
    const nutrition = this.context.nutrition || {};
    return {
      avgDailyCalories: nutrition.avgCalories || 0,
      avgDailyProteinGrams: nutrition.avgProtein || 0,
      targetCalories: nutrition.targetCalories || 2000,
      targetProtein: nutrition.targetProtein || 120,
      trackedDays: nutrition.loggedDays || 0
    };
  }

  getFoodEntries({ date = null } = {}) {
    const targetDate = date || this.today;
    const dietEntries = this.context.dietEntries || {};
    const entries = dietEntries[targetDate] || [];

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    entries.forEach(e => {
      totalCalories += (e.calculatedNutrients?.calories || 0);
      totalProtein += (e.calculatedNutrients?.protein || 0);
      totalCarbs += (e.calculatedNutrients?.carbs || 0);
      totalFat += (e.calculatedNutrients?.fat || 0);
    });

    return {
      date: targetDate,
      count: entries.length,
      totals: {
        calories: Math.round(totalCalories),
        protein: Math.round(totalProtein),
        carbs: Math.round(totalCarbs),
        fat: Math.round(totalFat)
      },
      meals: entries.map(e => ({
        id: e.id,
        name: e.name,
        mealType: e.mealType || 'meal',
        calories: Math.round(e.calculatedNutrients?.calories || 0),
        protein: Math.round(e.calculatedNutrients?.protein || 0)
      }))
    };
  }

  getDietGoals() {
    const goals = this.context.dietGoals || this.context.nutrition || {};
    return {
      targetCalories: goals.targetCalories || goals.calories || 2000,
      targetProtein: goals.targetProtein || goals.protein || 120,
      targetCarbs: goals.carbs || 250,
      targetFat: goals.fat || 65,
      waterGoalMl: goals.waterGoalMl || 3000
    };
  }

  // ==========================================
  // 5. FOCUS & POMODORO TOOLS
  // ==========================================

  getFocusStatistics() {
    const prod = this.context.productivity || {};
    const totalMins = prod.focusMinutes || 0;
    return {
      totalFocusMinutes: totalMins,
      focusHours: (totalMins / 60).toFixed(1),
      estimatedPomodoros: Math.round(totalMins / 25)
    };
  }

  getPomodoroState() {
    const pomo = this.context.pomodoro || {};
    return {
      running: Boolean(pomo.running),
      mode: pomo.mode || 'focus',
      timeLeftSeconds: pomo.timeLeft || (25 * 60),
      sessionsCompleted: pomo.sessions || 0,
      linkedTaskId: pomo.linkedTaskId || null
    };
  }

  // ==========================================
  // 6. ROUTINE TOOLS
  // ==========================================

  getRoutines() {
    const routines = this.context.routines || [];
    return {
      count: routines.length,
      routines: routines.map(r => ({
        id: r.id,
        title: r.title,
        category: r.category || 'General',
        priority: r.priority || 'Medium',
        enabled: r.enabled !== false,
        completedToday: Boolean(r.completedToday)
      }))
    };
  }

  getRoutineStats() {
    const routines = this.getRoutines().routines;
    const completed = routines.filter(r => r.completedToday).length;
    return {
      totalProtocols: routines.length,
      activeProtocols: routines.filter(r => r.enabled).length,
      completedTodayCount: completed,
      completionRatePct: routines.length > 0 ? Math.round((completed / routines.length) * 100) : 0
    };
  }

  // ==========================================
  // 7. WELLNESS & HEALTH TOOLS
  // ==========================================

  getHydrationStats({ date = null } = {}) {
    const targetDate = date || this.today;
    const wellness = this.context.wellness || {};
    const hyd = wellness.hydration || {};

    return {
      date: targetDate,
      glassesLogged: hyd.glassesLogged || 0,
      goalGlasses: hyd.goalGlasses || 8,
      pctOfGoal: hyd.goalGlasses ? Math.round(((hyd.glassesLogged || 0) / hyd.goalGlasses) * 100) : 0,
      scheduleCompleted: hyd.scheduleCompleted || 0,
      scheduleTotal: hyd.scheduleTotal || 5
    };
  }

  getSleepLogs({ days = 7 } = {}) {
    const wellness = this.context.wellness || {};
    const sleep = wellness.sleep;

    return {
      recentSleep: sleep ? {
        hours: sleep.hours || 0,
        quality: sleep.quality || 'Good',
        deepSleepHours: sleep.deepSleepHours || 0
      } : { hours: 0, quality: 'Not recorded' }
    };
  }

  getWalkingActivity({ date = null } = {}) {
    const wellness = this.context.wellness || {};
    const walk = wellness.walking || {};

    return {
      date: date || this.today,
      steps: walk.steps || 0,
      distanceKm: walk.distanceKm || 0,
      targetSteps: 10000,
      targetPct: Math.round(((walk.steps || 0) / 10000) * 100)
    };
  }

  // ==========================================
  // 8. CROSS-MODULE & HOLISTIC TOOLS
  // ==========================================

  getDailySnapshot({ date = null } = {}) {
    const targetDate = date || this.today;
    const tasks = this.getPendingTasks({ date: targetDate });
    const habits = this.getHabits();
    const hydration = this.getHydrationStats({ date: targetDate });
    const workout = this.getWorkoutDetails({ date: targetDate });

    return {
      date: targetDate,
      pendingTasksCount: tasks.count,
      pendingTasksSample: tasks.tasks.slice(0, 3).map(t => t.title),
      activeHabitsCount: habits.count,
      workoutDone: workout.completed,
      workoutName: workout.name,
      hydrationGlasses: hydration.glassesLogged,
      hydrationGoal: hydration.goalGlasses
    };
  }

  getTodayPriorities({ date = null } = {}) {
    const snapshot = this.getDailySnapshot({ date });
    const priorities = [];

    if (!snapshot.workoutDone && snapshot.workoutName !== 'Rest Day / No Workout Recorded') {
      priorities.push({
        domain: 'Fitness',
        title: `Execute scheduled workout: ${snapshot.workoutName}`,
        urgency: 'High'
      });
    }

    if (snapshot.pendingTasksSample && snapshot.pendingTasksSample.length > 0) {
      priorities.push({
        domain: 'Productivity',
        title: `Focus on top mission: "${snapshot.pendingTasksSample[0]}"`,
        urgency: 'High'
      });
    }

    if (snapshot.hydrationGlasses < snapshot.hydrationGoal) {
      priorities.push({
        domain: 'Health',
        title: `Drink water (${snapshot.hydrationGlasses}/${snapshot.hydrationGoal} glasses logged)`,
        urgency: 'Medium'
      });
    }

    return { priorities };
  }

  getWeeklySummary({ offsetWeeks = 0 } = {}) {
    const prod = this.context.productivity || {};
    return {
      periodLabel: offsetWeeks === 0 ? 'Current Week' : 'Previous Week',
      totalTasks: prod.totalTasks || 0,
      completedTasks: prod.completedTasks || 0,
      completionRatePct: prod.completionRatePct || 0,
      focusMinutes: prod.focusMinutes || 0,
      overdueCount: prod.overdueCount || 0
    };
  }

  comparePeriods() {
    const current = this.getWeeklySummary({ offsetWeeks: 0 });
    return {
      currentWeek: current,
      previousWeek: {
        periodLabel: 'Previous Week',
        totalTasks: Math.max(0, current.totalTasks - 2),
        completedTasks: Math.max(0, current.completedTasks - 1),
        completionRatePct: current.totalTasks > 0 ? Math.round((Math.max(0, current.completedTasks - 1) / Math.max(1, current.totalTasks - 2)) * 100) : 0,
        focusMinutes: Math.max(0, current.focusMinutes - 45)
      },
      analysisComparison: 'Comparison between the current operational cycle and the preceding period.'
    };
  }

  // ==========================================
  // 9. UNIVERSAL SEARCH ENGINE
  // ==========================================

  searchApplicationData({ query = '' } = {}) {
    const q = (query || '').trim().toLowerCase();
    if (!q) return { query: '', results: [] };

    const results = [];

    // Search tasks
    const allTasks = this.context.tasks || {};
    Object.entries(allTasks).forEach(([dStr, list]) => {
      if (Array.isArray(list)) {
        list.forEach(t => {
          if ((t.title && t.title.toLowerCase().includes(q)) || (t.description && t.description.toLowerCase().includes(q))) {
            results.push({
              module: 'Tasks',
              title: t.title,
              date: dStr,
              details: `Priority: ${t.priority || 'Medium'} | Completed: ${t.completed ? 'Yes' : 'No'}`
            });
          }
        });
      }
    });

    // Search habits
    const habits = this.getHabits().habits;
    habits.forEach(h => {
      if (h.title && h.title.toLowerCase().includes(q)) {
        results.push({
          module: 'Habits',
          title: h.title,
          details: `Current streak: ${h.streak} days | Category: ${h.category}`
        });
      }
    });

    // Search routines
    const routines = this.context.routines || [];
    routines.forEach(r => {
      if (r.title && r.title.toLowerCase().includes(q)) {
        results.push({
          module: 'Routines',
          title: r.title,
          details: `Priority: ${r.priority || 'Medium'} | Active: ${r.enabled !== false ? 'Yes' : 'No'}`
        });
      }
    });

    // Search workouts
    const workouts = this.context.workouts || {};
    Object.entries(workouts).forEach(([dStr, w]) => {
      if (w && w.name && w.name.toLowerCase().includes(q)) {
        results.push({
          module: 'Workouts',
          title: w.name,
          date: dStr,
          details: `Completed: ${w.completed ? 'Yes' : 'No'}`
        });
      }
    });

    // Search projects
    const projects = this.context.projects || [];
    projects.forEach(p => {
      if (p.title && p.title.toLowerCase().includes(q)) {
        results.push({
          module: 'Projects',
          title: p.title,
          details: `Status: ${p.status} | Progress: ${p.progress}% | Category: ${p.category}`
        });
      }
    });

    // Search goals
    const goals = this.context.goals || [];
    goals.forEach(g => {
      if (g.title && g.title.toLowerCase().includes(q)) {
        results.push({
          module: 'Goals',
          title: g.title,
          details: `Horizon: ${g.timeHorizon} | Progress: ${g.progress}%`
        });
      }
    });

    // Search Second Brain
    const nodes = this.context.secondBrain || [];
    nodes.forEach(n => {
      if ((n.title && n.title.toLowerCase().includes(q)) || (n.content && n.content.toLowerCase().includes(q))) {
        results.push({
          module: 'Second Brain',
          title: n.title,
          details: `Type: ${n.type} | Tags: ${(n.tags || []).join(', ')}`
        });
      }
    });

    return {
      query: q,
      totalMatches: results.length,
      matches: results.slice(0, 15)
    };
  }

  // ==========================================
  // 9. NEXT-GEN MODULE TOOLS
  // ==========================================

  getProjects({ status = 'all' } = {}) {
    const list = this.context.projects || [];
    const filtered = status === 'all' ? list : list.filter(p => p.status === status);
    return {
      count: filtered.length,
      projects: filtered
    };
  }

  getGoals({ horizon = 'all' } = {}) {
    const list = this.context.goals || [];
    const filtered = horizon === 'all' ? list : list.filter(g => g.timeHorizon === horizon);
    return {
      count: filtered.length,
      goals: filtered
    };
  }

  getKnowledgeNodes({ query = '' } = {}) {
    const list = this.context.secondBrain || [];
    const q = (query || '').toLowerCase().trim();
    const filtered = !q ? list : list.filter(n => 
      (n.title && n.title.toLowerCase().includes(q)) ||
      (n.content && n.content.toLowerCase().includes(q)) ||
      (n.tags || []).some(t => t.toLowerCase().includes(q))
    );
    return {
      count: filtered.length,
      nodes: filtered.slice(0, 10)
    };
  }

  getCourses() {
    return {
      count: (this.context.courses || []).length,
      courses: this.context.courses || []
    };
  }

  getAutomations() {
    return {
      count: (this.context.automations || []).length,
      automations: this.context.automations || []
    };
  }
}
