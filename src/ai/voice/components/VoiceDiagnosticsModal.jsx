import React, { useState, useEffect } from 'react';
import { 
  Activity, Shield, CheckCircle2, AlertTriangle, RefreshCw, X, Cpu, HardDrive, Mic, Volume2
} from 'lucide-react';

export default function VoiceDiagnosticsModal({ voiceManager, onClose }) {
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
    lastLatencyMs = 0,
    selectedLanguage,
    settings,
    isSpeaking,
    isListening,
    kokoroReady,
    moonshineReady
  } = snapshot;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 99999, padding: 16
    }}>
      <div className="card" style={{ maxWidth: 580, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 16 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Activity size={20} color="var(--accent-primary)" />
            <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
              JARVIS Voice Diagnostics Centre
            </h2>
          </div>
          {onClose && (
            <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
              <X size={16} />
            </button>
          )}
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 16px' }}>
          Real-time hardware acceleration, latency telemetry & audio model diagnostics.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          {/* STT Telemetry */}
          <div style={{ padding: 14, background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Mic size={15} color="#3b82f6" />
              <strong style={{ fontSize: 12, color: 'var(--text-primary)' }}>Speech Recognition</strong>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Engine:</span>
                <strong style={{ color: '#3b82f6' }}>Moonshine WASM</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                <span style={{ color: moonshineReady ? '#10b981' : '#f59e0b' }}>
                  {moonshineReady ? 'Model Ready' : 'Loading/Deferred'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Language:</span>
                <span>{selectedLanguage}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Inference Latency:</span>
                <span>{lastLatencyMs} ms</span>
              </div>
            </div>
          </div>

          {/* TTS Telemetry */}
          <div style={{ padding: 14, background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Volume2 size={15} color="#10b981" />
              <strong style={{ fontSize: 12, color: 'var(--text-primary)' }}>Speech Synthesis</strong>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Engine:</span>
                <strong style={{ color: '#10b981' }}>Kokoro TTS</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Active Voice:</span>
                <span>{settings?.voiceId || 'bm_george'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Acceleration:</span>
                <span style={{ textTransform: 'uppercase' }}>WebGPU / WASM</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Playback Status:</span>
                <span style={{ color: isSpeaking ? '#10b981' : 'var(--text-muted)' }}>
                  {isSpeaking ? 'Active (Playing)' : 'Idle'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* State Machine Status */}
        <div style={{ padding: 14, background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-subtle)', marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
            State Machine & VAD Activity
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
            <span>Current Voice State:</span>
            <code style={{ fontSize: 11, color: 'var(--accent-primary)', background: 'var(--bg-card)', padding: '2px 8px', borderRadius: 4, fontWeight: 800 }}>
              {state}
            </code>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, marginTop: 4 }}>
            <span>Audio RMS Energy Level:</span>
            <span>{Math.round(audioLevel * 100)}%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, marginTop: 4 }}>
            <span>Interaction Mode:</span>
            <strong>{mode}</strong>
          </div>
        </div>

        {/* Transcript Inspection */}
        <div style={{ padding: 14, background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
            Last Transcript & Contextual Resolution
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Raw Recognizer Text:</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'var(--bg-card)', padding: '6px 10px', borderRadius: 6, marginBottom: 6 }}>
            {rawTranscript || 'None'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Contextually Corrected:</div>
          <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 700, background: 'var(--bg-card)', padding: '6px 10px', borderRadius: 6 }}>
            {correctedTranscript || rawTranscript || 'None'}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ fontWeight: 700 }}>
            Dismiss Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
}
