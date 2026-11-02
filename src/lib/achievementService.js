/**
 * FITNESS OS — VERIFIED ACHIEVEMENTS SERVICE
 * 
 * Awards achievements strictly from verified historical user activity data.
 */

export const ACHIEVEMENT_DEFINITIONS = [
  { id: 'ach_first_workout', title: 'First Mission', category: 'Workout', icon: '🏋️', color: '#10b981', xp: 50, desc: 'Completed your 1st workout' },
  { id: 'ach_5_workouts', title: 'Iron Cadet', category: 'Workout', icon: '💪', color: '#38bdf8', xp: 100, desc: 'Completed 5 workouts' },
  { id: 'ach_25_workouts', title: 'Gym Veteran', category: 'Workout', icon: '⚔️', color: '#818cf8', xp: 250, desc: 'Completed 25 workouts' },
  { id: 'ach_gym_streak_7', title: 'Unstoppable Momentum', category: 'Streak', icon: '🔥', color: '#f59e0b', xp: 200, desc: '7-day workout streak' },
  { id: 'ach_first_pr', title: 'PR Breaker', category: 'PR', icon: '⚡', color: '#ec4899', xp: 100, desc: 'Earned your 1st Personal Record' },
  { id: 'ach_10_prs', title: 'PR Hunter', category: 'PR', icon: '👑', color: '#a855f7', xp: 300, desc: 'Earned 10 Personal Records' },
  { id: 'ach_volume_50k', title: 'Heavy Lifter', category: 'Volume', icon: '🧱', color: '#64748b', xp: 200, desc: 'Accumulated 50,000 kg total volume' },
  { id: 'ach_volume_100k', title: 'Century Titan', category: 'Volume', icon: '🏛️', color: '#facc15', xp: 500, desc: 'Accumulated 100,000 kg total volume' },
  { id: 'ach_100k_steps', title: 'Step Master', category: 'Walking', icon: '👟', color: '#14b8a6', xp: 200, desc: 'Logged 100,000 total walking steps' },
  { id: 'ach_10_diet_days', title: 'Diet Disciple', category: 'Diet', icon: '🥗', color: '#10b981', xp: 150, desc: 'Tracked nutrition for 10 days' },
  { id: 'ach_protein_streak_7', title: 'Protein Monarch', category: 'Diet', icon: '🥩', color: '#fb7185', xp: 250, desc: 'Met protein target 7 days in a row' }
];

export const checkAndUnlockAchievements = (state) => {
  const existingUnlocked = new Set((state.gamification?.achievements || []).map(a => typeof a === 'string' ? a : a.id));
  const newUnlocks = [];

  // Compute stats from verified store data
  const workouts = Object.values(state.workouts || {}).filter(w => w.completed);
  const completedWorkoutsCount = workouts.length;
  const gymStreak = state.gamification?.gymStreak || 0;
  const prsCount = (state.personalRecords || []).length;
  
  let totalVolume = 0;
  workouts.forEach(w => {
    (w.exercises || []).forEach(ex => {
      (ex.sets || []).forEach(st => {
        if (st.completed) {
          totalVolume += (Number(st.weight) || 0) * (Number(st.reps) || 0);
        }
      });
    });
  });

  const walkingLogs = Object.values(state.walkingLogs || {});
  const totalSteps = walkingLogs.reduce((acc, log) => acc + (Number(log.steps) || 0), 0);
  const dietDaysCount = Object.keys(state.dietEntries || {}).length;

  ACHIEVEMENT_DEFINITIONS.forEach(def => {
    if (existingUnlocked.has(def.id)) return;

    let unlocked = false;

    switch (def.id) {
      case 'ach_first_workout':
        if (completedWorkoutsCount >= 1) unlocked = true;
        break;
      case 'ach_5_workouts':
        if (completedWorkoutsCount >= 5) unlocked = true;
        break;
      case 'ach_25_workouts':
        if (completedWorkoutsCount >= 25) unlocked = true;
        break;
      case 'ach_gym_streak_7':
        if (gymStreak >= 7) unlocked = true;
        break;
      case 'ach_first_pr':
        if (prsCount >= 1) unlocked = true;
        break;
      case 'ach_10_prs':
        if (prsCount >= 10) unlocked = true;
        break;
      case 'ach_volume_50k':
        if (totalVolume >= 50000) unlocked = true;
        break;
      case 'ach_volume_100k':
        if (totalVolume >= 100000) unlocked = true;
        break;
      case 'ach_100k_steps':
        if (totalSteps >= 100000) unlocked = true;
        break;
      case 'ach_10_diet_days':
        if (dietDaysCount >= 10) unlocked = true;
        break;
      default:
        break;
    }

    if (unlocked) {
      newUnlocks.push(def);
    }
  });

  return newUnlocks;
};
