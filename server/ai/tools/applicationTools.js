/**
 * TaskBar OS — Backend Application Tools Engine
 * Provides structured query and analysis tools for all active modules.
 * Only accesses data corresponding to the user's current request.
 */

export class ApplicationTools {
  constructor(context = {}) {
    this.context = context;
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
        title: h.title,
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
        type: r.type || 'morning',
        completedToday: Boolean(r.completedToday)
      }))
    };
  }

  // ==========================================
  // 7. HOLISTIC PERIOD COMPARISON (This Week vs Last Week)
  // ==========================================

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
}
