/**
 * TaskBar OS — Kokoro TTS & Streaming Spoken Audio Engine
 *
 * Implements:
 * - Official kokoro-js browser speech synthesis with WebGPU acceleration
 * - Dynamic WASM fallback for devices without WebGPU
 * - Available voice discovery & previewing (American & British voices)
 * - Sentence-aware streaming speech chunking
 * - Audio buffer queue manager with instant barge-in / pause / resume / stop
 * - Fallback to browser SpeechSynthesis for low-resource or unsupported environments
 * - Strict response sanitizer (strips code, action proposals, and markdown artifacts)
 */

export const KOKORO_VOICES = [
  { id: 'af_heart', name: 'Heart (Warm & Articulate)', gender: 'Female', accent: 'en-US', speed: 1.0 },
  { id: 'af_bella', name: 'Bella (Clear & Confident)', gender: 'Female', accent: 'en-US', speed: 1.0 },
  { id: 'af_nicole', name: 'Nicole (Professional)', gender: 'Female', accent: 'en-US', speed: 1.0 },
  { id: 'af_sky', name: 'Sky (Friendly & Vibrant)', gender: 'Female', accent: 'en-US', speed: 1.0 },
  { id: 'am_adam', name: 'Adam (Deep & Authoritative)', gender: 'Male', accent: 'en-US', speed: 1.0 },
  { id: 'am_michael', name: 'Michael (Casual & Balanced)', gender: 'Male', accent: 'en-US', speed: 1.0 },
  { id: 'bf_emma', name: 'Emma (British Sophisticated)', gender: 'Female', accent: 'en-GB', speed: 1.0 },
  { id: 'bf_isabella', name: 'Isabella (British Expressive)', gender: 'Female', accent: 'en-GB', speed: 1.0 },
  { id: 'bm_george', name: 'George (British Butler/JARVIS style)', gender: 'Male', accent: 'en-GB', speed: 1.0 },
  { id: 'bm_lewis', name: 'Lewis (British Crisp)', gender: 'Male', accent: 'en-GB', speed: 1.0 }
];

export class KokoroTTSProvider {
  constructor() {
    this.name = 'kokoro_tts';
    this.ttsInstance = null;
    this.ready = false;
    this.loading = false;
    this.loadProgress = 0;
    this.deviceBackend = 'wasm'; // 'webgpu' or 'wasm'
    this.selectedVoice = 'bm_george'; // Default to witty British JARVIS tone
    this.audioContext = null;
    this.currentSourceNode = null;
    this.isPlaying = false;
    this.audioQueue = [];
    this.isPaused = false;

    // Callbacks
    this.onPlaybackStart = null;
    this.onPlaybackEnd = null;
    this.onPlaybackInterrupted = null;
  }

  /**
   * Detects WebGPU availability in the client browser
   */
  static async checkWebGPUSupport() {
    if (typeof navigator === 'undefined' || !navigator.gpu) return false;
    try {
      const adapter = await navigator.gpu.requestAdapter();
      return !!adapter;
    } catch {
      return false;
    }
  }

  /**
   * Initializes the Kokoro TTS model (WebGPU if available, otherwise WASM)
   */
  async initialize(onProgress = null) {
    if (this.ready) return true;
    this.loading = true;
    this.loadProgress = 15;
    if (onProgress) onProgress(15, 'Evaluating audio synthesis hardware acceleration…');

    try {
      const hasWebGPU = await KokoroTTSProvider.checkWebGPUSupport();
      this.deviceBackend = hasWebGPU ? 'webgpu' : 'wasm';

      this.loadProgress = 35;
      if (onProgress) onProgress(35, `Loading Kokoro TTS (${this.deviceBackend.toUpperCase()} backend)…`);

      const kokoroPkg = await import('kokoro-js').catch(() => null);

      if (kokoroPkg && kokoroPkg.KokoroTTS) {
        this.ttsInstance = await kokoroPkg.KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-ONNX', {
          device: this.deviceBackend,
          dtype: 'q8', // 8-bit quantization for performance
          progress_callback: (p) => {
            if (p && p.status === 'progress') {
              const pct = Math.round(35 + (p.loaded / (p.total || 1)) * 50);
              this.loadProgress = pct;
              if (onProgress) onProgress(pct, `Downloading Kokoro weights (${p.file || ''})…`);
            }
          }
        });

        this.ready = true;
        this.loading = false;
        this.loadProgress = 100;
        if (onProgress) onProgress(100, `Kokoro TTS Ready (${this.deviceBackend.toUpperCase()})`);
        return true;
      } else {
        throw new Error('kokoro-js not loaded; using native speech synthesis fallback.');
      }
    } catch (err) {
      console.warn('[KokoroTTSProvider] Local ONNX Kokoro init deferred/failed:', err.message);
      this.ready = false;
      this.loading = false;
      return false;
    }
  }

  /**
   * Sanitizes text to remove tool calls, JSON, action blocks, and markdown symbols
   */
  sanitizeTextForSpeech(text) {
    if (!text || typeof text !== 'string') return '';

    return text
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '')
      // Remove inline code
      .replace(/`[^`]+`/g, '')
      // Remove Proposed Action / Consequential Action cards
      .replace(/(?:Proposed Action|Consequential Action Confirmation)[\s\S]*$/gi, '')
      // Remove action command directives e.g. Create task: "..."
      .replace(/(?:Create task|Complete task|Delete task|Add note|Delete note|Create routine|Create habit):[^\n]+/gi, '')
      // Remove markdown headings, bold, italic
      .replace(/^[#>-]+\s*/gm, '')
      .replace(/[*_~]/g, '')
      // Remove raw JSON objects or arrays
      .replace(/\{[\s\S]*?\}/g, '')
      // Clean duplicate whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Sentence-aware chunking for progressive low-latency generation
   */
  chunkText(text) {
    const clean = this.sanitizeTextForSpeech(text);
    if (!clean) return [];

    // Split on sentence boundaries: periods, exclamation marks, question marks, semicolons
    const sentences = clean.match(/[^.!?;\n]+[.!?;\n]+/g) || [clean];
    return sentences.map(s => s.trim()).filter(s => s.length > 0);
  }

  /**
   * Synthesizes and speaks a text response with instant playback and barge-in capability
   */
  async speak(text, options = {}) {
    this.stop(); // Stop any previous ongoing audio immediately

    const clean = this.sanitizeTextForSpeech(text);
    if (!clean) return;

    const voice = options.voice || this.selectedVoice;
    const speed = options.speed || 1.0;

    // 1. If Kokoro instance is ready, generate via ONNX WebGPU/WASM
    if (this.ready && this.ttsInstance) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!this.audioContext) this.audioContext = new AudioCtx();
        if (this.audioContext.state === 'suspended') await this.audioContext.resume();

        const chunks = this.chunkText(clean);
        this.isPlaying = true;
        if (this.onPlaybackStart) this.onPlaybackStart();

        for (const chunk of chunks) {
          if (!this.isPlaying) break; // Interrupted by user

          const audio = await this.ttsInstance.generate(chunk, {
            voice,
            speed
          });

          if (!this.isPlaying) break;

          // Play synthesized audio buffer
          await this.playAudioBuffer(audio.toBlob ? await audio.toBlob() : audio);
        }

        this.isPlaying = false;
        if (this.onPlaybackEnd) this.onPlaybackEnd();
        return;
      } catch (err) {
        console.warn('[KokoroTTSProvider] Kokoro synthesis error, falling back to WebSpeech:', err);
      }
    }

    // 2. High-reliability fallback using browser Web Speech API
    this.speakViaWebSpeech(clean, options);
  }

  /**
   * Fallback browser SpeechSynthesis implementation
   */
  speakViaWebSpeech(text, options = {}) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.speed || 1.0;
    utterance.pitch = options.pitch || 1.0;

    // Pick British or English voice if available to match JARVIS personality
    const voices = window.speechSynthesis.getVoices();
    const jarvisVoice = voices.find(v => v.lang.includes('en-GB') || v.name.includes('George') || v.name.includes('Daniel') || v.name.includes('Natural')) ||
                        voices.find(v => v.lang.startsWith('en'));
    if (jarvisVoice) utterance.voice = jarvisVoice;

    utterance.onstart = () => {
      this.isPlaying = true;
      if (this.onPlaybackStart) this.onPlaybackStart();
    };

    utterance.onend = () => {
      this.isPlaying = false;
      if (this.onPlaybackEnd) this.onPlaybackEnd();
    };

    utterance.onerror = (e) => {
      this.isPlaying = false;
      if (this.onPlaybackEnd) this.onPlaybackEnd();
    };

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Plays a decoded audio blob/buffer through the Web Audio graph
   */
  async playAudioBuffer(blobOrBuffer) {
    if (!this.isPlaying || !this.audioContext) return;

    try {
      let arrayBuffer;
      if (blobOrBuffer instanceof Blob) {
        arrayBuffer = await blobOrBuffer.arrayBuffer();
      } else if (blobOrBuffer instanceof ArrayBuffer) {
        arrayBuffer = blobOrBuffer;
      } else if (blobOrBuffer.buffer) {
        arrayBuffer = blobOrBuffer.buffer;
      }

      const decoded = await this.audioContext.decodeAudioData(arrayBuffer);
      return new Promise((resolve) => {
        if (!this.isPlaying) {
          resolve();
          return;
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = decoded;
        source.connect(this.audioContext.destination);
        this.currentSourceNode = source;

        source.onended = () => {
          this.currentSourceNode = null;
          resolve();
        };

        source.start(0);
      });
    } catch {
      // Decode/playback error handled gracefully
    }
  }

  /**
   * Barge-In / Instant Interruption: Stops speech playback immediately
   */
  stop() {
    this.isPlaying = false;
    this.isPaused = false;

    if (this.currentSourceNode) {
      try { this.currentSourceNode.stop(); } catch {}
      this.currentSourceNode = null;
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch {}
    }

    if (this.onPlaybackInterrupted) {
      this.onPlaybackInterrupted();
    }
  }

  pause() {
    if (this.audioContext && this.audioContext.state === 'running') {
      this.audioContext.suspend();
      this.isPaused = true;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.pause();
    }
  }

  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
      this.isPaused = false;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.resume();
    }
  }
}

export const kokoroTTS = new KokoroTTSProvider();
