import { BaseAIProvider } from './baseProvider.js';

/**
 * Deterministic Local Analytics & Conversational Companion Provider
 * Operates 100% offline and serves as an intelligent, responsive fallback
 * when cloud AI is rate-limited or unconfigured.
 */
export class LocalDeterministicProvider extends BaseAIProvider {
  constructor() {
    super('local_deterministic');
  }

  isConfigured() {
    return true; // Always available
  }

  async generateResponse(messages, options = {}) {
    const lastUserMsg = [...(messages || [])].reverse().find(m => m.role === 'user')?.content?.trim() || '';
    const lower = lastUserMsg.toLowerCase();
    const mode = options.mode || 'normal';
    const context = options.context || {};
    const todayStr = context.today || new Date().toISOString().split('T')[0];

    let responseText = '';

    // 1. Identity & Name
    if (lower.match(/^(what is your name|who are you|what's your name|tell me about yourself|introduce yourself)/i)) {
      responseText = `I am **TaskBar OS Companion**, your personal productivity architect and wellness co-pilot.

I am built directly into TaskBar OS to help you:
- Track and prioritize your daily tasks and missions.
- Monitor habit streaks and weekly consistency.
- Analyze gym workout volume and training recovery.
- Structure realistic focus intervals and daily schedules.

*(Currently operating via Local Deterministic Engine while cloud quota resets).*`;
    }
    // 2. Greetings
    else if (lower.match(/^(hi|hello|hey|greetings|good morning|good afternoon|good evening|yo|howdy|sup)\b/i)) {
      const todayTasks = (context.todayTasks || []).filter(t => !t.completed);
      const pendingCount = todayTasks.length;
      
      if (mode === 'friendly') {
        responseText = `Hey there! Great to see you. You currently have **${pendingCount} pending task${pendingCount === 1 ? '' : 's'}** scheduled for today. How can I help you make today awesome?`;
      } else if (mode === 'coach') {
        responseText = `Greetings, Operative. Status check: **${pendingCount} pending missions** awaiting execution today. What is your primary target for this block?`;
      } else if (mode === 'concise') {
        responseText = `Hello. ${pendingCount} pending tasks today. Ready for your command.`;
      } else {
        responseText = `Hello! I'm here and ready to help. You have **${pendingCount} pending task${pendingCount === 1 ? '' : 's'}** scheduled for today. What would you like to focus on or review?`;
      }
    }
    // 3. Emotional distress & Empathy ("bad day", "wasted time", "tired", "unmotivated")
    else if (lower.match(/(wasted|bad day|tough day|unproductive|tired|exhausted|burnout|stressed|frustrated|lazy|depressed|overwhelmed|struggling)/i)) {
      if (mode === 'emotional_support' || mode === 'normal' || mode === 'friendly') {
        responseText = `That sounds like a genuinely exhausting day, and it's completely okay to feel that way.

One slow or difficult day does **not** erase the consistency and progress you've built. Energy naturally fluctuates, and trying to force peak output when you're drained only leads to deeper burnout.

Take a breath, step away from screens for a bit, drink some water, and rest. If you'd like, we can pick just **one** tiny, low-friction task for tomorrow, or simply close out the day without any guilt.`;
      } else if (mode === 'motivation') {
        responseText = `Friction is part of every high-performance journey. The key isn't never having a bad day—it's how you reset afterwards.

Forgive today. Log off, get a solid night of rest, and tomorrow morning we start fresh with a single high-impact win.`;
      } else {
        responseText = `Understood. Difficult periods happen. Prioritize rest and recovery right now so you can reset effectively tomorrow.`;
      }
    }
    // 4. Well-being & Small talk
    else if (lower.match(/^(how are you|how's it going|how are things|are you okay)/i)) {
      responseText = `I'm operating at peak efficiency! All your TaskBar OS data engines are synced and monitored. How are you feeling today?`;
    }
    // 5. Gratitude
    else if (lower.match(/(thank you|thanks|thx|appreciate it|awesome|great job)/i)) {
      responseText = `You're very welcome! I'm always in your corner to keep your momentum strong. Let me know whenever you need anything else.`;
    }
    // 6. Productivity & Task Analysis
    else if (lower.includes('productivity') || lower.includes('task') || lower.includes('how was') || lower.includes('progress')) {
      const prod = context.productivity || {};
      const tasks = context.tasks || {};
      let total = prod.totalTasks || 0;
      let completed = prod.completedTasks || 0;
      
      if (total === 0 && Object.keys(tasks).length > 0) {
        Object.values(tasks).forEach(list => {
          if (Array.isArray(list)) {
            total += list.length;
            completed += list.filter(t => t.completed).length;
          }
        });
      }

      const rate = total > 0 ? Math.round((completed / total) * 100) : (prod.completionRatePct || 0);
      const overdue = prod.overdueCount || 0;
      const focusMins = prod.focusMinutes || 0;

      responseText = `### 📊 Local Productivity Snapshot\n- **Tasks Recorded:** ${total}\n- **Completed:** ${completed} (${rate}%)\n- **Pending:** ${total - completed}\n- **Focus Time Recorded:** ${focusMins} minutes\n\n${overdue > 0 ? `⚠️ *You have ${overdue} overdue task${overdue === 1 ? '' : 's'}. Consider clearing or rescheduling them to reduce cognitive drag.*` : `✅ *Zero overdue tasks recorded. High tactical cadence!*`}`;
    }
    // 7. Habits & Streaks
    else if (lower.includes('habit') || lower.includes('streak') || lower.includes('consistency')) {
      const habitsList = Array.isArray(context.habits) ? context.habits : (context.habits?.habits || []);
      const activeCount = habitsList.length;
      const loggedToday = habitsList.filter(h => h.completedToday).length;

      responseText = `### 🎯 Measured Habit Tracker Analysis
- **Active Tracked Habits:** ${activeCount}
- **Logged Today:** ${loggedToday} / ${activeCount}

**Current Streaks:**
${habitsList.map(h => `- **${h.title}**: ${h.streak || 0} day streak ${h.completedToday ? '✅' : '⏳'}`).join('\n') || '- *No active habits logged yet.*'}

*Tip: Habit stacking (pairing a new habit immediately after an existing one) significantly boosts 30-day retention.*`;
    }
    // 8. Workouts & Fitness
    else if (lower.includes('workout') || lower.includes('gym') || lower.includes('training') || lower.includes('exercise')) {
      const workoutData = context.workouts || {};
      const sessions = workoutData.sessionCount || Object.keys(workoutData).length || 0;
      const volume = workoutData.totalVolumeKg || 0;

      responseText = `### 🏋️ Measured Workout & Volume Debrief
- **Sessions Completed:** ${sessions}
- **Total External Volume Moved:** ${volume.toLocaleString()} kg

${sessions > 0 ? `Consistent resistance training stimulates neuroplasticity and elevates sustained focus. Ensure adequate protein and 7-8 hours of sleep for recovery.` : `No completed workouts recorded in the past 14 days. Even a brisk 20-minute walk or bodyweight circuit will jumpstart energy levels!`}`;
    }
    // 9. Diet & Nutrition
    else if (lower.includes('diet') || lower.includes('food') || lower.includes('nutrition') || lower.includes('calories') || lower.includes('protein')) {
      const diet = context.nutrition || {};
      responseText = `### 🥗 Measured Nutrition Summary
- **Average Daily Calories:** ${diet.avgCalories || 0} kcal (Target: ${diet.targetCalories || 2000})
- **Average Daily Protein:** ${diet.avgProtein || 0} g (Target: ${diet.targetProtein || 120} g)
- **Tracked Days:** ${diet.loggedDays || 0} in window

*Nutrition note: Aim for consistent hydration throughout deep work blocks to prevent midday cognitive fatigue.*`;
    }
    // 10. Prioritization & Planning
    else if (lower.includes('priorit') || lower.includes('today') || lower.includes('plan') || lower.includes('schedule') || lower.includes('what should i do')) {
      const todayTasks = context.todayTasks || [];
      const pending = todayTasks.filter(t => !t.completed);
      const highPriority = pending.filter(t => t.priority === 'High');

      responseText = `### 📋 Daily Tactical Planning Protocol
1. **High Priority Target:** ${highPriority.length > 0 ? `Focus on **"${highPriority[0].title}"** first.` : pending.length > 0 ? `Tackle **"${pending[0].title}"** to build early momentum.` : 'All today tasks completed! Review tomorrow or recharge.'}
2. **Deep Work Cadence:** Run one 25-minute Pomodoro session with phone and notifications silenced.
3. **Recovery Buffer:** Schedule a 5-minute hydration and mobility break after every completed block.

${pending.length > 0 ? `*You have ${pending.length} pending task${pending.length === 1 ? '' : 's'} remaining for today.*` : `*All targets completed. Outstanding execution!*`}`;
    }
    // 11. Conversational Fallback
    else {
      responseText = `I understand you're asking about: "${lastUserMsg}".

As your TaskBar OS Companion, I can analyze your metrics, suggest priorities, breakdown large goals, or help you structure your schedule. 

What area of your productivity or routine would you like to review next?`;
    }

    return {
      text: responseText,
      model: 'local-companion-engine',
      provider: 'local_deterministic',
      mode,
      isLocalFallback: true
    };
  }

  async generateStreamResponse(messages, options = {}, onChunk = () => {}) {
    const res = await this.generateResponse(messages, options);
    const words = res.text.split(' ');
    for (let i = 0; i < words.length; i++) {
      const chunk = (i === 0 ? '' : ' ') + words[i];
      onChunk(chunk);
    }
    return res;
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

    let grade = 'B';
    if (rate >= 85 && focusMins >= 120) grade = 'A+';
    else if (rate >= 70) grade = 'A';
    else if (rate < 50) grade = 'C';

    return {
      grade,
      score: Math.min(100, Math.round(rate * 0.7 + (focusMins / 60) * 10)),
      summary: `You achieved a ${rate}% completion rate across ${total} recorded missions with ${focusMins} minutes of concentrated focus.`,
      strengths: [
        `${completed} completed missions logged during this cycle`,
        `${focusMins} minutes dedicated to distraction-free focus blocks`
      ],
      growthAreas: [
        total - completed > 0 ? `Clear ${total - completed} pending tasks to avoid backlog accumulation` : 'Maintain current high velocity'
      ],
      recommendations: [
        'Lock in your single highest-priority task every morning before checking incoming messages',
        'Use 25-minute Pomodoro sessions to lower task entry friction'
      ],
      isLocalFallback: true
    };
  }

  async analyzeHabits(data = {}) {
    const habits = Array.isArray(data.habits) ? data.habits : (data.habits?.habits || (Array.isArray(data) ? data : []));
    const count = habits.length;
    const maxStreak = habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);
    const strongest = habits.map(h => h.title || h.name || '');

    return {
      consistencyScore: Math.min(100, count * 15 + maxStreak * 5),
      activeStreaksCount: habits.filter(h => (h.streak || 0) > 0).length,
      longestActiveStreak: maxStreak,
      summary: `Tracking ${count} active habits with a top streak of ${maxStreak} consecutive days.`,
      strongestHabits: strongest,
      topPerformingHabits: habits.filter(h => (h.streak || 0) >= 3).map(h => h.title || h.name),
      atRiskHabits: habits.filter(h => (h.streak || 0) === 0).map(h => h.title || h.name),
      coachingTip: 'Focus on streak continuity over perfection—never miss twice in a row.',
      isLocalFallback: true
    };
  }

  async analyzeWorkouts(data = {}) {
    const sessions = data.sessionCount || 0;
    const volume = data.volumeKg || data.totalVolumeKg || 0;

    return {
      weeklyVolumeKg: volume,
      completedSessions: sessions,
      volumeTrend: `Total volume moved: ${volume.toLocaleString()} kg`,
      summary: `Logged ${sessions} training sessions with an aggregate mechanical workload of ${volume.toLocaleString()} kg.`,
      strongestLift: 'Consistent compound progression',
      recoveryAdvice: 'Ensure 8 hours of sleep and high hydration following heavy training days.',
      disclaimer: 'Not medical advice. Fitness analysis is educational only.',
      isLocalFallback: true
    };
  }

  async analyzeNutrition(data = {}) {
    const calories = data.calories || data.avgCalories || 0;
    const protein = data.protein || data.avgProtein || 0;
    const targetProt = data.targetProtein || 120;

    return {
      avgDailyCalories: calories,
      avgDailyProteinGrams: protein,
      proteinAssessment: protein >= targetProt ? 'Protein target achieved' : 'Under protein target',
      summary: `Recorded daily averages of ${calories} kcal and ${protein}g of protein.`,
      status: calories > 0 ? 'On Track' : 'Awaiting More Logs',
      dietaryAdvice: 'Prioritize whole protein sources and adequate dietary fiber across all meals.',
      disclaimer: 'Nutrition guidelines are educational only. Never adopt extreme dietary restrictions without medical supervision.',
      isLocalFallback: true
    };
  }

  async generateWeeklyReport(data = {}) {
    const metrics = data.productivityMetrics || {};
    const tasksDone = data.tasksCompleted !== undefined ? data.tasksCompleted : (metrics.tasksCompleted || 0);
    const focusMins = data.focusMinutes !== undefined ? data.focusMinutes : (metrics.focusMinutes || 0);
    const habitsRate = data.habitsAdherence !== undefined ? data.habitsAdherence : (metrics.habitsLogged || 0);

    return {
      overallGrade: tasksDone >= 14 ? 'A' : 'B',
      weekLabel: `Review Period (${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`,
      overallScore: Math.min(100, Math.round(tasksDone * 5 + (focusMins / 60) * 10)),
      headline: `Solid momentum logged with ${tasksDone} completed tasks and ${focusMins} focus minutes.`,
      keyAccomplishments: [
        `Executed ${tasksDone} operational tasks`,
        `Accumulated ${(focusMins / 60).toFixed(1)} hours of deep focus time`,
        'Consistent daily logging maintained'
      ],
      metrics: {
        totalFocusMinutes: focusMins,
        tasksCompleted: tasksDone
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
