/**
 * TaskBar OS — Moonshine STT & Multilingual Pluggable Speech Engine
 *
 * Implements:
 * - Official on-device @moonshine-ai/moonshine-wasm MicTranscriber with WebAssembly
 * - Streaming partial text updates (.onText) and completed lines (.onLine)
 * - Domain vocabulary keyterms injection (tasks, habits, projects, routines)
 * - Auto-muting during TTS to prevent audio loopback
 * - Model download progress tracking & latency metrics
 * - Pluggable fallback to Web Speech API STT for multilingual recognition (e.g. Hindi, Telugu, Spanish)
 */

export class BaseSTTProvider {
  constructor(name) {
    this.name = name;
    this.ready = false;
    this.loading = false;
    this.loadProgress = 0;
  }

  async initialize(onProgress) {
    throw new Error('initialize() must be implemented');
  }

  isReady() {
    return this.ready;
  }

  getSupportedLanguages() {
    return ['en'];
  }
}

/**
 * Official Moonshine WASM Speech Recognition Engine
 */
export class MoonshineSTTProvider extends BaseSTTProvider {
  constructor() {
    super('moonshine_wasm');
    this.micTranscriber = null;
    this.moonshineModule = null;
    this.lastPartialText = '';
    this.lastFinalLine = '';

    // Callbacks
    this.onPartialTranscript = null;
    this.onFinalTranscript = null;
    this.onError = null;
  }

  getSupportedLanguages() {
    return [
      { code: 'en', name: 'English (On-Device WASM)' }
    ];
  }

  async initialize(onProgress = null) {
    if (this.ready) return true;
    this.loading = true;
    this.loadProgress = 10;
    if (onProgress) onProgress(10, 'Initializing Moonshine WASM Runtime…');

    try {
      const moonshineWasm = await import('@moonshine-ai/moonshine-wasm').catch(() => null);

      if (!moonshineWasm || !moonshineWasm.MicTranscriber) {
        throw new Error('@moonshine-ai/moonshine-wasm MicTranscriber not available.');
      }

      this.moonshineModule = moonshineWasm;

      const mic = new moonshineWasm.MicTranscriber()
        .language('en')
        .onText((text) => {
          this.lastPartialText = text;
          if (this.onPartialTranscript) this.onPartialTranscript(text);
        })
        .onLine((line) => {
          const finalText = line?.text || '';
          this.lastFinalLine = finalText;
          if (this.onFinalTranscript) this.onFinalTranscript(finalText);
        })
        .onError((err) => {
          console.warn('[Moonshine] MicTranscriber error:', err);
          if (this.onError) this.onError(err);
        })
        .onProgress((fraction, file) => {
          const pct = Math.round(fraction * 100);
          this.loadProgress = pct;
          if (onProgress) onProgress(pct, `Downloading Moonshine model weights (${file || 'wasm'})…`);
        });

      await mic.load();

      this.micTranscriber = mic;
      this.ready = true;
      this.loading = false;
      this.loadProgress = 100;
      if (onProgress) onProgress(100, 'Moonshine Voice Ready (On-Device WASM)');
      return true;
    } catch (err) {
      console.warn('[MoonshineSTTProvider] On-device WASM init deferred/failed:', err.message);
      this.loading = false;
      this.ready = false;
      return false;
    }
  }

  /**
   * Biases Moonshine towards live application terms (tasks, habits, projects)
   */
  setDomainKeyterms(terms = []) {
    if (!this.micTranscriber || !terms || terms.length === 0) return;
    try {
      const cleanTerms = terms
        .map(t => String(t || '').trim())
        .filter(t => t.length > 2 && t.length < 40)
        .slice(0, 50);
      this.micTranscriber.setKeyterms(cleanTerms);
    } catch (err) {
      console.warn('[Moonshine] Failed to set keyterms:', err);
    }
  }

  /**
   * Start streaming microphone transcription
   */
  async start() {
    if (!this.ready || !this.micTranscriber) {
      await this.initialize();
    }
    this.lastPartialText = '';
    this.lastFinalLine = '';
    await this.micTranscriber.start();
  }

  /**
   * Stop capture and finalize
   */
  async stop() {
    if (this.micTranscriber && this.micTranscriber.isRunning) {
      await this.micTranscriber.stop();
    }
  }

  /**
   * Mute incoming mic audio during TTS speech to prevent feedback
   */
  mute(isMuted = true) {
    if (this.micTranscriber) {
      try { this.micTranscriber.mute(isMuted); } catch {}
    }
  }

  close() {
    if (this.micTranscriber) {
      try { this.micTranscriber.close(); } catch {}
      this.micTranscriber = null;
    }
    this.ready = false;
  }
}

/**
 * Web Speech API Fallback Provider (for Multilingual STT e.g. Hindi, Telugu, Spanish, French)
 */
export class WebSpeechSTTProvider extends BaseSTTProvider {
  constructor() {
    super('web_speech');
    this.recognition = null;
    this.currentLanguage = 'en-US';
    this.isListening = false;
    this.onPartialTranscript = null;
    this.onFinalTranscript = null;
    this.onError = null;
  }

  getSupportedLanguages() {
    return [
      { code: 'en-US', name: 'English (US)' },
      { code: 'hi-IN', name: 'Hindi (India) - Browser STT' },
      { code: 'te-IN', name: 'Telugu (India) - Browser STT' },
      { code: 'es-ES', name: 'Spanish' },
      { code: 'fr-FR', name: 'French' },
      { code: 'de-DE', name: 'German' },
      { code: 'ja-JP', name: 'Japanese' },
      { code: 'zh-CN', name: 'Mandarin' }
    ];
  }

  async initialize(onProgress = null) {
    const SpeechRecognition = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
    if (!SpeechRecognition) {
      this.ready = false;
      return false;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.currentLanguage;

      this.recognition.onresult = (event) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (interim && this.onPartialTranscript) {
          this.onPartialTranscript(interim);
        }
        if (final && this.onFinalTranscript) {
          this.onFinalTranscript(final);
        }
      };

      this.recognition.onerror = (err) => {
        if (err.error !== 'no-speech' && this.onError) {
          this.onError(err);
        }
      };

      this.ready = true;
      this.loadProgress = 100;
      if (onProgress) onProgress(100, 'Browser Multilingual Voice Engine Ready');
      return true;
    } catch {
      this.ready = false;
      return false;
    }
  }

  setLanguage(langCode) {
    this.currentLanguage = langCode;
    if (this.recognition) {
      this.recognition.lang = langCode;
    }
  }

  async start() {
    if (!this.recognition) await this.initialize();
    try {
      this.recognition.start();
      this.isListening = true;
    } catch {}
  }

  async stop() {
    try {
      this.recognition?.stop();
    } catch {}
    this.isListening = false;
  }

  mute() {}

  close() {
    this.stop();
  }
}

/**
 * Unified STT Registry and Auto-Selector
 */
export class STTRegistry {
  constructor() {
    this.moonshine = new MoonshineSTTProvider();
    this.webSpeech = new WebSpeechSTTProvider();
    this.preferredProvider = 'moonshine';
  }

  async getActiveProvider(language = 'en') {
    // If language is Hindi, Telugu, or non-English, route directly to browser engine
    if (language && !language.startsWith('en')) {
      await this.webSpeech.initialize();
      this.webSpeech.setLanguage(language);
      return this.webSpeech;
    }

    // Attempt Moonshine on-device WASM first
    if (this.preferredProvider === 'moonshine') {
      const ready = this.moonshine.isReady() || (await this.moonshine.initialize());
      if (ready) return this.moonshine;
    }

    // Fallback to browser speech API
    await this.webSpeech.initialize();
    return this.webSpeech;
  }
}

export const sttRegistry = new STTRegistry();
