/**
 * TaskBar OS — JARVIS Unified Voice State Machine & Interaction Orchestrator
 *
 * Implements the 12 explicit voice states:
 * - IDLE
 * - REQUESTING_MICROPHONE_PERMISSION
 * - LOADING_MODEL
 * - READY
 * - LISTENING
 * - TRANSCRIBING
 * - PROCESSING
 * - USING_APPLICATION_TOOLS
 * - GENERATING_SPEECH
 * - SPEAKING
 * - INTERRUPTED
 * - ERROR
 *
 * Coordinates:
 * - AudioCaptureService (microphone, RMS level, VAD)
 * - MoonshineSTTProvider / WebSpeechSTTProvider (STT)
 * - ContextualSpeechCorrector (fuzzy matching against tasks/projects)
 * - JARVIS Intelligence Engine (Gemini / LocalDeterministic / Tools)
 * - KokoroTTSProvider (speech generation & barge-in)
 */

import { AudioCaptureService } from './audioCaptureService.js';
import { sttRegistry } from './stt/moonshineProvider.js';
import { ContextualSpeechCorrector } from './contextualCorrector.js';
import { kokoroTTS, KOKORO_VOICES } from './tts/kokoroProvider.js';
import { aiService } from '../services/aiService.js';
import { prepareFullContext } from '../services/aiContextService.js';

export const VOICE_STATES = {
  IDLE: 'IDLE',
  REQUESTING_MICROPHONE_PERMISSION: 'REQUESTING_MICROPHONE_PERMISSION',
  LOADING_MODEL: 'LOADING_MODEL',
  READY: 'READY',
  LISTENING: 'LISTENING',
  TRANSCRIBING: 'TRANSCRIBING',
  PROCESSING: 'PROCESSING',
  USING_APPLICATION_TOOLS: 'USING_APPLICATION_TOOLS',
  GENERATING_SPEECH: 'GENERATING_SPEECH',
  SPEAKING: 'SPEAKING',
  INTERRUPTED: 'INTERRUPTED',
  ERROR: 'ERROR'
};

export const INTERACTION_MODES = {
  PUSH_TO_TALK: 'PUSH_TO_TALK',
  HANDS_FREE: 'HANDS_FREE',
  TEXT_AND_VOICE: 'TEXT_AND_VOICE',
  VOICE_COMMAND: 'VOICE_COMMAND'
};

export class VoiceStateManager {
  constructor(storeGetter) {
    this.getStore = storeGetter;
    this.state = VOICE_STATES.IDLE;
    this.mode = INTERACTION_MODES.PUSH_TO_TALK;

    this.audioCapture = new AudioCaptureService();
    this.rawTranscript = '';
    this.correctedTranscript = '';
    this.audioLevel = 0;
    this.statusMessage = 'Voice System Idle';
    this.lastLatencyMs = 0;
    this.selectedLanguage = 'en';

    // Settings
    this.settings = {
      voiceId: 'bm_george',
      speed: 1.0,
      autoPlaySpeech: true,
      handsFreeSilenceTimeoutMs: 1600,
      vadThreshold: 0.015,
      speakShort: false
    };

    // Listeners for UI state reactivity
    this.subscribers = new Set();

    this.setupAudioListeners();
    this.setupTTSListeners();
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    callback(this.getSnapshot());
    return () => this.subscribers.delete(callback);
  }

  notify() {
    const snapshot = this.getSnapshot();
    this.subscribers.forEach(cb => cb(snapshot));
  }

  getSnapshot() {
    return {
      state: this.state,
      mode: this.mode,
      rawTranscript: this.rawTranscript,
      correctedTranscript: this.correctedTranscript,
      audioLevel: this.audioLevel,
      statusMessage: this.statusMessage,
      lastLatencyMs: this.lastLatencyMs,
      selectedLanguage: this.selectedLanguage,
      settings: { ...this.settings },
      isSpeaking: kokoroTTS.isPlaying,
      isListening: this.audioCapture.isCapturing,
      kokoroReady: kokoroTTS.ready,
      moonshineReady: sttRegistry.moonshine.ready,
      voices: KOKORO_VOICES
    };
  }

  setState(newState, statusMessage = '') {
    this.state = newState;
    if (statusMessage) this.statusMessage = statusMessage;
    this.notify();
  }

  setMode(mode) {
    this.mode = mode;
    this.notify();
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    if (newSettings.voiceId) kokoroTTS.selectedVoice = newSettings.voiceId;
    this.notify();
  }

  setupAudioListeners() {
    this.audioCapture.onAudioLevel = (level) => {
      this.audioLevel = level;
      this.notify();
    };

    this.audioCapture.onSpeechStart = () => {
      // Barge-in check: If JARVIS is currently speaking and user speaks, halt output immediately!
      if (this.state === VOICE_STATES.SPEAKING || kokoroTTS.isPlaying) {
        this.handleBargeIn();
      }
      this.setState(VOICE_STATES.LISTENING, 'Listening to user voice…');
    };

    this.audioCapture.onSpeechEnd = async (float32Buffer) => {
      await this.handleAudioInput(float32Buffer);
    };

    this.audioCapture.onError = (err) => {
      this.setState(VOICE_STATES.ERROR, err.message || 'Microphone error');
    };
  }

  setupTTSListeners() {
    kokoroTTS.onPlaybackStart = () => {
      this.setState(VOICE_STATES.SPEAKING, 'JARVIS speaking response…');
    };

    kokoroTTS.onPlaybackEnd = () => {
      if (this.mode === INTERACTION_MODES.HANDS_FREE) {
        this.setState(VOICE_STATES.LISTENING, 'Hands-Free mode: Ready for next inquiry…');
      } else {
        this.setState(VOICE_STATES.READY, 'Voice turn complete. Ready.');
      }
    };

    kokoroTTS.onPlaybackInterrupted = () => {
      this.setState(VOICE_STATES.INTERRUPTED, 'Spoken output interrupted by user.');
    };
  }

  /**
   * Barge-in interruption
   */
  handleBargeIn() {
    kokoroTTS.stop();
    this.setState(VOICE_STATES.INTERRUPTED, 'Interrupted. Listening to new command…');
  }

  /**
   * Initializes both Moonshine and Kokoro models progressively
   */
  async initializeModels(onProgress = null) {
    this.setState(VOICE_STATES.LOADING_MODEL, 'Loading voice models into local WASM / WebGPU…');

    // Init STT
    const stt = await sttRegistry.getActiveProvider(this.selectedLanguage);
    if (!stt.isReady()) {
      await stt.initialize((pct, msg) => {
        if (onProgress) onProgress(pct * 0.5, msg);
      });
    }

    // Init Kokoro TTS
    if (!kokoroTTS.ready) {
      await kokoroTTS.initialize((pct, msg) => {
        if (onProgress) onProgress(50 + pct * 0.5, msg);
      });
    }

    this.setState(VOICE_STATES.READY, 'JARVIS Advanced Voice Intelligence Ready');
  }

  /**
   * Push-to-Talk Toggle
   */
  async toggleListening() {
    if (this.audioCapture.isCapturing) {
      this.audioCapture.stop();
      this.setState(VOICE_STATES.IDLE, 'Microphone standby');
      return;
    }

    this.setState(VOICE_STATES.REQUESTING_MICROPHONE_PERMISSION, 'Requesting microphone authorization…');
    const perm = await AudioCaptureService.checkPermission();
    if (perm === 'denied') {
      this.setState(VOICE_STATES.ERROR, 'Microphone permission denied. Allow access in browser settings.');
      return;
    }

    this.rawTranscript = '';
    this.correctedTranscript = '';
    await this.audioCapture.start();
    this.setState(VOICE_STATES.LISTENING, 'Listening… speak naturally to JARVIS.');
  }

  /**
   * Hands-Free Mode Toggle
   */
  async toggleHandsFree() {
    if (this.mode === INTERACTION_MODES.HANDS_FREE) {
      this.mode = INTERACTION_MODES.PUSH_TO_TALK;
      this.audioCapture.stop();
      this.setState(VOICE_STATES.IDLE, 'Hands-Free deactivated');
    } else {
      this.mode = INTERACTION_MODES.HANDS_FREE;
      await this.toggleListening();
    }
    this.notify();
  }

  /**
   * Processes recorded audio buffer through STT, Contextual Correction, and JARVIS Engine
   */
  async handleAudioInput(float32Buffer) {
    this.setState(VOICE_STATES.TRANSCRIBING, 'Transcribing speech audio…');
    const startTime = performance.now();

    try {
      // 1. STT Inference
      const provider = await sttRegistry.getActiveProvider(this.selectedLanguage);
      const sttResult = await provider.transcribe(float32Buffer);

      this.rawTranscript = (sttResult.text || '').trim();
      this.lastLatencyMs = Math.round(performance.now() - startTime);

      if (!this.rawTranscript) {
        if (this.mode === INTERACTION_MODES.HANDS_FREE) {
          this.setState(VOICE_STATES.LISTENING, 'Hands-Free: Waiting for user speech…');
        } else {
          this.setState(VOICE_STATES.READY, 'No speech detected.');
        }
        return;
      }

      // 2. Direct voice shortcuts check: "stop", "pause", "speak slower", "repeat"
      const lowerRaw = this.rawTranscript.toLowerCase();
      if (lowerRaw === 'stop' || lowerRaw === 'stop talking' || lowerRaw === 'quiet' || lowerRaw === 'pause') {
        this.handleBargeIn();
        return;
      }

      // 3. Contextual Correction against active TaskBar OS entities
      const store = this.getStore ? this.getStore() : {};
      const correction = ContextualSpeechCorrector.correctTranscript(this.rawTranscript, store);
      this.correctedTranscript = correction.corrected;
      this.notify();

      // 4. Pass transcript into JARVIS Intelligence Engine
      this.setState(VOICE_STATES.PROCESSING, 'JARVIS reasoning over application state…');
      await this.executeJARVISPipeline(this.correctedTranscript || this.rawTranscript, store);

    } catch (err) {
      console.error('[VoiceStateManager] Audio handling failed:', err);
      this.setState(VOICE_STATES.ERROR, err.message || 'Voice processing error');
    }
  }

  /**
   * Submits recognized voice command to JARVIS AI & synthesizes natural spoken reply
   */
  async executeJARVISPipeline(userText, store) {
    try {
      const fullContext = prepareFullContext(store);

      // Check if user is issuing a tool action
      this.setState(VOICE_STATES.USING_APPLICATION_TOOLS, 'Consulting TaskBar OS modules…');

      // Dispatch to secure AI endpoint
      const response = await aiService.sendChatMessage(
        [{ role: 'user', content: userText }],
        fullContext,
        store.aiMode || 'normal',
        store.settings?.aiPreferences || {}
      );

      const assistantText = response.text || '';

      // 5. Speech Generation through Kokoro TTS
      if (this.settings.autoPlaySpeech && assistantText) {
        this.setState(VOICE_STATES.GENERATING_SPEECH, 'Generating natural spoken voice via Kokoro…');
        await kokoroTTS.speak(assistantText, {
          voice: this.settings.voiceId,
          speed: this.settings.speed
        });
      } else {
        this.setState(VOICE_STATES.READY, 'Response ready');
      }

    } catch (err) {
      this.setState(VOICE_STATES.ERROR, `AI response failed: ${err.message}`);
    }
  }

  /**
   * Stop all voice activity and clean up resources
   */
  stopAll() {
    this.audioCapture.stop();
    kokoroTTS.stop();
    this.setState(VOICE_STATES.IDLE, 'Voice subsystem halted');
  }
}
