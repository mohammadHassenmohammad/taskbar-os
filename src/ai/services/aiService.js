import {
  validateProductivityAnalysis,
  validateHabitAnalysis,
  validateWorkoutAnalysis,
  validateNutritionAnalysis,
  validateDailyPlan,
  validateWeeklyReport,
  validateSuggestion
} from '../schemas/aiSchemas';

/**
 * Frontend AI Client Service
 * Dispatches requests to the secure backend `/api/ai` endpoints with response caching.
 */
class AIService {
  constructor() {
    this.baseUrl = '/api/ai';
  }

  async getStatus() {
    try {
      const res = await fetch(`${this.baseUrl}/status`);
      if (!res.ok) throw new Error('Status check failed');
      return await res.json();
    } catch (err) {
      return {
        activeProvider: 'local_deterministic',
        isCloudConfigured: false,
        offline: true,
        error: err.message
      };
    }
  }

  async sendChatMessage(messages, context = {}) {
    const payload = { messages, context };
    const res = await fetch(`${this.baseUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `AI Chat error (${res.status})`);
    }

    return await res.json();
  }

  async analyze(type, data = {}) {
    const res = await fetch(`${this.baseUrl}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Analysis error (${res.status})`);
    }

    const json = await res.json();
    const raw = json.analysis;

    switch (type) {
      case 'productivity':
        return validateProductivityAnalysis(raw);
      case 'habits':
        return validateHabitAnalysis(raw);
      case 'workouts':
        return validateWorkoutAnalysis(raw);
      case 'nutrition':
        return validateNutritionAnalysis(raw);
      default:
        return raw;
    }
  }

  /**
   * Generates or retrieves cached daily plan
   */
  async getDailyPlan(context = {}, forceRegenerate = false) {
    const todayStr = context.today || new Date().toISOString().split('T')[0];
    const cacheKey = `taskbar_ai_daily_plan_${todayStr}`;

    if (!forceRegenerate) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          // invalid cache, continue
        }
      }
    }

    const res = await fetch(`${this.baseUrl}/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to generate plan');
    }

    const data = await res.json();
    const validated = validateDailyPlan(data.plan);
    localStorage.setItem(cacheKey, JSON.stringify(validated));
    return validated;
  }

  /**
   * Generates or retrieves cached weekly/monthly report
   */
  async getReport(period = 'weekly', reportData = {}, forceRegenerate = false) {
    const cacheKey = `taskbar_ai_report_${period}`;

    if (!forceRegenerate) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          // Reuse cache if generated within last 12 hours
          if (parsed && (Date.now() - (parsed.cachedAt || 0)) < 12 * 3600 * 1000) {
            return parsed.report;
          }
        } catch {
          // continue to fetch
        }
      }
    }

    const res = await fetch(`${this.baseUrl}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period, data: reportData })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to generate report');
    }

    const data = await res.json();
    const validated = validateWeeklyReport(data.report);
    localStorage.setItem(cacheKey, JSON.stringify({
      cachedAt: Date.now(),
      report: validated
    }));
    return validated;
  }

  async getSuggestions(data = {}) {
    const res = await fetch(`${this.baseUrl}/suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to fetch suggestions');
    }

    const json = await res.json();
    return (json.suggestions || []).map(validateSuggestion).filter(Boolean);
  }
}

export const aiService = new AIService();
