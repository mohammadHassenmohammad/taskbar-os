import { GeminiProvider } from './providers/geminiProvider.js';
import { OpenRouterProvider } from './providers/openRouterProvider.js';
import { LocalDeterministicProvider } from './providers/localProvider.js';

let cachedGemini = null;
let cachedOpenRouter = null;
let cachedLocal = null;

export function getProvider(preferredProvider = null) {
  const providerName = preferredProvider || process.env.AI_PROVIDER || 'gemini';

  if (providerName === 'openrouter') {
    if (!cachedOpenRouter) cachedOpenRouter = new OpenRouterProvider();
    if (cachedOpenRouter.isConfigured()) return cachedOpenRouter;
  }

  // Default to Gemini
  if (!cachedGemini) cachedGemini = new GeminiProvider();
  if (cachedGemini.isConfigured()) return cachedGemini;

  // Fallback to local deterministic
  if (!cachedLocal) cachedLocal = new LocalDeterministicProvider();
  return cachedLocal;
}

export function getProviderStatus() {
  const gemini = cachedGemini || new GeminiProvider();
  const openRouter = cachedOpenRouter || new OpenRouterProvider();
  const active = getProvider();

  return {
    activeProvider: active.name,
    isCloudConfigured: active.name !== 'local_deterministic',
    providers: {
      gemini: {
        name: 'Google Gemini',
        configured: gemini.isConfigured(),
        model: gemini.model,
        tier: 'Free Tier (15 RPM / 1,500 RPD)',
        eligibleFreeModels: ['gemini-1.5-flash', 'gemini-2.0-flash']
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

