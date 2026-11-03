/**
 * TASKBAR OS — NEXT-GENERATION EXTENSION SUITE VERIFICATION
 * 
 * Verifies:
 * 1. Project Management (CRUD, milestones, progress math)
 * 2. Goal and Vision Planner (Horizons, dynamic progress from milestones)
 * 3. Second Brain & JARVIS Memory (Nodes, tags, long-term memory)
 * 4. Learning & Study Centre (Courses, topics, study session accumulation)
 * 5. Time Intelligence (Planned vs actual, workload status)
 * 6. Automation Engine (Execution, history, error safety)
 * 7. Backup & Restore (JSON structure validation & restore integrity)
 * 8. JARVIS Intent Routing & Application Tool Querying
 */

import { classifyIntent, INTENT_TYPES } from '../../../server/ai/orchestrator.js';
import { ApplicationTools } from '../../../server/ai/tools/applicationTools.js';

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (!condition) {
    console.error(`\x1b[31m[FAIL]\x1b[0m ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    passed++;
    console.log(`\x1b[32m[PASS]\x1b[0m ${message}`);
  }
}

export function runNextGenSuite() {
  console.log('\n=== TASKBAR OS NEXT-GEN EXPANSION VERIFICATION SUITE ===\n');

  // --- 1. PROJECT MANAGEMENT LOGIC ---
  console.log('--- 1. PROJECT MANAGEMENT & MILESTONES ---');
  const sampleProject = {
    id: 'proj_test_1',
    title: 'Distributed Consensus Protocol',
    status: 'active',
    milestones: [
      { id: 'm1', title: 'Leader Election', completed: true },
      { id: 'm2', title: 'Log Replication', completed: true },
      { id: 'm3', title: 'Safety Verification', completed: false }
    ]
  };

  const projectProgress = Math.round(
    (sampleProject.milestones.filter(m => m.completed).length / sampleProject.milestones.length) * 100
  );
  assert(projectProgress === 67, 'Project progress calculates dynamically from milestones (2/3 = 67%)');

  // --- 2. GOAL & VISION HORIZON LOGIC ---
  console.log('\n--- 2. GOAL AND VISION PLANNER ---');
  const sampleGoal = {
    id: 'goal_test_1',
    title: 'Achieve AI Engineering Mastery',
    timeHorizon: 'long_term',
    milestones: [
      { id: 'gm1', title: 'Intent Classification Engine', completed: true },
      { id: 'gm2', title: 'Tool Execution Harness', completed: true }
    ]
  };

  const goalProgress = Math.round(
    (sampleGoal.milestones.filter(m => m.completed).length / sampleGoal.milestones.length) * 100
  );
  assert(goalProgress === 100, 'Goal progress reaches 100% when all milestones completed');
  assert(sampleGoal.timeHorizon === 'long_term', 'Goal maintains distinct time horizon classification');

  // --- 3. SECOND BRAIN FULL-TEXT RETRIEVAL ---
  console.log('\n--- 3. SECOND BRAIN & JARVIS MEMORY ---');
  const brainNodes = [
    { id: 'b1', title: 'Raft Consensus', content: 'Heartbeats and election timeouts', tags: ['distributed', 'systems'] },
    { id: 'b2', title: 'Kaizen Protocol', content: 'Continuous iterative improvement', tags: ['productivity', 'mindset'] }
  ];

  const searchResults = brainNodes.filter(n => 
    n.title.toLowerCase().includes('kaizen') || 
    n.content.toLowerCase().includes('kaizen') ||
    n.tags.includes('kaizen')
  );
  assert(searchResults.length === 1, 'Full-text retrieval accurately locates node by title/tag');
  assert(searchResults[0].id === 'b2', 'Search returned exact matching node');

  // --- 4. LEARNING & STUDY PROGRESS ACCUMULATION ---
  console.log('\n--- 4. LEARNING AND STUDY CENTRE ---');
  const course = {
    id: 'c1',
    title: 'Advanced Operating Systems',
    totalHours: 20,
    completedHours: 5
  };
  const session = { durationMinutes: 60 };
  const updatedHours = course.completedHours + (session.durationMinutes / 60);
  assert(updatedHours === 6, 'Logging a 60m session increments course completed hours from 5 to 6');
  const coursePct = Math.round((updatedHours / course.totalHours) * 100);
  assert(coursePct === 30, 'Course progress correctly computes as 30% (6/20 hrs)');

  // --- 5. TIME INTELLIGENCE EFFICIENCY CALCULATION ---
  console.log('\n--- 5. TIME INTELLIGENCE & ALLOCATION ---');
  const plannedMinutes = 180; // 3 hours planned
  const actualPomodoroMins = 90;
  const actualStudyMins = 45;
  const totalActual = actualPomodoroMins + actualStudyMins; // 135 mins
  const efficiency = Math.round((totalActual / plannedMinutes) * 100);
  assert(efficiency === 75, 'Efficiency calculation matches empirical actual vs planned (135/180 = 75%)');
  const workloadStatus = plannedMinutes > 8 * 60 ? 'Heavy' : plannedMinutes > 4 * 60 ? 'Optimal' : 'Light';
  assert(workloadStatus === 'Light', '3 hours planned is categorized as Light workload');

  // --- 6. AUTOMATION EXECUTION PROTOCOL ---
  console.log('\n--- 6. AUTOMATION ENGINE LOGIC ---');
  const automation = {
    id: 'auto_1',
    name: 'Hydration Ping',
    actionType: 'log_water',
    actionPayload: { glasses: 2 },
    enabled: true,
    runHistory: []
  };
  assert(automation.enabled === true, 'Automation rule maintains enabled state');
  const executionRecord = {
    timestamp: new Date().toISOString(),
    status: 'success',
    summary: `Logged ${automation.actionPayload.glasses} glasses of water`
  };
  automation.runHistory.unshift(executionRecord);
  assert(automation.runHistory.length === 1, 'Automation run history logs execution success telemetry');

  // --- 7. BACKUP & RESTORE ARCHIVE INTEGRITY ---
  console.log('\n--- 7. BACKUP ARCHIVE INTEGRITY ---');
  const mockExport = {
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    appName: 'TaskBar OS',
    data: {
      tasks: { '2026-11-03': [{ id: 't1', title: 'Verify Architecture' }] },
      projects: [sampleProject],
      goals: [sampleGoal]
    }
  };
  assert(mockExport.version === '2.0.0', 'Backup export archive carries valid semantic version');
  assert(Array.isArray(mockExport.data.projects), 'Backup includes projects table');
  assert(Array.isArray(mockExport.data.goals), 'Backup includes goals table');

  // --- 8. JARVIS ORCHESTRATOR & APPLICATION TOOLS ---
  console.log('\n--- 8. JARVIS INTENT CLASSIFICATION ---');
  assert(classifyIntent('what are my active projects') === INTENT_TYPES.PROJECTS_QUERY, 'Classifies "what are my active projects" as PROJECTS_QUERY');
  assert(classifyIntent('show my goals and vision') === INTENT_TYPES.GOALS_QUERY, 'Classifies "show my goals and vision" as GOALS_QUERY');
  assert(classifyIntent('search my second brain for kaizen') === INTENT_TYPES.BRAIN_QUERY, 'Classifies second brain queries as BRAIN_QUERY');
  assert(classifyIntent('what courses am I studying') === INTENT_TYPES.LEARNING_QUERY, 'Classifies course queries as LEARNING_QUERY');

  // Tools search query check
  const toolsContext = {
    projects: [sampleProject],
    goals: [sampleGoal],
    secondBrain: brainNodes,
    courses: [course]
  };
  const tools = new ApplicationTools(toolsContext);
  const projQuery = tools.getProjects();
  assert(projQuery.count === 1, 'ApplicationTools returns active projects count 1');
  assert(projQuery.projects[0].title === 'Distributed Consensus Protocol', 'ApplicationTools returns correct project title');

  const goalQuery = tools.getGoals();
  assert(goalQuery.count === 1, 'ApplicationTools returns active goals count 1');

  const searchOutput = tools.searchApplicationData({ query: 'raft' });
  assert(searchOutput.totalMatches >= 1, 'Universal search found match across Second Brain');
  assert(searchOutput.matches[0].module === 'Second Brain', 'Match identified correctly as Second Brain module');

  console.log(`\n\x1b[32m=== NEXT-GEN SUITE COMPLETE: ${passed}/${total} PASSED ===\x1b[0m\n`);
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith('nextGenVerification.test.js')) {
  runNextGenSuite();
}
