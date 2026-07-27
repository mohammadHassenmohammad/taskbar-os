import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import { format, differenceInDays, addDays, subDays, parseISO } from 'date-fns';
import { toast } from 'react-hot-toast';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot,
  updateDoc
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { playNotificationSound } from "../lib/audio";
import { NotificationService } from "../lib/notifications";

const today = () => format(new Date(), 'yyyy-MM-dd');

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

export const calculateLevel = (xp) => {
  // Rigorous Neural Progression Formula: XP = 250 * (Level^2 - Level)
  // This creates a progressively steeper climb, ensuring 'Master' ranks are genuinely difficult to achieve.
  const getXpForLevel = (lvl) => 250 * (Math.pow(lvl, 2) - lvl);
  
  const RANKS = [
    { minLvl: 1,  maxLvl: 3,  title: 'Novice Operative',   color: '#94a3b8' },
    { minLvl: 4,  maxLvl: 6,  title: 'Tactical Analyst',   color: '#38bdf8' },
    { minLvl: 7,  maxLvl: 10, title: 'Field Commander',    color: '#818cf8' },
    { minLvl: 11, maxLvl: 15, title: 'Strategic Vanguard', color: '#a855f7' },
    { minLvl: 16, maxLvl: 20, title: 'Neural Sovereign',   color: '#fb7185' },
    { minLvl: 21, maxLvl: 30, title: 'Quantum Overseer',   color: '#f472b6' },
    { minLvl: 31, maxLvl: 99, title: 'Grandmaster of Order', color: '#facc15' },
  ];

  let currentLvl = 1;
  while (xp >= getXpForLevel(currentLvl + 1)) {
    currentLvl++;
  }

  const currentRank = RANKS.find(r => currentLvl >= r.minLvl && currentLvl <= r.maxLvl) || RANKS[RANKS.length - 1];
  const xpCurrent = getXpForLevel(currentLvl);
  const xpNext = getXpForLevel(currentLvl + 1);
  const progress = ((xp - xpCurrent) / (xpNext - xpCurrent)) * 100;

  return {
    level: currentLvl,
    title: currentRank.title,
    rankColor: currentRank.color,
    xpRequired: xpNext,
    currentLevelXp: xpCurrent,
    progress: Math.min(100, Math.max(0, progress))
  };
};

// Tactical Selector for Operative Progression
export const getLevelInfo = (state) => calculateLevel(state.gamification?.xp || 0);


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
  gamification: { xp: 0, streak: 0, lastActiveDate: null, achievements: [], gymStreak: 0, lastGymDate: null },
  pomodoro: { running: false, mode: 'focus', timeLeft: 25 * 60, sessions: 0, linkedTaskId: null },
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
    autoSave: true
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
  syncLocked: true,
  isDataLoaded: false,
  syncError: null,
};

export const useStore = create(
  persist(
    immer((set, get) => ({
      ...defaultState,

      // --- Theme ---
      toggleTheme: () => set((s) => { s.theme = s.theme === 'dark' ? 'light' : 'dark'; }),

      // --- Auth ---
      login: async (email, password) => {
        try { await signInWithEmailAndPassword(auth, email, password); } 
        catch (e) { throw e; }
      },
      isNewUser: false,
      signup: async (email, password, profileData) => {
        let user;
        try {
          const res = await createUserWithEmailAndPassword(auth, email, password);
          user = res.user;
        } catch (e) {
          if (e.code === 'auth/email-already-in-use') {
            // Attempt to sign in instead to complete profile if it was a partial signup before
            const res = await signInWithEmailAndPassword(auth, email, password);
            user = res.user;
          } else {
            throw e;
          }
        }

        try {
          const userData = {
            uid: user.uid,
            email,
            ...profileData,
            createdAt: new Date().toISOString(),
            xp: 0,
            level: 1,
            streak: 0,
            achievements: []
          };
          await setDoc(doc(db, 'users', user.uid), userData);
          set((s) => { s.isNewUser = true; });
          return userData;
        } catch (e) {
          throw e;
        }
      },
      requestPasswordReset: async (email) => {
        try { await sendPasswordResetEmail(auth, email); }
        catch (e) { throw e; }
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
      setUser: (user) => set((s) => { 
        if (user && s.user?.uid !== user.uid) {
          Object.assign(s, { ...defaultState, syncLocked: true, isDataLoaded: false });
        }
        s.user = user; 
        s.authLoading = false; 
      }),
      requestPasswordReset: async (email) => {
        try { await sendPasswordResetEmail(auth, email); }
        catch (e) { throw e; }
      },
      updateUserPassword: async (newPassword) => {
        if (!auth.currentUser) throw new Error('No active operative found');
        try { await updatePassword(auth.currentUser, newPassword); }
        catch (e) { throw e; }
      },
      updateProfile: async (updates) => {
        const currentUser = get().user;
        if (!currentUser) throw new Error('No active operative found');
        try {
          await updateDoc(doc(db, 'users', currentUser.uid), updates);
          set((s) => {
            if (s.user) Object.assign(s.user, updates);
          });
        } catch (e) { throw e; }
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
        const tasks = s.tasks[date]; if (!tasks) return;
        const idx = tasks.findIndex((t) => t.id === taskId); if (idx === -1) return;
        Object.assign(tasks[idx], updates);
      }),
      deleteTask: (taskId, date) => set((s) => {
        if (!s.tasks[date]) return;
        if (s.activeTimer?.id === taskId) s.activeTimer = null;
        s.tasks[date] = s.tasks[date].filter((t) => t.id !== taskId);
      }),
      duplicateTask: (taskId, date) => set((s) => {
        const tasks = s.tasks[date]; if (!tasks) return;
        const task = tasks.find((t) => t.id === taskId); if (!task) return;
        s.tasks[date].push(createTask({ ...task, id: uuidv4(), completed: false, completedAt: null, createdAt: new Date().toISOString(), order: tasks.length }));
      }),
      reorderTasks: (date, orderedIds) => set((s) => {
        if (!s.tasks[date]) return;
        const taskMap = Object.fromEntries(s.tasks[date].map((t) => [t.id, t]));
        s.tasks[date] = orderedIds.map((id, idx) => ({ ...taskMap[id], order: idx }));
      }),
      toggleTaskComplete: (taskId, date) => set((s) => {
        const tasks = s.tasks[date]; if (!tasks) return;
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

        // XP logic with Streak Multiplier
        const streak = s.gamification.streak || 0;
        const multiplier = streak >= 7 ? 1.5 : streak >= 3 ? 1.2 : 1.0;
        const baseXP = PRIORITY_XP[task.priority] || 10;
        const xpDelta = Math.round(baseXP * multiplier);
        
        s.gamification.xp = Math.max(0, s.gamification.xp + (task.completed ? xpDelta : -xpDelta));
        
        if (task.completed && multiplier > 1) {
          toast.success(`Discipline Multiplier Active (${multiplier}x)! +${xpDelta} XP`, { icon: '🔥' });
        } else if (task.completed) {
          toast.success(`Task Complete! +${xpDelta} XP`, { icon: '🎯' });
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
            const streak = s.gamification.streak || 0;
            const multiplier = streak >= 7 ? 1.5 : streak >= 3 ? 1.2 : 1.0;
            const baseXP = PRIORITY_XP[task.priority] || 10;
            const xpDelta = Math.round(baseXP * multiplier);
            
            s.gamification.xp += xpDelta;
            if (multiplier > 1) {
              toast.success(`Discipline Multiplier Active (${multiplier}x)! +${xpDelta} XP`, { icon: '🔥' });
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
        
        enabled.forEach(r => {
          if (!existingIds.has(r.id)) {
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
      applyGymScheduleForDate: (date) => set((s) => {
        if (s.workouts[date]) return; // Already exists
        const dow = new Date(date + 'T12:00:00').getDay();
        const sched = s.gymSchedule[dow];
        if (sched && sched.exercises?.length > 0) {
          s.workouts[date] = {
            id: uuidv4(),
            name: sched.name,
            date,
            completed: false,
            exercises: sched.exercises.map(ex => ({
              ...ex,
              id: uuidv4(),
              sets: Array(ex.targetSets || 3).fill(0).map(() => ({ id: uuidv4(), weight: '', reps: '', completed: false }))
            }))
          };
        }
      }),

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
      addQuickNote: (date, text) => set((s) => {
        if (!s.quickNotes) s.quickNotes = {};
        if (!s.quickNotes[date]) s.quickNotes[date] = [];
        const id = uuidv4();
        s.quickNotes[date].unshift({ id, text, timestamp: new Date().toISOString(), color: 'var(--accent-primary)' });
      }),
      deleteQuickNote: (date, id) => set((s) => {
        if (s.quickNotes[date]) {
          s.quickNotes[date] = s.quickNotes[date].filter(n => n.id !== id);
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
          const bonus = 250;
          s.gamification.xp += bonus;
          toast.success(`MISSION MASTERED: 100% Completion Bonus! +${bonus} XP`, { icon: '🏆', duration: 5000 });
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
        const tasks = s.tasks[fromDate] || [];
        const taskIdx = tasks.findIndex(t => t.id === taskId);
        if (taskIdx === -1) return;
        const [task] = tasks.splice(taskIdx, 1);
        if (!s.tasks[toDate]) s.tasks[toDate] = [];
        s.tasks[toDate].push({ ...task, date: toDate, completed: false, timeTaken: 0 });
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
      addMissionNote: (date, text) => set((s) => {
        if (!s.missionNotes) s.missionNotes = {};
        if (!s.missionNotes[date]) s.missionNotes[date] = [];
        s.missionNotes[date].unshift({ id: uuidv4(), text, timestamp: new Date().toISOString() });
      }),
      deleteMissionNote: (date, noteId) => set((s) => {
        if (s.missionNotes && s.missionNotes[date]) {
          s.missionNotes[date] = s.missionNotes[date].filter(n => n.id !== noteId);
        }
      }),
      editMissionNote: (date, noteId, text) => set((s) => {
        const note = s.missionNotes?.[date]?.find(n => n.id === noteId);
        if (note) {
          note.text = text;
          note.timestamp = new Date().toISOString(); 
        }
      }),

      // --- POMODORO ---
      setPomodoroState: (updates) => set((s) => { Object.assign(s.pomodoro, updates); }),

      // --- SETTINGS & DATA ---
      updateSettings: (updates) => set((s) => { Object.assign(s.settings, updates); }),
      
      exportData: () => {
        const state = get();
        const exportObj = {
          tasks: state.tasks,
          workouts: state.workouts,
          gamification: state.gamification,
          journal: state.journal,
          routines: state.routines,
          waterLogs: state.waterLogs,
          waterSchedule: state.waterSchedule,
          waterCompletions: state.waterCompletions,
          moodLogs: state.moodLogs,
          bodyMetrics: state.bodyMetrics,
          personalRecords: state.personalRecords,
          exerciseLibrary: state.exerciseLibrary,
          settings: state.settings,
          missionNotes: state.missionNotes,
          submittedDays: state.submittedDays,
          exportDate: new Date().toISOString(),
          version: '1.0.0'
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

      importData: (jsonStr) => set((s) => {
        try {
          const data = JSON.parse(jsonStr);
          // Selective merge or full override
          const keys = [
            'tasks', 'workouts', 'gamification', 'journal', 'routines', 
            'waterLogs', 'waterSchedule', 'waterCompletions', 'moodLogs', 
            'bodyMetrics', 'personalRecords', 'exerciseLibrary', 'settings', 
            'missionNotes', 'submittedDays'
          ];
          keys.forEach(key => {
            if (data[key]) s[key] = data[key];
          });
          toast.success('Intelligence synchronized from backup! 🧠');
        } catch (err) {
          toast.error('Data corruption detected in backup file.');
          console.error('Import error:', err);
        }
      }),

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
          s.gamification.xp = Math.max(0, s.gamification.xp - (w.xpEarned || 0));
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
          s.gamification.xp += 10;
        }
      }),
      uncompleteGymSet: (date, exerciseId, setId) => set((s) => {
        const ex = s.workouts[date]?.exercises.find(e => e.id === exerciseId);
        const st = ex?.sets.find(s => s.id === setId);
        if (st && st.completed) {
          st.completed = false;
          s.gamification.xp -= 10;
        }
      }),
      deleteGymSet: (date, exerciseId, setId) => set((s) => {
        const ex = s.workouts[date]?.exercises.find(e => e.id === exerciseId);
        if (ex) ex.sets = ex.sets.filter(s => s.id !== setId);
      }),
      toggleSetComplete: (date, exId, setId) => set((s) => {
        if (setId === 'dummy' || setId === 'init') {
          // Initialize workout from schedule if it doesn't exist
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
          // AUTOMATED RECOVERY: Trigger rest timer on completion
          if (st.completed) {
            s.restTimer.duration = 60;
            s.restTimer.timeLeft = 60;
            s.restTimer.running = true;
          }
        }
      }),

      completeWorkout: async (date) => {
        set((s) => {
          const w = s.workouts[date]; if (!w) return;
          const completedSets = w.exercises.flatMap(e => e.sets).filter(st => st.completed).length;
          let xp = Math.round(completedSets * 15 + (w.exercises.length * 10));
          if (xp < 50) xp = 50;
          w.completed = true;
          w.xpEarned = xp;
          s.gamification.xp += xp;
          const last = s.gamification.lastGymDate;
          if (last) {
            const diff = differenceInDays(parseISO(date), parseISO(last));
            s.gamification.gymStreak = diff === 1 ? s.gamification.gymStreak + 1 : diff === 0 ? (s.gamification.gymStreak || 1) : 1;
          } else { s.gamification.gymStreak = 1; }
          s.gamification.lastGymDate = date;
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
          energyLogs: state.energyLogs
        });

        if (!dataToSync) return;

        try {
          await setDoc(doc(db, "users", user.uid, "data", "state_v4"), dataToSync);
        } catch (err) {
          console.error("Firestore Sync Error:", err);
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
        workouts: state.workouts,
        gamification: state.gamification,
        waterSchedule: state.waterSchedule,
        exerciseLibrary: state.exerciseLibrary,
        sleepLogs: state.sleepLogs,
        energyLogs: state.energyLogs,
        bodyMetrics: state.bodyMetrics,
        missionNotes: state.missionNotes,
        dailyFocus: state.dailyFocus,
        quickNotes: state.quickNotes
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
