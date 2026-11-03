import React from 'react';
import { Sparkles, Shield, Cpu, Wifi, WifiOff } from 'lucide-react';

export default function AIStatus({ status }) {
  if (!status) return null;

  const isGemini = status.activeProvider === 'gemini';
  const isCloud = status.isCloudConfigured;
  const modelName = isGemini ? status.providers?.gemini?.model : 'Local Analytics Engine';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 16px',
      background: 'rgba(255, 255, 255, 0.02)',
      borderRadius: 'var(--radius-md, 12px)',
      border: '1px solid var(--border-subtle)',
      fontSize: 12,
      flexWrap: 'wrap',
      gap: 10
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: isCloud ? 'var(--color-success, #10b981)' : '#f59e0b',
          boxShadow: isCloud ? '0 0 10px rgba(16, 185, 129, 0.5)' : 'none'
        }} />
        <div>
          <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
            {isCloud ? 'Google Gemini Free Tier' : 'Local Deterministic Engine'}
          </span>
          <span style={{ color: 'var(--text-muted)', marginLeft: 6, fontSize: 11 }}>
            ({modelName})
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: 6,
          background: isCloud ? 'rgba(99, 102, 241, 0.12)' : 'rgba(245, 158, 11, 0.12)',
          color: isCloud ? 'var(--accent-primary)' : '#f59e0b',
          letterSpacing: 0.5
        }}>
          {isCloud ? 'FREE TIER (15 RPM CAP)' : 'OFFLINE MODE'}
        </span>
      </div>
    </div>
  );
}

