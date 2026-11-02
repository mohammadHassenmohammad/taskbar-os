import { v4 as uuidv4 } from 'uuid';

/**
 * FITNESS OS — WORKOUT PROGRESSION & PR SERVICE
 * 
 * Detects legitimate Personal Records (PRs), computes progressive overload deltas
 * against historical exercise logs, and generates session intensity summaries.
 */

/**
 * Detects PRs for a completed set in an exercise.
 * Evaluates:
 * 1. Heaviest Weight (kg) for the exercise
 * 2. Max Reps at a specific weight
 * 3. Highest Set Volume (Weight × Reps)
 */
export const detectPersonalRecords = ({
  exerciseName,
  setWeight,
  setReps,
  existingPRs = []
}) => {
  const w = Number(setWeight) || 0;
  const r = Number(setReps) || 0;

  if (w <= 0 || r <= 0 || !exerciseName) {
    return { isPR: false, prType: null, message: null, prRecord: null };
  }

  const setVolume = w * r;

  // Filter historical PRs for this exact exercise
  const exercisePRs = existingPRs.filter(pr => pr.exerciseName?.toLowerCase() === exerciseName.toLowerCase());

  let isHeaviestPR = true;
  let isMaxVolumePR = true;

  exercisePRs.forEach(pr => {
    if (pr.weight >= w) isHeaviestPR = false;
    if (pr.volume >= setVolume) isMaxVolumePR = false;
  });

  if (isHeaviestPR || isMaxVolumePR) {
    const prType = isHeaviestPR ? 'Heaviest Weight' : 'Max Set Volume';
    const prRecord = {
      id: `pr_${uuidv4()}`,
      exerciseName,
      weight: w,
      reps: r,
      volume: setVolume,
      type: prType,
      achievedAt: new Date().toISOString()
    };

    return {
      isPR: true,
      prType,
      message: `NEW PR! ${exerciseName}: ${w}kg × ${r} reps`,
      prRecord
    };
  }

  return { isPR: false, prType: null, message: null, prRecord: null };
};

/**
 * Calculates progressive overload performance deltas for an exercise against previous history.
 * Example: Previous: 60kg × 10 -> Today: 65kg × 10 -> Progress: +5kg
 */
export const calculateProgressiveOverload = ({
  exerciseName,
  currentSets = [],
  historicalWorkouts = {}
}) => {
  if (!exerciseName || !currentSets.length) {
    return { hasPrevious: false, weightDelta: 0, repsDelta: 0, volumeDelta: 0, previousBest: null };
  }

  // Find previous workouts containing this exercise
  let previousBest = null;

  const dates = Object.keys(historicalWorkouts).sort().reverse();
  for (const date of dates) {
    const w = historicalWorkouts[date];
    if (!w.exercises) continue;
    const ex = w.exercises.find(e => e.name?.toLowerCase() === exerciseName.toLowerCase());
    if (ex && ex.sets?.some(s => s.completed)) {
      const bestCompletedSet = ex.sets
        .filter(s => s.completed)
        .reduce((best, cur) => ((Number(cur.weight) || 0) > (Number(best.weight) || 0) ? cur : best), ex.sets[0]);
      
      if (bestCompletedSet) {
        previousBest = {
          weight: Number(bestCompletedSet.weight) || 0,
          reps: Number(bestCompletedSet.reps) || 0,
          volume: (Number(bestCompletedSet.weight) || 0) * (Number(bestCompletedSet.reps) || 0),
          date
        };
        break;
      }
    }
  }

  if (!previousBest || previousBest.weight === 0) {
    return { hasPrevious: false, weightDelta: 0, repsDelta: 0, volumeDelta: 0, previousBest: null };
  }

  // Current session best set
  const currentBestSet = currentSets
    .filter(s => s.completed)
    .reduce((best, cur) => ((Number(cur.weight) || 0) > (Number(best.weight) || 0) ? cur : best), currentSets[0] || {});

  const currentWeight = Number(currentBestSet?.weight) || 0;
  const currentReps = Number(currentBestSet?.reps) || 0;

  const weightDelta = currentWeight - previousBest.weight;
  const repsDelta = currentReps - previousBest.reps;

  return {
    hasPrevious: true,
    previousBest,
    weightDelta,
    repsDelta,
    formattedDelta: weightDelta > 0 ? `+${weightDelta}kg` : weightDelta < 0 ? `${weightDelta}kg` : repsDelta > 0 ? `+${repsDelta} reps` : 'Equal'
  };
};

/**
 * Compiles session intensity & volume breakdown metrics.
 */
export const calculateWorkoutSummaryMetrics = (workout = {}) => {
  const exercises = workout.exercises || [];
  const completedExercises = exercises.filter(e => e.sets?.some(s => s.completed));
  const completedSets = exercises.flatMap(e => e.sets || []).filter(s => s.completed);

  let totalVolumeKg = 0;
  let totalReps = 0;

  completedSets.forEach(s => {
    const w = Number(s.weight) || 0;
    const r = Number(s.reps) || 0;
    totalVolumeKg += w * r;
    totalReps += r;
  });

  return {
    exercisesCount: exercises.length,
    completedExercisesCount: completedExercises.length,
    totalSets: completedSets.length,
    totalReps,
    totalVolumeKg,
    formattedVolume: totalVolumeKg.toLocaleString() + ' kg'
  };
};
