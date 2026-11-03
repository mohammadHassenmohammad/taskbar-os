/**
 * JARVIS Contextual Speech Corrector & Domain Vocabulary Engine
 *
 * Intercepts raw speech-to-text transcripts and evaluates them against
 * live application context (tasks, projects, routines, habits, common commands).
 * Preserves the original raw transcript, records candidate corrections,
 * and flags uncertain operations to prevent premature execution.
 */

const NORM = (str) => String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

export class ContextualSpeechCorrector {
  /**
   * Evaluates a raw transcript against active store entities
   * @param {string} rawTranscript - The recognized text from STT
   * @param {object} applicationContext - Active store state snapshot
   * @returns {object} - { original, corrected, matchedEntity, confidence, requiresClarification }
   */
  static correctTranscript(rawTranscript, applicationContext = {}) {
    if (!rawTranscript || typeof rawTranscript !== 'string') {
      return {
        original: '',
        corrected: '',
        confidence: 1.0,
        requiresClarification: false
      };
    }

    const trimmed = rawTranscript.trim();
    const normalized = NORM(trimmed);

    // 1. Gather all entity candidates from active modules
    const tasks = [];
    const allTasks = applicationContext.tasks || {};
    Object.values(allTasks).forEach(list => {
      if (Array.isArray(list)) {
        list.forEach(t => t.title && tasks.push(t.title));
      }
    });

    const projects = (applicationContext.projects || []).map(p => p.title).filter(Boolean);
    const goals = (applicationContext.goals || []).map(g => g.title).filter(Boolean);
    const routines = (applicationContext.routines || []).map(r => r.title).filter(Boolean);
    const habits = (applicationContext.habits || []).map(h => h.title).filter(Boolean);

    let corrected = trimmed;
    let matchedEntity = null;
    let confidence = 0.95;
    let requiresClarification = false;

    const words = trimmed.split(/\s+/);
    const allEntities = [
      ...tasks.map(t => ({ title: t, type: 'task' })),
      ...projects.map(p => ({ title: p, type: 'project' })),
      ...routines.map(r => ({ title: r, type: 'routine' })),
      ...habits.map(h => ({ title: h, type: 'habit' }))
    ];

    for (const entity of allEntities) {
      const eNorm = NORM(entity.title);
      if (eNorm.length >= 3) {
        // Direct inclusion
        if (normalized.includes(eNorm)) {
          matchedEntity = entity;
          confidence = 1.0;
          break;
        }

        // Fuzzy match across word windows
        for (let i = 0; i < words.length; i++) {
          for (let j = i + 1; j <= Math.min(words.length, i + 4); j++) {
            const windowStr = NORM(words.slice(i, j).join(''));
            if (Math.abs(windowStr.length - eNorm.length) <= 2) {
              const dist = this.levenshtein(windowStr, eNorm);
              if (dist <= 2) {
                matchedEntity = entity;
                confidence = dist === 0 ? 1.0 : (dist === 1 ? 0.88 : 0.75);
                const originalSlice = words.slice(i, j).join(' ');
                corrected = trimmed.replace(originalSlice, entity.title);
                break;
              }
            }
          }
          if (matchedEntity) break;
        }
      }
      if (matchedEntity) break;
    }

    // Destructive safety check
    if (/\b(delete|remove|erase|clear)\b/i.test(trimmed)) {
      if (matchedEntity && confidence < 0.9) {
        requiresClarification = true;
      }
    }

    return {
      original: trimmed,
      corrected,
      matchedEntity,
      confidence,
      requiresClarification
    };
  }

  static levenshtein(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }
}
