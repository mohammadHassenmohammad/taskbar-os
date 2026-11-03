import { ApplicationTools } from './tools/applicationTools.js';

/**
 * JARVIS Conversational Orchestrator & Intent Engine
 * Dynamically resolves intent, selects relevant data tools,
 * and composes contextual prompts for natural dialogue.
 */

export const INTENT_TYPES = {
  GREETING: 'GREETING',
  CASUAL: 'CASUAL',
  GENERAL_KNOWLEDGE: 'GENERAL_KNOWLEDGE',
  EMOTIONAL_SUPPORT: 'EMOTIONAL_SUPPORT',
  MOTIVATION: 'MOTIVATION',
  ACTION_COMMAND: 'ACTION_COMMAND',
  PRODUCTIVITY_CURRENT: 'PRODUCTIVITY_CURRENT',
  PRODUCTIVITY_PREVIOUS: 'PRODUCTIVITY_PREVIOUS',
  PRODUCTIVITY_COMPARE: 'PRODUCTIVITY_COMPARE',
  SUGGESTION_IMPROVEMENT: 'SUGGESTION_IMPROVEMENT',
  TASKS_QUERY: 'TASKS_QUERY',
  HABITS_QUERY: 'HABITS_QUERY',
  WORKOUTS_QUERY: 'WORKOUTS_QUERY',
  DIET_QUERY: 'DIET_QUERY',
  FOCUS_QUERY: 'FOCUS_QUERY',
  ROUTINES_QUERY: 'ROUTINES_QUERY',
  WELLNESS_QUERY: 'WELLNESS_QUERY',
  SEARCH_QUERY: 'SEARCH_QUERY',
  CROSS_MODULE_SYNTHESIS: 'CROSS_MODULE_SYNTHESIS',
  PLANNING: 'PLANNING',
  GENERAL_CONVERSATION: 'GENERAL_CONVERSATION'
};

export function classifyIntent(userText = '', recentHistory = []) {
  const text = (userText || '').trim().toLowerCase();
  const lastAssistantMsg = [...recentHistory].reverse().find(m => m.role === 'assistant')?.content?.toLowerCase() || '';

  // 1. Simple Greetings (exact or start of line)
  if (text.match(/^(hi|hello|hey|greetings|howdy|sup|yo|good morning|good evening|good afternoon)[\s!?.]*$/i)) {
    return INTENT_TYPES.GREETING;
  }

  // 2. Casual / Status Questions
  if (text.match(/^(what are you doing|what's up|how are you|how's it going|nice|cool|awesome|great|what|ok|okay)[\s!?.]*$/i)) {
    return INTENT_TYPES.CASUAL;
  }

  // 3. Emotional distress & Empathy
  if (text.match(/(difficult day|bad day|tough day|wasted|unproductive day|burnout|exhausted|tired|stressed|overwhelmed|depressed|unmotivated|feeling down|struggling)/i)) {
    return INTENT_TYPES.EMOTIONAL_SUPPORT;
  }

  // 4. Motivation
  if (text.match(/(motivate me|inspire me|need a push|give me energy|pep talk|puck up)/i)) {
    return INTENT_TYPES.MOTIVATION;
  }

  // 5. General Knowledge & Technical Explanations (when not asking about "my" application data)
  if (text.match(/^(explain|what is|what are|how does|how do|why is|why does|tell me about|who was|who is|write|code|debug|joke)\b/i) &&
      !text.match(/\b(my|today|week|schedule|tasks?|habits?|workouts?|diet)\b/i)) {
    return INTENT_TYPES.GENERAL_KNOWLEDGE;
  }

  // 6. Action Execution Commands (create, complete, delete, start focus, log water, notes)
  if (text.match(/\b(create|add|schedule|log|start|begin|complete|finish|mark|check off|delete|remove|reschedule|move|write|take|save)\s+(task|habit|routine|note|notes|thought|food|meal|workout|focus|water|sleep|steps|session)\b/i) ||
      text.match(/\b(note\s+down|take\s+note|take\s+a\s+note|add\s+note|add\s+notes|write\s+note|save\s+note|quick\s+note)\b/i) ||
      text.match(/\b(drink|log)\s+\d+\s*(glasses|ml|liters|cups)?\s*(of\s+)?(water)?/i) ||
      text.match(/\b(start|begin)\s+(\d+)\s*(min|minute|mins)?\s*(focus|pomodoro|timer)/i)) {
    return INTENT_TYPES.ACTION_COMMAND;
  }

  // 7. Universal Search
  if (text.match(/^(find|search for|look for|where is|did i log|search)\b/i)) {
    return INTENT_TYPES.SEARCH_QUERY;
  }

  // 7. Holistic Cross-Module / Daily Overview
  if (text.match(/(what should i work on today|what should i do today|how does my day look|how is my day looking|daily overview|summary of today|breakdown of today)/i)) {
    return INTENT_TYPES.CROSS_MODULE_SYNTHESIS;
  }

  // 8. Contextual Follow-up Comparisons (e.g. "what about last week?", "compare them", "what should I improve?")
  if (text.includes('last week') || text.includes('previous week') || text.includes('what about yesterday')) {
    return INTENT_TYPES.PRODUCTIVITY_PREVIOUS;
  }
  if (text.match(/^(compare them|compare both|how do they compare|comparison)/i) || 
     (text.includes('compare') && (lastAssistantMsg.includes('week') || lastAssistantMsg.includes('tasks')))) {
    return INTENT_TYPES.PRODUCTIVITY_COMPARE;
  }
  if (text.match(/(what should i improve|how can i improve|where did i drop|what can i do better)/i)) {
    return INTENT_TYPES.SUGGESTION_IMPROVEMENT;
  }

  // 9. Productivity & Progress
  if (text.includes('productivity') || (text.includes('how was') && (text.includes('week') || text.includes('progress')))) {
    return INTENT_TYPES.PRODUCTIVITY_CURRENT;
  }

  // 10. Wellness, Hydration, Sleep, Steps
  if (text.match(/\b(water|hydration|hydrate|sleep|sleeping|rest|steps|walking|walked|mood|energy)\b/i)) {
    return INTENT_TYPES.WELLNESS_QUERY;
  }

  // 11. Routines & Morning Protocols
  if (text.match(/\b(routine|routines|protocol|protocols|morning ritual|evening ritual)\b/i)) {
    return INTENT_TYPES.ROUTINES_QUERY;
  }

  // 12. Tasks & Prioritization
  if (text.match(/\b(tasks?|prioritize|priority|priorities|overdue|to-do|todo|todos)\b/i) || text.includes('what should i work on')) {
    return INTENT_TYPES.TASKS_QUERY;
  }

  // 13. Habits & Streaks
  if (text.match(/\b(habits?|streaks?|consistency)\b/i)) {
    return INTENT_TYPES.HABITS_QUERY;
  }

  // 14. Workouts & Gym
  if (text.match(/\b(workouts?|gym|training|exercise|exercises|lift|lifting|prs?|personal records?)\b/i)) {
    return INTENT_TYPES.WORKOUTS_QUERY;
  }

  // 15. Diet & Nutrition
  if (text.match(/\b(diet|food|foods|eat|eating|nutrition|calories?|protein|macro|macros)\b/i)) {
    return INTENT_TYPES.DIET_QUERY;
  }

  // 16. Focus & Pomodoro
  if (text.match(/\b(focus|pomodoro|deep work)\b/i)) {
    return INTENT_TYPES.FOCUS_QUERY;
  }

  // 17. Planning
  if (text.includes('plan tomorrow') || text.includes('daily plan') || text.includes('schedule tomorrow') || text.includes('plan my day')) {
    return INTENT_TYPES.PLANNING;
  }

  // 18. General Knowledge fallback
  if (text.match(/^(explain|what is|what are|how does|how do|why is|why does|tell me about|who was|write|code|debug|joke)/i)) {
    return INTENT_TYPES.GENERAL_KNOWLEDGE;
  }

  return INTENT_TYPES.GENERAL_CONVERSATION;
}

/**
 * Builds the contextual prompt and retrieves relevant application data
 */
export function orchestrateConversation({ messages = [], context = {}, preferences = {} }) {
  const tools = new ApplicationTools(context);
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';
  const recentHistory = messages.slice(-6);
  const intent = classifyIntent(lastUserMsg, recentHistory);

  let retrievedData = null;
  let responseStyleGuidance = '';

  switch (intent) {
    case INTENT_TYPES.GREETING:
      responseStyleGuidance = `The user is simply greeting you. Reply with a warm, natural, friendly greeting like a sophisticated personal assistant (e.g., "Hey! What's on your mind today?" or "Hello! Ready when you are."). Do NOT present a productivity dashboard or statistics.`;
      break;

    case INTENT_TYPES.CASUAL:
      responseStyleGuidance = `Casual social check-in. Reply naturally, casually and concisely. If they ask "what are you doing?", say you're right here and ready to help with their day or projects. Keep it conversational.`;
      break;

    case INTENT_TYPES.GENERAL_KNOWLEDGE:
      responseStyleGuidance = `The user is asking a general knowledge, educational, or technical question (not related to TaskBar OS data). Answer their question thoroughly, clearly, and accurately. If explaining code or concepts, provide intuitive examples. Do NOT mention productivity metrics.`;
      break;

    case INTENT_TYPES.EMOTIONAL_SUPPORT:
      responseStyleGuidance = `The user is feeling tired, stressed, unmotivated, or had a difficult day. Respond with genuine empathy, patience, and warmth. Acknowledge that bad days happen and do NOT push a productivity report or force immediate tasks. Validate their experience.`;
      break;

    case INTENT_TYPES.MOTIVATION:
      responseStyleGuidance = `The user is asking for motivation. Deliver genuine, constructive, and grounded encouragement. Focus on starting small and building momentum. Avoid toxic positivity or hollow clichés.`;
      break;

    case INTENT_TYPES.CROSS_MODULE_SYNTHESIS:
      retrievedData = {
        snapshot: tools.getDailySnapshot({ date: tools.today }),
        priorities: tools.getTodayPriorities({ date: tools.today }),
        pendingTasks: tools.getPendingTasks({ date: tools.today }),
        workout: tools.getWorkoutDetails({ date: tools.today }),
        routines: tools.getRoutines()
      };
      responseStyleGuidance = `Synthesize their complete operational day across Tasks, Workouts, Routines, and Hydration into an encouraging, structured, and realistic timeline. Recommend their #1 priority first.`;
      break;

    case INTENT_TYPES.SEARCH_QUERY:
      const cleanSearchQuery = lastUserMsg.replace(/^(find|search for|look for|where is|search)\s+/i, '').trim();
      retrievedData = tools.searchApplicationData({ query: cleanSearchQuery });
      responseStyleGuidance = `The user searched for "${cleanSearchQuery}". Present the matching tasks, habits, workouts, or routines found in their records clearly.`;
      break;

    case INTENT_TYPES.ACTION_COMMAND:
      retrievedData = {
        pendingTasks: tools.getPendingTasks({ date: tools.today }),
        habits: tools.getHabits(),
        routines: tools.getRoutines()
      };
      responseStyleGuidance = `The user is issuing an action command to create, complete, update, delete, or log an item. Confirm what you are doing in an articulate, efficient manner and output the corresponding action proposal syntax (e.g. 'Create task: "..."', 'Complete task: "..."', 'Delete task: "..."', 'Start focus session: ... mins', 'Log water: ... glasses', 'Mark habit complete: "..."') so the application can execute it with 1-click or confirmation.`;
      break;

    case INTENT_TYPES.WELLNESS_QUERY:
      retrievedData = {
        hydration: tools.getHydrationStats({ date: tools.today }),
        sleep: tools.getSleepLogs({ days: 7 }),
        walking: tools.getWalkingActivity({ date: tools.today })
      };
      responseStyleGuidance = `Discuss their hydration, sleep, or physical activity metrics. Provide actionable, supportive recovery or wellness advice.`;
      break;

    case INTENT_TYPES.ROUTINES_QUERY:
      retrievedData = {
        routines: tools.getRoutines(),
        stats: tools.getRoutineStats()
      };
      responseStyleGuidance = `Review their routine protocols and morning/evening habits. Emphasize consistency.`;
      break;

    case INTENT_TYPES.PRODUCTIVITY_CURRENT:
      retrievedData = tools.getWeeklySummary({ offsetWeeks: 0 });
      responseStyleGuidance = `Provide an articulate, evidence-grounded analysis of their productivity using the retrieved weekly metrics. Cite exact figures, completion percentages, and focus hours.`;
      break;

    case INTENT_TYPES.PRODUCTIVITY_PREVIOUS:
      retrievedData = tools.getWeeklySummary({ offsetWeeks: -1 });
      responseStyleGuidance = `The user is asking about the previous week. Present the metrics for the previous week clearly and invite comparison if desired.`;
      break;

    case INTENT_TYPES.PRODUCTIVITY_COMPARE:
      retrievedData = tools.comparePeriods();
      responseStyleGuidance = `Compare the current week against the previous period. Highlight shifts in completed tasks, completion percentage, and focus hours. Offer practical takeaways based on the comparison.`;
      break;

    case INTENT_TYPES.SUGGESTION_IMPROVEMENT:
      retrievedData = {
        stats: tools.getTaskStatistics(),
        overdue: tools.getOverdueTasks(),
        habits: tools.getHabitStreaks()
      };
      responseStyleGuidance = `Based on the comparative trends and current overdue/pending tasks, provide 2-3 specific, high-leverage tactical suggestions for improvement.`;
      break;

    case INTENT_TYPES.TASKS_QUERY:
      retrievedData = {
        pendingToday: tools.getPendingTasks({ date: tools.today }),
        overdue: tools.getOverdueTasks(),
        stats: tools.getTaskStatistics()
      };
      responseStyleGuidance = `Review the user's actual tasks. If they ask what to prioritize, recommend an optimal sequence starting with the highest-priority mission. Always use real task titles.`;
      break;

    case INTENT_TYPES.HABITS_QUERY:
      retrievedData = tools.getHabitStreaks();
      responseStyleGuidance = `Summarize their habit streaks, celebrate ongoing consistency, and highlight any habit at risk.`;
      break;

    case INTENT_TYPES.WORKOUTS_QUERY:
      retrievedData = {
        todayWorkout: tools.getWorkoutDetails({ date: tools.today }),
        history: tools.getWorkoutHistory({ days: 14 }),
        prs: tools.getPersonalRecords()
      };
      responseStyleGuidance = `Summarize their workout sessions and total external volume moved. Offer recovery advice if training frequency is high.`;
      break;

    case INTENT_TYPES.DIET_QUERY:
      retrievedData = {
        todayMeals: tools.getFoodEntries({ date: tools.today }),
        stats: tools.getNutritionStatistics(),
        goals: tools.getDietGoals()
      };
      responseStyleGuidance = `Summarize daily caloric and protein averages against their targets.`;
      break;

    case INTENT_TYPES.FOCUS_QUERY:
      retrievedData = {
        stats: tools.getFocusStatistics(),
        pomodoro: tools.getPomodoroState()
      };
      responseStyleGuidance = `Summarize their focus time and Pomodoro history.`;
      break;

    case INTENT_TYPES.PLANNING:
      retrievedData = {
        todayTasks: tools.getPendingTasks({ date: tools.today }),
        habits: tools.getHabits(),
        workout: tools.getWorkoutDetails({ date: tools.today })
      };
      responseStyleGuidance = `Help structure a realistic, high-impact schedule for the day. Recommend focus blocks and recovery intervals.`;
      break;

    default:
      responseStyleGuidance = `Respond naturally, intelligently, and contextually to the user's message. Only cite TaskBar OS metrics if relevant to their inquiry.`;
  }

  const systemPrompt = `You are JARVIS for TaskBar OS — an articulate, highly capable, witty, and thoughtful personal AI companion.
You communicate naturally and intelligently like an exceptional colleague.

CRITICAL DIRECTIVES:
1. NEVER output robotic system headings like "TaskBar OS Intelligence Briefing" or "I have evaluated your local metrics".
2. NEVER say "As an AI language model..." or repeat "As your TaskBar OS Companion...".
3. For greetings, casual questions, and general conversation, reply NATURALLY and CONCISELY. Do not dump database stats.
4. For technical, educational, or general knowledge questions (e.g. programming, science, history), explain thoroughly and accurately with clean markdown.
5. For emotional conversations (tired, burnout, bad day), listen with deep empathy and patience before offering advice.
6. When answering questions about the user's productivity, tasks, habits, workouts, or diet, use the provided RETRIEVED APPLICATION DATA below. Never invent fictional numbers.
7. Understand conversational references ("that", "it", "last week", "compare them", "what about yesterday") from the recent chat history.
8. AUTONOMOUS ACTIONS & COMMANDS: You have full authority to propose and execute actions across TaskBar OS on the user's behalf. When the user gives an operational instruction or when recommending an action:
- To create a task: include \`Create task: "<Task Title>"\` on its own line.
- To complete a task: include \`Complete task: "<Task Title>"\` on its own line.
- To delete a task: include \`Delete task: "<Task Title>"\` on its own line.
- To add a note: include \`Add note: "<Note Content>"\` on its own line.
- To delete a note: include \`Delete note: "<Note Content>"\` on its own line.
- To create a routine: include \`Create routine: "<Routine Title>"\` on its own line.
- To delete a routine: include \`Delete routine: "<Routine Title>"\` on its own line.
- To create a habit: include \`Create habit: "<Habit Name>"\` on its own line.
- To delete a habit: include \`Delete habit: "<Habit Name>"\` on its own line.
- To start a focus block: include \`Start focus session: <minutes> mins\` on its own line.
- To log hydration: include \`Log water: <amount> glasses\` on its own line.
- To mark habit complete: include \`Mark habit complete: "<Habit Name>"\` on its own line.
The application engine renders an interactive action card allowing the user to approve and execute it with one click.
CRITICAL DIRECTIVE: A NOTE is NOT a TASK. When a user asks to add or save a note (e.g. "add note 'fayaz'"), NEVER create a task for it. Always output \`Add note: "<Content>"\`.
When creating items with customizable options (routines, tasks, habits), the UI embeds interactive selection chips (Domain, Priority, Frequency, Time) so the user can directly configure fields before approving.

${responseStyleGuidance ? `STYLE & INTENT GUIDANCE:\n${responseStyleGuidance}\n` : ''}
${retrievedData ? `RETRIEVED APPLICATION DATA (Real Stored Records):\n${JSON.stringify(retrievedData, null, 2)}\n` : ''}
${preferences && Object.keys(preferences).length > 0 ? `USER PREFERENCES:\n${JSON.stringify(preferences, null, 2)}\n` : ''}`;

  return {
    intent,
    systemPrompt,
    retrievedData
  };
}
