/**
 * Comprehensive AI System Verification Test Suite
 * Tests AI Provider abstraction, schemas, context preparation,
 * deterministic local fallback, rate limiting, and security sanitization.
 */

import { BaseAIProvider } from '../../../server/ai/providers/baseProvider.js';
import { GeminiProvider } from '../../../server/ai/providers/geminiProvider.js';
import { OpenRouterProvider } from '../../../server/ai/providers/openRouterProvider.js';
import { LocalDeterministicProvider } from '../../../server/ai/providers/localProvider.js';
import { getProvider, getProviderStatus } from '../../../server/ai/providerRegistry.js';
import { checkRateLimit, validatePayloadSize, sanitizeInput } from '../../../server/ai/security.js';
import {
  validateProductivityAnalysis,
  validateHabitAnalysis,
  validateWorkoutAnalysis,
  validateNutritionAnalysis,
  validateDailyPlan,
  validateWeeklyReport,
  validateSuggestion
} from '../../ai/schemas/aiSchemas.js';
import {
  prepareProductivityContext,
  prepareHabitContext,
  prepareWorkoutContext,
  prepareNutritionContext,
  prepareFullContext
} from '../../ai/services/aiContextService.js';

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
  console.log('TASKBAR OS — COMPLETE AI SYSTEM VERIFICATION TEST SUITE');
  console.log('====================================================================');

  // --- 1. PROVIDER ABSTRACTION & REGISTRY ---
  console.log('\n--- 1. PROVIDER ABSTRACTION & REGISTRY ---');
  const localProv = new LocalDeterministicProvider();
  assert(localProv instanceof BaseAIProvider, 'LocalDeterministicProvider implements BaseAIProvider');
  assert(localProv.isConfigured() === true, 'Local provider is always configured and ready');

  const geminiProv = new GeminiProvider({ apiKey: '' });
  assert(geminiProv instanceof BaseAIProvider, 'GeminiProvider implements BaseAIProvider');
  assert(geminiProv.isConfigured() === false, 'Gemini correctly reports unconfigured when API key is empty');
  assert(geminiProv.model === 'gemini-1.5-flash', 'Gemini defaults to free-tier gemini-1.5-flash');

  const openRouterProv = new OpenRouterProvider({ apiKey: '' });
  assert(openRouterProv instanceof BaseAIProvider, 'OpenRouterProvider implements BaseAIProvider');
  assert(openRouterProv.isConfigured() === false, 'OpenRouter unconfigured without key');

  // Fallback to local when cloud key is missing
  const active = getProvider();
  assert(active.name === 'local_deterministic', 'Registry falls back gracefully to local deterministic provider when no key set');

  const status = getProviderStatus();
  assert(status.providers.gemini.eligibleFreeModels.includes('gemini-1.5-flash'), 'Gemini reports eligible free models');
  assert(status.providers.local_deterministic.configured === true, 'Local deterministic provider reports active');

  // --- 2. DETERMINISTIC LOCAL ANALYTICS VERIFICATION ---
  console.log('\n--- 2. DETERMINISTIC LOCAL ANALYTICS VERIFICATION ---');
  const mockContext = {
    tasks: {
      '2026-11-03': [
        { id: '1', title: 'Task A', completed: true },
        { id: '2', title: 'Task B', completed: false }
      ]
    },
    habits: [
      { id: 'h1', title: 'Cold Shower', streak: 5, category: 'Health' },
      { id: 'h2', title: 'Deep Work', streak: 12, category: 'Focus' }
    ]
  };

  const localChatRes = await localProv.generateResponse([
    { role: 'user', content: 'How was my productivity this week?' }
  ], { context: mockContext });

  assert(localChatRes.provider === 'local_deterministic', 'Local chat returns local_deterministic provider tag');
  assert(localChatRes.text.includes('Local Productivity Snapshot'), 'Local chat returns structured productivity snapshot');
  assert(localChatRes.isLocalFallback === true, 'Local response flagged as local fallback');

  const localHabitRes = await localProv.analyzeHabits(mockContext);
  assert(localHabitRes.strongestHabits.includes('Cold Shower'), 'Local habit analysis identifies active streaks');
  assert(localHabitRes.summary.includes('Tracking 2 active habits'), 'Local habit analysis calculates accurate count');

  const localWorkRes = await localProv.analyzeWorkouts({ sessionCount: 4, volumeKg: 5200 });
  assert(localWorkRes.volumeTrend.includes('5,200 kg'), 'Local workout analysis formats volume');
  assert(localWorkRes.disclaimer.includes('Not medical'), 'Local workout analysis includes safety disclaimer');

  const localNutRes = await localProv.analyzeNutrition({ calories: 1800, protein: 140, targetCalories: 2000, targetProtein: 120 });
  assert(localNutRes.proteinAssessment.includes('Protein target achieved'), 'Local nutrition confirms protein achieved');

  const localWeeklyReport = await localProv.generateWeeklyReport({ tasksCompleted: 14, focusMinutes: 240, habitsAdherence: 85 });
  assert(localWeeklyReport.overallGrade === 'A', '14 completed tasks earns Grade A');
  assert(localWeeklyReport.metrics.totalFocusMinutes === 240, 'Report metrics record exact focus minutes');

  const localSuggestions = await localProv.generateSuggestions();
  assert(Array.isArray(localSuggestions) && localSuggestions.length >= 3, 'Local provider generates actionable suggestions list');

  // --- 3. SCHEMA VALIDATION ENGINE ---
  console.log('\n--- 3. SCHEMA VALIDATION ENGINE ---');
  const validPlan = validateDailyPlan({
    dailyTheme: 'Aerobic Pacing',
    recommendedOrder: [{ title: 'Code Review', recommendedTime: '09:00 AM', priority: 'High' }],
    focusBlocks: [{ time: '10:00 AM', duration: 25, label: 'Deep Focus' }],
    recoveryBreaks: [{ time: '11:00 AM', duration: 10, activity: 'Walk' }]
  });
  assert(validPlan.dailyTheme === 'Aerobic Pacing', 'Daily plan schema preserves theme');
  assert(validPlan.recommendedOrder.length === 1, 'Daily plan schema preserves recommended task order');
  assert(validPlan.focusBlocks[0].duration === 25, 'Daily plan focus block duration validated');

  // Corrupted / missing input handling
  const emptyPlan = validateDailyPlan(null);
  assert(emptyPlan === null, 'Null plan returns null safely without throwing');

  const malformedHabit = validateHabitAnalysis({ randomKey: 'invalid' });
  assert(malformedHabit.strongestHabits.length === 0, 'Malformed habit analysis defaults array properties safely');

  const validSug = validateSuggestion({
    type: 'create_task',
    title: 'Review PR',
    impact: 'High',
    payload: { taskTitle: 'Review PR' }
  });
  assert(validSug.type === 'create_task', 'Suggestion schema validates type');
  assert(validSug.impact === 'High', 'Suggestion schema validates impact');

  // --- 4. CONTEXT PREPARATION & DATA SANITIZATION ---
  console.log('\n--- 4. CONTEXT PREPARATION & DATA SANITIZATION ---');
  const mockStore = {
    tasks: {
      '2026-11-03': [
        { id: 't1', title: 'Write tests', priority: 'High', category: 'Work', completed: true, timeTaken: 1800 },
        { id: 't2', title: 'Prepare brief', priority: 'Medium', category: 'Work', completed: false, timeTaken: 900 }
      ]
    },
    habits: [
      { id: 'h1', title: 'Morning Run', streak: 4, category: 'Fitness', archived: false }
    ],
    habitLogs: {
      '2026-11-03': { 'h1': true }
    },
    workouts: {
      '2026-11-03': {
        completed: true,
        name: 'Upper Body Blast',
        exercises: [{ sets: [{ weight: 80, reps: 10, completed: true }] }]
      }
    },
    dietEntries: {
      '2026-11-03': [
        { calculatedNutrients: { calories: 500, protein: 40 } }
      ]
    },
    dietGoals: { calories: 2200, protein: 150 },
    gamification: { level: 4, rank: 'Recruit' },
    settings: {
      aiPrivacy: {
        includeTasks: true,
        includeHabits: true,
        includeWorkouts: true,
        includeNutrition: true
      }
    }
  };

  const fullContext = prepareFullContext(mockStore);
  assert(fullContext.today === '2026-11-03', 'Context normalizes today date');
  assert(fullContext.productivity.totalTasks === 2, 'Productivity context aggregates 2 tasks in window');
  assert(fullContext.productivity.completedTasks === 1, 'Productivity context aggregates 1 completed task');
  assert(fullContext.productivity.focusMinutes === 45, '1800s + 900s = 2700s = 45 focus minutes');
  assert(fullContext.habits.habits[0].completedToday === true, 'Habit context records completedToday boolean');
  assert(fullContext.workouts.sessionCount === 1, 'Workout context records 1 completed session');
  assert(fullContext.workouts.totalVolumeKg === 800, 'Workout context records 80kg * 10reps = 800kg volume');
  assert(fullContext.nutrition.avgCalories === 500, 'Nutrition context records 500 avg calories');

  // Privacy boundary test: disabling workouts removes workout context
  const restrictedStore = {
    ...mockStore,
    settings: {
      aiPrivacy: {
        includeTasks: true,
        includeHabits: false,
        includeWorkouts: false,
        includeNutrition: false
      }
    }
  };
  const restrictedContext = prepareFullContext(restrictedStore);
  assert(restrictedContext.workouts === undefined, 'Privacy setting: workouts excluded when toggled off');
  assert(restrictedContext.habits === undefined, 'Privacy setting: habits excluded when toggled off');
  assert(restrictedContext.nutrition === undefined, 'Privacy setting: nutrition excluded when toggled off');
  assert(restrictedContext.productivity !== undefined, 'Privacy setting: productivity retained when toggled on');

  // --- 5. SECURITY, RATE LIMITING & CREDENTIAL PROTECTION ---
  console.log('\n--- 5. SECURITY, RATE LIMITING & CREDENTIAL PROTECTION ---');
  // Check sanitization removes potential secrets
  const dirtyPrompt = 'Here is my password: secretpassword123 and token AIzaSyD9876543210zyxwvutsrqponmlkjihgfed';
  const cleanPrompt = sanitizeInput(dirtyPrompt);
  assert(!cleanPrompt.includes('secretpassword123'), 'Sanitization redacts plaintext passwords');
  assert(!cleanPrompt.includes('AIzaSyD9876543210'), 'Sanitization redacts API key tokens');

  // Check payload size validation
  const smallPayload = JSON.stringify({ message: 'Hello' });
  assert(validatePayloadSize(smallPayload) === true, 'Small payload passes size validation');

  const largeString = 'a'.repeat(35 * 1024); // 35 KB > 32 KB limit
  let sizeError = null;
  try {
    validatePayloadSize(largeString);
  } catch (err) {
    sizeError = err;
  }
  assert(sizeError !== null, 'Payload exceeding 32KB is rejected with error');

  // Rate limiter check
  const rl1 = checkRateLimit('test_client_ip');
  assert(rl1.allowed === true, 'First request allowed under rate limit window');

  console.log(`\n\x1b[32m[SUCCESS]\x1b[0m All ${passed} / ${total} AI verification tests passed successfully!`);
}

runTestSuite().catch(err => {
  console.error('\n\x1b[31m[FAILED]\x1b[0m Test suite encountered fatal error:', err);
  process.exit(1);
});
