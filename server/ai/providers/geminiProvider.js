import { BaseAIProvider } from './baseProvider.js';

/**
 * Google Gemini API Provider (Free Tier Eligible)
 * Supports models: gemini-1.5-flash, gemini-2.0-flash
 */
export class GeminiProvider extends BaseAIProvider {
  constructor(config = {}) {
    super('gemini');
    this.apiKey = config.apiKey || process.env.GEMINI_API_KEY || '';
    this.model = config.model || process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    this.endpoint = 'https://generativelanguage.googleapis.com/v1beta/models';
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  /**
   * Helper to make API requests with timeout and error handling
   */
  async _callApi(payload, timeoutMs = 15000) {
    if (!this.isConfigured()) {
      throw new Error('GEMINI_API_KEY is not configured on the server. Please add GEMINI_API_KEY to your server .env file.');
    }

    const url = `${this.endpoint}/${this.model}:generateContent?key=${this.apiKey}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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
          throw new Error('Gemini API Rate Limit / Quota Exceeded (Free Tier). Please wait 30 seconds before retrying.');
        } else if (status === 400) {
          throw new Error(`Gemini API Invalid Request: ${msg}`);
        } else if (status === 403) {
          throw new Error('Gemini API Authentication Failed: Invalid API Key or API not enabled.');
        } else {
          throw new Error(`Gemini API Error (${status}): ${msg}`);
        }
      }

      const result = await response.json();
      return result;
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error('Gemini API Request Timed Out (15s limit reached).');
      }
      throw err;
    }
  }

  /**
   * Generates a conversational response
   */
  async generateResponse(messages, options = {}) {
    const systemPrompt = options.systemPrompt || 
      'You are TaskBar OS AI, an intelligent, concise, evidence-based productivity architect. Analyze actual user data accurately. Never invent false statistics or complete tasks on your own. Format output in clean GitHub-style markdown.';

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
        temperature: options.temperature ?? 0.4,
        maxOutputTokens: options.maxTokens ?? 2048,
      }
    };

    const res = await this._callApi(payload);
    const candidate = res.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text || 'No response generated.';
    
    return {
      text,
      model: this.model,
      provider: 'gemini',
      usage: res.usageMetadata || null
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
    } catch (parseErr) {
      // Clean possible wrapping backticks
      const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    }
  }

  /**
   * Specialized Productivity Analysis
   */
  async analyzeProductivity(data) {
    const prompt = `Analyze this user productivity data from TaskBar OS:
${JSON.stringify(data, null, 2)}

Provide a structured productivity evaluation with:
- "summary": A concise overview (2-3 sentences) of current performance
- "bestPerformingDays": Array of top day names or dates with reason
- "incompleteTaskPatterns": Observed trends in overdue or neglected tasks
- "focusPatterns": Evaluation of recorded focus sessions
- "routineConsistency": Consistency of regular routines
- "areasNeedingAttention": Array of 1-3 bottlenecks
- "suggestions": Array of 2-4 actionable, concrete recommendations
- "productivityScore": Calculated or estimated score (0-100)`;

    return this.generateStructuredResponse(prompt, null, {
      systemPrompt: 'You are an objective productivity analyst. Ground all observations in the measured data.'
    });
  }

  /**
   * Specialized Habit Analysis
   */
  async analyzeHabits(data) {
    const prompt = `Analyze this user habit tracking data from TaskBar OS:
${JSON.stringify(data, null, 2)}

Provide a structured habit evaluation with:
- "summary": Encouraging, objective overview of habit streaks
- "strongestHabits": Habits with highest consistency
- "vulnerableHabits": Habits frequently missed or needing support
- "missedDayPatterns": Observed patterns in missed days (e.g. weekends vs weekdays)
- "recommendations": Array of practical adjustments without shame or judgment`;

    return this.generateStructuredResponse(prompt, null, {
      systemPrompt: 'You are a supportive behavioural coach. Never shame users for missed habits. Focus on realistic progress.'
    });
  }

  /**
   * Specialized Workout Analysis
   */
  async analyzeWorkouts(data) {
    const prompt = `Analyze this workout intelligence from TaskBar OS Gym:
${JSON.stringify(data, null, 2)}

Provide a structured workout evaluation with:
- "summary": Summary of training volume and frequency
- "consistency": Evaluation of workout cadence
- "volumeTrend": Overview of total weight lifted / sets completed
- "restObservations": Rest day observations
- "recommendations": Safe training recommendations
- "disclaimer": Always remind the user that AI suggestions are educational and not medical advice`;

    return this.generateStructuredResponse(prompt, null, {
      systemPrompt: 'You are a certified fitness consultant. NEVER diagnose injuries, recommend training through pain, or prescribe extreme volume.'
    });
  }

  /**
   * Specialized Nutrition Analysis
   */
  async analyzeNutrition(data) {
    const prompt = `Analyze this nutrition data from TaskBar OS Diet module:
${JSON.stringify(data, null, 2)}

Provide a structured nutrition evaluation with:
- "summary": Overview of calorie balance and macronutrient distribution
- "proteinAssessment": Comparison of actual vs targeted protein
- "energyBalance": Overview of deficit or surplus based on measured BMR and activity
- "hydration": Water intake assessment
- "recommendations": 2-3 balanced, healthy eating habits
- "disclaimer": Explicit note that nutrition estimates are educational and not a medical diet prescription`;

    return this.generateStructuredResponse(prompt, null, {
      systemPrompt: 'You are a nutrition educator. NEVER recommend restrictive diets, skipping meals, or extreme deficits.'
    });
  }

  /**
   * Specialized Weekly / Monthly Report
   */
  async generateWeeklyReport(data) {
    const prompt = `Generate a comprehensive Weekly Operational Report for TaskBar OS:
Period: ${data.periodStart || 'Last 7 Days'} to ${data.periodEnd || 'Today'}
Data:
${JSON.stringify(data, null, 2)}

Format with:
- "title": Report title
- "period": Date range string
- "overallGrade": Performance grade (S, A, B, C, D)
- "productivityScore": 0-100 score
- "highlights": Key accomplishments
- "lowlights": Missed targets
- "metrics": Object containing tasksCompleted, totalFocusMinutes, habitsAdherencePct, workoutsCompleted
- "markdownBody": A beautiful, structured markdown report with bullet points and bold highlights
- "nextWeekPriorities": Array of top 3 strategic priorities for next week`;

    return this.generateStructuredResponse(prompt, null, {
      systemPrompt: 'You are a high-level executive operations chief delivering a formal performance debrief.'
    });
  }

  /**
   * Specialized Suggestion Generator
   */
  async generateSuggestions(data) {
    const prompt = `Based on current user status in TaskBar OS:
${JSON.stringify(data, null, 2)}

Suggest 3 to 5 immediate, actionable proposals the user can choose to accept.
Each suggestion MUST be an object with:
- "id": string unique identifier
- "type": "create_task" | "start_focus" | "schedule_rest" | "log_water" | "adjust_priority"
- "title": Clear action title
- "description": Why this action makes sense based on data
- "payload": Specific parameters (e.g. { taskTitle: "Review weekly sprint", priority: "High" })
- "impact": "High" | "Medium" | "Low"`;

    const res = await this.generateStructuredResponse(prompt, null, {
      systemPrompt: 'Generate high-impact, realistic next actions that respect user energy limits.'
    });
    return Array.isArray(res) ? res : (res.suggestions || []);
  }
}
