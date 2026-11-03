import { useState } from 'react';
import { useStore, NOTIFICATION_SOUNDS } from '../store/useStore'; // Sync Heartbeat: 1778478600
import { playNotificationSound } from '../lib/audio';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, Download, Upload, Moon, Sun, Bell, Timer, 
  Volume2, Zap, Shield, User, Globe, Coffee, Monitor, 
  Cloud, RefreshCw, Mail, Lock, Target, Key, Play, Database, Plus, Minus,
  FileText, AlertTriangle, X, Check, Brain, Cpu, ShieldCheck
} from 'lucide-react';
import { aiService } from '../ai/services/aiService';
import { aiMemoryService } from '../ai/services/aiMemoryService';
import toast from 'react-hot-toast';

function SettingRow({ label, sub, icon: Icon, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        {Icon && <div style={{ marginTop: 2, color: 'var(--text-muted)' }}><Icon size={18} /></div>}
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{label}</div>
          {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, maxWidth: 300, lineHeight: 1.5 }}>{sub}</div>}
        </div>
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function Switch({ checked, onChange }) {
  return (
    <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 24,
        background: checked ? 'var(--accent-primary)' : 'var(--bg-elevated)',
        border: `1.5px solid ${checked ? 'var(--accent-primary)' : 'var(--border-default)'}`,
        transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }} />
      <motion.div
        animate={{ x: checked ? 22 : 4 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{
          position: 'absolute', height: 16, width: 16, left: 0, bottom: 4, borderRadius: '50%',
          background: checked ? 'white' : 'var(--text-muted)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      />
    </label>
  );
}

export default function Settings() {
  const { 
    theme, toggleTheme, settings, updateSettings, resetAccount, 
    user, updateUserPassword, exportData, importData 
  } = useStore();
  const [activeTab, setActiveTab] = useState('general');
  const [localSettings, setLocalSettings] = useState(() => ({
    ...settings,
    aiEnabled: settings.aiEnabled ?? true,
    aiPrivacy: settings.aiPrivacy || {
      includeTasks: true,
      includeHabits: true,
      includeWorkouts: true,
      includeNutrition: true
    }
  }));
  const [aiStatus, setAiStatus] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPreview, setImportPreview] = useState(null);
  const [createPreBackup, setCreatePreBackup] = useState(true);

  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [memoryEnabled, setMemoryEnabled] = useState(() => aiMemoryService.isMemoryEnabled());
  const [memoryPrefs, setMemoryPrefs] = useState(() => aiMemoryService.getPreferences());
  const [newPrefKey, setNewPrefKey] = useState('');
  const [newPrefVal, setNewPrefVal] = useState('');

  // Load AI Server Status
  useState(() => {
    aiService.getStatus().then(setAiStatus).catch(() => {});
  });

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setDiagnosticResult(null);
    try {
      const res = await aiService.testConnection();
      setDiagnosticResult(res);
      if (res.connected) {
        toast.success(`Connected to Gemini (${res.activeModel}) in ${res.latencyMs || 0}ms! 🚀`);
      } else {
        toast.error(res.error || 'Connection failed', { icon: '⚠️' });
      }
    } catch (err) {
      setDiagnosticResult({ success: false, connected: false, error: err.message });
      toast.error(err.message, { icon: '⚠️' });
    } finally {
      setTestingConnection(false);
      aiService.getStatus().then(setAiStatus).catch(() => {});
    }
  };

  const handleToggleMemory = (enabled) => {
    setMemoryEnabled(enabled);
    aiMemoryService.setMemoryEnabled(enabled);
    toast.success(enabled ? 'AI memory enabled' : 'AI memory disabled');
  };

  const handleAddPreference = (e) => {
    e?.preventDefault();
    if (!newPrefKey.trim() || !newPrefVal.trim()) return;
    aiMemoryService.setPreference(newPrefKey.trim(), newPrefVal.trim());
    setMemoryPrefs(aiMemoryService.getPreferences());
    setNewPrefKey('');
    setNewPrefVal('');
    toast.success('Preference stored in AI memory');
  };

  const handleDeletePreference = (key) => {
    aiMemoryService.deletePreference(key);
    setMemoryPrefs(aiMemoryService.getPreferences());
    toast.success(`Preference "${key}" removed`);
  };

  const handleSave = () => {
    updateSettings(localSettings);
    toast.success('System protocols updated! ⚡');
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) return toast.error('Minimum 6 characters required.');
    setIsChangingPass(true);
    try {
      await updateUserPassword(newPassword);
      toast.success('Security credentials updated! 🔒');
      setNewPassword('');
    } catch (err) {
      toast.error(err.message || 'Failed to update password.');
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = event.target.result;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') {
          toast.error('Invalid backup file format');
          return;
        }
        let tasksCount = 0;
        if (parsed.tasks && typeof parsed.tasks === 'object') {
          Object.values(parsed.tasks).forEach(list => {
            if (Array.isArray(list)) tasksCount += list.length;
          });
        }
        const habitsCount = Array.isArray(parsed.habits) ? parsed.habits.length : 0;
        const workoutsCount = parsed.workouts && typeof parsed.workouts === 'object' ? Object.keys(parsed.workouts).length : 0;
        let dietCount = 0;
        if (parsed.dietEntries && typeof parsed.dietEntries === 'object') {
          Object.values(parsed.dietEntries).forEach(list => {
            if (Array.isArray(list)) dietCount += list.length;
          });
        }
        const xpTotal = parsed.gamification?.totalXp || 0;

        setImportPreview({
          fileName: file.name,
          rawText: raw,
          tasksCount,
          habitsCount,
          workoutsCount,
          dietCount,
          xpTotal,
          exportDate: parsed.exportDate || 'Unknown'
        });
        setShowImportModal(true);
      } catch (err) {
        toast.error('Failed to parse backup JSON: ' + err.message);
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (window.confirm('⚠️ WARNING: This will permanently purge all mission intelligence and reset your profile. This action cannot be undone. Proceed?')) {
      resetAccount();
      toast.success('System purge complete. OS recalibrated. 🛡️');
    }
  };

  const testSound = () => {
    playNotificationSound(localSettings.notificationSound);
    toast.success(`Playing: ${localSettings.notificationSound}`);
  };

  const tabs = [
    { id: 'profile', label: 'Operative Profile', icon: User },
    { id: 'general', label: 'General Protocols', icon: Globe },
    { id: 'ai', label: 'AI & Intelligence', icon: Brain },
    { id: 'focus', label: 'Focus Matrix', icon: Timer },
    { id: 'notifications', label: 'Neural Alerts', icon: Bell },
    { id: 'account', label: 'Security & Data', icon: Shield },
  ];

  const [profileForm, setProfileForm] = useState(() => ({
    username: user?.username || '',
    fullName: user?.fullName || user?.name || '',
    age: user?.age || '',
    gender: user?.gender || 'Other',
    bio: user?.bio || '',
    weight: user?.weight || '',
    height: user?.height || '',
    fitnessGoal: user?.fitnessGoal || 'General Health',
    productivityStyle: user?.productivityStyle || 'Deep Work',
    waterGoal: user?.waterGoal || '2.5'
  }));

  const { updateProfile } = useStore();

  const handleProfileSave = async () => {
    try {
      await updateProfile(profileForm);
      toast.success('Profile Intelligence Synchronized! ⚡');
    } catch {
      toast.error('Failed to update profile.');
    }
  };

  return (
    <div className="settings-layout" style={{ maxWidth: 960, margin: '0 auto', display: 'flex', gap: 32, minHeight: '80vh' }}>

      
      {/* Settings Sidebar Navigation */}
      <div className="settings-sidebar" style={{ width: 240, display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>

        <h2 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1.5, padding: '0 12px 16px' }}>
          System Control
        </h2>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 16,
              background: activeTab === tab.id ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' : 'transparent',
              color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
              border: 'none', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', textAlign: 'left',
              fontWeight: activeTab === tab.id ? 800 : 600, fontSize: 14,
              boxShadow: activeTab === tab.id ? '0 10px 20px rgba(99, 102, 241, 0.2)' : 'none'
            }}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
        
        <div className="hide-mobile" style={{ marginTop: 'auto', padding: '20px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
             <Cloud size={14} /> Cloud Sync Active
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>Last sync: {new Date().toLocaleTimeString()}</div>
        </div>
      </div>

      {/* Settings Content Area */}
      <div style={{ flex: 1 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="card"
            style={{ padding: 32, borderRadius: 'var(--radius-xl)', border: '1.5px solid var(--border-subtle)' }}
          >
            {/* Operative Profile */}
            {activeTab === 'profile' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: -0.5 }}>Operative Profile</h3>
                    <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>Calibrate your biometric and objective parameters.</p>
                  </div>
                  <div style={{ padding: '8px 16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 12, border: '1px solid rgba(16, 185, 129, 0.2)', textAlign: 'right' }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: 1 }}>Biometric Integrity</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#10b981' }}>OPTIMAL</div>
                  </div>
                </div>

                <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

                  <div className="form-group">
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Username</label>
                    <input 
                      type="text" className="form-input" value={profileForm.username} 
                      onChange={(e) => setProfileForm({...profileForm, username: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Full Name</label>
                    <input 
                      type="text" className="form-input" value={profileForm.fullName} 
                      onChange={(e) => setProfileForm({...profileForm, fullName: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Operative Bio</label>
                  <textarea 
                    className="form-input" style={{ height: 80, resize: 'none', padding: '12px' }} value={profileForm.bio}
                    onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                    placeholder="Identify your mission..."
                  />
                </div>

                <div className="form-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>

                  <div className="form-group">
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Age</label>
                    <input 
                      type="number" className="form-input" value={profileForm.age} 
                      onChange={(e) => setProfileForm({...profileForm, age: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Weight (kg)</label>
                    <input 
                      type="number" className="form-input" value={profileForm.weight} 
                      onChange={(e) => setProfileForm({...profileForm, weight: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Height (cm)</label>
                    <input 
                      type="number" className="form-input" value={profileForm.height} 
                      onChange={(e) => setProfileForm({...profileForm, height: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

                  <div className="form-group">
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Primary Objective</label>
                    <select 
                      className="form-select" value={profileForm.fitnessGoal}
                      onChange={(e) => setProfileForm({...profileForm, fitnessGoal: e.target.value})}
                    >
                      <option value="Weight Loss">Weight Loss</option>
                      <option value="Muscle Gain">Muscle Gain</option>
                      <option value="Endurance">Endurance</option>
                      <option value="Mental Focus">Mental Focus</option>
                      <option value="General Health">General Health</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Productivity Style</label>
                    <select 
                      className="form-select" value={profileForm.productivityStyle}
                      onChange={(e) => setProfileForm({...profileForm, productivityStyle: e.target.value})}
                    >
                      <option value="Deep Work">Deep Work</option>
                      <option value="Multitasker">Multitasker</option>
                      <option value="Creative">Creative</option>
                      <option value="Disciplined">Disciplined</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                   <button className="btn btn-primary" onClick={handleProfileSave}><Save size={14} /> Synchronize Profile</button>
                </div>
              </div>
            )}

            {/* General Protocols */}
            {activeTab === 'general' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: -0.5 }}>General Protocols</h3>
                  <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>Configure the core operative parameters of your OS.</p>
                </div>

                <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div 
                    onClick={() => theme !== 'light' && toggleTheme()}
                    style={{ 
                      padding: 24, borderRadius: 20, border: `2px solid ${theme === 'light' ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                      background: theme === 'light' ? 'white' : 'var(--bg-elevated)', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: theme === 'light' ? '0 10px 30px rgba(99, 102, 241, 0.15)' : 'none'
                    }}>
                    <Sun size={28} color={theme === 'light' ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                    <div style={{ marginTop: 14, fontWeight: 800, fontSize: 15, color: theme === 'light' ? 'var(--text-primary)' : 'var(--text-muted)' }}>Light Mode</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>High-clarity tactical light.</div>
                  </div>
                  <div 
                    onClick={() => theme !== 'dark' && toggleTheme()}
                    style={{ 
                      padding: 24, borderRadius: 20, border: `2px solid ${theme === 'dark' ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                      background: theme === 'dark' ? '#0d0e14' : 'var(--bg-elevated)', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: theme === 'dark' ? '0 10px 30px rgba(99, 102, 241, 0.15)' : 'none'
                    }}>
                    <Moon size={28} color={theme === 'dark' ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                    <div style={{ marginTop: 14, fontWeight: 800, fontSize: 15, color: theme === 'dark' ? 'white' : 'var(--text-muted)' }}>Dark Mode</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Deep-space focus mode.</div>
                  </div>
                </div>

                <SettingRow label="Sync Interval" sub="Frequency of cloud intelligence synchronization." icon={RefreshCw}>
                   <select 
                    className="form-select" 
                    value={localSettings.syncInterval}
                    onChange={(e) => setLocalSettings({...localSettings, syncInterval: Number(e.target.value)})}
                   >
                      <option value={1}>1 Minute</option>
                      <option value={5}>5 Minutes</option>
                      <option value={15}>15 Minutes</option>
                      <option value={30}>30 Minutes</option>
                   </select>
                </SettingRow>

                <SettingRow label="Motivational Load" sub="Initialize dashboard with daily neural reinforcements." icon={Zap}>
                  <Switch checked={localSettings.motivationalQuotes} onChange={(v) => setLocalSettings({...localSettings, motivationalQuotes: v})} />
                </SettingRow>

                <SettingRow label="Operational Auto-Save" sub="Automatically commit all changes to local and cloud storage." icon={Save}>
                   <Switch checked={localSettings.autoSave} onChange={(v) => setLocalSettings({...localSettings, autoSave: v})} />
                </SettingRow>

                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                   <button className="btn btn-primary" onClick={handleSave}><Save size={14} /> Update Protocols</button>
                </div>
              </div>
            )}

            {/* AI & Intelligence */}
            {activeTab === 'ai' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ marginBottom: 12 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: -0.5 }}>AI & Intelligence Protocols</h3>
                  <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>Manage AI provider connections, model parameters, and strict data privacy boundaries.</p>
                </div>

                <SettingRow label="AI Assistant & Insights" sub="Enable context-aware intelligence, weekly debriefs, and conversational advice." icon={Brain}>
                   <Switch 
                     checked={localSettings.aiEnabled} 
                     onChange={(v) => setLocalSettings({...localSettings, aiEnabled: v})} 
                   />
                </SettingRow>

                {/* AI Provider & Dynamic Connection Diagnostic Screen */}
                <div style={{ padding: 20, background: 'var(--bg-elevated)', borderRadius: 16, border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Cpu size={18} color="var(--accent-primary)" />
                      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Gemini Connection & Model Diagnostics</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="badge" style={{
                        background: (diagnosticResult?.connected ?? aiStatus?.isCloudConfigured) ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                        color: (diagnosticResult?.connected ?? aiStatus?.isCloudConfigured) ? '#10b981' : '#f59e0b',
                        fontSize: 10, fontWeight: 800
                      }}>
                        {(diagnosticResult?.connected ?? aiStatus?.isCloudConfigured) ? 'GEMINI CONNECTED' : 'LOCAL ENGINE / DISCONNECTED'}
                      </span>

                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={handleTestConnection}
                        disabled={testingConnection}
                        style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <RefreshCw size={12} className={testingConnection ? 'spin' : ''} />
                        <span>{testingConnection ? 'Pinging Gemini...' : 'Test Connection'}</span>
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                    <div style={{ padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 10 }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>API Key Configured</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: aiStatus?.providers?.gemini?.configured ? '#10b981' : '#ef4444' }}>
                        {aiStatus?.providers?.gemini?.configured ? 'Yes (Server Environment)' : 'No (Local Offline)'}
                      </div>
                    </div>

                    <div style={{ padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 10 }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>Active / Selected Model</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                        {diagnosticResult?.activeModel || aiStatus?.providers?.gemini?.resolvedModel || aiStatus?.providers?.gemini?.preferredModel || 'gemini-2.0-flash'}
                      </div>
                    </div>

                    <div style={{ padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 10 }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>Discovered Models</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-primary)' }}>
                        {diagnosticResult?.discoveredCount ?? (aiStatus?.providers?.gemini?.discoveredModelsCount || 0)} available
                      </div>
                    </div>

                    <div style={{ padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 10 }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>Last Connection Status</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: (diagnosticResult?.connected ?? aiStatus?.isCloudConfigured) ? '#10b981' : '#f59e0b' }}>
                        {diagnosticResult ? (diagnosticResult.connected ? `Success (${diagnosticResult.latencyMs}ms)` : 'Failed') : (aiStatus?.providers?.gemini?.lastSuccess ? 'Online' : 'Standby')}
                      </div>
                    </div>
                  </div>

                  {/* Discovered Models Chips */}
                  {((diagnosticResult?.availableModels || aiStatus?.providers?.gemini?.discoveredModels)?.length > 0) && (
                    <div style={{ marginTop: 4 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                        Compatible Discovered Models:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {(diagnosticResult?.availableModels || aiStatus?.providers?.gemini?.discoveredModels || []).map((m, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 6,
                              background: 'rgba(99, 102, 241, 0.1)',
                              border: '1px solid rgba(99, 102, 241, 0.25)',
                              color: 'var(--accent-primary)'
                            }}
                          >
                            {m.cleanName || m.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Last Error Display if any */}
                  {(diagnosticResult?.error || aiStatus?.providers?.gemini?.lastError) && (
                    <div style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      color: '#ef4444',
                      fontSize: 11
                    }}>
                      <strong>Connection Diagnostic Notice:</strong> {diagnosticResult?.error || aiStatus?.providers?.gemini?.lastError}
                    </div>
                  )}

                  <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    💡 <strong>Self-Healing Discovery:</strong> TaskBar OS dynamically calls Google's <code>ListModels</code> API to discover and select available generative models, with automatic fallback if a model alias is deprecated.
                  </div>
                </div>

                {/* Long-Term Preference Memory (Phase 5) */}
                <div style={{ padding: 20, background: 'var(--bg-elevated)', borderRadius: 16, border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Brain size={18} color="var(--accent-primary)" />
                      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Personal AI Memory & Preferences</span>
                    </div>
                    <Switch checked={memoryEnabled} onChange={handleToggleMemory} />
                  </div>

                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                    Stores high-level planning preferences, communication habits, and user goals across conversations. You retain full sovereignty to edit or wipe stored memories at any time.
                  </p>

                  {/* Preferences List */}
                  {memoryEnabled && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                      {Object.entries(memoryPrefs).length === 0 ? (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          No custom memories stored yet. Add one below.
                        </div>
                      ) : (
                        Object.entries(memoryPrefs).map(([key, val]) => (
                          <div
                            key={key}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 12px',
                              borderRadius: 8,
                              background: 'rgba(0, 0, 0, 0.2)',
                              border: '1px solid var(--border-subtle)'
                            }}
                          >
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-primary)' }}>{key}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{String(val)}</div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-ghost btn-icon btn-xs text-danger"
                              onClick={() => handleDeletePreference(key)}
                              title="Delete this preference"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ))
                      )}

                      {/* Add Preference Form */}
                      <form onSubmit={handleAddPreference} style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                        <input
                          type="text"
                          placeholder="Preference Name (e.g. preferredStyle)"
                          value={newPrefKey}
                          onChange={(e) => setNewPrefKey(e.target.value)}
                          style={{
                            flex: 1,
                            minWidth: 140,
                            padding: '6px 10px',
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 8,
                            color: 'var(--text-primary)',
                            fontSize: 11,
                            outline: 'none'
                          }}
                        />
                        <input
                          type="text"
                          placeholder="Value (e.g. Concise and direct bullet points)"
                          value={newPrefVal}
                          onChange={(e) => setNewPrefVal(e.target.value)}
                          style={{
                            flex: 2,
                            minWidth: 180,
                            padding: '6px 10px',
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 8,
                            color: 'var(--text-primary)',
                            fontSize: 11,
                            outline: 'none'
                          }}
                        />
                        <button type="submit" className="btn btn-secondary btn-sm" style={{ fontSize: 11 }}>
                          Add Memory
                        </button>
                      </form>

                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs text-danger"
                          onClick={() => {
                            aiMemoryService.clearPreferences();
                            setMemoryPrefs({});
                            toast.success('AI memory wiped');
                          }}
                        >
                          Clear All Preferences
                        </button>

                        <button
                          type="button"
                          className="btn btn-ghost btn-xs text-danger"
                          onClick={() => {
                            aiMemoryService.clearAllConversations();
                            toast.success('All conversation threads cleared');
                          }}
                        >
                          Clear All Conversation Threads
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Privacy & Data Sharing */}
                <div style={{ padding: 20, background: 'var(--bg-elevated)', borderRadius: 16, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldCheck size={18} color="var(--accent-primary)" />
                    <span>Data Privacy & Context Boundaries</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 14px 0', lineHeight: 1.5 }}>
                    Choose which data categories are aggregated into AI context prompts. Only anonymous numerical summaries and non-sensitive titles are ever included.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>Include Task Titles & Counts</span>
                      <Switch 
                        checked={localSettings.aiPrivacy?.includeTasks ?? true} 
                        onChange={(v) => setLocalSettings({
                          ...localSettings, 
                          aiPrivacy: { ...(localSettings.aiPrivacy || {}), includeTasks: v }
                        })} 
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>Include Habit Consistency & Streaks</span>
                      <Switch 
                        checked={localSettings.aiPrivacy?.includeHabits ?? true} 
                        onChange={(v) => setLocalSettings({
                          ...localSettings, 
                          aiPrivacy: { ...(localSettings.aiPrivacy || {}), includeHabits: v }
                        })} 
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>Include Workout History & Volume</span>
                      <Switch 
                        checked={localSettings.aiPrivacy?.includeWorkouts ?? true} 
                        onChange={(v) => setLocalSettings({
                          ...localSettings, 
                          aiPrivacy: { ...(localSettings.aiPrivacy || {}), includeWorkouts: v }
                        })} 
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>Include Nutrition & Hydration Logs</span>
                      <Switch 
                        checked={localSettings.aiPrivacy?.includeNutrition ?? true} 
                        onChange={(v) => setLocalSettings({
                          ...localSettings, 
                          aiPrivacy: { ...(localSettings.aiPrivacy || {}), includeNutrition: v }
                        })} 
                      />
                    </div>
                  </div>
                </div>

                {/* AI Cache Purge */}
                <SettingRow label="AI Memory & Report Cache" sub="Clear all locally cached conversational messages, suggestions, and generated debriefs." icon={RefreshCw}>
                   <button 
                     type="button" 
                     className="btn btn-ghost btn-sm text-danger"
                     onClick={() => {
                       localStorage.removeItem('taskbar_ai_chat_history');
                       localStorage.removeItem('taskbar_ai_report_weekly');
                       localStorage.removeItem('taskbar_ai_report_monthly');
                       toast.success('AI conversation history & report cache purged');
                     }}
                   >
                     Purge AI Cache
                   </button>
                </SettingRow>

                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                   <button className="btn btn-primary" onClick={handleSave}><Save size={14} /> Save AI Preferences</button>
                </div>
              </div>
            )}

            {/* Focus Matrix */}
            {activeTab === 'focus' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ marginBottom: 12 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: -0.5 }}>Focus Matrix</h3>
                  <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>Calibrate your deep focus and recovery intervals.</p>
                </div>

                {[
                  { key: 'pomodoroFocus', label: 'Deep Focus', icon: Target, max: 120, min: 10, step: 5 },
                  { key: 'pomodoroShortBreak', label: 'Recovery Interval', icon: Coffee, max: 30, min: 2, step: 1 },
                  { key: 'pomodoroLongBreak', label: 'Extended Recalibration', icon: Monitor, max: 60, min: 10, step: 5 },
                ].map((s) => (
                  <div key={s.key} style={{ padding: '20px', background: 'var(--bg-elevated)', borderRadius: 24, border: '1.5px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ padding: 10, background: 'rgba(99, 102, 241, 0.1)', borderRadius: 14, color: 'var(--accent-primary)' }}>
                           <s.icon size={20} />
                        </div>
                        <div>
                           <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>{s.label}</div>
                           <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Target duration in minutes.</div>
                        </div>
                     </div>
                     
                     <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'var(--bg-card)', padding: '6px 12px', borderRadius: 16, border: '1px solid var(--border-subtle)' }}>
                        <button 
                          onClick={() => setLocalSettings({...localSettings, [s.key]: Math.max(s.min, localSettings[s.key] - s.step)})}
                          className="btn btn-ghost btn-icon btn-sm"
                          style={{ width: 32, height: 32, borderRadius: 10 }}
                        >
                          <Minus size={14} />
                        </button>
                        <div style={{ minWidth: 40, textAlign: 'center' }}>
                           <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--accent-primary)' }}>{localSettings[s.key]}</div>
                           <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Min</div>
                        </div>
                        <button 
                          onClick={() => setLocalSettings({...localSettings, [s.key]: Math.min(s.max, localSettings[s.key] + s.step)})}
                          className="btn btn-ghost btn-icon btn-sm"
                          style={{ width: 32, height: 32, borderRadius: 10 }}
                        >
                          <Plus size={14} />
                        </button>
                     </div>
                  </div>
                ))}

                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                   <button className="btn btn-primary" onClick={handleSave}><Save size={14} /> Commit Changes</button>
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeTab === 'notifications' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ marginBottom: 12 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: -0.5 }}>Neural Alerts</h3>
                  <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>Manage how the system communicates mission-critical information.</p>
                </div>

                <SettingRow label="System Notifications" sub="Global toggle for all browser and system-level alerts." icon={Bell}>
                   <Switch checked={localSettings.notifications} onChange={(v) => setLocalSettings({...localSettings, notifications: v})} />
                </SettingRow>

                <SettingRow label="Alert Soundscape" sub="Select background soundscapes for focus sessions." icon={Volume2}>
                   <div style={{ display: 'flex', gap: 8 }}>
                      <select 
                        className="form-select" 
                        style={{ minWidth: 160 }}
                        value={localSettings.notificationSound}
                        onChange={(e) => setLocalSettings({...localSettings, notificationSound: e.target.value})}
                      >
                         {NOTIFICATION_SOUNDS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button className="btn btn-ghost" onClick={testSound}><Play size={14} /></button>
                   </div>
                </SettingRow>

                <SettingRow label="Tactical Audio" sub="Play sounds for mission completion and timer triggers." icon={Volume2}>
                   <Switch checked={localSettings.sound} onChange={(v) => setLocalSettings({...localSettings, sound: v})} />
                </SettingRow>

                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                   <button className="btn btn-primary" onClick={handleSave}><Save size={14} /> Update Alerts</button>
                </div>
              </div>
            )}

            {/* Account & Data */}
            {activeTab === 'account' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ marginBottom: 12 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: -0.5 }}>Identity & Security</h3>
                  <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>Manage your operative profile and security sovereignty.</p>
                </div>

                <div style={{ padding: 20, background: 'var(--bg-elevated)', borderRadius: 20, border: '1.5px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 20 }}>
                   <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 24, fontWeight: 900 }}>
                      {user?.name?.[0] || 'U'}
                   </div>
                   <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 18, fontWeight: 800 }}>{user?.name || 'Operative'}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}><Mail size={12} /> {user?.email || 'cloud@taskbar.os'}</div>
                   </div>
                </div>

                <div style={{ padding: 24, background: 'var(--bg-elevated)', borderRadius: 20, border: '1.5px solid var(--border-subtle)' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <Lock size={18} color="var(--accent-primary)" />
                      <span style={{ fontSize: 15, fontWeight: 800 }}>Security Protocol</span>
                   </div>
                   <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ flex: 1, position: 'relative' }}>
                         <Key size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                         <input 
                            type="password" 
                            className="form-input" 
                            placeholder="Enter new secure password" 
                            style={{ paddingLeft: 36, width: '100%' }}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                         />
                      </div>
                      <button className="btn btn-primary" onClick={handlePasswordChange} disabled={isChangingPass}>
                         {isChangingPass ? 'Updating...' : 'Change Password'}
                      </button>
                   </div>
                </div>

                <div style={{ padding: 24, background: 'var(--bg-elevated)', borderRadius: 20, border: '1.5px solid var(--border-subtle)' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <Database size={18} color="var(--accent-primary)" />
                      <div>
                        <span style={{ fontSize: 15, fontWeight: 800 }}>Intelligence Sovereignty</span>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Export portable backups or restore verified mission archives</div>
                      </div>
                   </div>
                   <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <button className="btn btn-ghost btn-sm" style={{ flex: 1, minWidth: 140 }} onClick={() => exportData('json')}>
                         <Download size={14} /> Export JSON
                      </button>
                      <button className="btn btn-ghost btn-sm" style={{ flex: 1, minWidth: 140 }} onClick={() => exportData('csv')}>
                         <FileText size={14} /> Export Tasks CSV
                      </button>
                      <label className="btn btn-primary btn-sm" style={{ flex: 1, minWidth: 140, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                         <Upload size={14} /> Import Backup
                         <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
                      </label>
                   </div>
                </div>

                <SettingRow label="Account Sovereignty" sub="Securely purge all intelligence and reset your operational profile." icon={Shield}>
                   <button className="btn btn-danger btn-sm" onClick={handleReset}>Reset System</button>
                </SettingRow>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* CONFIRM INTELLIGENCE RESTORE MODAL */}
      <AnimatePresence>
        {showImportModal && importPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(8px)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9 }}
              style={{
                background: 'var(--bg-card)',
                borderRadius: 24,
                padding: 26,
                maxWidth: 480,
                width: '100%',
                border: '1.5px solid var(--border-subtle)',
                boxShadow: '0 30px 60px rgba(0,0,0,0.6)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                    <Database size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>Restore Intelligence Archive</h3>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{importPreview.fileName}</div>
                  </div>
                </div>
                <button onClick={() => setShowImportModal(false)} className="btn btn-ghost btn-icon btn-sm"><X size={16} /></button>
              </div>

              {/* Archive Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                <div style={{ padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>Tasks to Restore</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)' }}>{importPreview.tasksCount}</div>
                </div>
                <div style={{ padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>Habits to Restore</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--accent-primary)' }}>{importPreview.habitsCount}</div>
                </div>
                <div style={{ padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>Workouts Logged</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#f59e0b' }}>{importPreview.workoutsCount}</div>
                </div>
                <div style={{ padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>Diet Records</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#10b981' }}>{importPreview.dietCount}</div>
                </div>
              </div>

              {/* Pre-restore backup safeguard */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(99,102,241,0.06)', borderRadius: 12, border: '1px solid rgba(99,102,241,0.2)', marginBottom: 20, cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={createPreBackup} 
                  onChange={e => setCreatePreBackup(e.target.checked)} 
                  style={{ accentColor: 'var(--accent-primary)', width: 16, height: 16 }}
                />
                <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>
                  Automatically download safety backup of current state before replacing
                </span>
              </label>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button 
                  type="button" 
                  className="btn btn-ghost" 
                  style={{ flex: 1 }} 
                  onClick={() => setShowImportModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 800 }}
                  onClick={() => {
                    if (createPreBackup) {
                      exportData('json');
                    }
                    importData(importPreview.rawText);
                    setShowImportModal(false);
                    setImportPreview(null);
                  }}
                >
                  <Check size={16} />
                  <span>Confirm & Restore</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
