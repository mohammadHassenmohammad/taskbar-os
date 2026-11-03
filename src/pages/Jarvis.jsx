import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Bot, Sparkles, CheckSquare, Dumbbell, Utensils, Timer, Droplets, Calendar, 
  FileText, Repeat, Mic, Radio, Settings, Activity, Volume2 
} from 'lucide-react';
import { useAI } from '../ai/hooks/useAI';
import AIChat from '../ai/components/AIChat';
import AIStatus from '../ai/components/AIStatus';
import JARVISVoiceOverlay from '../ai/voice/components/JARVISVoiceOverlay';
import VoiceSettingsPanel from '../ai/voice/components/VoiceSettingsPanel';
import VoiceDiagnosticsModal from '../ai/voice/components/VoiceDiagnosticsModal';
import { VoiceStateManager } from '../ai/voice/voiceStateManager';
import { useStore } from '../store/useStore';

export default function Jarvis() {
  const ai = useAI();
  const store = useStore();
  const [showVoiceOverlay, setShowVoiceOverlay] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [showVoiceDiagnostics, setShowVoiceDiagnostics] = useState(false);

  // Persistent voice manager bound to active store
  const voiceManager = useMemo(() => {
    return new VoiceStateManager(() => useStore.getState());
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%', minHeight: 'calc(100vh - 120px)' }}>
      {/* JARVIS Control Centre Header */}
      <motion.div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          padding: '12px 16px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg, 16px)',
          border: '1px solid var(--border-subtle)'
        }}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)',
            fontSize: 20
          }}>
            🤖
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>JARVIS Autonomous Control Centre</span>
              <span style={{
                fontSize: 10,
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: 4,
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--accent-primary)',
                letterSpacing: 0.5
              }}>
                CENTRAL ENGINE
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Direct natural-language command & control across Tasks, Habits, Gym, Diet & Focus
            </div>
          </div>
        </div>

        {/* Voice Controls & Live Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              setShowVoiceOverlay(true);
              voiceManager.toggleListening();
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800 }}
          >
            <Mic size={14} />
            <span>Voice Assistant</span>
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setShowVoiceOverlay(true);
              voiceManager.toggleHandsFree();
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
          >
            <Radio size={14} />
            <span>Hands-Free</span>
          </button>

          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={() => setShowVoiceSettings(true)}
            title="Voice & Kokoro Settings"
            style={{ color: 'var(--text-muted)' }}
          >
            <Settings size={15} />
          </button>

          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={() => setShowVoiceDiagnostics(true)}
            title="Voice Diagnostics Centre"
            style={{ color: 'var(--text-muted)' }}
          >
            <Activity size={15} />
          </button>

          <AIStatus status={ai.status} />
        </div>
      </motion.div>

      {/* Quick Natural Command Bar */}
      <motion.div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 4,
          scrollbarWidth: 'none'
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {[
          { label: 'Capture note for today', icon: FileText, prompt: 'Add note "Review quarterly roadmap"' },
          { label: 'Create new routine', icon: Repeat, prompt: 'Create routine "Morning Code Review"' },
          { label: 'Plan my whole day', icon: Calendar, prompt: 'Plan my entire day with focus blocks and workout' },
          { label: 'What should I work on?', icon: CheckSquare, prompt: 'What should I work on today based on my pending tasks?' },
          { label: 'Start 25m Focus', icon: Timer, prompt: 'Start a 25-minute focus session' },
          { label: 'Log 2 glasses of water', icon: Droplets, prompt: 'Log 2 glasses of water for today' },
          { label: 'Show workout schedule', icon: Dumbbell, prompt: 'Show my workout schedule and recent sessions' },
          { label: 'Review today\'s nutrition', icon: Utensils, prompt: 'Review my calories and protein intake for today' }
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={() => ai.sendMessage(item.prompt)}
              disabled={ai.loading || ai.isStreaming}
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '6px 10px',
                borderRadius: 8,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <Icon size={12} color="var(--accent-primary)" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </motion.div>

      {/* Main Full-Height Conversational Workspace */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <AIChat ai={ai} />
      </div>

      {/* Voice Assistant Overlay */}
      {showVoiceOverlay && (
        <JARVISVoiceOverlay
          voiceManager={voiceManager}
          onClose={() => setShowVoiceOverlay(false)}
          onOpenSettings={() => setShowVoiceSettings(true)}
          onOpenDiagnostics={() => setShowVoiceDiagnostics(true)}
        />
      )}

      {/* Voice Settings Modal */}
      {showVoiceSettings && (
        <VoiceSettingsPanel
          voiceManager={voiceManager}
          onClose={() => setShowVoiceSettings(false)}
        />
      )}

      {/* Voice Diagnostics Centre */}
      {showVoiceDiagnostics && (
        <VoiceDiagnosticsModal
          voiceManager={voiceManager}
          onClose={() => setShowVoiceDiagnostics(false)}
        />
      )}
    </div>
  );
}

