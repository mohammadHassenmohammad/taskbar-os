import { getProvider, getProviderStatus, testGeminiConnection } from './providerRegistry.js';
import { checkRateLimit, validatePayloadSize, sanitizeInput, getRateLimitStats } from './security.js';

/**
 * Core Request Dispatcher for TaskBar OS AI Server
 * Handles standard Node http request/response and Vite Connect middleware
 * Supports Server-Sent Events (SSE) streaming, diagnostics, and structured analytical endpoints.
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
        res.write(`data: ${JSON.stringify({ error: streamErr.message })}\n\n`);
        res.end();
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
      const result = await provider.generateResponse(messages, { mode, context, preferences });
      res.statusCode = 200;
      res.end(JSON.stringify(result));
      return;
    }

    // C. Modular Analysis Endpoint
    if (urlPath.endsWith('/analyze')) {
      const type = body.type || 'productivity';
      const data = body.data || {};
      let analysisResult = null;

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

      res.statusCode = 200;
      res.end(JSON.stringify({
        type,
        analysis: analysisResult,
        provider: provider.name,
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

      const planResult = await provider.generateStructuredResponse(prompt, null, {
        systemPrompt: 'Generate a realistic daily schedule that avoids burnout and respects human energy constraints.'
      });

      res.statusCode = 200;
      res.end(JSON.stringify({
        plan: planResult,
        provider: provider.name,
        timestamp: new Date().toISOString()
      }));
      return;
    }

    // E. Weekly / Monthly Report Endpoint
    if (urlPath.endsWith('/report')) {
      const reportData = body.data || {};
      const report = await provider.generateWeeklyReport(reportData);
      res.statusCode = 200;
      res.end(JSON.stringify({
        report,
        provider: provider.name,
        timestamp: new Date().toISOString()
      }));
      return;
    }

    // F. Suggestions Endpoint
    if (urlPath.endsWith('/suggestions')) {
      const data = body.data || {};
      const suggestions = await provider.generateSuggestions(data);
      res.statusCode = 200;
      res.end(JSON.stringify({
        suggestions,
        provider: provider.name
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
