/**
 * TaskBar OS — JARVIS Conversational Intelligence Test Suite
 * Verifies JARVIS-style intent classification, application tools,
 * dynamic model normalization, ethical directives, and context orchestration.
 */

import { GeminiProvider } from '../../../server/ai/providers/geminiProvider.js';
import { LocalDeterministicProvider } from '../../../server/ai/providers/localProvider.js';
import { classifyIntent, orchestrateConversation, INTENT_TYPES } from '../../../server/ai/orchestrator.js';
import { ApplicationTools } from '../../../server/ai/tools/applicationTools.js';
import { prepareFullContext, getContextBadges } from '../../ai/services/aiContextService.js';

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (!condition) {
    console.error(`\x1b[31m[FAIL]\x1b[0m ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passed++;
  console.log(`\x1b[32m[PASS]\x1b[0m ${message}`);
}

async function runTestSuite() {
  console.log('====================================================================');
  console.log('TASKBAR OS — JARVIS CONVERSATIONAL INTELLIGENCE TEST SUITE');
  console.log('====================================================================');

  // --- 1. JARVIS INTENT CLASSIFICATION ENGINE ---
  console.log('\n--- 1. JARVIS INTENT CLASSIFICATION ---');
  assert(classifyIntent('hi') === INTENT_TYPES.GREETING, 'Classifies "hi" as GREETING');
  assert(classifyIntent('hello') === INTENT_TYPES.GREETING, 'Classifies "hello" as GREETING');
  assert(classifyIntent('what are you doing?') === INTENT_TYPES.CASUAL, 'Classifies "what are you doing?" as CASUAL');
  assert(classifyIntent('nice') === INTENT_TYPES.CASUAL, 'Classifies "nice" as CASUAL');
  assert(classifyIntent('how was my productivity this week?') === INTENT_TYPES.PRODUCTIVITY_CURRENT, 'Classifies productivity query as PRODUCTIVITY_CURRENT');
  assert(classifyIntent('what about last week?') === INTENT_TYPES.PRODUCTIVITY_PREVIOUS, 'Classifies follow-up "what about last week?" as PRODUCTIVITY_PREVIOUS');
  assert(classifyIntent('compare them', [{ role: 'assistant', content: 'Here is your weekly summary' }]) === INTENT_TYPES.PRODUCTIVITY_COMPARE, 'Classifies "compare them" as PRODUCTIVITY_COMPARE');
  assert(classifyIntent('what should I improve?') === INTENT_TYPES.SUGGESTION_IMPROVEMENT, 'Classifies "what should I improve?" as SUGGESTION_IMPROVEMENT');
  assert(classifyIntent('motivate me') === INTENT_TYPES.MOTIVATION, 'Classifies "motivate me" as MOTIVATION');
  assert(classifyIntent('I had a difficult day') === INTENT_TYPES.EMOTIONAL_SUPPORT, 'Classifies "I had a difficult day" as EMOTIONAL_SUPPORT');
  assert(classifyIntent('explain Java HashMap') === INTENT_TYPES.GENERAL_KNOWLEDGE, 'Classifies "explain Java HashMap" as GENERAL_KNOWLEDGE');
  assert(classifyIntent('what did I eat yesterday?') === INTENT_TYPES.DIET_QUERY, 'Classifies diet question as DIET_QUERY');
  assert(classifyIntent('summarize my workouts this month') === INTENT_TYPES.WORKOUTS_QUERY, 'Classifies workout query as WORKOUTS_QUERY');
  assert(classifyIntent('plan tomorrow') === INTENT_TYPES.PLANNING, 'Classifies "plan tomorrow" as PLANNING');
  assert(classifyIntent('how much water did I drink today?') === INTENT_TYPES.WELLNESS_QUERY, 'Classifies hydration question as WELLNESS_QUERY');
  assert(classifyIntent('how did I sleep last night?') === INTENT_TYPES.WELLNESS_QUERY, 'Classifies sleep inquiry as WELLNESS_QUERY');
  assert(classifyIntent('what routines do I have scheduled?') === INTENT_TYPES.ROUTINES_QUERY, 'Classifies routine query as ROUTINES_QUERY');
  assert(classifyIntent('what should I work on today?') === INTENT_TYPES.CROSS_MODULE_SYNTHESIS, 'Classifies daily focus question as CROSS_MODULE_SYNTHESIS');
  assert(classifyIntent('find code review task') === INTENT_TYPES.SEARCH_QUERY, 'Classifies search inquiry as SEARCH_QUERY');

  // --- 2. SELECTIVE DATA ORCHESTRATION ---
  console.log('\n--- 2. SELECTIVE DATA ORCHESTRATION ---');
  const mockContext = {
    today: '2026-11-03',
    productivity: { totalTasks: 12, completedTasks: 9, completionRatePct: 75, focusMinutes: 150, overdueCount: 1 },
    tasks: {
      '2026-11-03': [{ id: 't1', title: 'Code review', priority: 'High', completed: false }]
    },
    habits: [
      { id: 'h1', title: 'Daily Workout', streak: 4, completedToday: true }
    ],
    workouts: {
      sessionCount: 3,
      totalVolumeKg: 4200
    }
  };

  // Greeting must NOT attach retrieved data
  const greetingOrch = orchestrateConversation({
    messages: [{ role: 'user', content: 'hi' }],
    context: mockContext
  });
  assert(greetingOrch.retrievedData === null, 'Greeting does not attach heavy application data tables');
  assert(greetingOrch.systemPrompt.includes('simply greeting you'), 'Greeting prompt guides natural social reply');

  // General knowledge must NOT attach retrieved data
  const gkOrch = orchestrateConversation({
    messages: [{ role: 'user', content: 'explain recursion in programming' }],
    context: mockContext
  });
  assert(gkOrch.retrievedData === null, 'General knowledge does not attach application data');

  // Productivity query MUST attach retrieved data
  const prodOrch = orchestrateConversation({
    messages: [{ role: 'user', content: 'how was my productivity this week?' }],
    context: mockContext
  });
  assert(prodOrch.retrievedData !== null, 'Productivity query attaches real weekly summary metrics');
  assert(prodOrch.retrievedData.completedTasks === 9, 'Retrieved metrics match actual store data');

  // Comparison query attaches comparison data
  const compOrch = orchestrateConversation({
    messages: [{ role: 'user', content: 'compare them' }],
    context: mockContext
  });
  assert(Boolean(compOrch.retrievedData.currentWeek), 'Compare intent generates comparative period data');

  // --- 3. APPLICATION TOOLS DIRECT QUERY ---
  console.log('\n--- 3. APPLICATION TOOLS DIRECT QUERY ---');
  const enrichedMockContext = {
    ...mockContext,
    routines: [
      { id: 'r1', title: 'Morning Protocol', enabled: true, completedToday: true }
    ],
    wellness: {
      hydration: { glassesLogged: 5, goalGlasses: 8 },
      sleep: { hours: 7.5, quality: 'Good' },
      walking: { steps: 8500, distanceKm: 6.2 }
    }
  };
  const tools = new ApplicationTools(enrichedMockContext);
  const pending = tools.getPendingTasks({ date: '2026-11-03' });
  assert(pending.count === 1, 'Tools getPendingTasks returns exact pending count');
  assert(pending.tasks[0].title === 'Code review', 'Tools getPendingTasks returns exact task title');

  const habitStreaks = tools.getHabitStreaks();
  assert(habitStreaks.length === 1 && habitStreaks[0].streak === 4, 'Tools getHabitStreaks returns sorted streaks');

  const searchRes = tools.searchApplicationData({ query: 'code review' });
  assert(searchRes.totalMatches >= 1, 'Tools searchApplicationData finds matching tasks by keyword');
  assert(searchRes.matches[0].title === 'Code review', 'Search result matches task title');

  const routineStats = tools.getRoutineStats();
  assert(routineStats.totalProtocols === 1 && routineStats.completedTodayCount === 1, 'Tools getRoutineStats calculates routine adherence');

  const hydration = tools.getHydrationStats({ date: '2026-11-03' });
  assert(hydration.glassesLogged === 5 && hydration.goalGlasses === 8, 'Tools getHydrationStats returns accurate hydration tracking');

  const dailySnap = tools.getDailySnapshot({ date: '2026-11-03' });
  assert(dailySnap.pendingTasksCount === 1 && dailySnap.hydrationGlasses === 5, 'Tools getDailySnapshot unifies tasks and wellness');

  const priorities = tools.getTodayPriorities({ date: '2026-11-03' });
  assert(priorities.priorities.length > 0, 'Tools getTodayPriorities synthesizes actionable recommendations');

  // --- 4. MODEL NORMALIZATION & RESOLUTION ---
  console.log('\n--- 4. MODEL NORMALIZATION & RESOLUTION ---');
  const provider = new GeminiProvider({ apiKey: 'test_key' });
  assert(provider._normalizeModelName('gemini-3.5-flash') === 'models/gemini-3.5-flash', 'Normalizes model without prefix to models/gemini-3.5-flash');
  assert(provider._cleanModelName('models/gemini-3.5-flash') === 'gemini-3.5-flash', 'Cleans models/ prefix for UI display');

  // --- 5. STREAMING & LOCAL FALLBACK INTEGRITY ---
  console.log('\n--- 5. STREAMING & LOCAL FALLBACK ---');
  const local = new LocalDeterministicProvider();
  let receivedChunks = [];
  const streamRes = await local.generateStreamResponse(
    [{ role: 'user', content: 'hi' }],
    { context: mockContext },
    (chunk) => receivedChunks.push(chunk)
  );
  assert(receivedChunks.length > 0, 'Local fallback yields streaming chunks');
  assert(streamRes.text.toLowerCase().includes('hello') || streamRes.text.toLowerCase().includes('hey'), 'Local fallback greeting is friendly and natural');

  console.log('\n====================================================================');
  console.log(`[SUCCESS] All ${passed} / ${total} JARVIS Intelligence Tests Passed!`);
  console.log('====================================================================\n');
}

runTestSuite().catch(err => {
  console.error('\n[FATAL] Test failed:', err);
  process.exit(1);
});
