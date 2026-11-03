/**
 * TaskBar OS — Web Audio Capture & Preprocessing Service
 *
 * Implements:
 * - High-fidelity microphone stream acquisition
 * - Echo cancellation, noise suppression & auto-gain
 * - Real-time RMS audio level monitoring for visualizers
 * - Voice Activity Detection (VAD) with configurable thresholds
 * - Resampling to 16,000 Hz Float32 PCM (required by Moonshine / STT engines)
 * - Microphone permission states & device switching
 * - Barge-in audio coordination
 */

export class AudioCaptureService {
  constructor(options = {}) {
    this.options = {
      sampleRate: 16000,
      silenceTimeoutMs: 1500,     // Time of silence before end of speech is triggered
      vadEnergyThreshold: 0.015,  // Threshold above background noise
      deviceId: null,
      ...options
    };

    this.audioContext = null;
    this.mediaStream = null;
    this.sourceNode = null;
    this.analyserNode = null;
    this.processorNode = null;

    this.isCapturing = false;
    this.isSpeaking = false;
    this.silenceTimer = null;
    this.audioChunks = [];

    // Callbacks
    this.onAudioLevel = null;        // (level: number 0-1) => void
    this.onSpeechStart = null;       // () => void
    this.onSpeechEnd = null;         // (audioBuffer: Float32Array) => void
    this.onInterruption = null;      // () => void
    this.onError = null;             // (err: Error) => void
  }

  /**
   * Enumerate available microphone input devices
   */
  static async listMicrophones() {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return [];
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter(d => d.kind === 'audioinput')
        .map(d => ({ id: d.deviceId, label: d.label || `Microphone ${d.deviceId.slice(0, 5)}` }));
    } catch {
      return [];
    }
  }

  /**
   * Request microphone permission explicitly
   */
  static async checkPermission() {
    try {
      if (!navigator.mediaDevices?.getUserMedia) return 'unsupported';
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      return 'granted';
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        return 'denied';
      }
      return 'prompt';
    }
  }

  /**
   * Start audio capture and VAD pipeline
   */
  async start() {
    if (this.isCapturing) return;

    try {
      const constraints = {
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          deviceId: this.options.deviceId ? { exact: this.options.deviceId } : undefined
        }
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioCtx({ sampleRate: 16000 });

      // In case browser creates context at native hardware rate (e.g. 48kHz or 44.1kHz),
      // we detect and downsample correctly.
      const nativeRate = this.audioContext.sampleRate;

      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 512;
      this.analyserNode.smoothingTimeConstant = 0.3;

      // ScriptProcessor / AudioWorklet fallback for audio chunks & VAD
      const bufferSize = 2048;
      this.processorNode = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

      this.sourceNode.connect(this.analyserNode);
      this.analyserNode.connect(this.processorNode);
      this.processorNode.connect(this.audioContext.destination);

      this.audioChunks = [];
      this.isCapturing = true;
      this.isSpeaking = false;

      this.processorNode.onaudioprocess = (e) => {
        if (!this.isCapturing) return;

        const inputData = e.inputBuffer.getChannelData(0);
        // Resample if nativeRate is not 16000
        const resampled = nativeRate === 16000 ? new Float32Array(inputData) : this.downsampleBuffer(inputData, nativeRate, 16000);

        // Compute RMS Level
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        const normalizedLevel = Math.min(1, rms * 8);

        if (this.onAudioLevel) {
          this.onAudioLevel(normalizedLevel);
        }

        // Voice Activity Detection
        if (rms > this.options.vadEnergyThreshold) {
          if (!this.isSpeaking) {
            this.isSpeaking = true;
            if (this.onSpeechStart) this.onSpeechStart();
          }

          // Reset silence timer
          if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
            this.silenceTimer = null;
          }

          this.audioChunks.push(resampled);
        } else if (this.isSpeaking) {
          this.audioChunks.push(resampled);

          if (!this.silenceTimer) {
            this.silenceTimer = setTimeout(() => {
              this.handleSpeechComplete();
            }, this.options.silenceTimeoutMs);
          }
        }
      };

    } catch (err) {
      this.stop();
      if (this.onError) this.onError(err);
      throw err;
    }
  }

  /**
   * Completes current speech turn and synthesizes final Float32 buffer
   */
  handleSpeechComplete() {
    if (!this.isSpeaking) return;
    this.isSpeaking = false;
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    if (this.audioChunks.length === 0) return;

    // Merge audio chunks into one contiguous Float32Array
    let totalLen = 0;
    for (const chunk of this.audioChunks) {
      totalLen += chunk.length;
    }
    const merged = new Float32Array(totalLen);
    let offset = 0;
    for (const chunk of this.audioChunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    this.audioChunks = [];

    if (this.onSpeechEnd) {
      this.onSpeechEnd(merged);
    }
  }

  /**
   * Resamples PCM Float32 buffer to target rate (16kHz)
   */
  downsampleBuffer(buffer, inputRate, outputRate) {
    if (outputRate === inputRate) return buffer;
    const sampleRateRatio = inputRate / outputRate;
    const newLength = Math.round(buffer.length / sampleRateRatio);
    const result = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;

    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
      let accum = 0;
      let count = 0;
      for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
        accum += buffer[i];
        count++;
      }
      result[offsetResult] = count > 0 ? accum / count : 0;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }
    return result;
  }

  /**
   * Stops microphone capture and cleans up all audio graph nodes
   */
  stop() {
    this.isCapturing = false;
    this.isSpeaking = false;
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    if (this.processorNode) {
      try { this.processorNode.disconnect(); } catch {}
      this.processorNode = null;
    }
    if (this.analyserNode) {
      try { this.analyserNode.disconnect(); } catch {}
      this.analyserNode = null;
    }
    if (this.sourceNode) {
      try { this.sourceNode.disconnect(); } catch {}
      this.sourceNode = null;
    }
    if (this.mediaStream) {
      try { this.mediaStream.getTracks().forEach(t => t.stop()); } catch {}
      this.mediaStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try { this.audioContext.close(); } catch {}
      this.audioContext = null;
    }

    this.audioChunks = [];
    if (this.onAudioLevel) this.onAudioLevel(0);
  }
}
