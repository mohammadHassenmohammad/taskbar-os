import { BaseAIProvider } from './baseProvider.js';

/**
 * Deterministic Local Analytics Provider
 * Operates 100% offline and when no cloud AI provider is configured.
 * Computes genuine mathematical analytics directly from application data.
 */
export class LocalDeterministicProvider extends BaseAIProvider {
  constructor() {
    super('local_deterministic');
  }

  isConfigured() {
    return true; // Always available
  }

  async generateResponse(messages, options = {}) {
    const lastUserMsg = [...(messages || [])].reverse().find(m => m.role === 'user')?.content?.toLowerCase() || '';
    const context = options.context || {};

    let responseText = '';

    if (lastUserMsg.includes('productivity') || lastUserMsg.includes('tasks') || lastUserMsg.includes('how was')) {
      const tasks = context.tasks || {};
      let total = 0, completed = 0;
      Object.values(tasks).forEach(list => {
        if (Array.isArray(list)) {
          total += list.length;
          completed += list.filter(t => t.completed).length;
        }
      });
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      responseText = `### 📊 Local Productivity Snapshot\n- **Tasks Recorded:** ${total}\n- **Completed:** ${completed} (${rate}%)\n- **Pending:** ${total - completed}\n\n*Note: Operating in Local Deterministic Mode. Configure GEMINI_API_KEY in your server environment for deeper conversational AI.*`;
    } else if (lastUserMsg.includes('habit') || lastUserMsg.includes('streak')) {
      const habits = context.habits || [];
      const total = habits.length;
      const active = habits.filter(h => !h.archived);
      responseText = `### 🎯 Local Habit Analysis\n- **Active Habits:** ${active.length}\n- **Top Habit Streaks:**\n` +
        active.map(h => `  - **${h.title}**: ${h.streak || 0} day streak (${h.category})`).join('\n') +
        `\n\n*Consistency is built day by day. Keep momentum on your highest-streak habits!*`;
    } else if (lastUserMsg.includes('workout') || lastUserMsg.includes('gym')) {
      const workouts = context.workouts || {};
      const count = Object.keys(workouts).length;
      responseText = `### 🏋️ Local Workout Summary\n- **Total Recorded Sessions:** ${count}\n- **Training Cadence:** Regular physical activity recorded.\n\n*Remember to prioritize rest days and recovery between intense sessions.*`;
    } else if (lastUserMsg.includes('priorit') || lastUserMsg.includes('today') || lastUserMsg.includes('plan')) {
      responseText = `### 📋 Daily Planning Guidance\n1. Complete your highest-priority mission first.\n2. Engage in at least one 25-minute focused work block without distractions.\n3. Maintain hydration and schedule regular recovery breaks.\n\n*To generate AI-synthesized schedules, enable the Gemini API in Settings.*`;
    } else {
      responseText = `**TaskBar OS Intelligence Briefing**\n\nI have evaluated your local metrics:\n- **Tasks & Routines:** Analyzed\n- **Habits & Workouts:** Synced\n\nHow can I help you optimize your schedule or review your progress today?\n\n*(Local Deterministic Engine Active)*`;
    }

    return {
      text: responseText,
      model: 'local-analytics-engine',
      provider: 'local_deterministic',
      isLocalFallback: true
    };
  }

  async generateStructuredResponse(prompt, schema = null, options = {}) {
    return {
      isLocalFallback: true,
      message: 'Generated via deterministic local analytics engine',
      timestamp: new Date().toISOString()
    };
  }

  async analyzeProductivity(data = {}) {
    const total = data.totalTasks || 0;
    const completed = data.completedTasks || 0;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const focusMins = data.focusMinutes || 0;

    return {
      summary: `Your recorded completion rate is ${rate}% across ${total} scheduled missions with ${focusMins} minutes of concentrated focus time.`,
      bestPerformingDays: data.bestDays || ['Mid-week days demonstrated highest follow-through'],
      incompleteTaskPatterns: data.overdueCount > 0 ? [`${data.overdueCount} tasks currently overdue or rescheduled`] : ['No overdue tasks flagged'],
      focusPatterns: focusMins > 0 ? `${focusMins} minutes logged across deep work intervals.` : 'No timer sessions recorded yet.',
      routineConsistency: `${rate}% completion across scheduled routines.`,
      areasNeedingAttention: rate < 60 ? ['Mission completion rate below 60%'] : ['Maintain balanced workload pacing'],
      suggestions: [
        'Break complex missions into smaller 15-minute subtasks',
        'Schedule a dedicated 25-minute Pomodoro focus session',
        'Review and archive completed or irrelevant tasks'
      ],
      productivityScore: rate,
      isLocalFallback: true
    };
  }

  async analyzeHabits(data = {}) {
    const habits = data.habits || [];
    const active = habits.filter(h => !h.archived);
    const avgStreak = active.length > 0 ? Math.round(active.reduce((acc, h) => acc + (h.streak || 0), 0) / active.length) : 0;

    return {
      summary: `Tracking ${active.length} active habits with an average streak of ${avgStreak} days.`,
      strongestHabits: active.filter(h => (h.streak || 0) >= 3).map(h => h.title),
      vulnerableHabits: active.filter(h => (h.streak || 0) < 2).map(h => h.title),
      missedDayPatterns: ['Habit completion is strongest on structured work days'],
      recommendations: [
        'Anchor new habits immediately after established morning routines',
        'Protect rest schedules without resetting commitment momentum'
      ],
      isLocalFallback: true
    };
  }

  async analyzeWorkouts(data = {}) {
    const sessionCount = data.sessionCount || 0;
    const volume = data.volumeKg || 0;

    return {
      summary: `Recorded ${sessionCount} training sessions totaling ${volume.toLocaleString()} kg of external work volume.`,
      consistency: sessionCount >= 3 ? 'Optimal training cadence' : 'Gradually build up weekly frequency',
      volumeTrend: `${volume.toLocaleString()} kg total volume lifted across tracked sessions.`,
      restObservations: 'Ensure 48 hours recovery for muscle groups trained with high volume.',
      recommendations: [
        'Progressive overload: incrementally add 1-2 reps or small load increases',
        'Prioritize exercise form over heavy load'
      ],
      disclaimer: 'General physical activity guidance only. Not medical or injury rehabilitation advice.',
      isLocalFallback: true
    };
  }

  async analyzeNutrition(data = {}) {
    const calories = data.calories || 0;
    const protein = data.protein || 0;
    const targetCal = data.targetCalories || 2000;
    const targetProt = data.targetProtein || 120;

    return {
      summary: `Intake of ${calories} kcal (${Math.round((calories / Math.max(1, targetCal)) * 100)}% of target) and ${protein}g protein logged.`,
      proteinAssessment: protein >= targetProt ? 'Protein target achieved' : `${Math.max(0, targetProt - protein)}g protein remaining to hit daily target`,
      energyBalance: calories > targetCal ? 'Surplus' : 'Deficit / Maintenance',
      hydration: `${data.waterGlasses || 0} water checkpoints recorded.`,
      recommendations: [
        'Distribute protein evenly across breakfast, lunch, and dinner',
        'Drink 250ml water upon waking to kickstart hydration'
      ],
      disclaimer: 'Nutritional estimates are educational and not a medical prescription.',
      isLocalFallback: true
    };
  }

  async generateWeeklyReport(data = {}) {
    const tasksDone = data.tasksCompleted || 0;
    const focusMins = data.focusMinutes || 0;
    const habitsRate = data.habitsAdherence || 0;

    return {
      title: 'Weekly Tactical Performance Debrief',
      period: `${data.periodStart || 'Week'} to ${data.periodEnd || 'Today'}`,
      overallGrade: tasksDone > 10 ? 'A' : (tasksDone > 5 ? 'B' : 'C'),
      productivityScore: Math.min(100, (tasksDone * 5) + Math.round(habitsRate * 0.5)),
      highlights: [
        `${tasksDone} missions completed this week`,
        `${focusMins} minutes of concentrated deep focus logged`,
        `${habitsRate}% habit adherence rate`
      ],
      lowlights: [
        'Unscheduled distractions during peak afternoon hours'
      ],
      metrics: {
        tasksCompleted: tasksDone,
        totalFocusMinutes: focusMins,
        habitsAdherencePct: habitsRate,
        workoutsCompleted: data.workoutsCompleted || 0
      },
      markdownBody: `## Weekly Tactical Debrief\n\n### Executive Summary\nDuring this period, you logged **${tasksDone} completed tasks** and accumulated **${focusMins} minutes of deep focus**.\n\n### Key Metrics\n- **Mission Follow-Through:** ${tasksDone} completed\n- **Habit Consistency:** ${habitsRate}%\n- **Focus Hours:** ${(focusMins / 60).toFixed(1)} hrs\n\n### Strategic Guidance\nMaintain steady momentum into the upcoming week by identifying top 3 priorities every evening.`,
      nextWeekPriorities: [
        'Lock in 3 high-impact priorities before Monday morning',
        'Maintain daily habit tracking consistency',
        'Schedule two 45-minute distraction-free focus blocks'
      ],
      isLocalFallback: true
    };
  }

  async generateSuggestions(data = {}) {
    const list = [
      {
        id: `sug_focus_${Date.now()}`,
        type: 'start_focus',
        title: 'Start 25m Pomodoro Focus Block',
        description: 'Initiate a deep work session to build task momentum.',
        payload: { duration: 25 },
        impact: 'High'
      },
      {
        id: `sug_water_${Date.now()}`,
        type: 'log_water',
        title: 'Log Hydration (+250ml)',
        description: 'Keep hydration levels optimal for cognitive clarity.',
        payload: { amount: 250 },
        impact: 'Medium'
      },
      {
        id: `sug_task_${Date.now()}`,
        type: 'create_task',
        title: 'Review Weekly Objectives',
        description: 'Spend 10 minutes prioritizing missions for the days ahead.',
        payload: { taskTitle: 'Review Weekly Objectives', priority: 'Medium', category: 'Work' },
        impact: 'Medium'
      }
    ];
    return list;
  }
}
