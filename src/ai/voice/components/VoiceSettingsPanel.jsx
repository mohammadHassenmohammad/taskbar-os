import React, { useState } from 'react';
import { 
  Volume2, Play, Check, Shield, Globe, Mic, Radio, Sliders, X 
} from 'lucide-react';
import { KOKORO_VOICES, kokoroTTS } from '../tts/kokoroProvider.js';

export default function VoiceSettingsPanel({ voiceManager, onClose }) {
  const [snapshot, setSnapshot] = useState(() => voiceManager?.getSnapshot() || {});
  const [previewingVoice, setPreviewingVoice] = useState(null);

  const settings = snapshot.settings || {};

  const handleUpdate = (updates) => {
    voiceManager?.updateSettings(updates);
    setSnapshot(voiceManager.getSnapshot());
  };

  const handlePreviewVoice = async (voiceId) => {
    setPreviewingVoice(voiceId);
    await kokoroTTS.speak("Hello operative. JARVIS speech synthesis initialized with Kokoro.", {
      voice: voiceId,
      speed: settings.speed || 1.0
    });
    setPreviewingVoice(null);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 99999, padding: 16
    }}>
      <div className="card" style={{ maxWidth: 540, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 16 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Volume2 size={20} color="var(--accent-primary)" />
            <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
              JARVIS Voice Settings
            </h2>
          </div>
          {onClose && (
            <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
              <X size={16} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* 1. Voice Picker */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, display: 'block' }}>
              Kokoro Spoken Voice Profile
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {KOKORO_VOICES.map(voice => (
                <div
                  key={voice.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: settings.voiceId === voice.id ? 'rgba(99,102,241,0.12)' : 'var(--bg-elevated)',
                    border: settings.voiceId === voice.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6
                  }}
                  onClick={() => handleUpdate({ voiceId: voice.id })}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>
                      {voice.name}
                    </span>
                    {settings.voiceId === voice.id && (
                      <Check size={14} color="var(--accent-primary)" />
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {voice.gender} · {voice.accent}
                    </span>
                    <button
                      className="btn btn-ghost btn-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewVoice(voice.id);
                      }}
                      style={{ fontSize: 10, padding: '2px 6px', color: 'var(--accent-primary)' }}
                    >
                      <Play size={10} style={{ marginRight: 2 }} />
                      {previewingVoice === voice.id ? 'Playing…' : 'Preview'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Speed Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
              <span style={{ color: 'var(--text-muted)' }}>Speaking Rate</span>
              <span style={{ color: 'var(--accent-primary)' }}>{settings.speed || 1.0}x</span>
            </div>
            <input
              type="range"
              min="0.75"
              max="1.5"
              step="0.05"
              value={settings.speed || 1.0}
              onChange={(e) => handleUpdate({ speed: parseFloat(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
            />
          </div>

          {/* 3. Auto-play Toggle */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 10
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Spoken Answers</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Automatically speak responses aloud with Kokoro TTS</div>
            </div>
            <input
              type="checkbox"
              checked={settings.autoPlaySpeech !== false}
              onChange={(e) => handleUpdate({ autoPlaySpeech: e.target.checked })}
              style={{ width: 18, height: 18, accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
            />
          </div>

          {/* 4. Language Selection */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
              Language & Multilingual STT Fallback
            </label>
            <select
              className="input input-sm"
              value={snapshot.selectedLanguage || 'en'}
              onChange={(e) => {
                if (voiceManager) voiceManager.selectedLanguage = e.target.value;
                setSnapshot(voiceManager.getSnapshot());
              }}
            >
              <option value="en">English (US/UK) - Moonshine On-Device WASM</option>
              <option value="hi-IN">Hindi (India) - Pluggable Browser Fallback</option>
              <option value="te-IN">Telugu (India) - Pluggable Browser Fallback</option>
              <option value="es-ES">Spanish - Multilingual Fallback</option>
              <option value="fr-FR">French - Multilingual Fallback</option>
              <option value="de-DE">German - Multilingual Fallback</option>
            </select>
          </div>

          {/* Close */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
            <button className="btn btn-primary btn-sm" onClick={onClose} style={{ fontWeight: 700 }}>
              Apply Voice Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
