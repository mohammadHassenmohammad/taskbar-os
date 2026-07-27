import { useState, useEffect } from 'react';
import { useStore, NOTIFICATION_SOUNDS } from '../store/useStore'; // Sync Heartbeat: 1778478600
import { playNotificationSound } from '../lib/audio';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, Download, Upload, Trash2, Moon, Sun, Bell, Timer, 
  Volume2, Zap, Shield, User, Globe, Coffee, Monitor, 
  CheckCircle, Cloud, RefreshCw, Smartphone, Mail, Lock, Target, Key, Play, Database, Plus, Minus
} from 'lucide-react';
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
  const [localSettings, setLocalSettings] = useState({ ...settings });
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Sync local state when global settings change
  useEffect(() => {
    setLocalSettings({ ...settings });
  }, [settings]);

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
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      importData(event.target.result);
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
    { id: 'focus', label: 'Focus Matrix', icon: Timer },
    { id: 'notifications', label: 'Neural Alerts', icon: Bell },
    { id: 'account', label: 'Security & Data', icon: Shield },
  ];

  const [profileForm, setProfileForm] = useState({
    username: '',
    fullName: '',
    age: '',
    gender: '',
    bio: '',
    weight: '',
    height: '',
    fitnessGoal: '',
    productivityStyle: '',
    waterGoal: ''
  });

  const { updateProfile } = useStore();

  useEffect(() => {
    if (user) {
      setProfileForm({
        username: user.username || '',
        fullName: user.fullName || user.name || '',
        age: user.age || '',
        gender: user.gender || 'Other',
        bio: user.bio || '',
        weight: user.weight || '',
        height: user.height || '',
        fitnessGoal: user.fitnessGoal || 'General Health',
        productivityStyle: user.productivityStyle || 'Deep Work',
        waterGoal: user.waterGoal || '2.5'
      });
    }
  }, [user]);

  const handleProfileSave = async () => {
    try {
      await updateProfile(profileForm);
      toast.success('Profile Intelligence Synchronized! ⚡');
    } catch (err) {
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
                      <span style={{ fontSize: 15, fontWeight: 800 }}>Intelligence Sovereignty</span>
                   </div>
                   <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <button className="btn btn-ghost" style={{ flex: 1, minWidth: 140 }} onClick={exportData}>
                         <Download size={14} /> Export Intelligence
                      </button>
                      <label className="btn btn-ghost" style={{ flex: 1, minWidth: 140, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
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
    </div>
  );
}
