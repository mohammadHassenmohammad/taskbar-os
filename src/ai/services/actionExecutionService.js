import { useStore, today } from '../../store/useStore.js';
import { format, addDays, subDays, nextDay, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

/**
 * JARVIS Autonomous Action & Execution Engine
 * Provides authoritative execution across all TaskBar OS modules.
 * Connects directly to Zustand store actions, preserving XP rules,
 * validation, and state reactivity.
 */

// Action Risk Levels
export const ACTION_RISK = {
  LOW: 'low',                   // Safe: Auto-executable or 1-click execution
  CONSEQUENTIAL: 'consequential' // Destructive: Requires explicit confirmation
};

/**
 * Resolves natural language date references to 'yyyy-MM-dd' ISO string
 */
export function resolveNaturalDate(dateInput) {
  if (!dateInput) return today();
  const lower = String(dateInput).trim().toLowerCase();

  const now = new Date();
  if (lower === 'today' || lower === 'now') return format(now, 'yyyy-MM-dd');
  if (lower === 'tomorrow') return format(addDays(now, 1), 'yyyy-MM-dd');
  if (lower === 'yesterday') return format(subDays(now, 1), 'yyyy-MM-dd');

  // Days of week (e.g. 'friday', 'next monday')
  const daysMap = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
  for (const [dayName, dayNum] of Object.entries(daysMap)) {
    if (lower.includes(dayName)) {
      const target = nextDay(now, dayNum);
      return format(target, 'yyyy-MM-dd');
    }
  }

  // Attempt ISO parse
  try {
    const parsed = parseISO(dateInput);
    if (!isNaN(parsed.getTime())) {
      return format(parsed, 'yyyy-MM-dd');
    }
  } catch {}

  return today();
}

/**
 * Normalizes text by removing non-alphanumeric characters and lowercase
 */
const normStr = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Fuzzy matches a task in the store by informal title or ID
 */
export function findTaskInStore(query = '', preferredDate = null) {
  const store = useStore.getState();
  const allTasks = store.tasks || {};
  const q = String(query).trim().toLowerCase();
  const qNorm = normStr(query);

  const exactMatches = [];
  const partialMatches = [];

  // Search across dates (checking preferredDate first)
  const dates = Object.keys(allTasks);
  if (preferredDate && dates.includes(preferredDate)) {
    dates.sort((a, b) => (a === preferredDate ? -1 : b === preferredDate ? 1 : 0));
  }

  dates.forEach(dStr => {
    const list = allTasks[dStr] || [];
    list.forEach(t => {
      const titleLower = (t.title || '').toLowerCase();
      const tNorm = normStr(t.title);

      const isExact = t.id === q || titleLower === q || (qNorm.length > 0 && tNorm === qNorm);
      if (isExact) {
        exactMatches.push({ task: t, date: dStr, exact: true });
      } else {
        const isPartial = titleLower.includes(q) || 
          (qNorm.length >= 3 && tNorm.includes(qNorm)) || 
          (qNorm.length >= 3 && qNorm.includes(tNorm)) ||
          (t.description && t.description.toLowerCase().includes(q));
        if (isPartial) {
          partialMatches.push({ task: t, date: dStr, exact: false });
        }
      }
    });
  });

  const candidates = [...exactMatches, ...partialMatches];

  if (candidates.length === 0) return { found: false, task: null };
  if (candidates.length === 1 || candidates[0].exact) {
    return { found: true, task: candidates[0].task, date: candidates[0].date, ambiguous: false };
  }

  return {
    found: true,
    task: candidates[0].task,
    date: candidates[0].date,
    ambiguous: true,
    candidates: candidates.slice(0, 4).map(c => ({ id: c.task.id, title: c.task.title, date: c.date }))
  };
}

/**
 * Fuzzy matches a habit in store by name
 */
export function findHabitInStore(query = '') {
  const store = useStore.getState();
  const habits = store.habits || [];
  const q = String(query).trim().toLowerCase();
  const qNorm = normStr(query);

  const match = habits.find(h => 
    h.id === q || 
    (h.name && h.name.toLowerCase() === q) || 
    (h.title && h.title.toLowerCase() === q) ||
    (h.name && normStr(h.name) === qNorm)
  ) || habits.find(h => 
    (h.name && h.name.toLowerCase().includes(q)) || 
    (h.title && h.title.toLowerCase().includes(q)) ||
    (qNorm.length >= 3 && normStr(h.name).includes(qNorm))
  );

  return match || null;
}

/**
 * Fuzzy matches a routine in store by title
 */
export function findRoutineInStore(query = '') {
  const store = useStore.getState();
  const routines = store.routines || [];
  const q = String(query).trim().toLowerCase();
  const qNorm = normStr(query);

  const match = routines.find(r => 
    r.id === q || 
    (r.title && r.title.toLowerCase() === q) ||
    (r.title && normStr(r.title) === qNorm)
  ) || routines.find(r => 
    (r.title && r.title.toLowerCase().includes(q)) ||
    (qNorm.length >= 3 && normStr(r.title).includes(qNorm))
  );

  return match || null;
}

/**
 * Core Autonomous Action Executor
 */
export class ActionExecutionService {
  /**
   * Evaluates and executes an action request through the authoritative Zustand store
   */
  static async executeAction(actionType, payload = {}, options = {}) {
    const store = useStore.getState();
    const targetDate = resolveNaturalDate(payload.date || options.date);

    try {
      switch (actionType) {
        // ==========================================
        // 1. TASKS OPERATIONS
        // ==========================================
        case 'create_task': {
          const title = payload.title || payload.taskTitle || 'New Mission';
          const priority = payload.priority || 'Medium';
          const category = payload.category || 'Work';
          const dueTime = payload.dueTime || '';

          store.addTask({
            title,
            priority,
            category,
            dueTime,
            completed: false
          }, targetDate);

          toast.success(`Task created for ${targetDate}: "${title}"`, { icon: '✅' });
          return {
            success: true,
            action: actionType,
            message: `Created task "${title}" scheduled for ${targetDate} with ${priority} priority.`,
            targetDate
          };
        }

        case 'complete_task': {
          const query = payload.title || payload.id || payload.taskTitle;
          const search = findTaskInStore(query, targetDate);

          if (!search.found) {
            throw new Error(`Could not locate task matching "${query}".`);
          }

          if (search.ambiguous && !payload.id && !options.confirmed) {
            return {
              success: false,
              requiresClarification: true,
              message: `Multiple tasks matched "${query}". Which one did you mean?`,
              candidates: search.candidates
            };
          }

          if (!search.task.completed) {
            store.toggleTaskComplete(search.task.id, search.date);
            toast.success(`Mission completed: "${search.task.title}"`, { icon: '🎯' });
          }

          return {
            success: true,
            action: actionType,
            message: `Marked "${search.task.title}" as completed (+XP awarded).`,
            taskId: search.task.id
          };
        }

        case 'uncomplete_task': {
          const query = payload.title || payload.id;
          const search = findTaskInStore(query, targetDate);
          if (!search.found) throw new Error(`Could not find task matching "${query}".`);

          if (search.task.completed) {
            store.toggleTaskComplete(search.task.id, search.date);
            toast.success(`Task reopened: "${search.task.title}"`);
          }
          return { success: true, message: `Reopened task "${search.task.title}".` };
        }

        case 'update_task': {
          const query = payload.targetTitle || payload.title || payload.id;
          const search = findTaskInStore(query, targetDate);
          if (!search.found) throw new Error(`Could not find task matching "${query}".`);

          const updates = {};
          if (payload.newTitle) updates.title = payload.newTitle;
          if (payload.priority) updates.priority = payload.priority;
          if (payload.category) updates.category = payload.category;
          if (payload.dueTime) updates.dueTime = payload.dueTime;

          store.updateTask(search.task.id, search.date, updates);
          toast.success(`Updated task "${search.task.title}"`);
          return { success: true, message: `Updated fields for "${search.task.title}".` };
        }

        case 'reschedule_task':
        case 'move_task': {
          const query = payload.title || payload.id;
          const search = findTaskInStore(query, targetDate);
          if (!search.found) throw new Error(`Could not find task matching "${query}".`);

          const toDate = resolveNaturalDate(payload.toDate || payload.newDate);
          store.postponeTask(search.task.id, search.date, toDate);
          toast.success(`Rescheduled to ${toDate}: "${search.task.title}"`, { icon: '📅' });
          return { success: true, message: `Moved "${search.task.title}" from ${search.date} to ${toDate}.` };
        }

        case 'delete_task': {
          const query = payload.title || payload.id;
          const search = findTaskInStore(query, targetDate);
          const routineMatch = findRoutineInStore(query);

          // If no task found, but a routine with this name exists, delete the routine
          if (!search.found && routineMatch) {
            store.deleteRoutine(routineMatch.id);
            toast.success(`Deleted routine: "${routineMatch.title}"`);
            return {
              success: true,
              action: actionType,
              message: `Deleted routine protocol "${routineMatch.title}" and cleared future occurrences.`
            };
          }

          if (!search.found) throw new Error(`Could not find task matching "${query}".`);

          // 1. Delete the primary matched task
          store.deleteTask(search.task.id, search.date);

          // 2. Clear any duplicate task instances on that date so none remain visible
          if (!payload.id && store.tasks[search.date]) {
            const qNorm = normStr(query);
            const duplicates = store.tasks[search.date].filter(t => 
              t.id !== search.task.id && (
                t.title?.toLowerCase() === search.task.title.toLowerCase() ||
                normStr(t.title) === qNorm
              )
            );
            duplicates.forEach(dup => {
              store.deleteTask(dup.id, search.date);
            });
          }

          // 3. If also requested or if the user asked to delete routine, remove the routine protocol
          if (payload.deleteRoutine && search.task.isRoutine && search.task.routineId) {
            store.deleteRoutine(search.task.routineId);
          }

          toast.success(`Task deleted: "${search.task.title}"`);
          return { success: true, message: `Deleted task "${search.task.title}".` };
        }

        // ==========================================
        // 2. HABITS OPERATIONS
        // ==========================================
        case 'create_habit': {
          const name = payload.name || payload.title || 'New Habit';
          store.addHabit({
            name,
            icon: payload.icon || '🌟',
            category: payload.category || 'General',
            target: payload.target || 1,
            unit: payload.unit || 'times',
            frequency: payload.frequency || 'daily',
            scheduledDays: payload.scheduledDays || [0, 1, 2, 3, 4, 5, 6]
          });
          toast.success(`Habit created: "${name}"`, { icon: '🌟' });
          return { success: true, message: `Created habit protocol "${name}".` };
        }

        case 'log_habit': {
          const query = payload.name || payload.title || payload.habitId;
          const habit = findHabitInStore(query);
          if (!habit) throw new Error(`Could not find habit matching "${query}".`);

          store.logHabit(habit.id, targetDate, true);
          toast.success(`Habit logged: "${habit.name || habit.title}"`, { icon: '🌟' });
          return { success: true, message: `Logged habit "${habit.name || habit.title}" for ${targetDate}.` };
        }

        case 'delete_habit': {
          const query = payload.name || payload.id;
          const habit = findHabitInStore(query);
          if (!habit) throw new Error(`Could not find habit matching "${query}".`);

          store.deleteHabit(habit.id);
          toast.success(`Habit deleted`);
          return { success: true, message: `Deleted habit "${habit.name || habit.title}".` };
        }

        // ==========================================
        // 3. ROUTINES OPERATIONS
        // ==========================================
        case 'create_routine': {
          const title = payload.title || 'New Routine';
          const category = payload.category || 'General';
          const priority = payload.priority || 'Medium';
          const dueTime = payload.dueTime || payload.time || '08:00 AM';
          const days = payload.days || [0, 1, 2, 3, 4, 5, 6];

          store.addRoutine({
            title,
            description: payload.description || '',
            priority,
            category,
            dueTime,
            days
          });
          toast.success(`Routine created: "${title}"`, { icon: '⚡' });
          return { 
            success: true, 
            message: `Added routine protocol "${title}" (${category}, ${priority} priority, ${dueTime}).` 
          };
        }

        case 'apply_routine': {
          store.applyRoutinesToDate(targetDate);
          toast.success(`Applied routine protocols for ${targetDate}`, { icon: '⚡' });
          return { success: true, message: `Generated daily tasks for all active routines for ${targetDate}.` };
        }

        case 'delete_routine': {
          const query = payload.title || payload.id;
          const routine = findRoutineInStore(query);
          if (!routine) throw new Error(`Could not find routine matching "${query}".`);

          store.deleteRoutine(routine.id);
          toast.success(`Routine deleted: "${routine.title}"`);
          return { success: true, message: `Deleted routine protocol "${routine.title}".` };
        }

        // ==========================================
        // 4. FOCUS & POMODORO OPERATIONS
        // ==========================================
        case 'start_focus': {
          const duration = parseInt(payload.duration || payload.minutes || 25, 10);
          store.startPomodoro('focus', duration, payload.linkedTaskId || null);
          store.setPage('focus');
          toast.success(`Focus session (${duration}m) initiated`, { icon: '🎯' });
          return { success: true, message: `Started a ${duration}-minute deep focus block.` };
        }

        case 'stop_focus': {
          store.resetPomodoro();
          toast.success('Focus session ended', { icon: '⏱️' });
          return { success: true, message: 'Current focus session has been stopped and reset.' };
        }

        // ==========================================
        // 5. WELLNESS & HYDRATION OPERATIONS
        // ==========================================
        case 'log_water': {
          const glassesToAdd = parseInt(payload.amount || payload.glasses || 1, 10);
          const current = store.waterLogs?.[targetDate] || 0;
          const newTotal = current + glassesToAdd;
          store.logWater(targetDate, newTotal);
          toast.success(`Logged ${glassesToAdd} glass(es) water (${newTotal} total)`, { icon: '💧' });
          return { success: true, message: `Logged ${glassesToAdd} glass(es) of water for ${targetDate} (Total: ${newTotal}/${store.waterGoal || 8}).` };
        }

        case 'log_sleep': {
          const hours = parseFloat(payload.hours || 7.5);
          const quality = payload.quality || 'Good';
          store.logSleep(targetDate, { hours, quality, deepSleepHours: payload.deepSleepHours || 2.0 });
          toast.success(`Sleep logged: ${hours} hrs (${quality})`, { icon: '😴' });
          return { success: true, message: `Recorded ${hours} hours of sleep (${quality}) for ${targetDate}.` };
        }

        case 'log_walking': {
          const steps = parseInt(payload.steps || 5000, 10);
          store.logWalkingActivity(steps, targetDate);
          toast.success(`Logged ${steps.toLocaleString()} steps`, { icon: '👟' });
          return { success: true, message: `Recorded ${steps.toLocaleString()} steps for ${targetDate}.` };
        }

        // ==========================================
        // 6. DIET & NUTRITION OPERATIONS
        // ==========================================
        case 'log_food': {
          const name = payload.name || payload.foodName || 'Meal Entry';
          const mealType = payload.mealType || 'lunch';
          const calories = parseFloat(payload.calories || 350);
          const protein = parseFloat(payload.protein || 25);
          const carbs = parseFloat(payload.carbs || 30);
          const fat = parseFloat(payload.fat || 10);

          store.addDietEntry({
            name,
            mealType,
            quantityGrams: payload.quantityGrams || 200,
            calculatedNutrients: { calories, protein, carbs, fat, fiber: 5 }
          }, targetDate);

          toast.success(`Food logged: "${name}" (${calories} kcal)`, { icon: '🥗' });
          return { success: true, message: `Logged ${name} (${calories} kcal, ${protein}g protein) under ${mealType}.` };
        }

        // ==========================================
        // 7. GYM & WORKOUT OPERATIONS
        // ==========================================
        case 'complete_workout': {
          await store.completeWorkout(targetDate);
          toast.success(`Workout completed for ${targetDate}! (+XP awarded)`, { icon: '🏋️' });
          return { success: true, message: `Workout marked complete for ${targetDate}. High discipline!` };
        }

        case 'reset_workout': {
          store.resetWorkout(targetDate);
          toast.success(`Workout reset for ${targetDate}`);
          return { success: true, message: `Reset workout session for ${targetDate}.` };
        }

        // ==========================================
        // 8. SYSTEM & SETTINGS OPERATIONS
        // ==========================================
        case 'toggle_theme': {
          store.toggleTheme();
          const newTheme = useStore.getState().theme;
          toast.success(`Theme switched to ${newTheme}`);
          return { success: true, message: `Switched system theme to ${newTheme}.` };
        }

        case 'navigate_page':
        case 'set_page': {
          const page = payload.page || payload.pageId || 'dashboard';
          store.setPage(page);
          return { success: true, message: `Navigated to ${page}.` };
        }

        case 'export_data': {
          const dataStr = store.exportData('json');
          return {
            success: true,
            message: `Generated application data backup JSON payload (${(dataStr.length / 1024).toFixed(1)} KB).`
          };
        }

        // ==========================================
        // 9. NOTES & SCRATCHPAD OPERATIONS
        // ==========================================
        case 'create_note':
        case 'add_note': {
          const rawText = payload.text || payload.content || payload.title || payload.note || 'New Note';
          const cleanText = String(rawText).replace(/^["']|["']$/g, '').trim();
          store.addQuickNote(targetDate, cleanText);
          store.addMissionNote(targetDate, cleanText);
          toast.success(`Note captured: "${cleanText}"`, { icon: '📝' });
          return {
            success: true,
            action: actionType,
            message: `Captured note "${cleanText}" for ${targetDate} in Neural Scratchpad & Mission Debrief.`,
            targetDate
          };
        }

        case 'delete_note': {
          const query = payload.text || payload.title || payload.id;
          store.deleteQuickNote(targetDate, query);
          store.deleteMissionNote(targetDate, query);
          toast.success(`Note deleted: "${query}"`);
          return {
            success: true,
            action: actionType,
            message: `Deleted note "${query}" from ${targetDate}.`
          };
        }

        case 'create_project': {
          store.addProject({
            title: payload.title || payload.name,
            description: payload.description || '',
            category: payload.category || 'Work',
            deadline: payload.deadline || '',
            milestones: Array.isArray(payload.milestones) ? payload.milestones.map(m => ({ id: `m_${Date.now()}_${Math.random()}`, title: typeof m === 'string' ? m : m.title, completed: false })) : []
          });
          return {
            success: true,
            action: actionType,
            message: `Initiated project "${payload.title || payload.name}".`
          };
        }

        case 'delete_project': {
          const proj = (store.projects || []).find(p => p.id === payload.id || normStr(p.title) === normStr(payload.title || payload.name));
          if (!proj) throw new Error(`Project "${payload.title || payload.name || payload.id}" not found.`);
          store.deleteProject(proj.id);
          return {
            success: true,
            action: actionType,
            message: `Deleted project "${proj.title}".`
          };
        }

        case 'create_goal': {
          store.addGoal({
            title: payload.title || payload.name,
            description: payload.description || '',
            category: payload.category || 'Personal',
            timeHorizon: payload.timeHorizon || 'short_term',
            targetDate: payload.targetDate || ''
          });
          return {
            success: true,
            action: actionType,
            message: `Defined strategic goal "${payload.title || payload.name}".`
          };
        }

        case 'delete_goal': {
          const g = (store.goals || []).find(goal => goal.id === payload.id || normStr(goal.title) === normStr(payload.title || payload.name));
          if (!g) throw new Error(`Goal "${payload.title || payload.name || payload.id}" not found.`);
          store.deleteGoal(g.id);
          return {
            success: true,
            action: actionType,
            message: `Deleted goal "${g.title}".`
          };
        }

        case 'save_to_brain':
        case 'add_brain_item': {
          store.addBrainItem({
            title: payload.title || 'Knowledge Node',
            content: payload.content || payload.text || '',
            type: payload.type || 'note',
            tags: payload.tags || []
          });
          return {
            success: true,
            action: actionType,
            message: `Stored node "${payload.title || 'Knowledge Node'}" in Second Brain.`
          };
        }

        case 'log_study_session': {
          store.logStudySession({
            courseId: payload.courseId || '',
            subject: payload.subject || 'General',
            durationMinutes: Number(payload.durationMinutes || payload.duration) || 30,
            topicsCovered: payload.topicsCovered || payload.topic || '',
            date: targetDate
          });
          return {
            success: true,
            action: actionType,
            message: `Logged ${payload.durationMinutes || 30}m study session for ${payload.subject || 'General'}.`
          };
        }

        case 'create_automation': {
          store.addAutomation({
            name: payload.name || 'Automated Protocol',
            triggerType: payload.triggerType || 'schedule',
            triggerConfig: payload.triggerConfig || { time: '08:00 AM' },
            actionType: payload.actionType || 'apply_routines'
          });
          return {
            success: true,
            action: actionType,
            message: `Primed automation "${payload.name || 'Automated Protocol'}".`
          };
        }

        case 'add_memory': {
          store.addJarvisMemory(payload.key, payload.value);
          return {
            success: true,
            action: actionType,
            message: `Established persistent memory for "${payload.key}".`
          };
        }

        default:
          throw new Error(`Unrecognized application action: "${actionType}"`);
      }
    } catch (err) {
      console.error(`[ActionExecutionService] Failed to execute "${actionType}":`, err);
      toast.error(err.message || 'Action execution failed');
      return {
        success: false,
        error: err.message
      };
    }
  }
}
