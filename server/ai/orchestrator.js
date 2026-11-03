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
  PRODUCTIVITY_CURRENT: 'PRODUCTIVITY_CURRENT',
  PRODUCTIVITY_PREVIOUS: 'PRODUCTIVITY_PREVIOUS',
  PRODUCTIVITY_COMPARE: 'PRODUCTIVITY_COMPARE',
  SUGGESTION_IMPROVEMENT: 'SUGGESTION_IMPROVEMENT',
  TASKS_QUERY: 'TASKS_QUERY',
  HABITS_QUERY: 'HABITS_QUERY',
  WORKOUTS_QUERY: 'WORKOUTS_QUERY',
  DIET_QUERY: 'DIET_QUERY',
  FOCUS_QUERY: 'FOCUS_QUERY',
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

  // 5. Contextual Follow-up Comparisons (e.g. "what about last week?", "compare them", "what should I improve?")
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

  // 6. Productivity & Progress
  if (text.includes('productivity') || (text.includes('how was') && (text.includes('week') || text.includes('progress')))) {
    return INTENT_TYPES.PRODUCTIVITY_CURRENT;
  }

  // 7. Tasks & Prioritization
  if (text.includes('task') || text.includes('what should i work on') || text.includes('priorit') || text.includes('overdue') || text.includes('to-do') || text.includes('todo')) {
    return INTENT_TYPES.TASKS_QUERY;
  }

  // 8. Habits & Streaks
  if (text.includes('habit') || text.includes('streak') || text.includes('consistency')) {
    return INTENT_TYPES.HABITS_QUERY;
  }

  // 9. Workouts & Gym
  if (text.includes('workout') || text.includes('gym') || text.includes('training') || text.includes('exercise') || text.includes('lift')) {
    return INTENT_TYPES.WORKOUTS_QUERY;
  }

  // 10. Diet & Nutrition
  if (text.includes('diet') || text.includes('food') || text.includes('eat') || text.includes('nutrition') || text.includes('calories') || text.includes('protein')) {
    return INTENT_TYPES.DIET_QUERY;
  }

  // 11. Focus & Pomodoro
  if (text.includes('focus') || text.includes('pomodoro') || text.includes('deep work')) {
    return INTENT_TYPES.FOCUS_QUERY;
  }

  // 12. Planning
  if (text.includes('plan tomorrow') || text.includes('daily plan') || text.includes('schedule tomorrow') || text.includes('plan my day')) {
    return INTENT_TYPES.PLANNING;
  }

  // 13. General Knowledge (programming, science, trivia, questions starting with explain, what is, how to, tell me about)
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
      retrievedData = tools.getWorkoutHistory();
      responseStyleGuidance = `Summarize their workout sessions and total external volume moved. Offer recovery advice if training frequency is high.`;
      break;

    case INTENT_TYPES.DIET_QUERY:
      retrievedData = tools.getNutritionStatistics();
      responseStyleGuidance = `Summarize daily caloric and protein averages against their targets.`;
      break;

    case INTENT_TYPES.FOCUS_QUERY:
      retrievedData = tools.getFocusStatistics();
      responseStyleGuidance = `Summarize their focus time and Pomodoro history.`;
      break;

    case INTENT_TYPES.PLANNING:
      retrievedData = {
        todayTasks: tools.getPendingTasks({ date: tools.today }),
        habits: tools.getHabits()
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

${responseStyleGuidance ? `STYLE & INTENT GUIDANCE:\n${responseStyleGuidance}\n` : ''}
${retrievedData ? `RETRIEVED APPLICATION DATA (Real Stored Records):\n${JSON.stringify(retrievedData, null, 2)}\n` : ''}
${preferences && Object.keys(preferences).length > 0 ? `USER PREFERENCES:\n${JSON.stringify(preferences, null, 2)}\n` : ''}`;

  return {
    intent,
    systemPrompt,
    retrievedData
  };
}
