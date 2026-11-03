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
 * Dispatches requests to the secure backend `/api/ai` endpoints with response caching and real-time streaming.
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

  /**
   * Diagnostic live test connection
   */
  async testConnection() {
    try {
      const res = await fetch(`${this.baseUrl}/test-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Connection test failed (${res.status})`);
      }
      return await res.json();
    } catch (err) {
      return {
        success: false,
        connected: false,
        error: err.message
      };
    }
  }

  /**
   * Diagnostic details query
   */
  async getDiagnostics() {
    try {
      const res = await fetch(`${this.baseUrl}/diagnostics`);
      if (!res.ok) throw new Error('Diagnostics check failed');
      return await res.json();
    } catch (err) {
      return {
        success: false,
        connected: false,
        error: err.message
      };
    }
  }

  /**
   * Real-time Server-Sent Events (SSE) streaming chat
   */
  async streamChatMessage({ messages, mode = 'normal', context = {}, preferences = {}, onChunk, onDone, onError, abortSignal }) {
    const payload = { messages, mode, context, preferences };

    try {
      const res = await fetch(`${this.baseUrl}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: abortSignal
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Streaming request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6).trim();
            if (dataStr === '[DONE]') {
              continue;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              if (parsed.chunk) {
                accumulatedText += parsed.chunk;
                if (onChunk) onChunk(parsed.chunk, accumulatedText);
              }
            } catch (pErr) {
              if (dataStr !== '[DONE]') {
                // Ignore transient chunks
              }
            }
          }
        }
      }

      if (onDone) onDone(accumulatedText);
      return { text: accumulatedText };
    } catch (err) {
      if (err.name === 'AbortError') {
        if (onDone) onDone('');
        return { aborted: true };
      }
      if (onError) onError(err);
      throw err;
    }
  }

  async sendChatMessage(messages, context = {}, mode = 'normal', preferences = {}) {
    const payload = { messages, context, mode, preferences };
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
      throw new Error(errData.error || `Daily plan generation error (${res.status})`);
    }

    const json = await res.json();
    const validated = validateDailyPlan(json.plan);
    try {
      localStorage.setItem(cacheKey, JSON.stringify(validated));
    } catch {
      // ignore quota err
    }
    return validated;
  }

  /**
   * Generates weekly intelligence dossier
   */
  async getWeeklyReport(data = {}) {
    const res = await fetch(`${this.baseUrl}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Weekly report generation error (${res.status})`);
    }

    const json = await res.json();
    return validateWeeklyReport(json.report);
  }

  /**
   * Retrieves proactive recommendations
   */
  async getSuggestions(data = {}) {
    const res = await fetch(`${this.baseUrl}/suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Suggestions fetch error (${res.status})`);
    }

    const json = await res.json();
    const list = Array.isArray(json.suggestions) ? json.suggestions : [];
    return list.map(validateSuggestion);
  }
}

export const aiService = new AIService();
