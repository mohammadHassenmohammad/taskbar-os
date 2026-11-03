import React from 'react';

export default function AIStatus({ status }) {
  if (!status) return null;

  const isGemini = status.activeProvider === 'gemini';
  const isCloud = status.isCloudConfigured;
  const rawModel = isGemini 
    ? (status.providers?.gemini?.resolvedModel || status.providers?.gemini?.preferredModel || 'gemini-3.5-flash')
    : 'Local Analytics Engine';

  const cleanModel = (rawModel || 'gemini-3.5-flash').replace('models/', '');

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 14px',
      background: 'rgba(255, 255, 255, 0.02)',
      borderRadius: 'var(--radius-md, 12px)',
      border: '1px solid var(--border-subtle)',
      fontSize: 12,
      flexWrap: 'wrap',
      gap: 10
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: isCloud ? 'var(--color-success, #10b981)' : '#f59e0b',
          boxShadow: isCloud ? '0 0 8px rgba(16, 185, 129, 0.5)' : 'none'
        }} />
        <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
          {isCloud ? 'JARVIS Online' : 'JARVIS Local Mode'}
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
          • {cleanModel}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: 6,
          background: isCloud ? 'rgba(99, 102, 241, 0.12)' : 'rgba(245, 158, 11, 0.12)',
          color: isCloud ? 'var(--accent-primary)' : '#f59e0b'
        }}>
          {isCloud ? 'Free Cloud Tier' : 'Offline'}
        </span>
      </div>
    </div>
  );
}
