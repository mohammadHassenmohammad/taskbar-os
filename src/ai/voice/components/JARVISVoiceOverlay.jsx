import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, MicOff, Square, Play, Pause, Volume2, VolumeX, 
  Settings, Activity, Sparkles, X, Shield, RefreshCw, Radio
} from 'lucide-react';
import { VOICE_STATES, INTERACTION_MODES } from '../voiceStateManager.js';

export default function JARVISVoiceOverlay({ voiceManager, onClose, onOpenSettings, onOpenDiagnostics }) {
  const [snapshot, setSnapshot] = useState(() => voiceManager?.getSnapshot() || {});

  useEffect(() => {
    if (!voiceManager) return;
    return voiceManager.subscribe(setSnapshot);
  }, [voiceManager]);

  const {
    state,
    mode,
    rawTranscript,
    correctedTranscript,
    audioLevel = 0,
    statusMessage,
    selectedLanguage,
    kokoroReady,
    moonshineReady,
    settings
  } = snapshot;

  const isHandsFree = mode === INTERACTION_MODES.HANDS_FREE;
  const isSpeaking = state === VOICE_STATES.SPEAKING;
  const isListening = state === VOICE_STATES.LISTENING;

  const getStateColor = () => {
    switch (state) {
      case VOICE_STATES.LISTENING: return '#ef4444';
      case VOICE_STATES.SPEAKING: return '#10b981';
      case VOICE_STATES.PROCESSING:
      case VOICE_STATES.TRANSCRIBING:
      case VOICE_STATES.USING_APPLICATION_TOOLS: return 'var(--accent-primary)';
      case VOICE_STATES.INTERRUPTED: return '#f59e0b';
      case VOICE_STATES.ERROR: return 'var(--color-danger)';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      style={{
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--border-subtle)',
        borderTop: `2px solid ${getStateColor()}`,
        borderRadius: '20px 20px 0 0',
        padding: '20px 24px',
        boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.6)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 99998,
        maxWidth: 760,
        margin: '0 auto'
      }}
    >
      {/* Top Header / Status Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: getStateColor(),
            boxShadow: `0 0 12px ${getStateColor()}`,
            animation: isListening || isSpeaking ? 'pulse 1.2s infinite' : 'none'
          }} />
          <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: 1 }}>
            JARVIS Voice Interface · {state}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Hands-Free Toggle */}
          <button
            className={`btn btn-xs ${isHandsFree ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => voiceManager.toggleHandsFree()}
            style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4 }}
            title={isHandsFree ? 'Disable Hands-Free Continuous Mode' : 'Enable Hands-Free Continuous Mode'}
          >
            <Radio size={12} />
            <span>Hands-Free {isHandsFree ? 'ON' : 'OFF'}</span>
          </button>

          {/* Diagnostics Button */}
          {onOpenDiagnostics && (
            <button
              className="btn btn-ghost btn-icon btn-sm"
              onClick={onOpenDiagnostics}
              title="Voice Engine Diagnostics"
              style={{ color: 'var(--text-muted)' }}
            >
              <Activity size={15} />
            </button>
          )}

          {/* Settings Button */}
          {onOpenSettings && (
            <button
              className="btn btn-ghost btn-icon btn-sm"
              onClick={onOpenSettings}
              title="Voice Settings"
              style={{ color: 'var(--text-muted)' }}
            >
              <Settings size={15} />
            </button>
          )}

          {/* Close Overlay */}
          {onClose && (
            <button
              className="btn btn-ghost btn-icon btn-sm"
              onClick={() => {
                voiceManager.stopAll();
                onClose();
              }}
              style={{ color: 'var(--text-muted)' }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Waveform Visualizer */}
      <div style={{
        height: 48,
        background: 'rgba(0, 0, 0, 0.4)',
        borderRadius: 12,
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        padding: '0 16px',
        overflow: 'hidden'
      }}>
        {Array.from({ length: 28 }).map((_, i) => {
          // Dynamic bar height based on real-time audioLevel
          const heightMultiplier = Math.sin((i / 28) * Math.PI) * (audioLevel * 100);
          const barHeight = Math.max(4, Math.min(40, heightMultiplier + (isSpeaking ? 16 + (i % 5) * 4 : 4)));
          return (
            <div
              key={i}
              style={{
                width: 4,
                height: `${barHeight}px`,
                borderRadius: 2,
                background: isListening 
                  ? 'linear-gradient(180deg, #ef4444, #f97316)' 
                  : isSpeaking 
                    ? 'linear-gradient(180deg, #10b981, #06b6d4)' 
                    : 'rgba(255, 255, 255, 0.1)',
                transition: 'height 0.08s ease'
              }}
            />
          );
        })}
      </div>

      {/* Live Transcript / Subtitle Box */}
      <div style={{
        padding: '12px 16px',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 12,
        border: '1px solid var(--border-subtle)',
        minHeight: 52,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>
          {correctedTranscript && correctedTranscript !== rawTranscript ? 'Contextually Corrected Speech' : 'Live Transcript'}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>
          {correctedTranscript || rawTranscript || (
            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontWeight: 500 }}>
              {statusMessage || 'Speak naturally to JARVIS…'}
            </span>
          )}
        </div>
      </div>

      {/* Control Buttons Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            STT: <strong style={{ color: moonshineReady ? '#10b981' : 'var(--text-secondary)' }}>Moonshine WASM</strong>
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>•</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            TTS: <strong style={{ color: kokoroReady ? '#10b981' : 'var(--text-secondary)' }}>Kokoro ({settings.voiceId})</strong>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Barge-In / Stop Button */}
          {isSpeaking && (
            <button
              className="btn btn-danger btn-sm"
              onClick={() => voiceManager.handleBargeIn()}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800 }}
            >
              <Square size={13} fill="currentColor" />
              <span>Stop Talking (Barge-In)</span>
            </button>
          )}

          {/* Push-To-Talk Mic Button */}
          <button
            className={`btn ${isListening ? 'btn-danger' : 'btn-primary'} btn-sm`}
            onClick={() => voiceManager.toggleListening()}
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800 }}
          >
            {isListening ? <MicOff size={15} /> : <Mic size={15} />}
            <span>{isListening ? 'End Turn' : 'Press to Speak'}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
