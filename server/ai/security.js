/**
 * Security, Rate-Limiting and Sanitization Middleware for TaskBar OS AI
 */

const requestWindowMap = new Map(); // IP -> Array of timestamps
let dailyRequestsCount = 0;
let lastDayReset = new Date().toDateString();

const MAX_RPM = parseInt(process.env.AI_RATE_LIMIT_RPM || '15', 10);
const MAX_RPD = parseInt(process.env.AI_DAILY_LIMIT || '1500', 10);
const MAX_PAYLOAD_BYTES = parseInt(process.env.AI_MAX_PAYLOAD_BYTES || String(128 * 1024), 10); // 128 KB limit default

export function checkRateLimit(clientId = 'global') {
  const now = Date.now();
  const todayStr = new Date().toDateString();

  // Reset daily counter at midnight
  if (todayStr !== lastDayReset) {
    dailyRequestsCount = 0;
    lastDayReset = todayStr;
  }

  // Check Daily Ceiling
  if (dailyRequestsCount >= MAX_RPD) {
    return {
      allowed: false,
      reason: `Daily free quota limit reached (${MAX_RPD} requests/day). Resets at midnight.`
    };
  }

  // Check Per-Minute Sliding Window
  let timestamps = requestWindowMap.get(clientId) || [];
  timestamps = timestamps.filter(t => now - t < 60000); // 1 minute window

  if (timestamps.length >= MAX_RPM) {
    const oldest = timestamps[0];
    const retryAfterSec = Math.max(1, Math.ceil((60000 - (now - oldest)) / 1000));
    return {
      allowed: false,
      reason: `Rate limit reached (${MAX_RPM} req/min). Please wait ${retryAfterSec}s before retrying.`,
      retryAfter: retryAfterSec
    };
  }

  timestamps.push(now);
  requestWindowMap.set(clientId, timestamps);
  dailyRequestsCount++;

  return {
    allowed: true,
    currentRpm: timestamps.length,
    remainingRpm: MAX_RPM - timestamps.length,
    dailyRequestsUsed: dailyRequestsCount
  };
}

export function validatePayloadSize(bodyString, maxBytes = MAX_PAYLOAD_BYTES) {
  if (!bodyString) return true;
  const byteLength = Buffer.byteLength(bodyString, 'utf8');
  if (byteLength > maxBytes) {
    throw new Error(`Payload exceeds maximum allowed size (${(byteLength / 1024).toFixed(1)} KB > ${(maxBytes / 1024).toFixed(0)} KB limit).`);
  }
  return true;
}

/**
 * Sanitizes input text to remove sensitive secrets or tokens
 */
export function sanitizeInput(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/[a-zA-Z0-9_\-]{24,}/g, (match) => {
      // Mask apparent API keys or JWT tokens
      if (match.startsWith('AIza') || match.startsWith('sk-') || match.length > 40) {
        return '[REDACTED_CREDENTIAL]';
      }
      return match;
    })
    .replace(/password\s*[:=]\s*\S+/gi, 'password:[REDACTED]');
}

export function getRateLimitStats() {
  return {
    dailyRequestsCount,
    dailyLimit: MAX_RPD,
    rpmLimit: MAX_RPM
  };
}

