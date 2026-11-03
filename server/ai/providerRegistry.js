import { GeminiProvider } from './providers/geminiProvider.js';
import { OpenRouterProvider } from './providers/openRouterProvider.js';
import { LocalDeterministicProvider } from './providers/localProvider.js';

let cachedGemini = null;
let cachedOpenRouter = null;
let cachedLocal = null;

export function getGeminiProvider() {
  if (!cachedGemini) cachedGemini = new GeminiProvider();
  return cachedGemini;
}

export function getProvider(preferredProvider = null) {
  const providerName = preferredProvider || process.env.AI_PROVIDER || 'gemini';

  if (providerName === 'openrouter') {
    if (!cachedOpenRouter) cachedOpenRouter = new OpenRouterProvider();
    if (cachedOpenRouter.isConfigured()) return cachedOpenRouter;
  }

  // Default to Gemini
  const gemini = getGeminiProvider();
  if (gemini.isConfigured()) return gemini;

  // Fallback to local deterministic
  if (!cachedLocal) cachedLocal = new LocalDeterministicProvider();
  return cachedLocal;
}

export function getProviderStatus() {
  const gemini = getGeminiProvider();
  const openRouter = cachedOpenRouter || new OpenRouterProvider();
  const active = getProvider();

  return {
    activeProvider: active.name,
    isCloudConfigured: active.name !== 'local_deterministic',
    providers: {
      gemini: {
        name: 'Google Gemini',
        configured: gemini.isConfigured(),
        preferredModel: gemini.preferredModel,
        resolvedModel: gemini.lastResolvedModel,
        discoveredModelsCount: gemini.discoveredModels.length,
        discoveredModels: gemini.discoveredModels,
        lastSuccess: gemini.lastSuccessfulRequestAt,
        lastError: gemini.lastConnectionError,
        tier: 'Free Tier (15 RPM / 1,500 RPD)',
        eligibleFreeModels: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-flash', 'gemini-1.5-flash-8b']
      },
      openrouter: {
        name: 'OpenRouter (Optional)',
        configured: openRouter.isConfigured(),
        model: openRouter.model,
        tier: 'Configured Free Models'
      },
      local_deterministic: {
        name: 'Local Deterministic Analytics Engine',
        configured: true,
        model: 'local-math-engine',
        tier: '100% Free & Offline (Zero Network)'
      }
    }
  };
}

export async function testGeminiConnection() {
  const gemini = getGeminiProvider();
  return await gemini.testConnection();
}
