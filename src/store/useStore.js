import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import { format, differenceInDays, parseISO } from 'date-fns';
import { toast } from 'react-hot-toast';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  updatePassword
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { playNotificationSound } from "../lib/audio";
import { NotificationService } from "../lib/notifications";
import { calculateEntryNutrients } from "../lib/nutritionEngine";
import { 
  getDailySnapshot, 
  getTodayPriorities, 
  getNextAction, 
  generateCrossModuleInsights, 
  getGlobalConsistencyStreaks, 
  calculateCorrelationData 
} from "../lib/intelligenceEngine";
import { 
  calculateLevelInfo, 
  processXpAward,
  processXpReversal
} from "../lib/xpService";
import { 
  estimateStrengthWorkoutCalories
} from "../lib/calorieBurnService";
import { 
  calculateWalkingFromSteps, 
  calculateWalkingFromDistance, 
  calculateWalkingFromDuration, 
  deduplicateWalkingActivity 
} from "../lib/activityCalculationService";
import { 
  detectPersonalRecords
} from "../lib/workoutProgressService";
import { 
  checkAndUnlockAchievements
} from "../lib/achievementService";

export const today = () => format(new Date(), 'yyyy-MM-dd');

const INITIAL_WATER_SCHEDULE = [
  { id: 'w1', time: '08:00 AM', amount: '500ml' },
  { id: 'w2', time: '11:00 AM', amount: '500ml' },
  { id: 'w3', time: '02:00 PM', amount: '500ml' },
  { id: 'w4', time: '05:00 PM', amount: '500ml' },
  { id: 'w5', time: '08:00 PM', amount: '500ml' },
];

export const CATEGORIES = ['Work', 'Personal', 'Health', 'Learning', 'Creative', 'Social', 'Finance', 'Other'];
export const PRIORITY_XP = { Low: 10, Medium: 25, High: 50 };
export const MUSCLE_GROUPS = ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Cardio', 'Full Body'];
export const NOTIFICATION_SOUNDS = ['Default Pulse', 'Neural Ping', 'Digital Alert', 'Success Chime', 'Ambient Bell'];
export const EXERCISE_LIBRARY_DEFAULT = [
  { id: 'ex1', name: 'Push-ups', muscle: 'Chest', type: 'Repetition', equipment: 'Bodyweight', instructions: 'Full range, slow negatives.', purpose: 'Build chest strength and stability.' },
  { id: 'ex2', name: 'Incline Push-ups', muscle: 'Chest', type: 'Repetition', equipment: 'Incline Surface', instructions: 'Hands on bench or wall.', purpose: 'Upper chest focus.' },
  { id: 'ex3', name: 'Bench Dips', muscle: 'Arms', type: 'Repetition', equipment: 'Bench', instructions: 'Keep elbows close.', purpose: 'Triceps and lower chest.' },
  { id: 'ex4', name: 'Diamond Push-ups', muscle: 'Chest', type: 'Repetition', equipment: 'Bodyweight', instructions: 'Triceps focus, hands in diamond shape.', purpose: 'Inner chest and triceps.' },
  { id: 'ex5', name: 'Jump Squats', muscle: 'Legs', type: 'Repetition', equipment: 'Bodyweight', instructions: 'Land softly, explosive upward.', purpose: 'Power and leg strength.' },
  { id: 'ex6', name: 'Forward Lunges', muscle: 'Legs', type: 'Repetition', equipment: 'Bodyweight', instructions: 'Step fully forward, 90 deg knees.', purpose: 'Glutes and quads.' },
  { id: 'ex7', name: 'Bulgarian Split Squats', muscle: 'Legs', type: 'Repetition', equipment: 'Elevated Surface', instructions: 'Rear foot elevated.', purpose: 'Unilateral leg strength.' },
  { id: 'ex8', name: 'Calf Raises', muscle: 'Legs', type: 'Repetition', equipment: 'Step', instructions: 'Full range of motion.', purpose: 'Calf definition.' },
  { id: 'ex9', name: 'Wall Sit', muscle: 'Legs', type: 'Timed', equipment: 'Wall', instructions: 'Back against wall, 90 deg.', purpose: 'Leg endurance.' },
  { id: 'ex10', name: 'Wide-Grip Pull-ups', muscle: 'Back', type: 'Repetition', equipment: 'Pull-up Bar', instructions: 'Full extension, chin over bar.', purpose: 'Back width.' },
  { id: 'ex11', name: 'Chin-ups', muscle: 'Back', type: 'Repetition', equipment: 'Pull-up Bar', instructions: 'Underhand grip, focus on biceps/lats.', purpose: 'Bicep and lat power.' },
  { id: 'ex12', name: 'Inverted Rows', muscle: 'Back', type: 'Repetition', equipment: 'Bar', instructions: 'Squeeze back at top.', purpose: 'Mid-back thickness.' },
  { id: 'ex13', name: 'Pull-up Ladder', muscle: 'Back', type: 'Repetition', equipment: 'Pull-up Bar', instructions: '1, 2, 3... steps up and down.', purpose: 'Volume and endurance.' },
  { id: 'ex14', name: 'Neutral-Grip Pull-ups', muscle: 'Back', type: 'Repetition', equipment: 'Pull-up Bar', instructions: 'Palms facing each other.', purpose: 'Bicep and back.' },
  { id: 'ex15', name: 'Crunches', muscle: 'Core', type: 'Repetition', equipment: 'Bodyweight', instructions: 'Controlled movement, squeeze abs.', purpose: 'Upper abs.' },
  { id: 'ex16', name: 'Leg Raises', muscle: 'Core', type: 'Repetition', equipment: 'Bodyweight', instructions: 'Engage lower abs, don\'t arch back.', purpose: 'Lower abs.' },
  { id: 'ex17', name: 'Plank', muscle: 'Core', type: 'Timed', equipment: 'Bodyweight', instructions: 'Keep back straight, engage core.', purpose: 'Core stability.' },
  { id: 'ex18', name: 'Mountain Climbers', muscle: 'Core', type: 'Repetition', equipment: 'Bodyweight', instructions: 'Fast pace, knees to chest.', purpose: 'Cardio core.' },
  { id: 'ex19', name: 'Flutter Kicks', muscle: 'Core', type: 'Repetition', equipment: 'Bodyweight', instructions: 'Controlled core movement.', purpose: 'Lower abs.' },
  { id: 'ex20', name: 'Hanging Leg Raises', muscle: 'Core', type: 'Repetition', equipment: 'Pull-up Bar', instructions: 'Keep legs straight.', purpose: 'Elite core strength.' },
  { id: 'ex21', name: 'Superman Hold', muscle: 'Core', type: 'Timed', equipment: 'Bodyweight', instructions: 'Strengthen lower back.', purpose: 'Posterior chain.' },
  { id: 'ex22', name: 'Side Plank', muscle: 'Core', type: 'Timed', equipment: 'Bodyweight', instructions: 'Obliques focus.', purpose: 'Lateral stability.' },
  { id: 'ex23', name: 'Russian Twists', muscle: 'Core', type: 'Repetition', equipment: 'Bodyweight', instructions: 'Controlled rotation.', purpose: 'Obliques.' },
  { id: 'ex24', name: 'Pike Push-ups', muscle: 'Shoulders', type: 'Repetition', equipment: 'Bodyweight', instructions: 'Shoulders over wrists.', purpose: 'Shoulder power.' },
  { id: 'ex25', name: 'Dumbbell Shoulder Press', muscle: 'Shoulders', type: 'Repetition', equipment: 'Dumbbells', instructions: 'Or backpack press.', purpose: 'Deltoid growth.' },
  { id: 'ex26', name: 'Lateral Raises', muscle: 'Shoulders', type: 'Repetition', equipment: 'Dumbbells', instructions: 'Light weight, controlled.', purpose: 'Shoulder width.' },
  { id: 'ex27', name: 'Front Raises', muscle: 'Shoulders', type: 'Repetition', equipment: 'Dumbbells', instructions: 'Keep arms straight.', purpose: 'Front delts.' },
  { id: 'ex28', name: 'Bicep Curls', muscle: 'Arms', type: 'Repetition', equipment: 'Dumbbells', instructions: 'Dumbbells or backpack.', purpose: 'Bicep isolation.' },
  { id: 'ex29', name: 'Hammer Curls', muscle: 'Arms', type: 'Repetition', equipment: 'Dumbbells', instructions: 'Neutral grip.', purpose: 'Brachialis focus.' },
  { id: 'ex30', name: 'Tricep Dips', muscle: 'Arms', type: 'Repetition', equipment: 'Bench or Chair', instructions: 'Focus on lockout.', purpose: 'Tricep power.' },
  { id: 'ex31', name: 'Close-Grip Push-ups', muscle: 'Arms', type: 'Repetition', equipment: 'Bodyweight', instructions: 'Triceps focus.', purpose: 'Arm strength.' },
  { id: 'ex32', name: 'Burpees', muscle: 'Full Body', type: 'Repetition', equipment: 'Bodyweight', instructions: 'Explosive movement.', purpose: 'Full body burn.' },
  { id: 'ex33', name: 'Jump Lunges', muscle: 'Legs', type: 'Repetition', equipment: 'Bodyweight', instructions: 'Alternate legs, explosive.', purpose: 'Leg power.' },
  { id: 'ex34', name: 'Hollow Body Hold', muscle: 'Core', type: 'Timed', equipment: 'Bodyweight', instructions: 'Lower back pressed to floor, limbs hovering.', purpose: 'Core compression.' },
  { id: 'ex35', name: 'V-Ups', muscle: 'Core', type: 'Repetition', equipment: 'Bodyweight', instructions: 'Meet hands and feet at top.', purpose: 'Explosive core strength.' },
  { id: 'ex36', name: 'Dragon Flag (Negatives)', muscle: 'Core', type: 'Repetition', equipment: 'Bench/Bar', instructions: 'Lower body slowly as one unit.', purpose: 'Elite core stability.' },
  { id: 'ex37', name: 'Archer Push-ups', muscle: 'Chest', type: 'Repetition', equipment: 'Bodyweight', instructions: 'One arm straight, one arm pushing.', purpose: 'Unilateral chest power.' },
  { id: 'ex38', name: 'Superman Hold', muscle: 'Core', type: 'Timed', equipment: 'Bodyweight', instructions: 'Lift chest and legs, hold.', purpose: 'Lower back strength.' },
];

export const DEFAULT_SCHEDULE = {
  1: { name: 'Chest + Abs (Strength)', exercises: [
    { id: 'ex1', name: 'Push-ups', targetSets: 4, targetReps: 15, muscle: 'Chest' },
    { id: 'ex2', name: 'Incline Push-ups', targetSets: 3, targetReps: 12, muscle: 'Chest' },
    { id: 'ex3', name: 'Bench Dips', targetSets: 3, targetReps: 10, muscle: 'Arms' },
    { id: 'ex4', name: 'Diamond Push-ups', targetSets: 3, targetReps: 10, muscle: 'Chest' },
    { id: 'ex15', name: 'Crunches', targetSets: 3, targetReps: 20, muscle: 'Core' },
    { id: 'ex16', name: 'Leg Raises', targetSets: 3, targetReps: 15, muscle: 'Core' },
    { id: 'ex17', name: 'Plank', targetSets: 3, targetReps: 45, muscle: 'Core' },
  ]},
  2: { name: 'Legs + Abs (Power)', exercises: [
    { id: 'ex5', name: 'Jump Squats', targetSets: 4, targetReps: 15, muscle: 'Legs' },
    { id: 'ex6', name: 'Forward Lunges', targetSets: 3, targetReps: 12, muscle: 'Legs' },
    { id: 'ex7', name: 'Bulgarian Split Squats', targetSets: 3, targetReps: 10, muscle: 'Legs' },
    { id: 'ex8', name: 'Calf Raises', targetSets: 3, targetReps: 20, muscle: 'Legs' },
    { id: 'ex9', name: 'Wall Sit', targetSets: 3, targetReps: 60, muscle: 'Legs' },
    { id: 'ex18', name: 'Mountain Climbers', targetSets: 3, targetReps: 30, muscle: 'Core' },
    { id: 'ex19', name: 'Flutter Kicks', targetSets: 3, targetReps: 20, muscle: 'Core' },
  ]},
  3: { name: 'Back + Core (Pull-Up Day 1)', exercises: [
    { id: 'ex10', name: 'Wide-Grip Pull-ups', targetSets: 4, targetReps: 8, muscle: 'Back' },
    { id: 'ex11', name: 'Chin-ups', targetSets: 3, targetReps: 10, muscle: 'Back' },
    { id: 'ex20', name: 'Hanging Leg Raises', targetSets: 3, targetReps: 12, muscle: 'Core' },
    { id: 'ex12', name: 'Inverted Rows', targetSets: 3, targetReps: 12, muscle: 'Back' },
    { id: 'ex21', name: 'Superman Hold', targetSets: 3, targetReps: 45, muscle: 'Core' },
    { id: 'ex22', name: 'Side Plank', targetSets: 3, targetReps: 30, muscle: 'Core' },
    { id: 'ex23', name: 'Russian Twists', targetSets: 3, targetReps: 20, muscle: 'Core' },
  ]},
  4: { name: 'Shoulders + Abs (Volume)', exercises: [
    { id: 'ex24', name: 'Pike Push-ups', targetSets: 4, targetReps: 12, muscle: 'Shoulders' },
    { id: 'ex25', name: 'Dumbbell Shoulder Press', targetSets: 3, targetReps: 12, muscle: 'Shoulders' },
    { id: 'ex26', name: 'Lateral Raises', targetSets: 3, targetReps: 15, muscle: 'Shoulders' },
    { id: 'ex27', name: 'Front Raises', targetSets: 3, targetReps: 15, muscle: 'Shoulders' },
    { id: 'ex17', name: 'Plank Shoulder Taps', targetSets: 3, targetReps: 20, muscle: 'Core' },
    { id: 'ex16', name: 'Lying Leg Raises', targetSets: 3, targetReps: 15, muscle: 'Core' },
    { id: 'ex15', name: 'Sit-ups', targetSets: 3, targetReps: 20, muscle: 'Core' },
  ]},
  5: { name: 'Arms + Core (Detail)', exercises: [
    { id: 'ex28', name: 'Bicep Curls', targetSets: 3, targetReps: 12, muscle: 'Arms' },
    { id: 'ex29', name: 'Hammer Curls', targetSets: 3, targetReps: 12, muscle: 'Arms' },
    { id: 'ex30', name: 'Tricep Dips', targetSets: 3, targetReps: 10, muscle: 'Arms' },
    { id: 'ex31', name: 'Close-Grip Push-ups', targetSets: 3, targetReps: 10, muscle: 'Arms' },
    { id: 'ex18', name: 'Toe Touches', targetSets: 3, targetReps: 20, muscle: 'Core' },
    { id: 'ex23', name: 'Bicycle Crunches', targetSets: 3, targetReps: 25, muscle: 'Core' },
    { id: 'ex17', name: 'Forearm Plank', targetSets: 3, targetReps: 60, muscle: 'Core' },
  ]},
  6: { name: 'Full Body + Pull-Up Volume (Day 2)', exercises: [
    { id: 'ex13', name: 'Pull-up Ladder', targetSets: 6, targetReps: 1, muscle: 'Back' },
    { id: 'ex14', name: 'Neutral-Grip Pull-ups', targetSets: 3, targetReps: 8, muscle: 'Back' },
    { id: 'ex32', name: 'Burpees', targetSets: 3, targetReps: 15, muscle: 'Full Body' },
    { id: 'ex33', name: 'Jump Lunges', targetSets: 3, targetReps: 12, muscle: 'Legs' },
    { id: 'ex1', name: 'Push-ups', targetSets: 3, targetReps: 15, muscle: 'Chest' },
    { id: 'ex5', name: 'Jump Squats', targetSets: 3, targetReps: 20, muscle: 'Legs' },
    { id: 'ex20', name: 'Ab Circuit', targetSets: 2, targetReps: 1, muscle: 'Core' },
  ]},
  0: { name: 'Active Rest / Recovery', exercises: [
    { id: 'ex34', name: 'Light Jog / Walk', targetSets: 1, targetReps: 45, muscle: 'Cardio' },
    { id: 'ex35', name: 'Yoga / Stretching', targetSets: 1, targetReps: 30, muscle: 'Flexibility' },
  ]}
};

export const WORKOUT_TEMPLATES = [
  { id: 't1', name: 'Push Day', emoji: '💪', exercises: ['Bench Press', 'Shoulder Press', 'Lateral Raise', 'Push Up', 'Tricep Dip'] },
  { id: 't2', name: 'Pull Day', emoji: '🦾', exercises: ['Pull Up', 'Deadlift', 'Cable Row', 'Dumbbell Row', 'Bicep Curl'] },
  { id: 't3', name: 'Leg Day', emoji: '🦵', exercises: ['Squat', 'Leg Press', 'Romanian Deadlift', 'Lunges', 'Crunches'] },
  { id: 't4', name: 'Full Body', emoji: '🏋️', exercises: ['Squat', 'Bench Press', 'Deadlift', 'Shoulder Press', 'Pull Up'] },
  { id: 't5', name: 'Cardio', emoji: '🏃', exercises: ['Running', 'Cycling', 'Plank', 'Crunches'] },
  { id: 't6', name: 'Core Blast', emoji: '🔥', exercises: ['Plank', 'Crunches', 'Lunges', 'Push Up'] },
];

export const calculateLevel = (xp) => calculateLevelInfo(xp);

// Tactical Selector for Operative Progression
export const getLevelInfo = (state) => calculateLevelInfo(state.gamification?.xp || 0);


const createTask = (overrides = {}) => ({
  id: uuidv4(), title: '', description: '', priority: 'Medium', category: 'Work',
  dueTime: '', completed: false, progress: 0, createdAt: new Date().toISOString(),
  completedAt: null, date: today(), order: 0, isRoutine: false, timeTaken: 0,
  estimatedTime: 0, // In minutes
  ...overrides,
});

const createSet = (overrides = {}) => ({ id: uuidv4(), weight: '', reps: '', completed: false, ...overrides });

const defaultState = {
  theme: 'dark',
  tasks: {},
  submittedDays: {},
  analytics: {},
  gamification: { xp: 0, streak: 0, lastActiveDate: null, achievements: [], gymStreak: 0, lastGymDate: null, xpTransactions: [] },
  walkingLogs: {},
  pomodoro: { 
    running: false, 
    mode: 'focus', 
    timeLeft: 25 * 60, 
    totalDuration: 25 * 60,
    targetEndTime: null, 
    sessions: 0, 
    linkedTaskId: null,
    history: [],
    totalFocusSeconds: 0
  },
  lastSyncTimestamp: null,
  pendingSync: false,
  journal: {},
  settings: { 
    pomodoroFocus: 25, 
    pomodoroShortBreak: 5, 
    pomodoroLongBreak: 15, 
    notifications: true, 
    motivationalQuotes: true, 
    sound: true,
    notificationSound: 'Default Pulse',
    syncInterval: 5,
    autoSave: true,
    adjustCalorieTargetWithActivity: false
  },
  activeDate: today(),
  currentPage: localStorage.getItem('NeuralOS_activePage') || 'dashboard',
  isSleeping: false,
  sidebarCollapsed: false,
  navHistory: ['dashboard'],
  focusMode: false,
  user: null,
  authLoading: true,
  activeTimer: null, // { id, type, startTime, date }

  // Routines
  routines: [],
  appliedRoutines: {},
  dismissedRoutines: {},

  // Habits
  habits: [
    { id: 'h1', name: 'Morning Hydration', icon: '💧', color: '#38bdf8', category: 'Health', target: 500, unit: 'ml', frequency: 'daily', scheduledDays: [0, 1, 2, 3, 4, 5, 6], archived: false, createdAt: new Date().toISOString() },
    { id: 'h2', name: 'Read Book / Learn', icon: '📖', color: '#a78bfa', category: 'Learning', target: 20, unit: 'minutes', frequency: 'daily', scheduledDays: [0, 1, 2, 3, 4, 5, 6], archived: false, createdAt: new Date().toISOString() },
    { id: 'h3', name: 'Physical Conditioning', icon: '💪', color: '#f59e0b', category: 'Fitness', target: 45, unit: 'minutes', frequency: 'weekdays', scheduledDays: [1, 2, 3, 4, 5], archived: false, createdAt: new Date().toISOString() },
  ],
  habitLogs: {},

  waterLogs: {},
  waterGoal: 8,
  waterSchedule: INITIAL_WATER_SCHEDULE,
  waterCompletions: {},
  moodLogs: {},
  sleepLogs: {},
  energyLogs: {},
  personalRecords: [],
  bodyMetrics: {},
  missionNotes: {},
  quickNotes: {},
  dailyFocus: {},
  achievements: [],
  workouts: {},
  exerciseLibrary: [],
  gymActiveDate: today(),
  gymSchedule: DEFAULT_SCHEDULE,
  gymScheduleEnabled: true,
  activeGymTab: 'workout',
  restTimer: { duration: 60, timeLeft: 0, running: false, sound: true },

  // Diet OS Slices
  dietEntries: {},
  customFoods: [],
  savedMeals: [],
  recipes: [],
  favoriteFoods: [],
  dietGoals: {
    age: 25,
    gender: 'male',
    weightKg: 70,
    heightCm: 175,
    activityLevel: 'moderately_active',
    goalType: 'muscle_gain',
    calories: 2200,
    protein: 130,
    carbs: 250,
    fat: 65,
    fiber: 30,
    waterGoalMl: 3000,
    isAutoCalculated: true
  },
  dietActiveDate: today(),

  syncLocked: true,
  isDataLoaded: false,
  syncError: null,

  // Admin & Security
  adminLogs: [],
  adminSimulation: false,
};

export const useStore = create(
  persist(
    immer((set, get) => ({
      ...defaultState,

      // --- Theme ---
      toggleTheme: () => set((s) => { s.theme = s.theme === 'dark' ? 'light' : 'dark'; }),

      // --- Auth ---
      login: async (email, password) => {
        await signInWithEmailAndPassword(auth, email, password);
      },
      isNewUser: false,
      signup: async (email, password, profileData) => {
        let user;
        let isExistingAccount = false;
        try {
          const res = await createUserWithEmailAndPassword(auth, email, password);
          user = res.user;
        } catch (e) {
          if (e.code === 'auth/email-already-in-use') {
            // Sign in to restore existing profile without overwriting data
            const res = await signInWithEmailAndPassword(auth, email, password);
            user = res.user;
            isExistingAccount = true;
          } else {
            throw e;
          }
        }

        const userRef = doc(db, 'users', user.uid);
        let userData;

        if (isExistingAccount) {
          // Fetch existing user doc to protect XP, level, and achievements from being wiped
          const existingSnap = await getDoc(userRef).catch(() => null);
          const existingData = existingSnap?.exists() ? existingSnap.data() : {};
          userData = {
            uid: user.uid,
            email,
            ...profileData,
            ...existingData, // Preserve existing data
            updatedAt: new Date().toISOString()
          };
          await setDoc(userRef, userData, { merge: true });
        } else {
          userData = {
            uid: user.uid,
            email,
            ...profileData,
            createdAt: new Date().toISOString(),
            xp: 0,
            level: 1,
            streak: 0,
            achievements: []
          };
          await setDoc(userRef, userData, { merge: true });
          set((s) => { s.isNewUser = true; });
        }

        return userData;
      },
      requestPasswordReset: async (email) => {
        await sendPasswordResetEmail(auth, email);
      },
      dismissWelcome: () => set((s) => { s.isNewUser = false; }),
      logout: () => {
        signOut(auth);
        set((s) => { 
          Object.assign(s, defaultState);
          s.user = null;
          s.authLoading = false;
          s.isNewUser = false;
        });
      },
      loginGuest: (guestName = 'Operative') => set((s) => {
        s.user = {
          uid: 'guest_local_user',
          email: 'operative@taskbar.local',
          username: guestName.toLowerCase().replace(/\s+/g, '_'),
          fullName: guestName,
          isGuest: true,
          role: 'user',
          customClaims: {}
        };
        s.isDataLoaded = true;
        s.syncLocked = true;
        s.authLoading = false;
        s.syncError = null;
      }),
      loginAsTestAccount: (role = 'admin') => set((s) => {
        const testProfiles = {
          admin: {
            uid: 'test_admin',
            email: 'admin@taskbar.local',
            username: 'administrator',
            fullName: 'Platform Administrator',
            role: 'admin',
            customClaims: { admin: true, role: 'ADMIN' },
            isGuest: true
          },
          user: {
            uid: 'test_standard_user',
            email: 'user@taskbar.local',
            username: 'standard_user',
            fullName: 'Standard User',
            role: 'user',
            customClaims: { admin: false, role: 'USER' },
            isGuest: true
          }
        };

        const targetProfile = (role === 'admin' || role === 'super_admin') ? testProfiles.admin : testProfiles.user;
        Object.assign(s, defaultState);
        s.user = targetProfile;
        s.isDataLoaded = true;
        s.syncLocked = true;
        s.authLoading = false;
        s.syncError = null;
        s.currentPage = role === 'user' ? 'dashboard' : 'admin';
      }),
      wipeDatabaseAndReset: () => set((s) => {
        Object.assign(s, defaultState);
        s.user = null;
        s.isDataLoaded = true;
        s.syncLocked = false;
        s.authLoading = false;
        s.currentPage = 'dashboard';
      }),
      setUser: (user) => set((s) => { 
        if (user && s.user?.uid !== user.uid) {
          Object.assign(s, { ...defaultState, syncLocked: true, isDataLoaded: false });
        }
        s.user = user; 
        s.authLoading = false; 
      }),
      updateUserPassword: async (newPassword) => {
        if (!auth.currentUser) throw new Error('No active operative found');
        await updatePassword(auth.currentUser, newPassword);
      },
      updateProfile: async (updates) => {
        const currentUser = get().user;
        if (!currentUser) throw new Error('No active operative found');
        await updateDoc(doc(db, 'users', currentUser.uid), updates);
        set((s) => {
          if (s.user) Object.assign(s.user, updates);
        });
      },
      setAuthLoading: (loading) => set((s) => { s.authLoading = loading; }),
      setHasHydrated: (val) => set((s) => { s._hasHydrated = val; }),

      // --- Navigation ---
      setPage: (page) => set((s) => { 
        if (s.currentPage !== page) {
          s.navHistory.push(page);
          if (s.navHistory.length > 20) s.navHistory.shift(); // Mission limit
        }
        s.currentPage = page; 
        localStorage.setItem('NeuralOS_activePage', page);
      }),
      goBack: () => set((s) => {
        if (s.navHistory.length > 1) {
          s.navHistory.pop(); // Remove current
          const prev = s.navHistory[s.navHistory.length - 1];
          s.currentPage = prev;
          localStorage.setItem('NeuralOS_activePage', prev);
          return true;
        }
        return false;
      }),
      setSleeping: (v) => set((s) => { s.isSleeping = v; }),
      setActiveDate: (date) => set((s) => { s.activeDate = date; }),
      addAchievement: (title, icon, color) => set((s) => {
        const ach = { id: uuidv4(), date: today(), title, icon, color };
        s.achievements.unshift(ach);
        toast.success(`Achievement Unlocked: ${title} 🏆`, {
          style: { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--accent-primary)', fontWeight: 900 }
        });
      }),
      setGymActiveDate: (date) => set((s) => { s.gymActiveDate = date; }),
      getLevelInfo: () => calculateLevel(get().gamification?.xp || 0),
      toggleSidebar: () => set((s) => { s.sidebarCollapsed = !s.sidebarCollapsed; }),
      toggleFocusMode: () => set((s) => { s.focusMode = !s.focusMode; }),

      // --- Tasks ---
      getTasksForDate: (date) => {
        const tasks = get().tasks[date] || [];
        return [...tasks].sort((a, b) => a.order - b.order);
      },
      addTask: (taskData, date) => set((s) => {
        const d = date || s.activeDate;
        if (!s.tasks[d]) s.tasks[d] = [];
        s.tasks[d].push(createTask({ ...taskData, date: d, order: s.tasks[d].length }));
      }),
      updateTask: (taskId, date, updates) => set((s) => {
        let targetDate = date;
        if (!targetDate || !s.tasks[targetDate]?.some(t => t.id === taskId)) {
          targetDate = Object.keys(s.tasks).find(d => s.tasks[d]?.some(t => t.id === taskId));
        }
        if (!targetDate || !s.tasks[targetDate]) return;
        const tasks = s.tasks[targetDate];
        const idx = tasks.findIndex((t) => t.id === taskId); if (idx === -1) return;
        Object.assign(tasks[idx], updates);
      }),
      deleteTask: (taskId, date) => set((s) => {
        let targetDate = date;
        if (!targetDate || !s.tasks[targetDate]?.some(t => t.id === taskId)) {
          targetDate = Object.keys(s.tasks).find(d => s.tasks[d]?.some(t => t.id === taskId));
        }
        if (!targetDate || !s.tasks[targetDate]) return;

        const taskToDelete = s.tasks[targetDate].find((t) => t.id === taskId);
        if (s.activeTimer?.id === taskId) s.activeTimer = null;
        s.tasks[targetDate] = s.tasks[targetDate].filter((t) => t.id !== taskId);

        // If this task was generated from a routine, blacklist this routine instance for this date so it will not regenerate
        if (taskToDelete?.isRoutine && taskToDelete?.routineId) {
          if (!s.dismissedRoutines) s.dismissedRoutines = {};
          if (!s.dismissedRoutines[targetDate]) s.dismissedRoutines[targetDate] = [];
          if (!s.dismissedRoutines[targetDate].includes(taskToDelete.routineId)) {
            s.dismissedRoutines[targetDate].push(taskToDelete.routineId);
          }
        }
      }),
      duplicateTask: (taskId, date) => set((s) => {
        let targetDate = date;
        if (!targetDate || !s.tasks[targetDate]?.some(t => t.id === taskId)) {
          targetDate = Object.keys(s.tasks).find(d => s.tasks[d]?.some(t => t.id === taskId));
        }
        if (!targetDate || !s.tasks[targetDate]) return;
        const tasks = s.tasks[targetDate];
        const task = tasks.find((t) => t.id === taskId); if (!task) return;
        s.tasks[targetDate].push(createTask({ ...task, id: uuidv4(), completed: false, completedAt: null, createdAt: new Date().toISOString(), order: tasks.length }));
      }),
      reorderTasks: (date, orderedIds) => set((s) => {
        if (!s.tasks[date]) return;
        const taskMap = Object.fromEntries(s.tasks[date].map((t) => [t.id, t]));
        s.tasks[date] = orderedIds.map((id, idx) => ({ ...taskMap[id], order: idx }));
      }),
      toggleTaskComplete: (taskId, date) => set((s) => {
        let targetDate = date;
        if (!targetDate || !s.tasks[targetDate]?.some(t => t.id === taskId)) {
          targetDate = Object.keys(s.tasks).find(d => s.tasks[d]?.some(t => t.id === taskId));
        }
        if (!targetDate || !s.tasks[targetDate]) return;
        const tasks = s.tasks[targetDate];
        const task = tasks.find((t) => t.id === taskId); if (!task) return;
        
        // If it's the active timer, stop it first
        if (s.activeTimer?.id === taskId) {
          const elapsed = Math.floor((Date.now() - s.activeTimer.startTime) / 1000);
          task.timeTaken = (task.timeTaken || 0) + elapsed;
          s.activeTimer = null;
        }

        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;
        if (task.completed) task.progress = 100;

        // Idempotent XP logic with Streak Multiplier via Authoritative Engine
        const sourceId = `task:${task.id}:${targetDate}`;
        if (!s.gamification.xpTransactions) s.gamification.xpTransactions = [];

        if (task.completed) {
          const streak = s.gamification.streak || 0;
          const multiplier = streak >= 7 ? 1.5 : streak >= 3 ? 1.2 : 1.0;
          const baseXP = PRIORITY_XP[task.priority] || 10;
          const xpDelta = Math.round(baseXP * multiplier);

          const res = processXpAward(s.gamification.xpTransactions, {
            amount: xpDelta,
            category: task.category || 'Work',
            description: `Completed task: ${task.title || task.text || 'Mission'}`,
            sourceId,
            date
          });

          if (res.allowed && res.transaction) {
            const prevLvl = calculateLevelInfo(s.gamification.xp || 0).level;
            s.gamification.xpTransactions.unshift(res.transaction);
            s.gamification.xp = (s.gamification.xp || 0) + res.transaction.amount;
            const newLvl = calculateLevelInfo(s.gamification.xp).level;

            if (multiplier > 1) {
              toast.success(`Discipline Multiplier (${multiplier}x)! +${xpDelta} XP`, { icon: '🔥' });
            } else {
              toast.success(`Task Complete! +${xpDelta} XP`, { icon: '🎯' });
            }

            if (newLvl > prevLvl) {
              toast.success(`RANK PROMOTION! Level ${newLvl} achieved 🎉`, {
                duration: 5000,
                style: { background: '#10b981', color: '#fff', fontWeight: 900 }
              });
            }
          }
        } else {
          // Reopening task: audit reversal in ledger
          const rev = processXpReversal(s.gamification.xpTransactions, sourceId, 'Task Reopened');
          if (rev.allowed && rev.transaction) {
            s.gamification.xpTransactions.unshift(rev.transaction);
            s.gamification.xp = Math.max(0, (s.gamification.xp || 0) - rev.amount);
            toast('Task reopened — XP reversed.', { icon: '↩️' });
          }
        }

        if (task.completed) {
          const todayStr = today();
          if (s.gamification.lastActiveDate !== todayStr) {
            const last = s.gamification.lastActiveDate;
            if (last) {
              const diff = differenceInDays(parseISO(todayStr), parseISO(last));
              s.gamification.streak = diff === 1 ? s.gamification.streak + 1 : diff === 0 ? s.gamification.streak : 1;
            } else { s.gamification.streak = 1; }
            s.gamification.lastActiveDate = todayStr;
          }
        }
      }),

      startTimer: (id, type, date) => set((s) => {
        // If there's an active timer, stop it first to prevent orphans
        if (s.activeTimer) {
          const { id: oldId, type: oldType, startTime, date: oldDate } = s.activeTimer;
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          
          if (oldType === 'task' && oldDate) {
            const task = s.tasks[oldDate]?.find(t => t.id === oldId);
            if (task) task.timeTaken = (task.timeTaken || 0) + elapsed;
          } else if (oldType === 'exercise' && oldDate) {
            const ex = s.workouts[oldDate]?.exercises.find(e => e.id === oldId);
            if (ex) ex.timeTaken = (ex.timeTaken || 0) + elapsed;
          }
        }
        
        s.activeTimer = { id, type, startTime: Date.now(), date };
      }),

      stopTimer: () => set((s) => {
        if (!s.activeTimer) return;
        const { id, type, startTime, date } = s.activeTimer;
        const elapsed = Math.floor((Date.now() - startTime) / 1000);

        if (type === 'task') {
          const tasks = s.tasks[date];
          const task = tasks?.find(t => t.id === id);
          if (task) {
            task.timeTaken = (task.timeTaken || 0) + elapsed;
            task.completed = true;
            task.completedAt = new Date().toISOString();
            task.progress = 100;
            // XP logic with Streak Multiplier
            if (!s.gamification.xpTransactions) s.gamification.xpTransactions = [];
            const streak = s.gamification.streak || 0;
            const multiplier = streak >= 7 ? 1.5 : streak >= 3 ? 1.2 : 1.0;
            const baseXP = PRIORITY_XP[task.priority] || 10;
            const xpDelta = Math.round(baseXP * multiplier);
            const sourceId = `task:${task.id}:${date}`;
            const awardRes = processXpAward(s.gamification.xpTransactions, {
              amount: xpDelta,
              category: 'Task',
              description: `Task completed via timer: ${task.title}${multiplier > 1 ? ` (${multiplier}x bonus)` : ''}`,
              sourceId,
              date
            });
            if (awardRes.allowed && awardRes.transaction) {
              s.gamification.xpTransactions.unshift(awardRes.transaction);
              s.gamification.xp = (s.gamification.xp || 0) + awardRes.transaction.amount;
              if (multiplier > 1) {
                toast.success(`Discipline Multiplier Active (${multiplier}x)! +${xpDelta} XP`, { icon: '🔥' });
              }
            }
          }
        } else if (type === 'exercise') {
          const workout = s.workouts[date];
          const ex = workout?.exercises.find(e => e.id === id);
          if (ex) {
            ex.timeTaken = (ex.timeTaken || 0) + elapsed;
            ex.completed = true;
          }
        }

        s.activeTimer = null;
      }),

      // Force-clear a stuck timer without side effects (emergency unlock)
      clearActiveTimer: () => set((s) => {
        s.activeTimer = null;
      }),

      // --- ROUTINES ---
      addRoutine: (data) => set((s) => { 
        s.routines.push({ 
          id: uuidv4(), 
          ...data, 
          days: data.days || [0, 1, 2, 3, 4, 5, 6], 
          enabled: true, 
          createdAt: new Date().toISOString() 
        }); 
      }),
      updateRoutine: (id, updates) => set((s) => { 
        const r = s.routines.find(r => r.id === id); 
        if (r) {
          Object.assign(r, updates);
          // Sync existing tasks for the active date if they exist
          const activeTasks = s.tasks[s.activeDate] || [];
          activeTasks.forEach(t => {
            if (t.isRoutine && t.routineId === id) {
              t.title = updates.title || t.title;
              t.description = updates.description || t.description;
              t.priority = updates.priority || t.priority;
              t.category = updates.category || t.category;
              t.dueTime = updates.dueTime || t.dueTime;
            }
          });
        }
      }),
      deleteRoutine: (id) => set((s) => { 
        s.routines = s.routines.filter(r => r.id !== id);
        
        // REFINED DELETION: Only remove UNCOMPLETED tasks for today and the future
        // We preserve historical data (completed tasks) to maintain XP and analytics integrity.
        const todayStr = today();
        Object.keys(s.tasks).forEach(date => {
          if (date >= todayStr) {
            s.tasks[date] = s.tasks[date].filter(t => 
              !t.isRoutine || t.routineId !== id || t.completed
            );
          }
        });
      }),
      toggleRoutine: (id) => set((s) => { 
        const r = s.routines.find(r => r.id === id); 
        if (r) {
          r.enabled = !r.enabled;
          
          // If paused, surgically remove UNCOMPLETED tasks for today and future
          if (!r.enabled) {
            const todayStr = today();
            Object.keys(s.tasks).forEach(date => {
              if (date >= todayStr) {
                s.tasks[date] = s.tasks[date].filter(t => 
                  !t.isRoutine || t.routineId !== id || t.completed
                );
              }
            });
          }
          // If resumed, immediately attempt to apply to today for instant feedback
          if (r.enabled) {
            const todayStr = today();
            // We can't call s.applyRoutinesToDate(todayStr) directly because 's' is the draft
            // But we can replicate the logic or call the method if we structure it right.
            // In Zustand with Immer, it's better to just replicate the logic or ensure the component re-runs it.
            // Actually, the easiest way is to just let the component handle the re-render or do it here.
            
            const dow = new Date(todayStr + 'T12:00:00').getDay();
            if ((r.days || [0,1,2,3,4,5,6]).includes(dow)) {
              if (!s.tasks[todayStr]) s.tasks[todayStr] = [];
              const exists = s.tasks[todayStr].some(t => t.isRoutine && t.routineId === id);
              if (!exists) {
                s.tasks[todayStr].push(createTask({ 
                  title: r.title, 
                  description: r.description, 
                  priority: r.priority, 
                  category: r.category, 
                  dueTime: r.dueTime, 
                  date: todayStr, 
                  isRoutine: true, 
                  routineId: r.id, 
                  order: s.tasks[todayStr].length 
                }));
              }
            }
          }
        }
      }),
      applyRoutinesToDate: (date) => set((s) => {
        const todayStr = today();
        if (date < todayStr) return; // Mission protocol: Only apply to active or future dates
        
        const dow = new Date(date + 'T12:00:00').getDay();
        const enabled = s.routines.filter(r => r.enabled && (r.days || [0,1,2,3,4,5,6]).includes(dow));
        
        if (!s.tasks[date]) s.tasks[date] = [];
        const existingIds = new Set(s.tasks[date].filter(t => t.isRoutine).map(t => t.routineId));
        const dismissed = new Set(s.dismissedRoutines?.[date] || []);
        
        enabled.forEach(r => {
          if (!existingIds.has(r.id) && !dismissed.has(r.id)) {
            s.tasks[date].push(createTask({ 
              title: r.title, 
              description: r.description, 
              priority: r.priority, 
              category: r.category, 
              dueTime: r.dueTime, 
              date, 
              isRoutine: true, 
              routineId: r.id, 
              order: s.tasks[date].length 
            }));
          }
        });
        s.appliedRoutines[date] = true;
      }),

      getRoutineStats: () => {
        const s = get();
        let totalCreated = 0;
        let totalCompleted = 0;
        Object.values(s.tasks).forEach(dayTasks => {
          dayTasks.forEach(t => {
            if (t.isRoutine) {
              totalCreated++;
              if (t.completed) totalCompleted++;
            }
          });
        });
        return { totalCreated, totalCompleted, activeProtocols: s.routines.filter(r => r.enabled).length };
      },

      // --- HYDRATION ---
      logWater: (date, glasses) => set((s) => { s.waterLogs[date] = Math.max(0, Math.min(20, glasses)); }),
      setWaterGoal: (goal) => set((s) => { s.waterGoal = goal; }),
      getHydrationStats: (date) => {
        const s = get();
        const completions = s.waterCompletions[date] || {};
        // VALIDATION PROTOCOL: Only count completions for items that exist in the current schedule
        const completedCount = s.waterSchedule.filter(item => completions[item.id]).length;
        return { completed: completedCount, goal: s.waterSchedule.length };
      },
      toggleWaterScheduleItem: (date, itemId) => set((s) => {
        if (!s.waterCompletions[date]) s.waterCompletions[date] = {};
        // IRREVERSIBLE PROTOCOL: Once checked, it cannot be unchecked.
        if (s.waterCompletions[date][itemId]) {
          toast.error('Mission commitment is irreversible! 💧');
          return;
        }
        s.waterCompletions[date][itemId] = true;
        toast.success('Hydration mission complete! 💧');
      }),
      addWaterScheduleItem: (item) => set((s) => {
        s.waterSchedule.push({ id: uuidv4(), ...item });
      }),
      updateWaterScheduleItem: (itemId, updates) => set((s) => {
        const item = s.waterSchedule.find(i => i.id === itemId);
        if (item) Object.assign(item, updates);
      }),
      removeWaterScheduleItem: (itemId) => set((s) => {
        s.waterSchedule = s.waterSchedule.filter(i => i.id !== itemId);
        // SURGICAL PURGE: Remove this item's completion record across all dates
        Object.keys(s.waterCompletions).forEach(date => {
          if (s.waterCompletions[date][itemId] !== undefined) {
            delete s.waterCompletions[date][itemId];
          }
        });
      }),
      getWorkoutStatus: (date) => {
        const s = get();
        const w = s.workouts[date];
        if (w?.completed) return 'Mission Completed 🏆';
        if (w && w.exercises?.some(ex => ex.sets?.some(st => st.completed))) return 'In Progress ⚡';
        
        // Check if it's a scheduled day in the master schedule
        const dow = new Date(date + 'T12:00:00').getDay();
        const sched = s.gymSchedule[dow];
        if (sched && sched.exercises?.length > 0) return 'Scheduled Mission 📅';
        
        return 'Rest Day / No Activity';
      },

      // --- BIO-HACKING: SLEEP & ENERGY ---
      logSleep: (date, data) => set((s) => {
        if (!s.sleepLogs[date]) s.sleepLogs[date] = { start: '22:00', end: '06:00', quality: 5, notes: '' };
        Object.assign(s.sleepLogs[date], data);
      }),
      logEnergy: (date, time, level) => set((s) => {
        if (!s.energyLogs[date]) s.energyLogs[date] = [];
        // Keep only 12 logs per day to avoid bloating
        const existingIdx = s.energyLogs[date].findIndex(l => l.time === time);
        if (existingIdx >= 0) {
          s.energyLogs[date][existingIdx].level = level;
        } else {
          s.energyLogs[date].push({ time, level, timestamp: new Date().toISOString() });
          s.energyLogs[date].sort((a, b) => a.time.localeCompare(b.time));
        }
      }),

      logMood: (date, mood, note) => set((s) => { s.moodLogs[date] = { mood, note: note || '' }; }),
      setQuickNote: (date, text) => set((s) => { s.quickNotes[date] = text; }),
      updateJournal: (date, data) => set((s) => {
        if (!s.journal[date]) s.journal[date] = { text: '', mood: 5, water: 0, sleep: 7 };
        Object.assign(s.journal[date], data);
      }),
      setDailyFocus: (date, text) => set((s) => { s.dailyFocus[date] = text; }),
      
      // --- NEURAL SCRATCHPAD ---
      addQuickNote: (dateOrText, text) => set((s) => {
        let targetDate = today();
        let noteText = '';
        if (text !== undefined) {
          targetDate = dateOrText || today();
          noteText = text;
        } else {
          noteText = dateOrText || '';
        }
        if (!s.quickNotes) s.quickNotes = {};
        if (!s.quickNotes[targetDate]) s.quickNotes[targetDate] = [];
        const id = uuidv4();
        s.quickNotes[targetDate].unshift({ id, text: noteText, timestamp: new Date().toISOString(), color: 'var(--accent-primary)' });
      }),
      deleteQuickNote: (date, id) => set((s) => {
        const targetDate = date || today();
        if (s.quickNotes && s.quickNotes[targetDate]) {
          s.quickNotes[targetDate] = s.quickNotes[targetDate].filter(n => n.id !== id && n.text?.toLowerCase() !== id?.toLowerCase());
        }
      }),
      updateQuickNote: (date, id, text) => set((s) => {
        const note = s.quickNotes[date]?.find(n => n.id === id);
        if (note) note.text = text;
      }),

      // --- SUBMIT DAY ---
      submitDay: (date) => set((s) => {
        const tasks = s.tasks[date] || [];
        const total = tasks.length, completed = tasks.filter(t => t.completed).length;
        const isPerfect = total > 0 && completed === total;
        
        s.submittedDays[date] = true;
        s.analytics[date] = { score: total > 0 ? Math.round((completed / total) * 100) : 0, total, completed, submittedAt: new Date().toISOString() };
        
        // Perfect Mission Bonus
        if (isPerfect) {
          if (!s.gamification.xpTransactions) s.gamification.xpTransactions = [];
          const bonusSourceId = `perfect_day_${date}`;
          const bonusRes = processXpAward(s.gamification.xpTransactions, {
            amount: 250,
            category: 'Mission',
            description: `100% Day Completion Bonus for ${date}`,
            sourceId: bonusSourceId,
            date
          });
          if (bonusRes.allowed && bonusRes.transaction) {
            s.gamification.xpTransactions.unshift(bonusRes.transaction);
            s.gamification.xp = (s.gamification.xp || 0) + bonusRes.transaction.amount;
            toast.success(`MISSION MASTERED: 100% Completion Bonus! +250 XP`, { icon: '🏆', duration: 5000 });
          }
        }

        // Streak Management
        const last = s.gamification.lastActiveDate;
        if (last) {
          const diff = differenceInDays(parseISO(date), parseISO(last));
          if (diff === 1) s.gamification.streak += 1;
          else if (diff > 1) s.gamification.streak = 1;
        } else {
          s.gamification.streak = 1;
        }
        s.gamification.lastActiveDate = date;
      }),
      unlockDay: (date) => set((s) => { delete s.submittedDays[date]; }),
      resetDayTasks: (date) => set((s) => {
        const tasks = s.tasks[date] || [];
        tasks.forEach(t => {
          t.completed = false;
          t.timeTaken = 0;
          t.progress = 0;
        });
        delete s.submittedDays[date];
        if (s.activeTimer?.date === date && s.activeTimer?.type === 'task') {
          s.activeTimer = null;
        }
      }),
      postponeTask: (taskId, fromDate, toDate) => set((s) => {
        let sourceDate = fromDate;
        if (!sourceDate || !s.tasks[sourceDate]?.some(t => t.id === taskId)) {
          sourceDate = Object.keys(s.tasks).find(d => s.tasks[d]?.some(t => t.id === taskId));
        }
        if (!sourceDate || !s.tasks[sourceDate]) return;

        const tasks = s.tasks[sourceDate];
        const taskIdx = tasks.findIndex(t => t.id === taskId);
        if (taskIdx === -1) return;
        const [task] = tasks.splice(taskIdx, 1);
        if (!s.tasks[toDate]) s.tasks[toDate] = [];
        s.tasks[toDate].push({ ...task, date: toDate, completed: false, timeTaken: 0 });

        // If a routine task is moved away from sourceDate, don't resurrect it on sourceDate
        if (task?.isRoutine && task?.routineId) {
          if (!s.dismissedRoutines) s.dismissedRoutines = {};
          if (!s.dismissedRoutines[sourceDate]) s.dismissedRoutines[sourceDate] = [];
          if (!s.dismissedRoutines[sourceDate].includes(task.routineId)) {
            s.dismissedRoutines[sourceDate].push(task.routineId);
          }
        }
      }),
      updateMissionLog: (date, text) => set((s) => {
        if (!s.journal[date]) s.journal[date] = { text: '', mood: 5, water: 0, sleep: 7 };
        s.journal[date].text = text;
      }),
      setTaskReminder: (date, taskId, time) => set((s) => {
        const tasks = s.tasks[date] || [];
        const task = tasks.find(t => t.id === taskId);
        if (task) task.reminderAt = time;
      }),
      addMissionNote: (dateOrText, text) => set((s) => {
        let targetDate = today();
        let noteText = '';
        if (text !== undefined) {
          targetDate = dateOrText || today();
          noteText = text;
        } else {
          noteText = dateOrText || '';
        }
        if (!s.missionNotes) s.missionNotes = {};
        if (!s.missionNotes[targetDate]) s.missionNotes[targetDate] = [];
        s.missionNotes[targetDate].unshift({ id: uuidv4(), text: noteText, timestamp: new Date().toISOString() });
      }),
      deleteMissionNote: (date, noteId) => set((s) => {
        const targetDate = date || today();
        if (s.missionNotes && s.missionNotes[targetDate]) {
          s.missionNotes[targetDate] = s.missionNotes[targetDate].filter(n => n.id !== noteId && n.text?.toLowerCase() !== noteId?.toLowerCase());
        }
      }),
      editMissionNote: (date, noteId, text) => set((s) => {
        const note = s.missionNotes?.[date]?.find(n => n.id === noteId);
        if (note) {
          note.text = text;
          note.timestamp = new Date().toISOString(); 
        }
      }),

      // --- POMODORO (PERSISTENT ABSOLUTE-TIME ARCHITECTURE) ---
      setPomodoroState: (updates) => set((s) => { Object.assign(s.pomodoro, updates); }),

      startPomodoro: (mode, durationMinutes, linkedTaskId = null) => set((s) => {
        const targetMode = mode || s.pomodoro.mode || 'focus';
        const focusMins = s.settings.pomodoroFocus || 25;
        const shortBreakMins = s.settings.pomodoroShortBreak || 5;
        const longBreakMins = s.settings.pomodoroLongBreak || 15;

        const mins = durationMinutes || (targetMode === 'focus' ? focusMins : targetMode === 'short-break' ? shortBreakMins : longBreakMins);
        const totalDuration = mins * 60;
        const now = Date.now();

        s.pomodoro.running = true;
        s.pomodoro.mode = targetMode;
        s.pomodoro.totalDuration = totalDuration;
        s.pomodoro.timeLeft = totalDuration;
        s.pomodoro.targetEndTime = now + (totalDuration * 1000);
        if (linkedTaskId !== null) s.pomodoro.linkedTaskId = linkedTaskId;
      }),

      pausePomodoro: () => set((s) => {
        if (!s.pomodoro.running) return;
        const now = Date.now();
        if (s.pomodoro.targetEndTime) {
          s.pomodoro.timeLeft = Math.max(0, Math.ceil((s.pomodoro.targetEndTime - now) / 1000));
        }
        s.pomodoro.running = false;
        s.pomodoro.targetEndTime = null;
      }),

      resumePomodoro: () => set((s) => {
        if (s.pomodoro.running || s.pomodoro.timeLeft <= 0) return;
        const now = Date.now();
        s.pomodoro.running = true;
        s.pomodoro.targetEndTime = now + (s.pomodoro.timeLeft * 1000);
      }),

      resetPomodoro: () => set((s) => {
        const targetMode = s.pomodoro.mode || 'focus';
        const focusMins = s.settings.pomodoroFocus || 25;
        const shortBreakMins = s.settings.pomodoroShortBreak || 5;
        const longBreakMins = s.settings.pomodoroLongBreak || 15;
        const mins = targetMode === 'focus' ? focusMins : targetMode === 'short-break' ? shortBreakMins : longBreakMins;
        const totalDuration = mins * 60;

        s.pomodoro.running = false;
        s.pomodoro.targetEndTime = null;
        s.pomodoro.timeLeft = totalDuration;
        s.pomodoro.totalDuration = totalDuration;
      }),

      skipPomodoroSession: () => set((s) => {
        const currentMode = s.pomodoro.mode;
        const nextMode = currentMode === 'focus' ? 'short-break' : 'focus';
        const focusMins = s.settings.pomodoroFocus || 25;
        const shortBreakMins = s.settings.pomodoroShortBreak || 5;
        const mins = nextMode === 'focus' ? focusMins : shortBreakMins;
        const totalDuration = mins * 60;

        s.pomodoro.running = false;
        s.pomodoro.targetEndTime = null;
        s.pomodoro.mode = nextMode;
        s.pomodoro.timeLeft = totalDuration;
        s.pomodoro.totalDuration = totalDuration;
      }),

      completePomodoroSession: (sessionId) => set((s) => {
        s.pomodoro.running = false;
        s.pomodoro.targetEndTime = null;
        s.pomodoro.timeLeft = 0;
        
        const isFocus = s.pomodoro.mode === 'focus';
        if (isFocus) {
          s.pomodoro.sessions = (s.pomodoro.sessions || 0) + 1;
          const sessionSecs = s.pomodoro.totalDuration || (25 * 60);
          s.pomodoro.totalFocusSeconds = (s.pomodoro.totalFocusSeconds || 0) + sessionSecs;

          // If linked to a task, update the task's timeTaken
          if (s.pomodoro.linkedTaskId) {
            const todayStr = today();
            const todayTasks = s.tasks[todayStr] || [];
            const linked = todayTasks.find(t => t.id === s.pomodoro.linkedTaskId);
            if (linked) {
              linked.timeTaken = (linked.timeTaken || 0) + sessionSecs;
            }
          }

          // Anti-farming idempotent XP award (+25 XP)
          const sid = sessionId || `focus_${today()}_${Date.now()}`;
          if (!s.gamification.xpTransactions) s.gamification.xpTransactions = [];
          const awardRes = processXpAward(s.gamification.xpTransactions, {
            amount: 25,
            category: 'Focus',
            description: `Completed ${Math.round(sessionSecs / 60)}-minute Focus Session`,
            sourceId: sid
          });
          if (awardRes.allowed && awardRes.transaction) {
            s.gamification.xpTransactions.unshift(awardRes.transaction);
            s.gamification.xp = (s.gamification.xp || 0) + awardRes.transaction.amount;
          }

          if (!s.pomodoro.history) s.pomodoro.history = [];
          s.pomodoro.history.unshift({
            id: sid,
            mode: 'focus',
            durationMinutes: Math.round(sessionSecs / 60),
            completedAt: new Date().toISOString(),
            taskId: s.pomodoro.linkedTaskId
          });
        }
      }),

      // --- HABITS ACTIONS ---
      addHabit: (habitData) => set((s) => {
        if (!s.habits) s.habits = [];
        const newHabit = {
          id: uuidv4(),
          name: habitData.name || 'New Habit',
          icon: habitData.icon || '⭐',
          color: habitData.color || '#6e6aff',
          category: habitData.category || 'Health',
          target: Number(habitData.target) || 1,
          unit: habitData.unit || 'times',
          frequency: habitData.frequency || 'daily',
          scheduledDays: habitData.scheduledDays || [0, 1, 2, 3, 4, 5, 6],
          reminderTime: habitData.reminderTime || '',
          notes: habitData.notes || '',
          archived: false,
          createdAt: new Date().toISOString()
        };
        s.habits.push(newHabit);
      }),

      updateHabit: (id, updates) => set((s) => {
        if (!s.habits) return;
        const habit = s.habits.find(h => h.id === id);
        if (habit) Object.assign(habit, updates);
      }),

      deleteHabit: (id) => set((s) => {
        if (!s.habits) return;
        s.habits = s.habits.filter(h => h.id !== id);
        if (s.habitLogs) {
          Object.keys(s.habitLogs).forEach(dateKey => {
            if (s.habitLogs[dateKey]?.[id] !== undefined) {
              delete s.habitLogs[dateKey][id];
            }
          });
        }
      }),

      toggleArchiveHabit: (id) => set((s) => {
        if (!s.habits) return;
        const habit = s.habits.find(h => h.id === id);
        if (habit) habit.archived = !habit.archived;
      }),

      logHabit: (habitId, date, completed) => set((s) => {
        const d = date || today();
        if (!s.habitLogs) s.habitLogs = {};
        if (!s.habitLogs[d]) s.habitLogs[d] = {};

        const prevDone = !!s.habitLogs[d][habitId];
        const nextDone = completed !== undefined ? Boolean(completed) : !prevDone;
        s.habitLogs[d][habitId] = nextDone;

        const habit = (s.habits || []).find(h => h.id === habitId);
        const habitName = habit?.name || 'Habit';
        const sourceId = `habit:${habitId}:${d}`;
        if (!s.gamification.xpTransactions) s.gamification.xpTransactions = [];

        if (nextDone && !prevDone) {
          const awardRes = processXpAward(s.gamification.xpTransactions, {
            amount: 15,
            category: 'Habit',
            description: `Completed habit: ${habitName}`,
            sourceId,
            date: d
          });
          if (awardRes.allowed && awardRes.transaction) {
            s.gamification.xpTransactions.unshift(awardRes.transaction);
            s.gamification.xp = (s.gamification.xp || 0) + awardRes.transaction.amount;
          }
        } else if (!nextDone && prevDone) {
          const revRes = processXpReversal(s.gamification.xpTransactions, sourceId, 'Habit Unchecked');
          if (revRes.allowed && revRes.transaction) {
            s.gamification.xpTransactions.unshift(revRes.transaction);
            s.gamification.xp = Math.max(0, (s.gamification.xp || 0) - revRes.amount);
          }
        }
      }),

      // --- SETTINGS & DATA ---
      updateSettings: (updates) => set((s) => { Object.assign(s.settings, updates); }),
      
      exportData: (formatType = 'json') => {
        const state = get();
        if (formatType === 'csv') {
          // Flatten tasks to CSV
          const rows = [['Date', 'Title', 'Priority', 'Category', 'Completed', 'TimeTakenSeconds']];
          Object.entries(state.tasks || {}).forEach(([d, list]) => {
            (list || []).forEach(t => {
              rows.push([d, t.title || '', t.priority || 'Medium', t.category || 'Work', t.completed ? 'Yes' : 'No', t.timeTaken || 0]);
            });
          });
          const csvStr = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
          const blob = new Blob([csvStr], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `TaskBar_OS_Tasks_${format(new Date(), 'yyyy-MM-dd')}.csv`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success('Tasks CSV exported successfully! 📂');
          return;
        }

        const exportObj = {
          tasks: state.tasks,
          routines: state.routines,
          habits: state.habits,
          habitLogs: state.habitLogs,
          workouts: state.workouts,
          gamification: state.gamification,
          journal: state.journal,
          waterLogs: state.waterLogs,
          waterSchedule: state.waterSchedule,
          waterCompletions: state.waterCompletions,
          moodLogs: state.moodLogs,
          sleepLogs: state.sleepLogs,
          energyLogs: state.energyLogs,
          walkingLogs: state.walkingLogs,
          bodyMetrics: state.bodyMetrics,
          personalRecords: state.personalRecords,
          exerciseLibrary: state.exerciseLibrary,
          dietEntries: state.dietEntries,
          customFoods: state.customFoods,
          savedMeals: state.savedMeals,
          recipes: state.recipes,
          dietGoals: state.dietGoals,
          pomodoro: state.pomodoro,
          settings: state.settings,
          missionNotes: state.missionNotes,
          submittedDays: state.submittedDays,
          exportDate: new Date().toISOString(),
          version: '1.2.0'
        };
        const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `TaskBar_OS_Backup_${format(new Date(), 'yyyy-MM-dd')}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Intelligence exported successfully! 📂');
      },

      syncMissionNotifications: async () => {
        const s = get();
        if (!s.settings.notifications) return;
        
        await NotificationService.cancelAll();
        const now = new Date();
        const todayStr = today();

        // 1. Water Reminders
        if (s.waterSchedule.length > 0) {
          s.waterSchedule.forEach((item, idx) => {
            const [time, period] = item.time.split(' ');
            let [hours, minutes] = time.split(':').map(Number);
            if (period === 'PM' && hours < 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            
            const scheduleDate = new Date();
            scheduleDate.setHours(hours, minutes, 0, 0);
            
            if (scheduleDate > now && !s.waterCompletions[todayStr]?.[item.id]) {
              NotificationService.scheduleTacticalAlert({
                id: 1000 + idx,
                title: 'Hydration Protocol 💧',
                body: `Operative, it is time for your ${item.amount} hydration mission.`,
                date: scheduleDate
              });
            }
          });
        }

        // 2. Task Reminders
        const tasks = s.tasks[todayStr] || [];
        tasks.forEach((t, idx) => {
          if (t.reminderAt && !t.completed) {
            const [time, period] = t.reminderAt.split(' ');
            let [hours, minutes] = time.split(':').map(Number);
            if (period === 'PM' && hours < 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            
            const scheduleDate = new Date();
            scheduleDate.setHours(hours, minutes, 0, 0);
            
            if (scheduleDate > now) {
              NotificationService.scheduleTacticalAlert({
                id: 2000 + idx,
                title: 'Mission Task Alert ⚡',
                body: `Priority ${t.priority}: ${t.title} is scheduled for now.`,
                date: scheduleDate
              });
            }
          }
        });

        // 3. Gym Reminder (if not started)
        const workout = s.workouts[todayStr];
        if (!workout || !workout.completed) {
          const gymTime = new Date();
          gymTime.setHours(18, 0, 0, 0); // Default 6 PM gym reminder if not specified
          if (gymTime > now) {
            NotificationService.scheduleTacticalAlert({
              id: 3000,
              title: 'Fitness OS Protocol 🏋️',
              body: 'Prepare for today\'s physical conditioning mission.',
              date: gymTime
            });
          }
        }
      },

      importData: (jsonStr) => {
        try {
          const data = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
          if (!data || typeof data !== 'object') throw new Error('Invalid backup format');
          
          const keys = [
            'tasks', 'workouts', 'gamification', 'journal', 'routines', 
            'habits', 'habitLogs', 'dietEntries', 'customFoods', 'savedMeals',
            'recipes', 'dietGoals', 'walkingLogs', 'pomodoro',
            'waterLogs', 'waterSchedule', 'waterCompletions', 'moodLogs', 
            'sleepLogs', 'energyLogs',
            'bodyMetrics', 'personalRecords', 'exerciseLibrary', 'settings', 
            'missionNotes', 'submittedDays'
          ];

          set((s) => {
            keys.forEach(key => {
              if (data[key] !== undefined) s[key] = data[key];
            });
          });
          toast.success('Intelligence synchronized from backup! 🧠');
          return { success: true };
        } catch (err) {
          toast.error('Data corruption detected in backup file.');
          console.error('Import error:', err);
          return { success: false, error: err.message };
        }
      },

      // ===== GYM ACTIONS =====
      setActiveGymTab: (tab) => set((s) => { s.activeGymTab = tab; }),
      syncLibrary: () => set((s) => { s.exerciseLibrary = [...EXERCISE_LIBRARY_DEFAULT]; }),
      addExerciseToLibrary: (data) => set((s) => { s.exerciseLibrary.push({ id: uuidv4(), ...data, custom: true }); }),
      updateExerciseInLibrary: (id, updates) => set((s) => { const e = s.exerciseLibrary.find(e => e.id === id); if (e) Object.assign(e, updates); }),
      removeExerciseFromLibrary: (id) => set((s) => { s.exerciseLibrary = s.exerciseLibrary.filter(e => e.id !== id); }),

      setGymScheduleDay: (dayOfWeek, scheduleData) => set((s) => {
        s.gymSchedule[dayOfWeek] = JSON.parse(JSON.stringify(scheduleData));
      }),
      resetGymSchedule: () => set((s) => { s.gymSchedule = DEFAULT_SCHEDULE; }),

      applyGymScheduleForDate: (date) => set((s) => {
        if (s.workouts[date]) return;
        const dow = new Date(date + 'T12:00:00').getDay();
        const sched = s.gymSchedule[dow];
        if (sched && sched.exercises?.length > 0) {
          s.workouts[date] = {
            id: uuidv4(), date, name: sched.name, completed: false,
            exercises: sched.exercises.map(ex => ({
              ...ex, id: uuidv4(), 
              sets: Array.from({ length: parseInt(ex.targetSets) || 3 }).map(() => ({ id: uuidv4(), weight: '', reps: ex.targetReps, completed: false }))
            }))
          };
        }
      }),

      applyTemplate: (date, template) => set((s) => {
        s.workouts[date] = {
          id: uuidv4(), date, name: template.name, completed: false,
          exercises: template.exercises.map(ex => ({
            ...ex, id: uuidv4(), 
            sets: Array.from({ length: parseInt(ex.targetSets) || 3 }).map(() => createSet({ reps: ex.targetReps }))
          }))
        };
      }),
      resetWorkout: (date) => set((s) => { 
        const w = s.workouts[date];
        if (!w) return;

        if (w.completed) {
          const workoutSourceId = `workout_${w.id || date}_${date}`;
          const revRes = processXpReversal(s.gamification.xpTransactions || [], workoutSourceId, 'Workout Reset');
          if (revRes.allowed && revRes.transaction) {
            s.gamification.xpTransactions.unshift(revRes.transaction);
            s.gamification.xp = Math.max(0, (s.gamification.xp || 0) - revRes.amount);
          } else if (w.xpEarned) {
            s.gamification.xp = Math.max(0, (s.gamification.xp || 0) - w.xpEarned);
          }
          if (s.gamification.lastGymDate === date) {
            s.gamification.gymStreak = Math.max(0, s.gamification.gymStreak - 1);
            s.gamification.lastGymDate = null; 
          }
        }

        // In-place reset
        w.completed = false;
        w.xpEarned = 0;
        w.exercises.forEach(ex => {
          ex.completed = false;
          ex.timeTaken = 0;
          ex.sets.forEach(set => {
            set.completed = false;
          });
        });
        
        // Also clear active timer if it was for this workout
        if (s.activeTimer?.date === date && s.activeTimer?.type === 'exercise') {
          s.activeTimer = null;
        }
      }),

      addExerciseToWorkout: (date, exercise) => set((s) => {
        if (!s.workouts[date]) s.workouts[date] = { id: uuidv4(), date, name: 'Custom Workout', exercises: [], completed: false };
        s.workouts[date].exercises.push({ ...exercise, id: uuidv4(), sets: [createSet()] });
      }),
      removeExerciseFromWorkout: (date, exId) => set((s) => {
        if (!s.workouts[date]) return;
        s.workouts[date].exercises = s.workouts[date].exercises.filter(e => e.id !== exId);
      }),

      addSet: (date, exId) => set((s) => {
        const ex = s.workouts[date]?.exercises.find(e => e.id === exId);
        if (ex) ex.sets.push(createSet());
      }),
      removeSet: (date, exId, setId) => set((s) => {
        const ex = s.workouts[date]?.exercises.find(e => e.id === exId);
        if (ex) ex.sets = ex.sets.filter(st => st.id !== setId);
      }),
      updateSet: (date, exId, setId, updates) => set((s) => {
        const ex = s.workouts[date]?.exercises.find(e => e.id === exId);
        const st = ex?.sets.find(s => s.id === setId);
        if (st) Object.assign(st, updates);
      }),
      completeGymSet: (date, exerciseId, setId) => set((s) => {
        const ex = s.workouts[date]?.exercises.find(e => e.id === exerciseId);
        const st = ex?.sets.find(s => s.id === setId);
        if (st && !st.completed) {
          st.completed = true;
          const sourceId = `gym:${date}:${exerciseId}:${setId}`;
          if (!s.gamification.xpTransactions) s.gamification.xpTransactions = [];
          const res = processXpAward(s.gamification.xpTransactions, {
            amount: 10,
            category: 'Fitness',
            description: `Set Completed: ${ex.name}`,
            sourceId,
            date
          });
          if (res.allowed && res.transaction) {
            s.gamification.xpTransactions.unshift(res.transaction);
            s.gamification.xp = (s.gamification.xp || 0) + res.transaction.amount;
          }
        }
      }),
      uncompleteGymSet: (date, exerciseId, setId) => set((s) => {
        const ex = s.workouts[date]?.exercises.find(e => e.id === exerciseId);
        const st = ex?.sets.find(s => s.id === setId);
        if (st && st.completed) {
          st.completed = false;
          const sourceId = `gym:${date}:${exerciseId}:${setId}`;
          const rev = processXpReversal(s.gamification.xpTransactions || [], sourceId, 'Set Reopened');
          if (rev.allowed && rev.transaction) {
            s.gamification.xpTransactions.unshift(rev.transaction);
            s.gamification.xp = Math.max(0, (s.gamification.xp || 0) - rev.amount);
          }
        }
      }),
      deleteGymSet: (date, exerciseId, setId) => set((s) => {
        const ex = s.workouts[date]?.exercises.find(e => e.id === exerciseId);
        if (ex) ex.sets = ex.sets.filter(s => s.id !== setId);
      }),
      awardXP: (payload) => set((s) => {
        if (!s.gamification.xpTransactions) s.gamification.xpTransactions = [];
        const prevLvl = calculateLevelInfo(s.gamification.xp).level;
        const res = processXpAward(s.gamification.xpTransactions, payload);
        if (res.allowed && res.transaction) {
          s.gamification.xpTransactions.unshift(res.transaction);
          s.gamification.xp += res.transaction.amount;
          const newLvl = calculateLevelInfo(s.gamification.xp).level;
          if (newLvl > prevLvl) {
            toast.success(`LEVEL UP! Operative reached Level ${newLvl} 🎉`, {
              duration: 6000,
              style: { background: '#10b981', color: '#fff', fontWeight: 900 }
            });
          }
        }
      }),

      toggleSetComplete: (date, exId, setId) => set((s) => {
        if (setId === 'dummy' || setId === 'init') {
          const dow = new Date(date + 'T12:00:00').getDay();
          const sched = s.gymSchedule[dow];
          if (sched) {
            s.workouts[date] = {
              id: uuidv4(), date, name: sched.name, completed: false,
              exercises: sched.exercises.map(ex => ({
                ...ex, id: uuidv4(), 
                sets: Array.from({ length: parseInt(ex.targetSets) || 3 }).map(() => createSet({ reps: ex.targetReps }))
              }))
            };
          }
          return;
        }
        const ex = s.workouts[date]?.exercises.find(e => e.id === exId);
        const st = ex?.sets.find(s => s.id === setId);
        if (st) {
          st.completed = !st.completed;
          if (st.completed) {
            s.restTimer.duration = 60;
            s.restTimer.timeLeft = 60;
            s.restTimer.running = true;

            // Anti-Farming XP Award per Completed Set (+5 XP)
            if (!s.gamification.xpTransactions) s.gamification.xpTransactions = [];
            const setRes = processXpAward(s.gamification.xpTransactions, {
              amount: 5,
              category: 'Workout',
              description: `Completed set (${ex.name}: ${st.weight || 0}kg × ${st.reps || 0} reps)`,
              sourceId: `set_${setId}_${date}`
            });
            if (setRes.allowed && setRes.transaction) {
              s.gamification.xpTransactions.unshift(setRes.transaction);
              s.gamification.xp += setRes.transaction.amount;
            }

            // Automatic PR Detection
            if (st.weight && st.reps) {
              const prResult = detectPersonalRecords({
                exerciseName: ex.name,
                setWeight: st.weight,
                setReps: st.reps,
                existingPRs: s.personalRecords || []
              });
              if (prResult.isPR && prResult.prRecord) {
                if (!s.personalRecords) s.personalRecords = [];
                s.personalRecords.unshift(prResult.prRecord);
                
                // PR Bonus XP (+50 XP)
                const prRes = processXpAward(s.gamification.xpTransactions, {
                  amount: 50,
                  category: 'Personal Record',
                  description: prResult.message,
                  sourceId: prResult.prRecord.id
                });
                if (prRes.allowed && prRes.transaction) {
                  s.gamification.xpTransactions.unshift(prRes.transaction);
                  s.gamification.xp += prRes.transaction.amount;
                }

                toast.success(prResult.message, { 
                  icon: '🏆', 
                  duration: 5000, 
                  style: { background: '#8b5cf6', color: '#fff', fontWeight: 900 } 
                });
              }
            }
          }
        }
      }),

      completeWorkout: async (date) => {
        set((s) => {
          const w = s.workouts[date]; if (!w) return;
          const completedSets = w.exercises.flatMap(e => e.sets).filter(st => st.completed);
          
          let totalVolumeKg = 0;
          completedSets.forEach(st => {
            totalVolumeKg += (Number(st.weight) || 0) * (Number(st.reps) || 0);
          });

          // Central Calorie expenditure estimation
          const durationMins = Math.max(15, Math.round((w.exercises.reduce((a, e) => a + (e.timeTaken || 0), 0)) / 60) || 45);
          const estCalories = estimateStrengthWorkoutCalories({
            durationMinutes: durationMins,
            totalVolumeKg,
            completedSets: completedSets.length,
            weightKg: s.dietGoals?.weightKg || 70
          });

          w.completed = true;
          w.estimatedCalories = estCalories.estimatedCalories;
          w.totalVolumeKg = totalVolumeKg;
          w.completedSetsCount = completedSets.length;

          // Anti-Farming XP Award for Workout Completion (+50 XP)
          if (!s.gamification.xpTransactions) s.gamification.xpTransactions = [];
          const sourceId = `workout_${w.id || date}_${date}`;
          const xpRes = processXpAward(s.gamification.xpTransactions, {
            amount: 50,
            category: 'Workout',
            description: `Workout completed: ${w.name} (${completedSets.length} sets, ~${estCalories.estimatedCalories} kcal)`,
            sourceId
          });

          if (xpRes.allowed && xpRes.transaction) {
            s.gamification.xpTransactions.unshift(xpRes.transaction);
            s.gamification.xp += xpRes.transaction.amount;
            w.xpEarned = xpRes.transaction.amount;
          }

          // Streak Management
          const last = s.gamification.lastGymDate;
          if (last) {
            const diff = differenceInDays(parseISO(date), parseISO(last));
            s.gamification.gymStreak = diff === 1 ? s.gamification.gymStreak + 1 : diff === 0 ? (s.gamification.gymStreak || 1) : 1;
          } else { s.gamification.gymStreak = 1; }
          s.gamification.lastGymDate = date;

          // Check and unlock verified achievements
          const unlocked = checkAndUnlockAchievements(s);
          if (unlocked.length > 0) {
            unlocked.forEach(ach => {
              s.achievements.unshift({ id: ach.id, title: ach.title, icon: ach.icon, color: ach.color, date });
              const achXpRes = processXpAward(s.gamification.xpTransactions, {
                amount: ach.xp,
                category: 'Achievement',
                description: `Unlocked Achievement: ${ach.title}`,
                sourceId: `ach_${ach.id}`
              });
              if (achXpRes.allowed && achXpRes.transaction) {
                s.gamification.xpTransactions.unshift(achXpRes.transaction);
                s.gamification.xp += achXpRes.transaction.amount;
              }
              toast.success(`Achievement Unlocked: ${ach.title} 🏆 (+${ach.xp} XP)`, { duration: 5000 });
            });
          }
        });
        await get().syncFirestore();
      },

      // --- Body Metrics ---
      logBodyMetrics: (date, data) => set((s) => {
        // DATA INTEGRITY GUARD: Ensure bodyMetrics is an object (legacy fix)
        if (Array.isArray(s.bodyMetrics)) s.bodyMetrics = {};
        if (!s.bodyMetrics[date]) s.bodyMetrics[date] = {};
        Object.assign(s.bodyMetrics[date], data);
      }),

      // --- Rest Timer ---
      startRestTimer: (duration = 60) => set((s) => {
        s.restTimer.duration = duration;
        s.restTimer.timeLeft = duration;
        s.restTimer.running = true;
      }),
      stopRestTimer: () => set((s) => { s.restTimer.running = false; s.restTimer.timeLeft = 0; }),
      tickRestTimer: () => set((s) => {
        if (s.restTimer.timeLeft > 0) {
          s.restTimer.timeLeft -= 1;
        } else {
          s.restTimer.running = false;
          // MISSION COMPLETE: Play notification soundscape
          playNotificationSound(s.settings.notificationSound || 'Neural Ping');
          toast.success('Rest interval complete. Re-engage mission! ⚡', { icon: '🏋️' });
          NotificationService.fireImmediate({
            id: 9999,
            title: 'Rest Interval Complete ⚡',
            body: 'Re-engage mission!'
          });
        }
      }),
      setRestTimer: (updates) => set((s) => { Object.assign(s.restTimer, updates); }),

      // --- DIET OS ACTIONS ---
      setDietActiveDate: (date) => set((s) => { s.dietActiveDate = date; }),
      
      addDietEntry: (entryData, date) => set((s) => {
        const d = date || s.dietActiveDate || today();
        if (!s.dietEntries[d]) s.dietEntries[d] = [];
        
        // Calculate nutrients at save time to preserve historical accuracy
        const calculatedNutrients = calculateEntryNutrients(
          entryData.food,
          Number(entryData.quantity),
          entryData.unit
        );

        const newEntry = {
          id: uuidv4(),
          foodId: entryData.food.id,
          foodName: entryData.food.name,
          category: entryData.food.category || 'Other',
          meal: entryData.meal || 'Lunch',
          quantity: Number(entryData.quantity),
          unit: entryData.unit || 'g',
          rawOrCooked: entryData.food.rawOrCooked || 'cooked',
          calculatedNutrients,
          createdAt: new Date().toISOString()
        };

        s.dietEntries[d].push(newEntry);
        toast.success(`Logged ${newEntry.foodName} (${newEntry.quantity}${newEntry.unit})`, { icon: '🥗' });
      }),

      updateDietEntry: (entryId, date, updates) => set((s) => {
        const entries = s.dietEntries[date]; if (!entries) return;
        const idx = entries.findIndex(e => e.id === entryId); if (idx === -1) return;
        
        const entry = entries[idx];
        if (updates.quantity || updates.unit || updates.food) {
          const foodObj = updates.food || { 
            servingSize: entry.calculatedNutrients ? entry.quantity : 100, 
            servingUnit: entry.unit,
            calories: entry.calculatedNutrients.calories,
            protein: entry.calculatedNutrients.protein,
            carbs: entry.calculatedNutrients.carbs,
            fat: entry.calculatedNutrients.fat,
            fiber: entry.calculatedNutrients.fiber,
            sugar: entry.calculatedNutrients.sugar,
            sodium: entry.calculatedNutrients.sodium
          };
          const q = updates.quantity !== undefined ? Number(updates.quantity) : entry.quantity;
          const u = updates.unit || entry.unit;
          entry.calculatedNutrients = calculateEntryNutrients(foodObj, q, u);
        }

        Object.assign(entry, updates);
        toast.success('Food entry updated', { icon: '✏️' });
      }),

      deleteDietEntry: (entryId, date) => set((s) => {
        if (!s.dietEntries[date]) return;
        s.dietEntries[date] = s.dietEntries[date].filter(e => e.id !== entryId);
        toast.success('Entry removed', { icon: '🗑️' });
      }),

      addCustomFood: (foodData) => set((s) => {
        const newFood = {
          id: `custom_${uuidv4()}`,
          name: foodData.name,
          category: foodData.category || 'Custom Foods',
          servingSize: Number(foodData.servingSize) || 100,
          servingUnit: foodData.servingUnit || 'g',
          calories: Number(foodData.calories) || 0,
          protein: Number(foodData.protein) || 0,
          carbs: Number(foodData.carbs) || 0,
          fat: Number(foodData.fat) || 0,
          fiber: Number(foodData.fiber) || 0,
          sugar: Number(foodData.sugar) || 0,
          sodium: Number(foodData.sodium) || 0,
          source: 'User Custom',
          rawOrCooked: foodData.rawOrCooked || 'cooked',
          isCustom: true
        };
        s.customFoods.push(newFood);
        toast.success(`Created custom food: ${newFood.name}`, { icon: '🍲' });
      }),

      toggleFavoriteFood: (foodId) => set((s) => {
        if (!s.favoriteFoods) s.favoriteFoods = [];
        if (s.favoriteFoods.includes(foodId)) {
          s.favoriteFoods = s.favoriteFoods.filter(id => id !== foodId);
        } else {
          s.favoriteFoods.push(foodId);
        }
      }),

      saveMealTemplate: (mealData) => set((s) => {
        if (!s.savedMeals) s.savedMeals = [];
        s.savedMeals.push({
          id: uuidv4(),
          name: mealData.name,
          items: mealData.items || [],
          createdAt: new Date().toISOString()
        });
        toast.success(`Saved meal template: ${mealData.name}`, { icon: '🍱' });
      }),

      deleteMealTemplate: (id) => set((s) => {
        if (s.savedMeals) s.savedMeals = s.savedMeals.filter(m => m.id !== id);
      }),

      saveRecipe: (recipeData) => set((s) => {
        if (!s.recipes) s.recipes = [];
        s.recipes.push({
          id: uuidv4(),
          name: recipeData.name,
          servings: Number(recipeData.servings) || 1,
          ingredients: recipeData.ingredients || [],
          totals: recipeData.totals || {},
          perServing: recipeData.perServing || {},
          createdAt: new Date().toISOString()
        });
        toast.success(`Recipe saved: ${recipeData.name}`, { icon: '📖' });
      }),

      deleteRecipe: (id) => set((s) => {
        if (s.recipes) s.recipes = s.recipes.filter(r => r.id !== id);
      }),

      updateDietGoals: (goalsData) => set((s) => {
        Object.assign(s.dietGoals, goalsData);
        toast.success('Diet goals updated!', { icon: '🎯' });
      }),

      // --- WALKING & DAILY ACTIVITY ACTIONS ---
      logWalkingActivity: (param1, param2) => set((s) => {
        let d, activityData;
        if (typeof param1 === 'string' && param1.match(/^\d{4}-\d{2}-\d{2}$/)) {
          d = param1;
          activityData = param2 || {};
        } else if (typeof param2 === 'string' && param2.match(/^\d{4}-\d{2}-\d{2}$/)) {
          d = param2;
          activityData = param1 || {};
        } else if (typeof param1 === 'object') {
          activityData = param1 || {};
          d = param2 || s.dietActiveDate || s.gymActiveDate || today();
        } else {
          d = param1 || s.dietActiveDate || today();
          activityData = param2 || {};
        }

        if (!s.walkingLogs) s.walkingLogs = {};
        if (!s.walkingLogs[d] || !Array.isArray(s.walkingLogs[d])) s.walkingLogs[d] = [];

        const heightCm = s.dietGoals?.heightCm || 175;
        const weightKg = s.dietGoals?.weightKg || 70;

        let calcResult;
        if (activityData.inputMode === 'steps') {
          calcResult = calculateWalkingFromSteps({
            steps: activityData.steps,
            heightCm,
            weightKg,
            intensityKey: activityData.intensity || 'normal'
          });
        } else if (activityData.inputMode === 'distance') {
          calcResult = calculateWalkingFromDistance({
            distanceKm: activityData.distanceKm,
            heightCm,
            weightKg,
            intensityKey: activityData.intensity || 'normal'
          });
        } else {
          calcResult = calculateWalkingFromDuration({
            durationMinutes: activityData.durationMinutes,
            heightCm,
            weightKg,
            intensityKey: activityData.intensity || 'normal'
          });
        }

        const logEntry = {
          id: activityData.id || uuidv4(),
          date: d,
          inputMode: activityData.inputMode || 'steps',
          ...calcResult,
          timestamp: new Date().toISOString()
        };

        s.walkingLogs[d] = deduplicateWalkingActivity(s.walkingLogs[d], logEntry);

        // Anti-Farming XP Award for Walking Activity (+15 XP for >3000 steps or >20 min walk)
        if (calcResult.steps >= 3000 || calcResult.durationMinutes >= 20) {
          if (!s.gamification.xpTransactions) s.gamification.xpTransactions = [];
          const sourceId = `walk_${logEntry.id}_${d}`;
          const xpRes = processXpAward(s.gamification.xpTransactions, {
            amount: 15,
            category: 'Walking',
            description: `Logged Walking: ${calcResult.steps} steps (~${calcResult.estimatedCalories} kcal)`,
            sourceId
          });
          if (xpRes.allowed && xpRes.transaction) {
            s.gamification.xpTransactions.unshift(xpRes.transaction);
            s.gamification.xp += xpRes.transaction.amount;
          }
        }

        toast.success(`Logged Walking: ${calcResult.steps.toLocaleString()} steps (~${calcResult.estimatedCalories} kcal)`, { icon: '🚶' });
      }),

      deleteWalkingLog: (date, logId) => set((s) => {
        if (s.walkingLogs && s.walkingLogs[date]) {
          s.walkingLogs[date] = s.walkingLogs[date].filter(l => l.id !== logId);
          toast.success('Activity log removed', { icon: '🗑️' });
        }
      }),

      // --- CROSS-MODULE INTELLIGENCE ENGINE SELECTORS ---
      getDailySnapshot: (date) => getDailySnapshot(get(), date || today()),
      getTodayPriorities: (date) => getTodayPriorities(get(), date || today()),
      getNextAction: (date) => getNextAction(get(), date || today()),
      getCrossModuleInsights: (date) => generateCrossModuleInsights(get(), date || today()),
      getGlobalConsistencyStreaks: () => getGlobalConsistencyStreaks(get()),
      calculateCorrelationData: (daysCount) => calculateCorrelationData(get(), daysCount || 14),

      syncFirestore: async () => {
        const { user, syncLocked, isDataLoaded } = get();
        if (!user || syncLocked || !isDataLoaded) return;
        
        const state = get();
        
        // --- DATA SANITIZATION LAYER ---
        // Prevents Firestore crashes by removing circular refs, NaN, and undefined
        const sanitize = (val) => {
          try {
            return JSON.parse(JSON.stringify(val, (k, v) => {
              if (typeof v === 'number' && isNaN(v)) return 0;
              if (v === undefined) return null;
              return v;
            }));
          } catch (e) {
            console.error("Sanitization Error:", e);
            return null;
          }
        };

        const dataToSync = sanitize({
          theme: state.theme,
          tasks: state.tasks,
          submittedDays: state.submittedDays,
          analytics: state.analytics,
          gamification: state.gamification,
          pomodoro: state.pomodoro,
          journal: state.journal,
          settings: state.settings,
          routines: state.routines,
          appliedRoutines: state.appliedRoutines,
          dismissedRoutines: state.dismissedRoutines,
          waterLogs: state.waterLogs,
          waterGoal: state.waterGoal,
          waterSchedule: state.waterSchedule,
          waterCompletions: state.waterCompletions,
          moodLogs: state.moodLogs,
          quickNotes: state.quickNotes,
          dailyFocus: state.dailyFocus,
          missionNotes: state.missionNotes,
          workouts: state.workouts,
          exerciseLibrary: state.exerciseLibrary,
          personalRecords: state.personalRecords,
          bodyMetrics: state.bodyMetrics,
          gymSchedule: state.gymSchedule,
          gymScheduleEnabled: state.gymScheduleEnabled,
          activeTimer: state.activeTimer,
          achievements: state.achievements,
          sleepLogs: state.sleepLogs,
          energyLogs: state.energyLogs,
          dietEntries: state.dietEntries,
          customFoods: state.customFoods,
          savedMeals: state.savedMeals,
          recipes: state.recipes,
          favoriteFoods: state.favoriteFoods,
          dietGoals: state.dietGoals,
          walkingLogs: state.walkingLogs,
          habits: state.habits,
          habitLogs: state.habitLogs
        });

        if (!dataToSync) return;

        try {
          await setDoc(doc(db, "users", user.uid, "data", "state_v4"), dataToSync);
          set({ lastSyncTimestamp: new Date().toISOString(), pendingSync: false, syncError: null });
        } catch (err) {
          console.error("Firestore Sync Error:", err);
          set({ syncError: err.message || 'Sync failed', pendingSync: true });
        }
      },

      loadUserData: async (uid) => {
        set({ syncLocked: true, isDataLoaded: false, syncError: null });
        try {
          // Fetch root user profile
          const userRef = doc(db, "users", uid);
          const userSnap = await getDoc(userRef);
          let profile = {};
          if (userSnap.exists()) {
            profile = userSnap.data();
          }

          // Fetch operational state
          const stateRef = doc(db, "users", uid, "data", "state_v4");
          const stateSnap = await getDoc(stateRef);
          
          if (stateSnap.exists()) {
            const cloudData = stateSnap.data();
            set((s) => { 
              const mergedState = { 
                ...defaultState, 
                ...cloudData, 
                user: { ...s.user, ...profile }, 
                authLoading: false, 
                syncLocked: false,
                isDataLoaded: true,
                syncError: null
              };
              // DATA INTEGRITY GUARD: Force object structure for metrics
              if (Array.isArray(mergedState.bodyMetrics)) mergedState.bodyMetrics = {};
              if (Array.isArray(mergedState.missionNotes)) mergedState.missionNotes = {};
              if (typeof mergedState.dailyFocus === 'string') mergedState.dailyFocus = {};
              
              // STALE TIMER GUARD: Clear activeTimer if older than 6 hours
              // Prevents stuck timers from Firestore from locking the entire Gym/Task interface
              if (mergedState.activeTimer && mergedState.activeTimer.startTime) {
                const timerAge = Date.now() - mergedState.activeTimer.startTime;
                const SIX_HOURS = 6 * 60 * 60 * 1000;
                if (timerAge > SIX_HOURS) {
                  console.warn('[Neural OS] Stale timer detected and cleared:', mergedState.activeTimer);
                  mergedState.activeTimer = null;
                }
              }

              Object.assign(s, mergedState); 
            });
          } else {
            // First time user (no cloud state yet)
            set((s) => {
              s.user = { ...s.user, ...profile };
              s.syncLocked = false;
              s.isDataLoaded = true; // Allow syncing now
              s.authLoading = false;
              s.syncError = null;
            });
          }
        } catch (err) {
          console.error("Load User Data Error (Persistence Guard active):", err);
          // CRITICAL: We do NOT set syncLocked to false here.
          // If loading fails, we keep it locked to prevent overwriting cloud data with empty local state.
          const isPermissionErr = err.code === 'permission-denied' || (err.message && err.message.toLowerCase().includes('permission'));
          const errorMsg = isPermissionErr 
            ? "Firebase Permission Error: Firestore rules are preventing access. Check your Firestore Security Rules in Firebase Console." 
            : (err.message || err.toString());
          set({ authLoading: false, syncError: errorMsg });
          toast.error(isPermissionErr ? "Cloud permission denied. Update Firestore rules or bypass sync." : "Cloud synchronization failed. Retrying in background...", { id: 'sync-error' });
        }
      },

      bypassSync: () => set((s) => {
        s.isDataLoaded = true;
        s.syncLocked = true; // Protect cloud state while running in local cache bypass mode
        s.syncError = null;
      }),

      resetAccount: async () => {
        set((s) => {
          s.gamification = { xp: 0, streak: 0, lastActiveDate: null, achievements: [], gymStreak: 0, lastGymDate: null };
          s.tasks = {};
          s.workouts = {};
          s.analytics = {};
          s.submittedDays = {};
          s.waterLogs = {};
          s.moodLogs = {};
          s.missionNotes = {};
        });
        await get().syncFirestore();
      },
    })),
    {
      name: 'taskbar-os-storage-v4',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        theme: state.theme,
        settings: state.settings,
        sidebarCollapsed: state.sidebarCollapsed,
        currentPage: state.currentPage,
        isSleeping: state.isSleeping,
        // We persist these as a secondary safety layer, but cloud is primary
        tasks: state.tasks,
        routines: state.routines,
        appliedRoutines: state.appliedRoutines,
        dismissedRoutines: state.dismissedRoutines,
        habits: state.habits,
        habitLogs: state.habitLogs,
        workouts: state.workouts,
        gamification: state.gamification,
        waterSchedule: state.waterSchedule,
        exerciseLibrary: state.exerciseLibrary,
        sleepLogs: state.sleepLogs,
        energyLogs: state.energyLogs,
        bodyMetrics: state.bodyMetrics,
        missionNotes: state.missionNotes,
        dailyFocus: state.dailyFocus,
        quickNotes: state.quickNotes,
        dietEntries: state.dietEntries,
        customFoods: state.customFoods,
        savedMeals: state.savedMeals,
        recipes: state.recipes,
        favoriteFoods: state.favoriteFoods,
        dietGoals: state.dietGoals,
        walkingLogs: state.walkingLogs,
        pomodoro: state.pomodoro,
        lastSyncTimestamp: state.lastSyncTimestamp
      }),
      onRehydrateStorage: () => (state) => {
        state.setHasHydrated(true);
      },
    }
  )
);

// --- NEURAL PULSE: GLOBAL SYNC OBSERVER ---
let syncTimeout = null;
useStore.subscribe((state) => {
  if (!state.user || state.syncLocked || !state.isDataLoaded) return;
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    state.syncFirestore();
  }, 1000); 
});
