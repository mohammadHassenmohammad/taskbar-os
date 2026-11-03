import { BaseAIProvider } from './baseProvider.js';
import { buildCompanionSystemPrompt } from '../prompts/personalityPrompts.js';

/**
 * Google Gemini API Provider with Automatic Dynamic Model Discovery,
 * Intelligent Fallback, Real-time SSE Streaming & Self-Healing 404 Recovery.
 */
export class GeminiProvider extends BaseAIProvider {
  constructor(config = {}) {
    super('gemini');
    this.apiKey = config.apiKey || process.env.GEMINI_API_KEY || '';
    this.preferredModel = config.model || process.env.GEMINI_MODEL || 'gemini-3.8-flash';
    this.model = this.preferredModel;
    this.analysisModel = config.analysisModel || process.env.GEMINI_ANALYSIS_MODEL || 'gemini-3.8-flash';
    this.fallbackModel = config.fallbackModel || process.env.GEMINI_FALLBACK_MODEL || 'gemini-2.0-flash';
    this.endpoint = 'https://generativelanguage.googleapis.com/v1beta';
    
    // Model Discovery Cache & Retirement Tracking
    this.discoveredModels = [];
    this.modelsLastDiscoveredAt = 0;
    this.modelDiscoveryTtlMs = 60 * 60 * 1000; // 1 hour
    this.retiredModels = new Set(); // Tracks models reported as retired/unavailable by Google
    this.lastResolvedModel = this.preferredModel;
    this.lastSuccessfulRequestAt = null;
    this.lastConnectionError = null;
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  /**
   * Helper to normalize model resource names
   * Ensures 'gemini-3.8-flash' -> 'models/gemini-3.8-flash'
   */
  _normalizeModelName(modelName) {
    if (!modelName) return 'models/gemini-3.8-flash';
    return modelName.startsWith('models/') ? modelName : `models/${modelName}`;
  }

  _cleanModelName(modelName) {
    if (!modelName) return 'gemini-3.8-flash';
    return modelName.replace(/^models\//, '');
  }

  /**
   * Discovers available models dynamically using Google ListModels API
   * Endpoint: GET https://generativelanguage.googleapis.com/v1beta/models
   */
  async discoverModels(forceRefresh = false) {
    if (!this.isConfigured()) {
      return [];
    }

    const now = Date.now();
    if (!forceRefresh && this.discoveredModels.length > 0 && (!this.modelsLastDiscoveredAt || (now - this.modelsLastDiscoveredAt < this.modelDiscoveryTtlMs))) {
      return this.discoveredModels;
    }

    const url = `${this.endpoint}/models?key=${this.apiKey}`;
    try {
      const response = await fetch(url, { method: 'GET' });
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const msg = errJson.error?.message || response.statusText;
        this.lastConnectionError = `ListModels failed (${response.status}): ${msg}`;
        return [];
      }

      const data = await response.json();
      const rawModels = data.models || [];

      // Filter only generative models that support text generation (exclude embedding models)
      const validModels = rawModels
        .filter(m => {
          const methods = m.supportedGenerationMethods || [];
          return methods.includes('generateContent') || methods.includes('streamGenerateContent');
        })
        .map(m => ({
          name: m.name,
          cleanName: this._cleanModelName(m.name),
          displayName: m.displayName || m.name,
          description: m.description || '',
          supportedGenerationMethods: m.supportedGenerationMethods || [],
          inputTokenLimit: m.inputTokenLimit || 0,
          outputTokenLimit: m.outputTokenLimit || 0,
          supportsStreaming: (m.supportedGenerationMethods || []).includes('generateContent')
        }));

      this.discoveredModels = validModels;
      this.modelsLastDiscoveredAt = now;
      this.lastConnectionError = null;
      return validModels;
    } catch (err) {
      this.lastConnectionError = `Discovery network failure: ${err.message}`;
      return [];
    }
  }

  /**
   * Intelligently resolves the active model:
   * 1. Checks if preferred model is present, non-retired, and supports generateContent.
   * 2. If not, selects the best compatible non-retired model from the discovered models list.
   * 3. Falls back safely through priority candidates.
   */
  async getResolvedModel(forceRefresh = false) {
    const models = await this.discoverModels(forceRefresh);
    const available = models.filter(m => !this.retiredModels.has(m.cleanName) && !this.retiredModels.has(m.name));
    const cleanPreferred = this._cleanModelName(this.preferredModel);

    // If preferred model is not retired and available, use it
    if (!this.retiredModels.has(cleanPreferred) && available.length > 0) {
      const preferredMatch = available.find(m => m.cleanName === cleanPreferred || m.name === this._normalizeModelName(this.preferredModel));
      if (preferredMatch) {
        this.lastResolvedModel = preferredMatch.cleanName;
        return preferredMatch.name;
      }
    }

    // Priority candidate models for free-tier eligible generation
    const priorityOrder = [
      'gemini-3.8-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-2.5-flash',
      'gemini-1.5-flash-8b',
      'gemini-2.0-flash-exp',
      'gemini-1.5-pro'
    ];

    if (available.length > 0) {
      for (const candidate of priorityOrder) {
        if (this.retiredModels.has(candidate)) continue;
        const found = available.find(m => m.cleanName === candidate);
        if (found) {
          this.lastResolvedModel = found.cleanName;
          return found.name;
        }
      }

      // Pick the first available non-retired model
      const firstSupported = available[0];
      if (firstSupported) {
        this.lastResolvedModel = firstSupported.cleanName;
        return firstSupported.name;
      }
    }

    // Fallback safely across candidate list if discovery returned empty
    for (const fb of priorityOrder) {
      if (!this.retiredModels.has(fb)) {
        this.lastResolvedModel = fb;
        return `models/${fb}`;
      }
    }

    return this._normalizeModelName(this.preferredModel);
  }

  /**
   * Helper to make API requests with automatic 404 recovery and intelligent model retirement
   */
  async _callApi(payload, timeoutMs = 15000) {
    if (!this.isConfigured()) {
      throw new Error('GEMINI_API_KEY is not configured on the server. Please add GEMINI_API_KEY to your server .env file.');
    }

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      const resolvedModelName = await this.getResolvedModel();
      const url = `${this.endpoint}/${resolvedModelName}:generateContent?key=${this.apiKey}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const status = response.status;
          const msg = errorData.error?.message || response.statusText;

          // Self-heal retired model (404)
          if (status === 404) {
            console.warn(`[GeminiProvider] Model ${resolvedModelName} unavailable: ${msg}. Retiring and selecting fallback...`);
            this.retiredModels.add(this._cleanModelName(resolvedModelName));
            this.retiredModels.add(this._normalizeModelName(resolvedModelName));

            // Extract Google's suggested replacement model if provided (e.g. "use models/gemini-3.8-flash")
            const suggestedMatch = msg.match(/use\s+(?:models\/)?([a-zA-Z0-9.\-_]+)/i);
            if (suggestedMatch && suggestedMatch[1]) {
              const suggestedModel = this._cleanModelName(suggestedMatch[1]);
              console.log(`[GeminiProvider] Google suggested model: ${suggestedModel}. Switching immediately...`);
              this.preferredModel = suggestedModel;
              this.lastResolvedModel = suggestedModel;
            }

            if (attempts < maxAttempts) {
              await this.discoverModels(true);
              continue; // Retry with the next model
            }
          }

          this.lastConnectionError = `Gemini API Error (${status}): ${msg}`;

          if (status === 429) {
            throw new Error('Gemini API Rate Limit / Quota Exceeded (Free Tier). Please wait 30 seconds before retrying.');
          } else if (status === 400) {
            throw new Error(`Gemini API Invalid Request: ${msg}`);
          } else if (status === 403 || status === 401) {
            throw new Error('Gemini API Authentication Failed: Invalid API Key or API not enabled in Google Cloud Console.');
          } else if (status === 404) {
            throw new Error(`Gemini API Model Unavailable (404): ${msg}.`);
          } else {
            throw new Error(`Gemini API Error (${status}): ${msg}`);
          }
        }

        const result = await response.json();
        this.lastSuccessfulRequestAt = new Date().toISOString();
        this.lastConnectionError = null;
        return result;
      } catch (err) {
        clearTimeout(timeout);
        if (attempts >= maxAttempts || err.name === 'AbortError') {
          throw err;
        }
      }
    }
  }

  /**
   * Generates a conversational response with personality mode & live context
   */
  async generateResponse(messages, options = {}) {
    const mode = options.mode || 'normal';
    const context = options.context || {};
    const preferences = options.preferences || {};
    const systemPrompt = options.systemPrompt || buildCompanionSystemPrompt(mode, context, preferences);

    const contents = (messages || []).map(m => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const payload = {
      contents,
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      generationConfig: {
        temperature: options.temperature ?? 0.6,
        maxOutputTokens: options.maxTokens ?? 2048,
      }
    };

    const res = await this._callApi(payload);
    const candidate = res.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text || 'No response generated.';
    
    return {
      text,
      model: this.lastResolvedModel,
      provider: 'gemini',
      mode,
      usage: res.usageMetadata || null
    };
  }

  /**
   * Real-time Server-Sent Events (SSE) Streaming Response
   * Calls onChunk(chunkText) as tokens stream in from Google Generative Language API
   */
  async generateStreamResponse(messages, options = {}, onChunk = () => {}) {
    if (!this.isConfigured()) {
      throw new Error('GEMINI_API_KEY is not configured on the server.');
    }

    const mode = options.mode || 'normal';
    const context = options.context || {};
    const preferences = options.preferences || {};
    const systemPrompt = options.systemPrompt || buildCompanionSystemPrompt(mode, context, preferences);

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      const resolvedModelName = await this.getResolvedModel();
      const url = `${this.endpoint}/${resolvedModelName}:streamGenerateContent?key=${this.apiKey}&alt=sse`;

      const contents = (messages || []).map(m => ({
        role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const payload = {
        contents,
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        generationConfig: {
          temperature: options.temperature ?? 0.6,
          maxOutputTokens: options.maxTokens ?? 2048,
        }
      };

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const msg = errorData.error?.message || response.statusText;
          
          if (response.status === 404) {
            console.warn(`[GeminiProvider Stream] Model ${resolvedModelName} returned 404: ${msg}. Retiring...`);
            this.retiredModels.add(this._cleanModelName(resolvedModelName));
            this.retiredModels.add(this._normalizeModelName(resolvedModelName));

            const suggestedMatch = msg.match(/use\s+(?:models\/)?([a-zA-Z0-9.\-_]+)/i);
            if (suggestedMatch && suggestedMatch[1]) {
              const suggestedModel = this._cleanModelName(suggestedMatch[1]);
              this.preferredModel = suggestedModel;
              this.lastResolvedModel = suggestedModel;
            }

            if (attempts < maxAttempts) {
              await this.discoverModels(true);
              continue;
            }
          }
          throw new Error(`Gemini Stream Error (${response.status}): ${msg}`);
        }

        return await this._processStreamReader(response, onChunk);
      } catch (err) {
        if (attempts >= maxAttempts) throw err;
      }
    }
  }

  /**
   * Helper to parse SSE data chunks from Gemini stream
   */
  async _processStreamReader(response, onChunk) {
    let accumulatedText = '';
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const jsonStr = trimmed.slice(6).trim();
          if (!jsonStr || jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const candidate = parsed.candidates?.[0];
            const partText = candidate?.content?.parts?.[0]?.text;
            if (partText) {
              accumulatedText += partText;
              onChunk(partText);
            }
          } catch {
            // Ignore incomplete chunks in flight
          }
        }
      }
    }

    this.lastSuccessfulRequestAt = new Date().toISOString();
    return {
      text: accumulatedText,
      model: this.lastResolvedModel,
      provider: 'gemini'
    };
  }

  /**
   * Generates a structured JSON response
   */
  async generateStructuredResponse(prompt, schema = null, options = {}) {
    const systemPrompt = (options.systemPrompt || '') + 
      '\nYou must respond ONLY with valid, parseable JSON conforming to the requested schema. Do not include markdown code block syntax (like ```json). Return raw JSON only.';

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      generationConfig: {
        temperature: options.temperature ?? 0.2,
        maxOutputTokens: options.maxTokens ?? 2048,
        responseMimeType: 'application/json'
      }
    };

    const res = await this._callApi(payload);
    const candidate = res.candidates?.[0];
    const rawText = candidate?.content?.parts?.[0]?.text || '{}';
    
    try {
      const parsed = JSON.parse(rawText.trim());
      return parsed;
    } catch {
      const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    }
  }

  /**
   * Live Connection Diagnostic Test
   */
  async testConnection() {
    if (!this.isConfigured()) {
      return {
        success: false,
        connected: false,
        error: 'GEMINI_API_KEY is not configured in server .env file.',
        availableModels: [],
        activeModel: null
      };
    }

    const startTime = Date.now();
    try {
      const models = await this.discoverModels(true);
      const activeModel = await this.getResolvedModel();

      const pingPayload = {
        contents: [{ role: 'user', parts: [{ text: 'Respond with the single word: OK' }] }],
        generationConfig: { maxOutputTokens: 5, temperature: 0.1 }
      };

      const res = await this._callApi(pingPayload, 8000);
      const latencyMs = Date.now() - startTime;
      const responseText = res.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

      this.lastSuccessfulRequestAt = new Date().toISOString();
      this.lastConnectionError = null;

      return {
        success: true,
        connected: true,
        activeModel: this.lastResolvedModel,
        discoveredCount: models.length,
        availableModels: models,
        latencyMs,
        sampleResponse: responseText,
        lastSuccess: this.lastSuccessfulRequestAt
      };
    } catch (err) {
      this.lastConnectionError = err.message;
      return {
        success: false,
        connected: false,
        error: err.message,
        activeModel: this.lastResolvedModel,
        availableModels: this.discoveredModels,
        lastError: this.lastConnectionError
      };
    }
  }

  /**
   * Specialized Productivity Analysis
   */
  async analyzeProductivity(data) {
    const prompt = `Analyze this user productivity data from TaskBar OS:
${JSON.stringify(data, null, 2)}

Provide a structured productivity evaluation with:
- "grade": "A+" | "A" | "B" | "C" | "Needs Improvement"
- "score": number 0-100
- "summary": 2-3 sentence overview of their task throughput and focus
- "strengths": Array of 2-3 specific positive observations
- "growthAreas": Array of 1-2 constructive focal points
- "recommendations": Array of 2-3 concrete tactical next steps`;

    return await this.generateStructuredResponse(prompt, null, {
      systemPrompt: 'You are an elite productivity analyst. Evaluate with fairness, rigor, and actionable clarity.'
    });
  }

  /**
   * Specialized Habit Analysis
   */
  async analyzeHabits(data) {
    const prompt = `Analyze these user habit records from TaskBar OS:
${JSON.stringify(data, null, 2)}

Provide structured habit analysis with:
- "consistencyScore": number 0-100
- "activeStreaksCount": number
- "longestActiveStreak": number
- "summary": 2 sentence review of consistency
- "topPerformingHabits": Array of habit title strings with high consistency
- "atRiskHabits": Array of habit title strings that have been missed recently
- "coachingTip": 1 actionable sentence on habit stacking or friction reduction`;

    return await this.generateStructuredResponse(prompt, null, {
      systemPrompt: 'You are a behavioral psychology habit coach. Focus on micro-consistency and streak momentum.'
    });
  }

  /**
   * Specialized Workout Analysis
   */
  async analyzeWorkouts(data) {
    const prompt = `Analyze these gym workout logs from TaskBar OS:
${JSON.stringify(data, null, 2)}

Provide structured workout evaluation with:
- "weeklyVolumeKg": total kg volume lifted
- "completedSessions": count of finished workouts
- "summary": 2 sentence assessment of progressive overload and consistency
- "strongestLift": string describing the exercise with highest load or volume
- "recoveryAdvice": 1-2 sentences on sleep and muscle recovery`;

    return await this.generateStructuredResponse(prompt, null, {
      systemPrompt: 'You are an evidence-based strength coach. Note: Do not provide medical advice.'
    });
  }

  /**
   * Specialized Nutrition Analysis
   */
  async analyzeNutrition(data) {
    const prompt = `Analyze these daily nutrition logs from TaskBar OS:
${JSON.stringify(data, null, 2)}

Provide structured nutrition summary with:
- "avgDailyCalories": number
- "avgDailyProteinGrams": number
- "summary": 2 sentence evaluation of macro balance
- "status": "On Track" | "Under Caloric Target" | "Over Caloric Target"
- "dietaryAdvice": 1-2 sentences on balanced micronutrient and hydration intake`;

    return await this.generateStructuredResponse(prompt, null, {
      systemPrompt: 'You are a nutrition scientist. Educational guidelines only, never prescribe extreme restriction.'
    });
  }

  /**
   * Generates Comprehensive Weekly Intelligence Report
   */
  async generateWeeklyReport(data) {
    const prompt = `Synthesize an end-of-week intelligence dossier based on:
${JSON.stringify(data, null, 2)}

Return JSON with:
- "weekLabel": string (e.g. "Week 45 - Nov 2026")
- "overallScore": number 0-100
- "headline": striking 1-sentence executive summary
- "keyAccomplishments": Array of 3-4 notable completed items
- "productivityMetrics": { "tasksCompleted": number, "focusMinutes": number, "habitsLogged": number, "workoutsCompleted": number }
- "strategicRecommendations": Array of 3 tactical priorities for next week`;

    return await this.generateStructuredResponse(prompt, null, {
      systemPrompt: 'You are an executive performance director compiling an end-of-week retrospective.'
    });
  }

  /**
   * Proactive Suggestions Engine
   */
  async generateSuggestions(data) {
    const prompt = `Based on current TaskBar OS activity:
${JSON.stringify(data, null, 2)}

Generate 3-5 personalized, actionable suggestions.
Return JSON with an array of objects:
[
  {
    "id": "sug_1",
    "type": "focus" | "task" | "habit" | "wellness" | "planning",
    "title": "Short title",
    "description": "Concrete 1-2 sentence recommendation grounded in their data",
    "impact": "High" | "Medium" | "Low",
    "actionLabel": "Action button text",
    "actionType": "create_task" | "start_focus" | "log_habit" | "review_plan"
  }
]`;

    return await this.generateStructuredResponse(prompt, null, {
      systemPrompt: 'Provide high-impact, non-intrusive tactical suggestions.'
    });
  }
}
