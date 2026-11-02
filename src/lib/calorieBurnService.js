/**
 * FITNESS OS — CENTRALIZED CALORIE EXPENDITURE ENGINE
 * 
 * Provides a single source of truth for energy expenditure across all modules.
 * Standardizes BMR (Mifflin-St Jeor), MET-based exercise calculations, and strength training estimates.
 */

// Standardized MET Values (Compendium of Physical Activities)
export const MET_VALUES = {
  // Walking
  'walking_slow': 2.5,     // < 3.2 km/h
  'walking_normal': 3.5,   // 4.5 km/h
  'walking_brisk': 4.3,    // 5.6 km/h
  'walking_fast': 5.0,     // 6.4 km/h

  // Running & Cardio
  'jogging_light': 7.0,
  'running_moderate': 9.8,
  'running_fast': 11.5,
  'cycling_casual': 4.0,
  'cycling_moderate': 8.0,
  'swimming': 6.0,
  'jump_rope': 10.0,

  // Gym & Resistance
  'strength_light': 3.5,
  'strength_moderate': 5.0,
  'strength_heavy': 6.5,
  'calisthenics_moderate': 4.5,
  'calisthenics_vigorous': 8.0,
  'hiit_circuit': 8.0,
  'flexibility_stretching': 2.5,

  // Default Fallbacks
  'default_exercise': 5.0
};

/**
 * Calculates BMR using the Mifflin-St Jeor Equation.
 * Male: BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age_years) + 5
 * Female: BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age_years) - 161
 */
export const calculateBMR = ({ weightKg = 70, heightCm = 175, age = 25, gender = 'male' }) => {
  const w = Number(weightKg) || 70;
  const h = Number(heightCm) || 175;
  const a = Number(age) || 25;
  const isMale = (gender || 'male').toLowerCase() === 'male';

  const baseBMR = (10 * w) + (6.25 * h) - (5 * a);
  return Math.round(isMale ? baseBMR + 5 : baseBMR - 161);
};

/**
 * MET-based Exercise Calorie Calculation Formula:
 * Calories = MET × 3.5 × body_weight(kg) / 200 × duration(minutes)
 */
export const calculateMetCalories = ({ metKey = 'default_exercise', metOverride, weightKg = 70, durationMinutes = 30 }) => {
  const met = metOverride || MET_VALUES[metKey] || MET_VALUES.default_exercise;
  const w = Number(weightKg) || 70;
  const mins = Number(durationMinutes) || 0;

  if (mins <= 0) return 0;

  const calories = (met * 3.5 * w / 200) * mins;
  return Math.round(calories);
};

/**
 * Strength Training Calorie Estimator
 * Evaluates active duration, volume (kg), completed sets, and body weight.
 * Clearly labeled as "Estimated calories burned".
 */
export const estimateStrengthWorkoutCalories = ({
  durationMinutes = 45,
  totalVolumeKg = 0,
  completedSets = 0,
  weightKg = 70,
  intensity = 'moderate'
}) => {
  const mins = Math.max(1, Number(durationMinutes) || 1);
  const w = Number(weightKg) || 70;
  const volume = Number(totalVolumeKg) || 0;
  const sets = Number(completedSets) || 0;

  // Determine base MET by intensity/set density
  let met = MET_VALUES.strength_moderate;
  if (intensity === 'heavy' || sets > 15 || volume > 5000) {
    met = MET_VALUES.strength_heavy;
  } else if (intensity === 'light' || sets < 8) {
    met = MET_VALUES.strength_light;
  }

  // Base MET duration expenditure
  const baseCalories = (met * 3.5 * w / 200) * mins;

  // Minor volume workload adjustment (+0.002 kcal per kg volume lifted)
  const volumeBonus = volume * 0.002;

  const totalEstimated = Math.round(baseCalories + volumeBonus);
  return {
    estimatedCalories: totalEstimated,
    label: '~' + totalEstimated + ' kcal (Estimated calories burned)',
    isEstimate: true
  };
};

/**
 * Daily Expenditure Summary Separator
 * BMR + Daily Activity (Walking) + Exercise = Total Daily Expenditure
 * Separates BMR (Resting energy need), Active Expenditure, and Food Intake.
 * Enforces: Energy balance is ONLY calculated when food intake has been logged.
 */
export const calculateDailyExpenditureSummary = ({
  userProfile = {},
  workoutCalories = 0,
  walkingCalories = 0,
  otherActivityCalories = 0,
  foodCalories = 0
}) => {
  const bmr = calculateBMR(userProfile);
  const workout = Number(workoutCalories) || 0;
  const walking = Number(walkingCalories) || 0;
  const other = Number(otherActivityCalories) || 0;
  const activeExpenditure = workout + walking + other;
  const totalDailyExpenditure = bmr + activeExpenditure;
  const food = Number(foodCalories) || 0;

  const hasFoodLogged = food > 0;
  const netCalories = hasFoodLogged ? Math.round(food - totalDailyExpenditure) : null;
  const balanceLabel = hasFoodLogged 
    ? (netCalories <= 0 ? `~ ${Math.abs(netCalories)} kcal Deficit` : `~ +${netCalories} kcal Surplus`)
    : 'Not available — no food intake logged';

  return {
    bmr,
    workoutCalories: workout,
    walkingCalories: walking,
    otherActivityCalories: other,
    activeExpenditure,
    totalDailyExpenditure,
    foodCalories: food,
    hasFoodLogged,
    netCalories,
    balanceLabel
  };
};
