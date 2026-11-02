// Centralized Nutrition Engine & Mathematics Service
// Handles mathematically precise quantity-based conversions, raw vs cooked scaling, recipe calculations, and data-driven insights.

export const UNIT_WEIGHT_GRAMS = {
  g: 1,
  kg: 1000,
  ml: 1, // standard 1ml = 1g approximation for liquid foods
  cup: 240,
  glass: 250,
  piece: 100, // default if item standard weight not specified
  egg: 50, // 1 medium whole egg is ~50g
  serving: 100,
  bowl: 250,
  tablespoon: 15, // 1 tbsp = 15g/ml
  teaspoon: 5,   // 1 tsp = 5g/ml
};

/**
 * Calculates exact nutritional values for a given food item and quantity.
 * 
 * @param {Object} food - Food item from database or custom food
 * @param {number} quantity - Quantity value entered by user
 * @param {string} unit - Unit selected by user (g, kg, ml, cup, etc.)
 * @returns {Object} Calculated nutrients (calories, protein, carbs, fat, fiber, sugar, sodium)
 */
export function calculateEntryNutrients(food, quantity, unit) {
  if (!food || typeof quantity !== 'number' || quantity <= 0) {
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0
    };
  }

  // Base serving weight in grams (or equivalent)
  const baseServingSize = food.servingSize || 100;
  const baseServingUnit = food.servingUnit || 'g';
  const baseWeightGrams = baseServingSize * (UNIT_WEIGHT_GRAMS[baseServingUnit] || 1);

  // Input total weight in grams
  const inputWeightGrams = quantity * (UNIT_WEIGHT_GRAMS[unit] || 1);

  // Scaling factor
  const factor = inputWeightGrams / baseWeightGrams;

  const round = (val) => Math.round((val || 0) * factor * 10) / 10;

  return {
    calories: Math.round((food.calories || 0) * factor),
    protein: round(food.protein),
    carbs: round(food.carbs),
    fat: round(food.fat),
    fiber: round(food.fiber),
    sugar: round(food.sugar),
    sodium: Math.round((food.sodium || 0) * factor)
  };
}

/**
 * Calculates daily aggregated totals from an array of diet entries.
 * 
 * @param {Array} entries - Array of food entry objects for a day
 * @returns {Object} Daily totals for calories and macronutrients
 */
export function calculateDaySummary(entries = []) {
  const totals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    entryCount: entries.length,
  };

  entries.forEach((entry) => {
    const n = entry.calculatedNutrients || {};
    totals.calories += Number(n.calories || 0);
    totals.protein += Number(n.protein || 0);
    totals.carbs += Number(n.carbs || 0);
    totals.fat += Number(n.fat || 0);
    totals.fiber += Number(n.fiber || 0);
    totals.sugar += Number(n.sugar || 0);
    totals.sodium += Number(n.sodium || 0);
  });

  // Round values
  totals.calories = Math.round(totals.calories);
  totals.protein = Math.round(totals.protein * 10) / 10;
  totals.carbs = Math.round(totals.carbs * 10) / 10;
  totals.fat = Math.round(totals.fat * 10) / 10;
  totals.fiber = Math.round(totals.fiber * 10) / 10;
  totals.sugar = Math.round(totals.sugar * 10) / 10;
  totals.sodium = Math.round(totals.sodium);

  return totals;
}

/**
 * Generates personalized insights strictly from actual recorded intake vs target goals.
 * 
 * @param {Object} summary - Day summary calculated from actual recorded entries
 * @param {Object} goals - Target goals from user state
 * @returns {Array} List of actionable, data-driven insight objects
 */
export function generateDietInsights(summary, goals) {
  const insights = [];

  if (!goals) return insights;

  const calRemaining = (goals.calories || 2000) - summary.calories;
  const protRemaining = (goals.protein || 120) - summary.protein;
  const carbRemaining = (goals.carbs || 250) - summary.carbs;
  const fatRemaining = (goals.fat || 65) - summary.fat;

  // Entry count check
  if (summary.entryCount === 0) {
    insights.push({
      type: 'info',
      title: 'No Intake Logged Yet',
      message: 'Start logging your meals today to track your calories and macronutrients accurately.'
    });
    return insights;
  }

  // Protein status
  if (protRemaining > 15) {
    insights.push({
      type: 'warning',
      title: 'Protein Target Remaining',
      message: `You are ${Math.round(protRemaining)}g below your protein goal today. Consider adding chicken breast, eggs, soya chunks, paneer, or a whey scoop.`
    });
  } else if (summary.protein >= (goals.protein || 120)) {
    insights.push({
      type: 'success',
      title: 'Protein Goal Achieved! 🏆',
      message: `Great job! You have reached ${summary.protein}g of protein (${Math.round((summary.protein / goals.protein) * 100)}% of target).`
    });
  }

  // Calorie status
  if (calRemaining > 300) {
    insights.push({
      type: 'info',
      title: 'Calorie Buffer Available',
      message: `You have ${Math.round(calRemaining)} kcal remaining today under your budget.`
    });
  } else if (calRemaining < -150) {
    insights.push({
      type: 'warning',
      title: 'Calorie Target Exceeded',
      message: `You are ${Math.abs(Math.round(calRemaining))} kcal over your daily target of ${goals.calories} kcal.`
    });
  } else if (Math.abs(calRemaining) <= 150) {
    insights.push({
      type: 'success',
      title: 'Optimal Energy Balance',
      message: `Your energy intake is right on target (${summary.calories} / ${goals.calories} kcal).`
    });
  }

  // Carbohydrate & Fat balance checks
  if (carbRemaining < -50) {
    insights.push({
      type: 'warning',
      title: 'Carbohydrate Surplus',
      message: `Carbohydrates have exceeded target by ${Math.abs(Math.round(carbRemaining))}g. Prioritize lean proteins and green vegetables for remaining meals.`
    });
  }
  if (fatRemaining < -20) {
    insights.push({
      type: 'warning',
      title: 'Dietary Fat Surplus',
      message: `Dietary fats have exceeded goal by ${Math.abs(Math.round(fatRemaining))}g. Moderate cooking oils and dressings.`
    });
  }

  // Fiber status
  if (summary.fiber < (goals.fiber || 25) / 2) {
    insights.push({
      type: 'info',
      title: 'Fiber Intake Recommendation',
      message: `Fiber intake is low (${summary.fiber}g). Add oats, chia seeds, broccoli, apples, or lentils.`
    });
  }

  return insights;
}

/**
 * Calculates recipe nutrition totals and per-serving breakdown from ingredients.
 * 
 * @param {Array} ingredients - Array of { food, quantity, unit }
 * @param {number} servings - Number of servings the recipe yields
 * @returns {Object} Total and per-serving nutrition metrics
 */
export function calculateRecipeNutrients(ingredients = [], servings = 1) {
  const total = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 };

  ingredients.forEach((item) => {
    const itemNutrients = calculateEntryNutrients(item.food, item.quantity, item.unit);
    total.calories += itemNutrients.calories;
    total.protein += itemNutrients.protein;
    total.carbs += itemNutrients.carbs;
    total.fat += itemNutrients.fat;
    total.fiber += itemNutrients.fiber;
    total.sugar += itemNutrients.sugar;
    total.sodium += itemNutrients.sodium;
  });

  const numServings = Math.max(1, servings);

  const perServing = {
    calories: Math.round(total.calories / numServings),
    protein: Math.round((total.protein / numServings) * 10) / 10,
    carbs: Math.round((total.carbs / numServings) * 10) / 10,
    fat: Math.round((total.fat / numServings) * 10) / 10,
    fiber: Math.round((total.fiber / numServings) * 10) / 10,
    sugar: Math.round((total.sugar / numServings) * 10) / 10,
    sodium: Math.round(total.sodium / numServings)
  };

  return { total, perServing };
}

export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,        // Little or no exercise
  lightly_active: 1.375, // Light exercise 1-3 days/week
  moderately_active: 1.55,// Moderate exercise 3-5 days/week
  very_active: 1.725,   // Heavy exercise 6-7 days/week
  extra_active: 1.9     // Intense daily training / physical job
};

/**
 * Calculates BMR, TDEE and target calories & macros using Mifflin-St Jeor Equation.
 * 
 * @param {Object} params - { age, gender, weightKg, heightCm, activityLevel, goalType }
 * @returns {Object} Calculated nutrition goals (calories, protein, carbs, fat, fiber, waterGoalMl)
 */
export function calculatePersonalNutritionGoals({
  age = 25,
  gender = 'male',
  weightKg = 70,
  heightCm = 175,
  activityLevel = 'moderately_active',
  goalType = 'muscle_gain'
}) {
  const weight = Number(weightKg) || 70;
  const height = Number(heightCm) || 175;
  const userAge = Number(age) || 25;

  // Mifflin-St Jeor Equation for BMR
  let bmr = (10 * weight) + (6.25 * height) - (5 * userAge);
  if (gender === 'female') {
    bmr -= 161;
  } else {
    bmr += 5;
  }

  // TDEE Calculation
  const mult = ACTIVITY_MULTIPLIERS[activityLevel] || 1.55;
  const tdee = bmr * mult;

  // Goal adjustment
  let calAdj = 0;
  let proteinRatio = 2.0; // g per kg

  if (goalType === 'weight_loss') {
    calAdj = -400;
    proteinRatio = 2.2;
  } else if (goalType === 'weight_gain') {
    calAdj = 400;
    proteinRatio = 2.0;
  } else if (goalType === 'muscle_gain') {
    calAdj = 250;
    proteinRatio = 2.2;
  } else if (goalType === 'general_health') {
    calAdj = 0;
    proteinRatio = 1.6;
  }

  const targetCalories = Math.round(tdee + calAdj);

  // Macro distribution:
  // Protein: proteinRatio * weightKg
  const targetProtein = Math.round(proteinRatio * weight);

  // Fat: 25% of total calories (9 kcal/g)
  const targetFat = Math.round((targetCalories * 0.25) / 9);

  // Carbs: Remaining calories (4 kcal/g)
  const proteinCals = targetProtein * 4;
  const fatCals = targetFat * 9;
  const remainingCalsForCarbs = Math.max(0, targetCalories - (proteinCals + fatCals));
  const targetCarbs = Math.round(remainingCalsForCarbs / 4);

  // Fiber: 14g per 1000 kcal
  const targetFiber = Math.round((targetCalories / 1000) * 14);

  // Water: 35ml per kg of bodyweight
  const targetWater = Math.round(weight * 35);

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calories: targetCalories,
    protein: targetProtein,
    carbs: targetCarbs,
    fat: targetFat,
    fiber: targetFiber,
    waterGoalMl: targetWater
  };
}

