import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { motion } from 'framer-motion';
import { 
  Download, Upload, Shield, CheckCircle2, AlertTriangle, 
  Database, RefreshCw, FileText, Lock, HardDrive 
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function BackupRestore() {
  const { 
    exportAllData, importValidatedBackup, backupHistory = [], 
    tasks = [], projects = [], goals = [], habits = [], 
    workouts = [], secondBrain = [], user, isDataLoaded, syncLocked 
  } = useStore();

  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedPreview, setParsedPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result);
        if (!json || !json.data) {
          throw new Error('Invalid TaskBar OS backup archive structure');
        }
        setSelectedFile(file);
        setParsedPreview(json);
      } catch (err) {
        toast.error(`Invalid backup file: ${err.message}`);
        setSelectedFile(null);
        setParsedPreview(null);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = () => {
    if (!parsedPreview) return;
    if (confirm('Restoring this backup will update your local records and sync to cloud. Proceed?')) {
      setImporting(true);
      const res = importValidatedBackup(parsedPreview);
      setImporting(false);
      if (res.success) {
        setSelectedFile(null);
        setParsedPreview(null);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '0 4px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, boxShadow: '0 4px 16px rgba(14,165,233,0.3)'
          }}>
            📦
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
              Backup, Archive & Restore Centre
            </h1>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Complete offline data sovereignty, validated JSON import & cryptographic audit
            </div>
          </div>
        </div>

        <button 
          className="btn btn-primary"
          onClick={exportAllData}
          style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}
        >
          <Download size={16} />
          <span>Export System Backup</span>
        </button>
      </div>

      {/* Cloud & Local State Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
        <div className="card" style={{ padding: 18, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Database Storage</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', marginTop: 4 }}>
            {user?.isGuest ? 'Local-Only (Guest)' : (isDataLoaded && !syncLocked ? 'Cloud & Local Dual-Lock' : 'Local Indexed/Storage')}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            IndexedDB / LocalStorage v4
          </div>
        </div>

        <div className="card" style={{ padding: 18, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Live Record Count</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--accent-primary)', marginTop: 4 }}>
            {tasks.length + projects.length + goals.length + habits.length + workouts.length + secondBrain.length} Records
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            Tasks, Projects, Goals, Habits, Logs
          </div>
        </div>

        <div className="card" style={{ padding: 18, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Data Ownership</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#10b981', marginTop: 4 }}>
            100% Exportable
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            Zero vendor lock-in schema
          </div>
        </div>
      </div>

      {/* Main Dual Grid: Export & Import */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 16 }}>
        {/* Export Card */}
        <div className="card" style={{ padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Download size={20} color="var(--accent-primary)" />
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Full Data Archive Export
            </h3>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            Generates a sanitized JSON export encompassing all operational data: tasks, routines, habits, projects, goals, fitness workouts, nutrition logs, and second brain nodes.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 14, background: 'var(--bg-elevated)', borderRadius: 10, fontSize: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Missions & Tasks:</span>
              <strong>{tasks.length}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Projects & Goals:</span>
              <strong>{projects.length + goals.length}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Habits & Routines:</span>
              <strong>{habits.length}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Second Brain Nodes:</span>
              <strong>{secondBrain.length}</strong>
            </div>
          </div>

          <button 
            className="btn btn-primary"
            onClick={exportAllData}
            style={{ marginTop: 'auto', fontWeight: 700 }}
          >
            Download Complete JSON Backup
          </button>
        </div>

        {/* Restore Card */}
        <div className="card" style={{ padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Upload size={20} color="#10b981" />
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Validated Backup Restore
            </h3>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            Select an exported TaskBar OS JSON archive to validate schemas and restore your full personal environment.
          </p>

          <input
            type="file"
            accept=".json"
            onChange={handleFileChange}
            style={{ fontSize: 12, padding: '10px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px dashed var(--border-subtle)', cursor: 'pointer' }}
          />

          {parsedPreview && (
            <div style={{ padding: 14, background: 'var(--bg-elevated)', borderRadius: 10, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={14} /> Valid Archive Verified (v{parsedPreview.version || '2.0.0'})
              </div>
              <div style={{ color: 'var(--text-muted)' }}>
                Exported: {format(new Date(parsedPreview.exportedAt || Date.now()), 'PPP p')}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                <span style={{ padding: '2px 6px', background: 'var(--bg-card)', borderRadius: 4 }}>{parsedPreview.data.tasks?.length || 0} tasks</span>
                <span style={{ padding: '2px 6px', background: 'var(--bg-card)', borderRadius: 4 }}>{parsedPreview.data.projects?.length || 0} projects</span>
                <span style={{ padding: '2px 6px', background: 'var(--bg-card)', borderRadius: 4 }}>{parsedPreview.data.goals?.length || 0} goals</span>
              </div>
            </div>
          )}

          <button
            className="btn btn-secondary"
            onClick={handleExecuteRestore}
            disabled={!parsedPreview || importing}
            style={{ marginTop: 'auto', fontWeight: 700 }}
          >
            {importing ? 'Restoring State…' : 'Execute Validated Restore'}
          </button>
        </div>
      </div>

      {/* Backup Audit History */}
      {backupHistory.length > 0 && (
        <div className="card" style={{ padding: 20, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 14 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <HardDrive size={16} color="var(--accent-primary)" />
            <span>Cryptographic Backup & Restore Log</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {backupHistory.map(item => (
              <div
                key={item.id}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 8,
                  fontSize: 12
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                    padding: '2px 6px', borderRadius: 4,
                    background: item.type === 'export' ? 'rgba(14,165,233,0.15)' : 'rgba(16,185,129,0.15)',
                    color: item.type === 'export' ? '#0ea5e9' : '#10b981'
                  }}>
                    {item.type}
                  </span>
                  <span style={{ color: 'var(--text-primary)' }}>System Archive Snapshot</span>
                </div>

                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                  {format(new Date(item.timestamp), 'MMM d, h:mm a')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

