/**
 * Schema definitions and response validation utilities for TaskBar OS AI
 */

export function validateProductivityAnalysis(obj) {
  if (!obj || typeof obj !== 'object') return null;
  return {
    summary: String(obj.summary || 'Productivity data processed.'),
    bestPerformingDays: Array.isArray(obj.bestPerformingDays) ? obj.bestPerformingDays : [],
    incompleteTaskPatterns: Array.isArray(obj.incompleteTaskPatterns) ? obj.incompleteTaskPatterns : [],
    focusPatterns: String(obj.focusPatterns || 'No focus session anomalies detected.'),
    routineConsistency: String(obj.routineConsistency || 'Routines tracking in progress.'),
    areasNeedingAttention: Array.isArray(obj.areasNeedingAttention) ? obj.areasNeedingAttention : [],
    suggestions: Array.isArray(obj.suggestions) ? obj.suggestions : [],
    productivityScore: typeof obj.productivityScore === 'number' ? Math.max(0, Math.min(100, obj.productivityScore)) : 0,
    isLocalFallback: Boolean(obj.isLocalFallback)
  };
}

export function validateHabitAnalysis(obj) {
  if (!obj || typeof obj !== 'object') return null;
  return {
    summary: String(obj.summary || 'Habit patterns evaluated.'),
    strongestHabits: Array.isArray(obj.strongestHabits) ? obj.strongestHabits : [],
    vulnerableHabits: Array.isArray(obj.vulnerableHabits) ? obj.vulnerableHabits : [],
    missedDayPatterns: Array.isArray(obj.missedDayPatterns) ? obj.missedDayPatterns : [],
    recommendations: Array.isArray(obj.recommendations) ? obj.recommendations : [],
    isLocalFallback: Boolean(obj.isLocalFallback)
  };
}

export function validateWorkoutAnalysis(obj) {
  if (!obj || typeof obj !== 'object') return null;
  return {
    summary: String(obj.summary || 'Workout sessions evaluated.'),
    consistency: String(obj.consistency || 'Cadence noted.'),
    volumeTrend: String(obj.volumeTrend || 'Volume calculated.'),
    restObservations: String(obj.restObservations || 'Ensure sufficient recovery.'),
    recommendations: Array.isArray(obj.recommendations) ? obj.recommendations : [],
    disclaimer: String(obj.disclaimer || 'General exercise education. Not medical advice.'),
    isLocalFallback: Boolean(obj.isLocalFallback)
  };
}

export function validateNutritionAnalysis(obj) {
  if (!obj || typeof obj !== 'object') return null;
  return {
    summary: String(obj.summary || 'Nutritional data evaluated.'),
    proteinAssessment: String(obj.proteinAssessment || 'Protein intake tracked.'),
    energyBalance: String(obj.energyBalance || 'Energy balance computed.'),
    hydration: String(obj.hydration || 'Hydration logs reviewed.'),
    recommendations: Array.isArray(obj.recommendations) ? obj.recommendations : [],
    disclaimer: String(obj.disclaimer || 'Nutritional estimates are educational and not a medical prescription.'),
    isLocalFallback: Boolean(obj.isLocalFallback)
  };
}

export function validateDailyPlan(obj) {
  if (!obj || typeof obj !== 'object') return null;
  return {
    date: String(obj.date || new Date().toISOString().split('T')[0]),
    dailyTheme: String(obj.dailyTheme || 'Tactical Execution & Balance'),
    recommendedOrder: Array.isArray(obj.recommendedOrder) ? obj.recommendedOrder.map(item => ({
      taskId: item.taskId || `task_${Math.random()}`,
      title: String(item.title || 'Mission'),
      recommendedTime: item.recommendedTime || 'Flexible',
      priority: item.priority || 'Medium',
      reason: String(item.reason || 'Strategic priority')
    })) : [],
    focusBlocks: Array.isArray(obj.focusBlocks) ? obj.focusBlocks.map(fb => ({
      time: fb.time || '10:00 AM',
      duration: Number(fb.duration) || 25,
      label: fb.label || 'Deep Focus Session'
    })) : [],
    recoveryBreaks: Array.isArray(obj.recoveryBreaks) ? obj.recoveryBreaks.map(rb => ({
      time: rb.time || '11:30 AM',
      duration: Number(rb.duration) || 10,
      activity: rb.activity || 'Hydration & Movement'
    })) : [],
    workloadAssessment: String(obj.workloadAssessment || 'Optimal'),
    plannerAdvice: String(obj.plannerAdvice || 'Execute with calm focus.')
  };
}

export function validateWeeklyReport(obj) {
  if (!obj || typeof obj !== 'object') return null;
  return {
    title: String(obj.title || 'Weekly Operational Debrief'),
    period: String(obj.period || 'Current Week'),
    overallGrade: String(obj.overallGrade || 'A'),
    productivityScore: Number(obj.productivityScore) || 75,
    highlights: Array.isArray(obj.highlights) ? obj.highlights : [],
    lowlights: Array.isArray(obj.lowlights) ? obj.lowlights : [],
    metrics: typeof obj.metrics === 'object' && obj.metrics !== null ? obj.metrics : {},
    markdownBody: String(obj.markdownBody || ''),
    nextWeekPriorities: Array.isArray(obj.nextWeekPriorities) ? obj.nextWeekPriorities : [],
    isLocalFallback: Boolean(obj.isLocalFallback)
  };
}

export function validateSuggestion(sug) {
  if (!sug || typeof sug !== 'object') return null;
  return {
    id: String(sug.id || `sug_${Date.now()}_${Math.random()}`),
    type: String(sug.type || 'create_task'),
    title: String(sug.title || 'Suggested Action'),
    description: String(sug.description || ''),
    payload: typeof sug.payload === 'object' && sug.payload !== null ? sug.payload : {},
    impact: ['High', 'Medium', 'Low'].includes(sug.impact) ? sug.impact : 'Medium'
  };
}
