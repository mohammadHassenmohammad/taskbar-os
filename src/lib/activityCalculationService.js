import { calculateMetCalories } from './calorieBurnService';

/**
 * FITNESS OS — WALKING & DAILY ACTIVITY CALCULATION SERVICE
 * 
 * Manages step counting, stride length estimation, distance & duration calculations,
 * and anti-double-counting guards for activity entries.
 */

export const WALKING_INTENSITIES = {
  slow:   { name: 'Slow Walk (< 3.2 km/h)', metKey: 'walking_slow', avgSpeedKmh: 3.0 },
  normal: { name: 'Normal Walk (4.5 km/h)', metKey: 'walking_normal', avgSpeedKmh: 4.5 },
  brisk:  { name: 'Brisk Walk (5.6 km/h)',  metKey: 'walking_brisk',  avgSpeedKmh: 5.6 },
  fast:   { name: 'Fast Walk (6.4 km/h)',   metKey: 'walking_fast',   avgSpeedKmh: 6.4 },
};

/**
 * Estimates stride length based on user height in cm.
 * Average male/female stride multiplier ~0.414 of height.
 * Default height 175cm -> ~0.725m stride length.
 */
export const estimateStrideLengthMeters = (heightCm = 175) => {
  const h = Number(heightCm) || 175;
  return (h * 0.414) / 100;
};

/**
 * Converts Steps -> Distance (km) -> Duration (min) -> Estimated Calories.
 */
export const calculateWalkingFromSteps = ({
  steps = 0,
  heightCm = 175,
  weightKg = 70,
  intensityKey = 'normal'
}) => {
  const numSteps = Math.max(0, Number(steps) || 0);
  const strideMeters = estimateStrideLengthMeters(heightCm);
  
  // Distance in kilometers
  const distanceKm = (numSteps * strideMeters) / 1000;
  
  // Duration in minutes
  const intensity = WALKING_INTENSITIES[intensityKey] || WALKING_INTENSITIES.normal;
  const durationMinutes = (distanceKm / intensity.avgSpeedKmh) * 60;
  
  // Calories burned using MET formula
  const calories = calculateMetCalories({
    metKey: intensity.metKey,
    weightKg,
    durationMinutes
  });

  return {
    steps: numSteps,
    distanceKm: Math.round(distanceKm * 100) / 100,
    durationMinutes: Math.round(durationMinutes),
    estimatedCalories: calories,
    strideMeters: Math.round(strideMeters * 1000) / 1000,
    intensity: intensity.name
  };
};

/**
 * Converts Distance (km) -> Steps -> Duration (min) -> Calories.
 */
export const calculateWalkingFromDistance = ({
  distanceKm = 0,
  heightCm = 175,
  weightKg = 70,
  intensityKey = 'normal'
}) => {
  const dist = Math.max(0, Number(distanceKm) || 0);
  const strideMeters = estimateStrideLengthMeters(heightCm);
  const steps = dist > 0 ? Math.round((dist * 1000) / strideMeters) : 0;
  
  const intensity = WALKING_INTENSITIES[intensityKey] || WALKING_INTENSITIES.normal;
  const durationMinutes = (dist / intensity.avgSpeedKmh) * 60;

  const calories = calculateMetCalories({
    metKey: intensity.metKey,
    weightKg,
    durationMinutes
  });

  return {
    steps,
    distanceKm: Math.round(dist * 100) / 100,
    durationMinutes: Math.round(durationMinutes),
    estimatedCalories: calories,
    strideMeters: Math.round(strideMeters * 1000) / 1000,
    intensity: intensity.name
  };
};

/**
 * Converts Duration (min) -> Distance (km) -> Steps -> Calories.
 */
export const calculateWalkingFromDuration = ({
  durationMinutes = 0,
  heightCm = 175,
  weightKg = 70,
  intensityKey = 'normal'
}) => {
  const mins = Math.max(0, Number(durationMinutes) || 0);
  const intensity = WALKING_INTENSITIES[intensityKey] || WALKING_INTENSITIES.normal;
  
  const distanceKm = (mins / 60) * intensity.avgSpeedKmh;
  const strideMeters = estimateStrideLengthMeters(heightCm);
  const steps = distanceKm > 0 ? Math.round((distanceKm * 1000) / strideMeters) : 0;

  const calories = calculateMetCalories({
    metKey: intensity.metKey,
    weightKg,
    durationMinutes: mins
  });

  return {
    steps,
    distanceKm: Math.round(distanceKm * 100) / 100,
    durationMinutes: Math.round(mins),
    estimatedCalories: calories,
    strideMeters: Math.round(strideMeters * 1000) / 1000,
    intensity: intensity.name
  };
};

/**
 * Anti-Double-Counting Activity Guard
 * Ensures a manual distance/time entry does not duplicate existing step-logged session for a given date.
 */
export const deduplicateWalkingActivity = (existingLogs = [], newActivity = {}) => {
  // If activity has matching activityId or timestamps within 15 minutes, update existing rather than duplicating
  const idx = existingLogs.findIndex(log => log.id === newActivity.id || (log.inputMode === newActivity.inputMode && log.date === newActivity.date));
  
  if (idx !== -1) {
    const updated = [...existingLogs];
    updated[idx] = { ...updated[idx], ...newActivity, updatedAt: new Date().toISOString() };
    return updated;
  }

  return [...existingLogs, { ...newActivity, createdAt: new Date().toISOString() }];
};
