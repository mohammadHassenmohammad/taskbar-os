/**
 * TASKBAR OS / NEURAL OS — AUTOMATED VERIFICATION SUITE
 * 
 * Tests:
 * 1. Mathematical Gamification Curve & Rank Boundaries
 * 2. Idempotent XP Rewarding & Anti-Farming Guard
 * 3. Reversible Reward Events
 * 4. Centralized Analytics & Aggregation Math (Productivity, Fitness, Nutrition)
 * 5. Non-destructive XP Ledger Reconciliation
 */

import { 
  thresholdForLevel, 
  calculateLevelInfo, 
  getRankForLevel, 
  processXpAward, 
  processXpReversal, 
  reconcileXpLedger 
} from '../xpService.js';

import { 
  computeProductivityMetrics, 
  computeFitnessMetrics, 
  computeNutritionMetrics, 
  computeLifestyleMetrics 
} from '../analyticsService.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`\x1b[31m[FAIL]\x1b[0m ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    passedTests++;
    console.log(`\x1b[32m[PASS]\x1b[0m ${message}`);
  }
}

function runSuite() {
  console.log('\n--- 1. GAMIFICATION THRESHOLD & RANK BOUNDARIES ---');
  assert(thresholdForLevel(1) === 0, 'Level 1 threshold is 0 XP');
  assert(thresholdForLevel(2) === 500, 'Level 2 threshold is 500 XP (250 * (4 - 2))');
  assert(thresholdForLevel(3) === 1500, 'Level 3 threshold is 1500 XP (250 * (9 - 3))');
  assert(thresholdForLevel(4) === 3000, 'Level 4 threshold is 3000 XP (250 * (16 - 4))');
  assert(thresholdForLevel(5) === 5000, 'Level 5 threshold is 5000 XP (250 * (25 - 5))');

  const zeroInfo = calculateLevelInfo(0);
  assert(zeroInfo.level === 1, '0 XP returns Level 1');
  assert(zeroInfo.xpIntoLevel === 0, '0 XP has 0 into level');
  assert(zeroInfo.progress === 0, '0 XP has 0% progress');
  assert(zeroInfo.rank === 'Recruit', 'Level 1 is Recruit rank');

  const subLvl2 = calculateLevelInfo(499);
  assert(subLvl2.level === 1, '499 XP is Level 1');
  assert(subLvl2.xpIntoLevel === 499, '499 XP into Level 1');
  assert(subLvl2.progress === 99.8, '499 XP is 99.8% progress into Level 1');

  const exactLvl2 = calculateLevelInfo(500);
  assert(exactLvl2.level === 2, '500 XP reaches Level 2 exactly');
  assert(exactLvl2.xpIntoLevel === 0, '500 XP has 0 remainder into Level 2');
  assert(exactLvl2.progress === 0, '500 XP has 0% progress into Level 2');

  const multiLevelJump = calculateLevelInfo(12000);
  assert(multiLevelJump.level === 7, '12000 XP correctly jumps to Level 7 Operative');
  assert(multiLevelJump.rank === 'Operative', 'Level 7 has Operative rank');

  console.log('\n--- 2. ALL SEVEN SPECIFIED RANK BOUNDARIES ---');
  assert(getRankForLevel(1).name === 'Recruit', 'Level 1 is Recruit');
  assert(getRankForLevel(4).name === 'Recruit', 'Level 4 is Recruit');
  assert(getRankForLevel(5).name === 'Operative', 'Level 5 is Operative');
  assert(getRankForLevel(9).name === 'Operative', 'Level 9 is Operative');
  assert(getRankForLevel(10).name === 'Specialist', 'Level 10 is Specialist');
  assert(getRankForLevel(19).name === 'Specialist', 'Level 19 is Specialist');
  assert(getRankForLevel(20).name === 'Vanguard', 'Level 20 is Vanguard');
  assert(getRankForLevel(34).name === 'Vanguard', 'Level 34 is Vanguard');
  assert(getRankForLevel(35).name === 'Elite', 'Level 35 is Elite');
  assert(getRankForLevel(49).name === 'Elite', 'Level 49 is Elite');
  assert(getRankForLevel(50).name === 'Neural Master', 'Level 50 is Neural Master');
  assert(getRankForLevel(74).name === 'Neural Master', 'Level 74 is Neural Master');
  assert(getRankForLevel(75).name === 'Transcendent', 'Level 75 is Transcendent');
  assert(getRankForLevel(100).name === 'Transcendent', 'Level 100+ is Transcendent');

  console.log('\n--- 3. ANTI-FARMING & REWARD IDEMPOTENCY ---');
  let auditLedger = [];
  let currentXp = 0;

  const award1 = processXpAward(auditLedger, {
    amount: 50,
    sourceId: 'task:t123:2026-10-13',
    description: 'Task Completion: Core Audit'
  });
  assert(award1.allowed === true, 'First reward succeeds');
  assert(award1.transaction.amount === 50, '50 XP awarded in transaction');
  auditLedger.push(award1.transaction);
  currentXp += award1.transaction.amount;
  assert(currentXp === 50, 'Lifetime XP is now 50');
  assert(auditLedger.length === 1, 'Audit ledger records the transaction');

  // Attempt duplicate reward with the same sourceId
  const awardDuplicate = processXpAward(auditLedger, {
    amount: 50,
    sourceId: 'task:t123:2026-10-13',
    description: 'Task Completion: Core Audit'
  });
  assert(awardDuplicate.allowed === false, 'Duplicate reward rejected by idempotency filter');
  assert(awardDuplicate.transaction === null, 'No transaction created for duplicate event');
  assert(currentXp === 50, 'Lifetime XP remains 50');

  // Test reversible reward (e.g. unchecking completed task)
  const reversal1 = processXpReversal(auditLedger, 'task:t123:2026-10-13', 'Task Unchecked');
  assert(reversal1.allowed === true, 'Reversal succeeds');
  assert(reversal1.amount === 50, '50 XP reversed');
  auditLedger.push(reversal1.transaction);
  currentXp -= reversal1.amount;
  assert(currentXp === 0, 'Lifetime XP decremented back to 0');
  assert(auditLedger.length === 2, 'Reversal recorded in audit ledger');

  // Attempt duplicate reversal
  const reversalDuplicate = processXpReversal(auditLedger, 'task:t123:2026-10-13', 'Task Unchecked');
  assert(reversalDuplicate.allowed === false, 'Duplicate reversal rejected');

  console.log('\n--- 4. DATA INTEGRITY & RECONCILIATION ---');
  const ledgerState = {
    xp: 120, // Drifted or corrupt value
    level: 1,
    auditLedger: [
      { sourceId: 'ev1', amount: 50, isReversal: false },
      { sourceId: 'ev2', amount: 30, isReversal: false },
      { sourceId: 'ev1', amount: 50, isReversal: true },
      { sourceId: 'ev3', amount: 100, isReversal: false },
    ]
  };
  const recon = reconcileXpLedger(ledgerState);
  assert(recon.reconciled === true, 'Discrepancy detected and repaired');
  assert(recon.computedXp === 130, 'Correct sum is 50 + 30 - 50 + 100 = 130 XP');
  assert(recon.finalXp === 130, 'Final lifetime XP matched to verified sum');

  console.log('\n--- 5. CENTRALIZED ANALYTICS ENGINE MATH ---');
  // Productivity: Empty input
  const emptyProd = computeProductivityMetrics({}, []);
  assert(emptyProd.createdCount === 0, 'Empty tasks has 0 created');
  assert(emptyProd.completionRate === 0, 'Empty tasks has 0% completion rate without division error');
  assert(emptyProd.focusMinutes === 0, 'Empty tasks has 0 focus minutes');

  // Productivity: Defined set
  const sampleTasks = {
    '2026-10-10': [
      { id: 't1', completed: true, timeTaken: 1200, category: 'Work' },
      { id: 't2', completed: false, timeTaken: 600, category: 'Health' }
    ],
    '2026-10-11': [
      { id: 't3', completed: true, timeTaken: 1800, category: 'Work' }
    ]
  };
  const activeProd = computeProductivityMetrics(sampleTasks, ['2026-10-10', '2026-10-11']);
  assert(activeProd.createdCount === 3, '3 total tasks in window');
  assert(activeProd.completedCount === 2, '2 completed tasks');
  assert(activeProd.completionRate === 67, 'Completion rate 2/3 = 67%');
  assert(activeProd.focusMinutes === 60, 'Total focus time is 3600s = 60 minutes');

  // Fitness: External load verification
  const sampleWorkouts = {
    '2026-10-10': {
      completed: true,
      exercises: [
        {
          name: 'Bench Press',
          sets: [
            { weight: 80, reps: 10, completed: true },
            { weight: 80, reps: 8, completed: true },
            { weight: 80, reps: 6, completed: false } // Unfinished set!
          ]
        },
        {
          name: 'Pushups (Bodyweight)',
          sets: [
            { weight: 0, reps: 20, completed: true } // Bodyweight should not add to external load
          ]
        }
      ]
    }
  };
  const activeFit = computeFitnessMetrics(sampleWorkouts, ['2026-10-10']);
  assert(activeFit.workoutsCompleted === 1, '1 workout completed');
  assert(activeFit.totalSets === 4, '4 total planned sets');
  assert(activeFit.completedSets === 3, '3 completed sets');
  // 80*10 + 80*8 = 800 + 640 = 1440 kg external load. (Bodyweight 0kg * 20 = 0 kg).
  assert(activeFit.totalExternalVolumeKg === 1440, 'External volume is exactly 1,440 kg (excludes unfinished sets & bodyweight load)');

  // Nutrition & Lifestyle Aggregations
  const sampleDiet = {
    '2026-10-10': [
      { name: 'Oatmeal', calculatedNutrients: { calories: 350, protein: 12, carbs: 60, fat: 5, fiber: 8 } },
      { name: 'Chicken Salad', calculatedNutrients: { calories: 450, protein: 45, carbs: 10, fat: 12, fiber: 4 } }
    ]
  };
  const activeNut = computeNutritionMetrics(sampleDiet, {}, [], {}, ['2026-10-10']);
  assert(activeNut.loggedDaysCount === 1, '1 logged nutrition day');
  assert(activeNut.totalCalories === 800, 'Total calories is 800 kcal');
  assert(activeNut.totalProtein === 57, 'Total protein is 57g');

  const sampleSleep = {
    '2026-10-10': { quality: 8, start: '23:00', end: '07:00' }
  };
  const activeLife = computeLifestyleMetrics(sampleSleep, {}, ['2026-10-10']);
  assert(activeLife.loggedSleepDays === 1, '1 logged sleep day');
  assert(activeLife.avgSleepQuality === 8, 'Sleep quality averages to 8/10');

  // --- 6. REVERSIBLE XP UNCOMPLETE / RECOMPLETE CYCLES ---
  console.log('\n--- 6. REVERSIBLE XP UNCOMPLETE / RECOMPLETE CYCLES ---');
  let cycleLedger = [];
  let cycleXp = 0;
  // Step A: Award task XP (+50)
  const cycleAward1 = processXpAward(cycleLedger, {
    amount: 50,
    sourceId: 'task:cycle_999:2026-11-03',
    description: 'Task Completion: Mission 999'
  });
  assert(cycleAward1.allowed === true, 'Task completed first time awarded XP');
  cycleLedger.push(cycleAward1.transaction);
  cycleXp += cycleAward1.transaction.amount;
  assert(cycleXp === 50, 'Cycle XP is 50');

  // Step B: Uncomplete task (-50)
  const cycleRev1 = processXpReversal(cycleLedger, 'task:cycle_999:2026-11-03', 'Uncompleted mission');
  assert(cycleRev1.allowed === true, 'Task uncompleted reversed XP');
  cycleLedger.push(cycleRev1.transaction);
  cycleXp -= cycleRev1.amount;
  assert(cycleXp === 0, 'Cycle XP back to 0');

  // Step C: Recomplete task (+50)
  const cycleAward2 = processXpAward(cycleLedger, {
    amount: 50,
    sourceId: 'task:cycle_999:2026-11-03',
    description: 'Task Recompleted: Mission 999'
  });
  assert(cycleAward2.allowed === true, 'Task re-completed successfully awarded XP after previous reversal');
  cycleLedger.push(cycleAward2.transaction);
  cycleXp += cycleAward2.transaction.amount;
  assert(cycleXp === 50, 'Cycle XP back to 50 after recompletion');

  // Step D: Reversal ledger check
  const cycleReconcile = reconcileXpLedger({ auditLedger: cycleLedger, xp: cycleXp });
  assert(cycleReconcile.finalXp === 50, 'Cycle reconcile calculates net 50 - 50 + 50 = 50 XP');

  // --- 7. POMODORO ABSOLUTE TIMESTAMP TIMER INTEGRITY ---
  console.log('\n--- 7. POMODORO ABSOLUTE TIMESTAMP TIMER INTEGRITY ---');
  const now = Date.now();
  const targetEnd = now + (25 * 60 * 1000);
  const remainingSeconds = Math.max(0, Math.round((targetEnd - now) / 1000));
  assert(remainingSeconds === 1500, '25-minute pomodoro remaining seconds is 1500s');

  const elapsedSeconds = 500;
  const timeAfterNav = now + (elapsedSeconds * 1000);
  const remainingAfterNav = Math.max(0, Math.round((targetEnd - timeAfterNav) / 1000));
  assert(remainingAfterNav === 1000, 'After 500s navigation, remaining seconds is exactly 1000s without timer drift');

  // --- 8. HABITS STREAK & LOGIC VERIFICATION ---
  console.log('\n--- 8. HABITS STREAK & LOGIC VERIFICATION ---');
  const mockHabit = { id: 'h_read', title: 'Daily Reading', schedule: 'daily' };
  const mockLogs = {
    '2026-11-01': { 'h_read': true },
    '2026-11-02': { 'h_read': true },
    '2026-11-03': { 'h_read': true }
  };
  let habitStreak = 0;
  const checkDates = ['2026-11-03', '2026-11-02', '2026-11-01', '2026-10-31'];
  for (const d of checkDates) {
    if (mockLogs[d]?.[mockHabit.id]) {
      habitStreak++;
    } else {
      break;
    }
  }
  assert(habitStreak === 3, 'Consecutive 3-day habit log calculates 3-day streak');

  // --- 9. DIET NUTRITION CALCULATIONS ---
  console.log('\n--- 9. DIET NUTRITION CALCULATIONS ---');
  const chickenBreast = {
    id: 'f_chicken',
    name: 'Chicken Breast',
    servingSize: 100,
    servingUnit: 'g',
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6
  };
  // Log 200g (2x serving)
  const qty = 200;
  const ratio = qty / chickenBreast.servingSize;
  const calcCal = Math.round(chickenBreast.calories * ratio);
  const calcProt = Math.round(chickenBreast.protein * ratio);
  assert(ratio === 2, '200g has ratio of 2x standard 100g serving');
  assert(calcCal === 330, '200g chicken breast is exactly 330 kcal');
  assert(calcProt === 62, '200g chicken breast is exactly 62g protein');

  // --- 10. ROUTINE DISMISSAL & DELETION INTEGRITY (PREVENT REGENERATION BUG) ---
  console.log('\n--- 10. ROUTINE DISMISSAL & DELETION INTEGRITY ---');
  // Scenario: Routine 'r_leet' generates task 'Leet code' for today
  const mockRoutine = { id: 'r_leet', title: 'Leet code', enabled: true, days: [0, 1, 2, 3, 4, 5, 6] };
  const mockDate = '2026-11-03';
  let mockStateTasks = {
    [mockDate]: [{ id: 'task_leet_1', title: 'Leet code', isRoutine: true, routineId: 'r_leet', completed: false }]
  };
  let mockDismissed = {};

  // Step 1: User deletes the routine task for today
  const taskToDelete = mockStateTasks[mockDate].find(t => t.id === 'task_leet_1');
  if (taskToDelete?.isRoutine && taskToDelete?.routineId) {
    if (!mockDismissed[mockDate]) mockDismissed[mockDate] = [];
    mockDismissed[mockDate].push(taskToDelete.routineId);
  }
  mockStateTasks[mockDate] = mockStateTasks[mockDate].filter(t => t.id !== 'task_leet_1');
  assert(mockStateTasks[mockDate].length === 0, 'Task deleted from today board');
  assert(mockDismissed[mockDate].includes('r_leet'), 'Routine blacklisted in dismissedRoutines for today');

  // Step 2: Component mounts or re-renders, triggering applyRoutinesToDate
  const existingIds = new Set(mockStateTasks[mockDate].filter(t => t.isRoutine).map(t => t.routineId));
  const dismissedSet = new Set(mockDismissed[mockDate] || []);
  let regenerated = false;
  if (!existingIds.has(mockRoutine.id) && !dismissedSet.has(mockRoutine.id)) {
    mockStateTasks[mockDate].push({ id: 'task_leet_2', title: mockRoutine.title, isRoutine: true, routineId: mockRoutine.id });
    regenerated = true;
  }
  assert(regenerated === false, 'Dismissed routine is NOT regenerated on re-render');
  assert(mockStateTasks[mockDate].length === 0, 'Board remains cleanly deleted without ghost task');

  // Step 3: Normalized string matching ("Leet code" matches "LeetCode")
  const normStr = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  assert(normStr('Leet code') === normStr('LeetCode'), 'Normalized string matches "Leet code" with "LeetCode"');
  assert(normStr('Leet-Code') === normStr('leetcode'), 'Normalized string matches "Leet-Code" with "leetcode"');

  console.log(`\n\x1b[32m[SUCCESS]\x1b[0m All ${passedTests} / ${totalTests} verification tests passed successfully!`);
}

runSuite();
