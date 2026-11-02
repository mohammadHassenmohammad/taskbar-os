# TASKBAR OS (FITNESS & TACTICAL ROUTINE OS)
## Comprehensive Architecture, Technical Specifications, Data Models & Master Workflows

> **DOCUMENT PURPOSE**: This document serves as the single source of truth for **TaskBar OS** (also referred to as **Neural OS / Tactical Fitness & Routine OS**). It is formatted and organized so that any LLM (including ChatGPT, Claude, or Gemini) or software engineer can immediately understand every layer of the system: architecture, data structures, state management, mathematical formulas, business rules, UI components, background services, cross-platform deployment, and end-to-end workflows.

---

## 1. EXECUTIVE SUMMARY & DESIGN PHILOSOPHY

### 1.1 What is TaskBar OS?
**TaskBar OS** is an integrated, local-first personal operating system that unifies **daily execution (tasks & routines)**, **physical performance (strength training & fitness)**, **nutritional intelligence (caloric & macro tracking with Indian/global foods)**, **biohacking (sleep, energy & walking)**, and **cognitive focus (Pomodoro & distraction blocking)** into a gamified, dark-mode tactical command environment.

### 1.2 Core Pillars
1. **Local-First Speed with Cloud Persistence**: Zero-latency UI updates using local state (`Zustand` + `Immer` + `localStorage`). Transparent asynchronous synchronization to Firebase Cloud Firestore when online. Works 100% offline.
2. **Deterministic, Anti-Farming Gamification**: Mathematical progression curve based on quadratic thresholds with an authoritative, idempotent XP transaction ledger preventing cheating or duplicate XP exploitation.
3. **Evidence-Backed Cross-Module Intelligence**: Built-in intelligence engine that computes real statistical correlations between sleep duration, protein intake, workout volume, and task completion rates—strictly prohibiting synthetic or fake mocked data.
4. **Cross-Platform Tactical Experience**: One shared modern React codebase deployed as:
   - Modern Web PWA
   - Desktop Application via Electron (frameless, inset titlebar, background throttling)
   - Native Mobile Application via Capacitor (Android, native local notifications, haptic feedback)
5. **Precision Health Mathematics**: Mifflin-St Jeor BMR/TDEE calculations, standardized MET expenditure formulas, raw-to-cooked food scaling, and set-by-set strength volume tracking.

---

## 2. TECHNOLOGY STACK & SYSTEM ARCHITECTURE

```
                                  +------------------------------------+
                                  |            CLIENT LAYER            |
                                  +------------------------------------+
                                  | • Web Browser (PWA)                |
                                  | • Desktop Shell (Electron CJS)     |
                                  | • Mobile Shell (Capacitor Android) |
                                  +-----------------+------------------+
                                                    |
                                                    v
+---------------------------------------------------------------------------------------------------------+
|                                              PRESENTATION                                               |
+---------------------------------------------------------------------------------------------------------+
| React 18 (Vite SPA) • Framer Motion 11 • Lucide Icons • Recharts • React Hot Toast • React Confetti      |
| CSS Variables Architecture (--bg-base, --bg-card, --accent-primary, --border-subtle, data-theme)        |
+---------------------------------------------------------------------------------------------------------+
                                                    |
                                                    v
+---------------------------------------------------------------------------------------------------------+
|                                           STATE MANAGEMENT                                              |
+---------------------------------------------------------------------------------------------------------+
| Zustand Store with Immer Middleware (Immutable Mutative Syntax) + LocalStorage Persistence Middleware   |
+---------------------------------------------------------------------------------------------------------+
       |                                            |                                              |
       v                                            v                                              v
+--------------+                           +-----------------+                           +-----------------+
|  ENGINES &   |                           | SYNC & CLOUD    |                           |  DEVICE & NATIVE|
|  SERVICES    |                           | LAYER           |                           |  CAPABILITIES   |
+--------------+                           +-----------------+                           +-----------------+
| • xpService  |                           | • Firebase Auth |                           | • LocalNotifs   |
| • calorieBurn|                           | • Firestore     |                           | • Haptics       |
| • nutrition  |                           | • Offline Cache |                           | • Battery API   |
| • intelligence                           | • Debounced Sync|                           | • Web Audio API |
+--------------+                           +-----------------+                           +-----------------+
```

### 2.1 Dependencies & Libraries
- **Core Runtime**: React 18.2+, React DOM, Vite 5+
- **State Store**: `zustand` 4.5+ with `zustand/middleware/immer` and `zustand/middleware/persist`
- **Animations & UX**: `framer-motion` 11+, `react-hot-toast`, `react-confetti`, `lucide-react`
- **Data Visualization**: `recharts` (AreaChart, LineChart, RadarChart, ResponsiveContainer)
- **Date Engine**: `date-fns` (strictly date formatting, ISO handling, difference calculations)
- **Cloud & Auth**: `firebase` 10+ (Authentication, Cloud Firestore)
- **Desktop**: `electron` 28+, `electron-builder`
- **Mobile**: `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/app`, `@capacitor/local-notifications`, `@capacitor/haptics`, `@capacitor/status-bar`
- **Audio**: Custom procedural Web Audio API synthesizers (zero external mp3 file dependencies)

---

## 3. MASTER DATA SCHEMAS & STATE SPECIFICATION

The root store state is managed centrally via `src/store/useStore.js`. The table below outlines the authoritative schema:

### 3.1 Store Data Schema (`defaultState`)

```typescript
interface RootStoreState {
  // Theme & Appearance
  theme: 'dark' | 'light';
  sidebarCollapsed: boolean;
  currentPage: string; // 'dashboard' | 'today' | 'calendar' | 'gym' | 'diet' | 'focus' | 'routines' | 'analytics' | 'ai' | 'report' | 'archive' | 'guide' | 'settings' | 'admin'
  navHistory: string[];
  focusMode: boolean;
  activeDate: string; // ISO date 'YYYY-MM-DD'

  // User & Sync
  user: FirebaseUser | null;
  authLoading: boolean;
  isDataLoaded: boolean;
  syncLocked: boolean;
  syncError: string | null;

  // Task & Planning Slice
  tasks: Record<string, Task[]>; // Keyed by 'YYYY-MM-DD'
  submittedDays: Record<string, boolean>; // Days sealed/reviewed
  activeTimer: { id: string; type: 'task'; startTime: number; date: string } | null;

  // Routines & Habits Slice
  routines: Routine[];
  appliedRoutines: Record<string, boolean>; // 'YYYY-MM-DD' -> true if routine injected

  // Gamification & Progression Slice
  gamification: {
    xp: number; // Lifetime total XP
    streak: number; // Daily task execution streak
    lastActiveDate: string | null;
    achievements: string[];
    gymStreak: number;
    lastGymDate: string | null;
    xpTransactions: XpTransaction[]; // Authoritative audit ledger
  };

  // Fitness OS (Gym) Slice
  workouts: Record<string, WorkoutSession>; // Keyed by 'YYYY-MM-DD'
  exerciseLibrary: ExerciseDefinition[];
  gymActiveDate: string;
  gymSchedule: Record<number, DaySchedule>; // 0 (Sun) to 6 (Sat)
  gymScheduleEnabled: boolean;
  activeGymTab: 'workout' | 'schedule' | 'exercises' | 'progress';
  restTimer: { duration: number; timeLeft: number; running: boolean; sound: boolean };
  personalRecords: PersonalRecord[];

  // Diet OS (Nutrition) Slice
  dietEntries: Record<string, FoodEntry[]>; // Keyed by 'YYYY-MM-DD'
  customFoods: CustomFoodItem[];
  savedMeals: SavedMeal[];
  recipes: Recipe[];
  favoriteFoods: string[];
  dietGoals: {
    age: number;
    gender: 'male' | 'female';
    weightKg: number;
    heightCm: number;
    activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';
    goalType: 'weight_loss' | 'maintenance' | 'weight_gain' | 'muscle_gain' | 'general_health';
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    waterGoalMl: number;
    isAutoCalculated: boolean;
  };
  dietActiveDate: string;

  // Hydration Slice
  waterLogs: Record<string, number>;
  waterGoal: number; // e.g., 8 glasses / 5 scheduled intervals
  waterSchedule: WaterReminderItem[];
  waterCompletions: Record<string, Record<string, boolean>>; // date -> { reminderId: true }

  // Biohacking & Lifestyle Slice
  sleepLogs: Record<string, { start: string; end: string; quality: number; notes: string }>;
  energyLogs: Record<string, Array<{ time: string; level: number }>>;
  walkingLogs: Record<string, WalkingLogEntry[] | WalkingLogEntry>;
  bodyMetrics: Record<string, { weight: number; bodyFat?: number }>;
  isSleeping: boolean;

  // Focus (Pomodoro) Slice
  pomodoro: {
    running: boolean;
    mode: 'focus' | 'shortBreak' | 'longBreak';
    timeLeft: number; // seconds
    sessions: number; // completed focus sessions count
    linkedTaskId: string | null;
  };

  // Notes & Journal
  journal: Record<string, string>;
  quickNotes: Record<string, string>;
  dailyFocus: Record<string, string>;

  // System & Settings
  settings: {
    pomodoroFocus: number; // minutes, default 25
    pomodoroShortBreak: number; // minutes, default 5
    pomodoroLongBreak: number; // minutes, default 15
    notifications: boolean;
    motivationalQuotes: boolean;
    sound: boolean;
    notificationSound: string;
    syncInterval: number;
    autoSave: boolean;
    adjustCalorieTargetWithActivity: boolean;
  };
}
```

### 3.2 Individual Entity Data Models

#### Task Model
```typescript
interface Task {
  id: string; // UUID v4
  title: string;
  description?: string;
  priority: 'High' | 'Medium' | 'Low';
  category: 'Work' | 'Personal' | 'Health' | 'Learning' | 'Creative' | 'Social' | 'Finance' | 'Other';
  dueTime?: string; // 'HH:mm'
  reminderAt?: string; // 'HH:mm' for active alarms
  completed: boolean;
  completedAt: string | null; // ISO timestamp
  createdAt: string; // ISO timestamp
  date: string; // 'YYYY-MM-DD'
  order: number;
  isRoutine: boolean;
  isGym?: boolean;
  timeTaken: number; // in seconds
  estimatedTime: number; // in minutes
  subtasks?: Array<{ id: string; title: string; completed: boolean }>;
}
```

#### Workout Session & Exercise Model
```typescript
interface WorkoutSession {
  id: string;
  date: string;
  name: string; // e.g. "Chest + Abs (Strength)"
  completed: boolean;
  completedAt: string | null;
  timeTaken: number; // in seconds
  estimatedCalories: number; // calculated via MET engine
  exercises: WorkoutExercise[];
}

interface WorkoutExercise {
  id: string;
  name: string;
  muscle: 'Chest' | 'Back' | 'Shoulders' | 'Arms' | 'Legs' | 'Core' | 'Cardio' | 'Full Body';
  type: 'Repetition' | 'Timed';
  targetSets: number;
  targetReps: number;
  timeTaken: number;
  sets: WorkoutSet[];
}

interface WorkoutSet {
  id: string;
  weight: number | string; // kg
  reps: number | string;
  completed: boolean;
  rpe?: number; // Rate of Perceived Exertion (1-10)
}
```

#### Food Entry & Nutrition Model
```typescript
interface FoodEntry {
  id: string; // UUID v4
  foodId: string;
  name: string;
  mealType: 'Breakfast' | 'Morning Snack' | 'Lunch' | 'Evening Snack' | 'Dinner' | 'Post Workout' | 'Other';
  quantity: number;
  unit: 'g' | 'kg' | 'ml' | 'cup' | 'glass' | 'piece' | 'egg' | 'serving' | 'bowl' | 'tablespoon' | 'teaspoon';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar?: number;
  sodium?: number;
  loggedAt: string; // ISO string
}
```

---

## 4. MATHEMATICAL ENGINES & FORMULAS

### 4.1 Authoritative Gamification & XP Economy (`xpService.js`)

#### Level Progression Threshold Formula
Cumulative XP required to reach Level $L$:
$$\text{thresholdForLevel}(L) = \begin{cases} 0 & \text{if } L \le 1 \\ \operatorname{round}\left(250 \times (L^2 - L)\right) & \text{if } L \ge 2 \end{cases}$$

Explicit Level Milestones:
- **Level 1**: $0\text{ XP}$
- **Level 2**: $500\text{ XP} \quad (\Delta = 500)$
- **Level 3**: $1{,}500\text{ XP} \quad (\Delta = 1{,}000)$
- **Level 4**: $3{,}000\text{ XP} \quad (\Delta = 1{,}500)$
- **Level 5**: $5{,}000\text{ XP} \quad (\Delta = 2{,}000)$
- **Level 10**: $22{,}500\text{ XP}$
- **Level 20**: $95{,}000\text{ XP}$
- **Level 50**: $612{,}500\text{ XP}$
- **Level 75**: $1{,}387{,}500\text{ XP}$

#### Tactical Ranks
| Level Range | Rank Title | Hex Color | Badge | Status |
|:---|:---|:---|:---:|:---|
| **Lvl 1 – 4** | **Recruit** | `#94a3b8` | 🔰 | Basic initiation |
| **Lvl 5 – 9** | **Operative** | `#38bdf8` | ⚡ | Active daily executor |
| **Lvl 10 – 19** | **Specialist** | `#818cf8` | ⚔️ | Multi-module discipline |
| **Lvl 20 – 34** | **Vanguard** | `#a855f7` | 🛡️ | Habitual mastery |
| **Lvl 35 – 49** | **Elite** | `#fb7185` | 👑 | Peak physical & cognitive output |
| **Lvl 50 – 74** | **Neural Master** | `#facc15` | 🏆 | Veteran consistency |
| **Lvl 75+** | **Transcendent** | `#ec4899` | 🌌 | Ultimate operational tier |

#### XP Award Values
- **High Priority Task**: $+50\text{ XP}$
- **Medium Priority Task**: $+25\text{ XP}$
- **Low Priority Task**: $+10\text{ XP}$
- **Full Pomodoro Focus Session (25 min)**: $+25\text{ XP}$
- **Completed Workout Session**: $+100\text{ XP}$
- **Recurring Routine Completed**: $+20\text{ XP}$
- **Daily Hydration Goal Reached**: $+30\text{ XP}$

#### Anti-Farming & Idempotency Rules
Every XP transaction is written to `gamification.xpTransactions` with a unique deterministic `sourceId`:
- Task: `task:${taskId}:${date}`
- Focus: `focus:${sessionId}`
- Workout: `workout:${date}`
- Hydration: `water:${date}`

If an item is completed and toggled off, `processXpReversal` subtracts the XP from total XP and logs a reversal record. Attempting to check and uncheck repeatedly will **never** generate net XP gain.

---

### 4.2 Calorie & Energy Expenditure Engine (`calorieBurnService.js`)

#### 1. Basal Metabolic Rate (BMR) - Mifflin-St Jeor Equation
$$\text{BMR}_{\text{male}} = (10 \times \text{weight}_{\text{kg}}) + (6.25 \times \text{height}_{\text{cm}}) - (5 \times \text{age}_{\text{years}}) + 5$$
$$\text{BMR}_{\text{female}} = (10 \times \text{weight}_{\text{kg}}) + (6.25 \times \text{height}_{\text{cm}}) - (5 \times \text{age}_{\text{years}}) - 161$$

#### 2. Total Daily Energy Expenditure (TDEE)
$$\text{TDEE} = \text{BMR} \times \text{Activity Multiplier} + \text{Goal Delta}$$

- **Activity Multipliers**:
  - Sedentary: $1.2$
  - Lightly Active (1–3 days/wk): $1.375$
  - Moderately Active (3–5 days/wk): $1.55$
  - Very Active (6–7 days/wk): $1.725$
  - Extra Active (physical labor): $1.9$
- **Goal Deltas**:
  - Weight Loss: $-400\text{ kcal}$
  - Maintenance: $0\text{ kcal}$
  - Lean Muscle Gain: $+250\text{ kcal}$
  - Aggressive Bulk: $+400\text{ kcal}$

#### 3. Exercise Energy Expenditure (MET Equation)
$$\text{Calories Burned} = \frac{\text{MET} \times 3.5 \times \text{weight}_{\text{kg}}}{200} \times \text{duration}_{\text{minutes}}$$

Standard MET values used:
- Walking (normal $4.5\text{ km/h}$): $3.5$
- Walking (brisk $5.6\text{ km/h}$): $4.3$
- Moderate Strength Training: $5.0$
- Heavy Strength Training / Circuit: $6.5$
- Calisthenics Vigorous: $8.0$
- HIIT / Jump Rope: $10.0$

#### 4. Workout Volume
$$\text{Session Volume (kg)} = \sum_{\text{completed sets}} (\text{Weight}_{\text{kg}} \times \text{Reps})$$

---

### 4.3 Nutrition Scaling & Cooking Factor Mathematics (`nutritionEngine.js`)

Foods in the database are stored on a $100\text{g}$ base standard. When a user logs a food using units (cups, spoons, pieces, grams), the exact factor is computed:

$$\text{Factor} = \frac{\text{Quantity} \times \text{Unit Weight in Grams}}{\text{Base Serving Size} \times \text{Base Unit Weight}}$$

Every macro is rounded to 1 decimal place:
$$\text{Nutrient}_{\text{actual}} = \operatorname{round}_{1\text{dp}}(\text{Nutrient}_{\text{base}} \times \text{Factor})$$

---

## 5. COMPLETE MODULE-BY-MODULE SPECIFICATIONS

### 5.1 Dashboard (`Dashboard.jsx`)
- **Header**: Live digital clock, active mission date selector, Operative Level & Rank badge, XP progress bar with exact remaining XP indicator.
- **Daily Snapshot Ring Cards**:
  - Tasks Progress: Completed vs total tasks with completion %.
  - Calorie Status: Consumed vs Target with Active Burn deduction.
  - Hydration Ring: Glasses completed against schedule.
  - Workout Status: Completed badge or scheduled session preview.
- **Quick Action Trigger Bar**: Instant modal triggers for Quick Task, Log Meal, Quick Hydration, Quick Walk, and Log Body Weight.
- **Next Priority Action**: Dynamically computes the single most urgent pending item (overdue task, scheduled meal, or unfinished workout).
- **Biohacker Widget**: Quick toggle for sleep tracking and hourly 1–10 energy pulse logging.

### 5.2 Tasks & Daily Execution (`TodayTasks.jsx`)
- **Date Navigation**: Previous Day, Today, Next Day, or Calendar jump.
- **Creation Bar**: Fast-entry input with Priority selector (High, Medium, Low), Category tag, Due Time picker, and Estimated Duration.
- **Task List Features**:
  - Checkbox toggle with instant audio chime (`playNotificationSound`) and confetti explosion on milestone.
  - Order reordering and persistent prioritization.
  - Subtask / Checklist accordion support.
  - In-place task editing modal (`TaskModal.jsx`).
  - Active Elapsed Timer: Run a live stopwatch on a task to record actual `timeTaken` vs `estimatedTime`.
  - Filter by status: All, Active, Completed, or Priority filter.
  - Search Overlay: Global `Ctrl+K` modal to search tasks across all historical and future dates.

### 5.3 Routines & Habit Tracker (`Routines.jsx`)
- **Recurring Template**: Define habits (e.g., "Morning Mobility", "Read 20 mins", "Cold Shower").
- **Day-of-Week Schedule**: Assign which days (Sunday–Saturday) the routine is active.
- **Auto-Injection Pipeline**: `applyRoutinesToDate(date)` runs automatically on app load and date shift, checking if routine tasks exist for that date; if not, injects them seamlessly as `isRoutine: true`.
- **Streak Protection**: Streaks increment on consecutive completed active days. Scheduled rest days do **not** break streaks.

### 5.4 Fitness OS / Gym (`Gym.jsx`)
- **Active Workout Session**:
  - Displays workout name from weekly schedule or custom template.
  - Set-by-set input: weight (kg) and reps for each exercise.
  - Check set as completed: automatically triggers rest timer and updates session volume.
  - Exercise Library: 38 default calisthenics, dumbbell, and barbell exercises categorized by muscle groups. Ability to create custom exercises.
  - Circular Rest Timer (`RestTimer`): Configurable 30s, 60s, 90s, 120s countdown with sound chime and $+15\text{s} / -15\text{s}$ controls.
  - PR (Personal Record) Detection: Flags when a set exceeds all historical max weight or max volume for that exercise.
  - Calorie Estimation: Automatically calculates calories burned based on exercise count, sets, and duration.
  - Streak Tracking: Dedicated gym streak counter with rest day allowance.

### 5.5 Diet OS / Nutrition (`Diet.jsx`)
- **Macro Target Bar**: Live progress bars for Calories, Protein, Carbohydrates, Fat, and Fiber.
- **Meal Classification**: Grouped by Breakfast, Morning Snack, Lunch, Evening Snack, Dinner, and Post-Workout.
- **Food Database (`foodDatabase.js`)**: Over 1,000 foods including extensive Indian staples (Roti, Dal, Paneer, Rice, Dosa, Idli, Curries) and global fitness foods (Whey, Chicken breast, Eggs, Oats, Avocado).
- **Unit Selector**: Grams (g), Kilograms (kg), Milliliters (ml), Cups (240g), Glass (250ml), Tablespoons (15g), Teaspoons (5g), and standard Eggs/Pieces.
- **Custom Food & Recipe Builder**: Users can save custom items, multi-ingredient meals, and favorite quick-picks.
- **Hydration Tracker**: 5-stage default water schedule (8:00 AM, 11:00 AM, 2:00 PM, 5:00 PM, 8:00 PM) with 1-click completion and desktop/mobile reminder alerts.

### 5.6 Focus Mode / Pomodoro (`FocusMode.jsx`)
- **Timer Modes**: Focus (default 25 min), Short Break (5 min), Long Break (15 min).
- **Background Integrity**: Uses timestamp delta math (`Date.now() - startTime`) rather than simple `setInterval` increments, preventing timing drift when the browser throttles background tabs.
- **Task Association**: Link a focus session directly to a pending task. Completing the session logs the time against the task.
- **Full Screen Ambient Mode**: Distraction-free dark canvas with minimal visual clutter, pulsing progress ring, and ambient sound alert.

### 5.7 BioHacker & Lifestyle (`BioHacker.jsx`, `WalkLogModal.jsx`)
- **Sleep Tracker**: Logs sleep start, wake time, calculated total duration, quality rating (1–10), and sleep tags.
- **Energy Pulse**: Quick logger for current physical/mental energy (1–10) with an interactive intraday area chart.
- **Walking & Steps Engine**:
  - Logs step count, distance in kilometers, or duration in minutes.
  - Smart deduplication prevents accidental duplicate activity records.
  - Calculates MET-based caloric burn and incorporates walking into the active calorie balance.
- **Body Metric Logger**: Weight tracking over time with rolling average.

### 5.8 AI Insights & Intelligence Engine (`intelligenceEngine.js`, `AIInsights.jsx`)
- **Cross-Module Correlations**:
  - Correlation between sleep duration ($< 6.5\text{h}$ vs $\ge 7.5\text{h}$) and workout volume or task completion.
  - Correlation between high-protein days and energy levels.
  - Correlation between early morning task completion and total daily productivity.
- **Strict Real-Data Policy**: If fewer than 3–5 data points exist for a metric, the UI renders a clean "Awaiting Data" badge rather than generating fabricated statistical scores.
- **Direct Action Links**: Insight cards provide 1-click navigation buttons directly to the relevant module to fix identified deficiencies (e.g., "Log Hydration →", "Adjust Protein Target →").

### 5.9 Deep Analytics & Monthly Reports (`Analytics.jsx`, `MonthlyReport.jsx`)
- **Productivity Score**:
  $$\text{Productivity Score} = \frac{\text{Completed Tasks}}{\text{Total Scheduled Tasks}} \times 100$$
- **Volume & Fitness Charts**: Weekly and monthly aggregate tonnage (kg lifted) and workout frequency.
- **Macro Adherence Radar**: Radar chart showing balance across Calorie adherence, Protein goal % hit, Water intake %, and Habit consistency.
- **Monthly Summary**: High-level printable review highlighting total missions cleared, top exercises, total volume lifted, and XP earned.

### 5.10 Admin Console & System Verification (`Admin.jsx`, `systemVerification.test.js`)
- **Security & RBAC**: Admin route listener accessible via `#admin` or `/admin` for users with administrative claims.
- **Audit Logs**: Visualizes system events, XP award transactions, and sync events.
- **Manual Maintenance Controls**:
  - Force Cloud Resync: Overrides local-only caches and pulls authoritative Firestore document.
  - Bypass Sync Lock: Unlocks the UI if network timeouts occur during initial sync.
  - Seed Test Data: Populates realistic test data for evaluation.
  - Automated Integrity Verification: Executes the built-in unit test suite verifying mathematical curves, anti-farming locks, and reversible XP ledger.

---

## 6. CLOUD SYNCHRONIZATION & OFFLINE ARCHITECTURE

### 6.1 Local-First Architecture
1. Any state mutation (adding a task, checking a set, logging a meal) updates the **Zustand store** immediately.
2. The store automatically serializes state to the browser's `localStorage` under the key `taskbar-storage`.
3. If the user is unauthenticated (Guest mode), the application functions fully with zero feature restrictions.

### 6.2 Cloud Firestore Synchronization (`firebase.js` & `useStore.js`)
- **Path**: `/users/{uid}` in Cloud Firestore.
- **Debounced Save**: When online and logged in, mutations trigger a debounced `setDoc` with `{ merge: true }` every 5 seconds to avoid Firestore rate limits.
- **Initial Load Protocol**:
  1. User authenticates via Firebase Auth.
  2. `loadUserData(uid)` is invoked.
  3. `getDoc` fetches the remote document.
  4. Local state and remote state are merged. If remote contains newer entries, remote takes precedence; if local has offline mutations, local merges gracefully without data loss.
  5. `isDataLoaded` flag is set to `true`, releasing the sync lock.
- **Timeout Protection**: If Firestore takes longer than 4.0 seconds to respond, a "Troubleshoot / Bypass Sync" button appears, allowing the user to enter Local-Only mode immediately without freezing the UI.

---

## 7. HARDWARE, BATTERY & NATIVE DEVICE INTEGRATION

### 7.1 Battery & Eco-Mode
TaskBar OS monitors hardware power via the Web Battery API (`navigator.getBattery`):
- If the device is unplugged and battery drops below 20%, the system automatically injects the `.eco-mode` CSS class.
- Background sync interval scales dynamically:
  - Active & Plugged in: 10-second checks.
  - Battery / Eco-mode: 30-second checks.
  - Hidden / Minimized Tab: 60-second checks (zero unnecessary CPU wakeups).

### 7.2 Native Notifications (`NotificationService.js`)
- **Capacitor Android**: Requests `LocalNotifications` permissions and configures the Android Notification Channel `tactical-alerts` with `importance: 5` (Heads-Up Alert) and vibration.
- **Web Fallback**: Falls back to the browser `Notification` API when running as a PWA.
- **Mission Sync**: Background scheduler registers alarms for scheduled water reminders, active task deadlines, and daily routine alerts.

### 7.3 Desktop Integration (`electron/main.cjs`)
- Frameless window with `titleBarStyle: 'hiddenInset'`.
- Background color set to `#0a0b10` to avoid white flash on startup.
- `backgroundThrottling: true` ensures CPU usage drops to negligible levels when minimized.

---

## 8. MASTER USER WORKFLOWS

### Workflow A: Morning Kickoff & Daily Alignment
1. **App Launch**: The user opens TaskBar OS (desktop, web, or mobile).
2. **Auto-Routine Injection**: The system reads the day of the week, checks `gymSchedule` and `routines`, and auto-injects scheduled routines into the daily task list.
3. **Daily Snapshot Review**: The user checks the Dashboard for today's workout focus, calorie/macro goals, and scheduled priority tasks.
4. **Hydration Activation**: The first 500ml water slot at 08:00 AM is logged with 1 click on the Quick Log Bar.

### Workflow B: Executing a Workout in Fitness OS
1. User navigates to **Gym** tab.
2. Today's programmed workout (e.g., "Chest + Abs") is displayed with target exercises, sets, and reps.
3. For each set:
   - User enters weight (e.g., 20kg dumbbells) and reps completed (e.g., 12 reps).
   - User checks the set checkbox.
   - The Rest Timer automatically triggers a 60-second circular countdown.
   - Session volume (kg) updates in real time.
4. If a set breaks a historical record, a "Personal Record Broken!" badge is displayed.
5. On checking the final exercise, the workout is marked completed:
   - $+100\text{ XP}$ is awarded through the idempotent XP engine.
   - Calories burned are calculated via MET formulas and deducted from the net calorie balance.
   - Confetti animation celebrates the session.

### Workflow C: Meal & Macro Tracking in Diet OS
1. User taps **Quick Log (+) → Meal** or navigates to **Diet**.
2. User selects meal type (e.g., "Lunch").
3. User types in food search (e.g., "Paneer" or "Brown Rice").
4. User selects unit (e.g., "Grams" or "Cups") and quantity.
5. Nutrition engine automatically scales calories, protein, carbs, fats, and fiber based on raw/cooked weight.
6. User clicks "Add to Meal". The dashboard macro ring bars update instantly, showing remaining calories and protein required for the day.

### Workflow D: Deep Work Pomodoro Session
1. User clicks on **Focus Mode** or clicks the Timer icon on a High Priority task.
2. The timer displays 25:00 minutes with ambient distraction-free UI.
3. User starts the session. Timestamp delta tracking keeps exact time even if the app is minimized.
4. On completion:
   - Procedural success chime plays.
   - $+25\text{ XP}$ is awarded.
   - The linked task logs elapsed time.

### Workflow E: Evening Review & Day Submission
1. User checks off remaining completed tasks on the **Today** view.
2. User opens the **BioHacker** section to rate daily energy and log sleep from the previous night.
3. User checks the **AI Insights** tab to see real-time observations (e.g., "Protein intake was 95% of target; recovery efficiency optimal").
4. Data is automatically synced to Cloud Firestore with an updated lifetime XP and active streak.

---

## 9. INSTRUCTIONS FOR DEVELOPERS & AI ASSISTANTS (CHATGPT)

When tasked with adding features, fixing bugs, or refactoring code in TaskBar OS, you **MUST** adhere to the following rules:

1. **State Mutation via Immer**:
   Always mutate state using Zustand's `immer` syntax inside actions:
   ```javascript
   set((state) => {
     state.tasks[date].push(newTask);
   });
   ```
2. **Preserve Idempotent XP Accounting**:
   Never increment `state.gamification.xp` directly in random UI components. Always route XP awards through `processXpAward` in `src/lib/xpService.js` with an explicit `sourceId`.
3. **No Synthetic Mock Data in Analytics**:
   Never generate randomized or placeholder metrics in `Analytics.jsx` or `AIInsights.jsx`. If user data is missing, display the fallback empty state: `"Not enough data yet"`.
4. **Local-First & Offline Resilience**:
   Ensure all features work offline without crashing if Firebase Auth or Firestore is disconnected.
5. **Theme & CSS Tokens**:
   Never use hardcoded hex colors for standard UI components. Always use CSS variables:
   - Backgrounds: `var(--bg-base)`, `var(--bg-card)`, `var(--bg-elevated)`
   - Text: `var(--text-primary)`, `var(--text-secondary)`, `var(--text-muted)`
   - Accents: `var(--accent-primary)`, `var(--priority-high)`, `var(--priority-medium)`
6. **Date Formatting**:
   Always use `format(new Date(), 'yyyy-MM-dd')` from `date-fns` for date keys to maintain ISO compatibility across all modules.
