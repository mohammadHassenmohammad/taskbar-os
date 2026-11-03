import { getProvider, getProviderStatus, testGeminiConnection } from './providerRegistry.js';
import { LocalDeterministicProvider } from './providers/localProvider.js';
import { checkRateLimit, validatePayloadSize, sanitizeInput, getRateLimitStats } from './security.js';

/**
 * Core Request Dispatcher for TaskBar OS AI Server
 * Handles standard Node http request/response and Vite Connect middleware
 * Features automatic resilient fallback to local deterministic analytics if cloud API is unavailable.
 */
export async function handleAIRequest(req, res, urlPath, body = {}) {
  // Common CORS and Base Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // 1. GET /api/ai/status
  if (req.method === 'GET' && urlPath.endsWith('/status')) {
    res.setHeader('Content-Type', 'application/json');
    const status = getProviderStatus();
    const limits = getRateLimitStats();
    res.statusCode = 200;
    res.end(JSON.stringify({ ...status, limits }));
    return;
  }

  // 2. GET /api/ai/diagnostics or POST /api/ai/test-connection
  if (urlPath.endsWith('/diagnostics') || urlPath.endsWith('/test-connection')) {
    res.setHeader('Content-Type', 'application/json');
    try {
      const diag = await testGeminiConnection();
      res.statusCode = 200;
      res.end(JSON.stringify(diag));
    } catch (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ success: false, connected: false, error: err.message }));
    }
    return;
  }

  // Enforce POST for intelligence endpoints
  if (req.method !== 'POST') {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method Not Allowed. Use POST.' }));
    return;
  }

  // 3. Rate-Limit Check
  const clientId = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'client';
  const rateLimit = checkRateLimit(clientId);
  if (!rateLimit.allowed) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 429;
    res.end(JSON.stringify({
      error: rateLimit.reason,
      retryAfter: rateLimit.retryAfter,
      rateLimited: true
    }));
    return;
  }

  // 4. Resolve Active Provider
  const requestedProvider = body.provider || null;
  const provider = getProvider(requestedProvider);
  const localFallback = new LocalDeterministicProvider();

  try {
    // A. Real-time Streaming Chat Endpoint (Server-Sent Events)
    if (urlPath.endsWith('/chat/stream')) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });

      const messages = (body.messages || []).map(m => ({
        role: m.role,
        content: sanitizeInput(m.content)
      }));
      const mode = body.mode || 'normal';
      const context = body.context || {};
      const preferences = body.preferences || {};

      try {
        await provider.generateStreamResponse(
          messages,
          { mode, context, preferences },
          (chunk) => {
            res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
          }
        );
        res.write('data: [DONE]\n\n');
        res.end();
      } catch (streamErr) {
        console.warn(`[AI Handler] Stream failed on ${provider.name}. Streaming fallback via LocalDeterministicProvider...`, streamErr.message);
        try {
          await localFallback.generateStreamResponse(
            messages,
            { mode, context, preferences },
            (chunk) => {
              res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
            }
          );
          res.write('data: [DONE]\n\n');
          res.end();
        } catch (fbErr) {
          res.write(`data: ${JSON.stringify({ error: fbErr.message })}\n\n`);
          res.end();
        }
      }
      return;
    }

    // Set JSON header for remaining endpoints
    res.setHeader('Content-Type', 'application/json');

    // B. Standard Conversational Chat Endpoint
    if (urlPath.endsWith('/chat')) {
      const messages = (body.messages || []).map(m => ({
        role: m.role,
        content: sanitizeInput(m.content)
      }));
      const mode = body.mode || 'normal';
      const context = body.context || {};
      const preferences = body.preferences || {};

      try {
        const result = await provider.generateResponse(messages, { mode, context, preferences });
        res.statusCode = 200;
        res.end(JSON.stringify(result));
      } catch (err) {
        console.warn(`[AI Handler] Chat failed on ${provider.name}. Falling back to LocalDeterministicProvider:`, err.message);
        const fbResult = await localFallback.generateResponse(messages, { mode, context, preferences });
        res.statusCode = 200;
        res.end(JSON.stringify({ ...fbResult, fallbackNotice: err.message }));
      }
      return;
    }

    // C. Modular Analysis Endpoint
    if (urlPath.endsWith('/analyze')) {
      const type = body.type || 'productivity';
      const data = body.data || {};
      let analysisResult = null;
      let usedProvider = provider.name;

      try {
        switch (type) {
          case 'productivity':
            analysisResult = await provider.analyzeProductivity(data);
            break;
          case 'habits':
            analysisResult = await provider.analyzeHabits(data);
            break;
          case 'workouts':
            analysisResult = await provider.analyzeWorkouts(data);
            break;
          case 'nutrition':
            analysisResult = await provider.analyzeNutrition(data);
            break;
          default:
            analysisResult = await provider.analyzeProductivity(data);
        }
      } catch (err) {
        console.warn(`[AI Handler] Analysis (${type}) failed on ${provider.name}. Falling back to LocalDeterministicProvider:`, err.message);
        usedProvider = 'local_deterministic';
        switch (type) {
          case 'productivity':
            analysisResult = await localFallback.analyzeProductivity(data);
            break;
          case 'habits':
            analysisResult = await localFallback.analyzeHabits(data);
            break;
          case 'workouts':
            analysisResult = await localFallback.analyzeWorkouts(data);
            break;
          case 'nutrition':
            analysisResult = await localFallback.analyzeNutrition(data);
            break;
          default:
            analysisResult = await localFallback.analyzeProductivity(data);
        }
      }

      res.statusCode = 200;
      res.end(JSON.stringify({
        type,
        analysis: analysisResult,
        provider: usedProvider,
        timestamp: new Date().toISOString()
      }));
      return;
    }

    // D. Daily Planning Endpoint
    if (urlPath.endsWith('/plan')) {
      const context = body.context || {};
      const prompt = `You are the TaskBar OS Daily Planning Architect.
Review this user's current tasks, routines, habits, and fitness schedule for today:
${JSON.stringify(context, null, 2)}

Synthesize a realistic, balanced, high-impact Daily Plan.
Return JSON with:
- "date": string today
- "dailyTheme": short motivational focus theme (e.g. "Deep Focus & Aerobic Cadence")
- "recommendedOrder": Array of task objects with "taskId", "title", "recommendedTime", "priority", "reason"
- "focusBlocks": Array of recommended focus intervals (e.g. [{ time: "09:30 AM", duration: 25, label: "Deep Coding Session" }])
- "recoveryBreaks": Array of recommended pause checkpoints (e.g. [{ time: "11:00 AM", duration: 10, activity: "Hydration & Stretch" }])
- "workloadAssessment": "Light" | "Optimal" | "Heavy" | "Overloaded"
- "plannerAdvice": 2-3 sentences of tactical coaching`;

      let planResult;
      let usedProvider = provider.name;

      try {
        planResult = await provider.generateStructuredResponse(prompt, null, {
          systemPrompt: 'Generate a realistic daily schedule that avoids burnout and respects human energy constraints.'
        });
      } catch (err) {
        console.warn(`[AI Handler] Daily plan failed on ${provider.name}. Falling back to LocalDeterministicProvider:`, err.message);
        usedProvider = 'local_deterministic';
        planResult = {
          date: new Date().toISOString().split('T')[0],
          dailyTheme: 'Tactical Focus & Steady Momentum',
          recommendedOrder: (context.todayTasks || []).map((t, idx) => ({
            taskId: t.id || `task_${idx}`,
            title: t.title,
            recommendedTime: idx === 0 ? '09:00 AM' : idx === 1 ? '11:00 AM' : '02:00 PM',
            priority: t.priority || 'Medium',
            reason: 'High strategic impact sequence'
          })),
          focusBlocks: [{ time: '10:00 AM', duration: 25, label: 'Deep Work Block' }],
          recoveryBreaks: [{ time: '11:30 AM', duration: 10, activity: 'Hydration & Mobility' }],
          workloadAssessment: 'Optimal',
          plannerAdvice: 'Focus on completing your top priority task before noon.'
        };
      }

      res.statusCode = 200;
      res.end(JSON.stringify({
        plan: planResult,
        provider: usedProvider,
        timestamp: new Date().toISOString()
      }));
      return;
    }

    // E. Weekly / Monthly Report Endpoint
    if (urlPath.endsWith('/report')) {
      const reportData = body.data || {};
      let report;
      let usedProvider = provider.name;

      try {
        report = await provider.generateWeeklyReport(reportData);
      } catch (err) {
        console.warn(`[AI Handler] Weekly report failed on ${provider.name}. Falling back to LocalDeterministicProvider:`, err.message);
        usedProvider = 'local_deterministic';
        report = await localFallback.generateWeeklyReport(reportData);
      }

      res.statusCode = 200;
      res.end(JSON.stringify({
        report,
        provider: usedProvider,
        timestamp: new Date().toISOString()
      }));
      return;
    }

    // F. Suggestions Endpoint
    if (urlPath.endsWith('/suggestions')) {
      const data = body.data || {};
      let suggestions;
      let usedProvider = provider.name;

      try {
        suggestions = await provider.generateSuggestions(data);
      } catch (err) {
        console.warn(`[AI Handler] Suggestions failed on ${provider.name}. Falling back to LocalDeterministicProvider:`, err.message);
        usedProvider = 'local_deterministic';
        suggestions = await localFallback.generateSuggestions(data);
      }

      res.statusCode = 200;
      res.end(JSON.stringify({
        suggestions,
        provider: usedProvider
      }));
      return;
    }

    // Unknown AI route
    res.statusCode = 404;
    res.end(JSON.stringify({ error: `AI endpoint not found: ${urlPath}` }));
  } catch (err) {
    console.error(`AI Handler Error [${urlPath}]:`, err.message);
    res.statusCode = 500;
    res.end(JSON.stringify({
      error: err.message || 'AI request failed.',
      provider: provider.name
    }));
  }
}
