import { BaseAIProvider } from './baseProvider.js';

/**
 * OpenRouter Provider (Optional - strictly configurable by admin)
 * Only allowed when OPENROUTER_API_KEY is explicitly provided.
 * Uses free-tier models such as: google/gemini-2.0-flash-exp:free or meta-llama/llama-3.3-70b-instruct:free
 */
export class OpenRouterProvider extends BaseAIProvider {
  constructor(config = {}) {
    super('openrouter');
    this.apiKey = config.apiKey || process.env.OPENROUTER_API_KEY || '';
    this.model = config.model || process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp:free';
    this.endpoint = 'https://openrouter.ai/api/v1/chat/completions';
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async _callApi(messages, options = {}, responseFormat = null) {
    if (!this.isConfigured()) {
      throw new Error('OPENROUTER_API_KEY is not configured on the server.');
    }

    const payload = {
      model: this.model,
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 2048
    };

    if (responseFormat) {
      payload.response_format = responseFormat;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://taskbar-os.local',
          'X-Title': 'TaskBar OS'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const status = response.status;
        const msg = errorData.error?.message || response.statusText;
        if (status === 429) {
          throw new Error('OpenRouter Rate Limit Exceeded. Please retry in a few moments.');
        }
        throw new Error(`OpenRouter Error (${status}): ${msg}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error('OpenRouter Request Timed Out (15s limit).');
      }
      throw err;
    }
  }

  async generateResponse(messages, options = {}) {
    const formattedMessages = [
      {
        role: 'system',
        content: options.systemPrompt || 'You are TaskBar OS AI, an intelligent productivity architect. Provide clear, evidence-based markdown guidance.'
      },
      ...messages
    ];

    const res = await this._callApi(formattedMessages, options);
    const content = res.choices?.[0]?.message?.content || 'No response generated.';

    return {
      text: content,
      model: this.model,
      provider: 'openrouter',
      usage: res.usage || null
    };
  }

  async generateStructuredResponse(prompt, schema = null, options = {}) {
    const messages = [
      {
        role: 'system',
        content: (options.systemPrompt || '') + '\nYou MUST reply ONLY in valid raw JSON without any markdown formatting.'
      },
      { role: 'user', content: prompt }
    ];

    const res = await this._callApi(messages, options, { type: 'json_object' });
    const content = res.choices?.[0]?.message?.content || '{}';
    try {
      return JSON.parse(content.trim());
    } catch {
      const cleaned = content.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    }
  }

  async analyzeProductivity(data) {
    const prompt = `Analyze this user productivity data from TaskBar OS:\n${JSON.stringify(data, null, 2)}\nReturn JSON with summary, bestPerformingDays, incompleteTaskPatterns, focusPatterns, routineConsistency, areasNeedingAttention, suggestions, productivityScore.`;
    return this.generateStructuredResponse(prompt);
  }

  async analyzeHabits(data) {
    const prompt = `Analyze this habit tracking data from TaskBar OS:\n${JSON.stringify(data, null, 2)}\nReturn JSON with summary, strongestHabits, vulnerableHabits, missedDayPatterns, recommendations.`;
    return this.generateStructuredResponse(prompt);
  }

  async analyzeWorkouts(data) {
    const prompt = `Analyze this workout data from TaskBar OS:\n${JSON.stringify(data, null, 2)}\nReturn JSON with summary, consistency, volumeTrend, restObservations, recommendations, disclaimer.`;
    return this.generateStructuredResponse(prompt);
  }

  async analyzeNutrition(data) {
    const prompt = `Analyze this nutrition data from TaskBar OS:\n${JSON.stringify(data, null, 2)}\nReturn JSON with summary, proteinAssessment, energyBalance, hydration, recommendations, disclaimer.`;
    return this.generateStructuredResponse(prompt);
  }

  async generateWeeklyReport(data) {
    const prompt = `Generate a weekly report for TaskBar OS:\n${JSON.stringify(data, null, 2)}\nReturn JSON with title, period, overallGrade, productivityScore, highlights, lowlights, metrics, markdownBody, nextWeekPriorities.`;
    return this.generateStructuredResponse(prompt);
  }

  async generateSuggestions(data) {
    const prompt = `Suggest 3-5 actionable next proposals for TaskBar OS:\n${JSON.stringify(data, null, 2)}\nReturn JSON array of suggestions with id, type, title, description, payload, impact.`;
    const res = await this.generateStructuredResponse(prompt);
    return Array.isArray(res) ? res : (res.suggestions || []);
  }
}
