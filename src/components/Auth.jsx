import { useState } from 'react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogIn, UserPlus, Lock, Mail, ShieldCheck, ArrowLeft, ArrowRight, 
  RefreshCw, User, Zap, Eye, EyeOff,
  Sparkles, CheckCircle, AlertCircle, Compass
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Auth() {
  const [stage, setStage] = useState('welcome'); // welcome, login, signup, forgot, onboarding, finalizing
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [resetSent, setResetSent] = useState(false);
  const [authError, setAuthError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    fullName: '',
    age: '26',
    gender: 'Other',
    weight: '72',
    height: '178',
    fitnessGoal: 'General Health',
    productivityStyle: 'Deep Work',
    waterGoal: '2.5',
    bio: ''
  });

  const { login, signup, requestPasswordReset, loginGuest, loginAsTestAccount } = useStore();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAuthError('');
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: 'Too short', color: 'var(--text-muted)' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 9) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'var(--color-danger)' };
    if (score <= 3) return { score: 2, label: 'Fair', color: 'var(--color-warning)' };
    if (score === 4) return { score: 3, label: 'Strong', color: 'var(--accent-primary)' };
    return { score: 4, label: 'Very Secure', color: 'var(--color-success)' };
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const startOnboarding = () => {
    setAuthError('');
    if (!validateEmail(formData.email)) {
      setAuthError('Please enter a valid email address.');
      return toast.error('Valid email is required.');
    }
    if (!formData.username.trim() || formData.username.length < 3) {
      setAuthError('Username must be at least 3 characters.');
      return toast.error('Valid username is required.');
    }
    if (formData.password.length < 6) {
      setAuthError('Password must contain at least 6 characters.');
      return toast.error('Security code too short (minimum 6).');
    }
    if (formData.password !== formData.confirmPassword) {
      setAuthError('Passwords do not match.');
      return toast.error('Passwords do not match.');
    }
    if (!agreeTerms) {
      setAuthError('You must agree to the Terms of Service to create an account.');
      return toast.error('Please accept the terms.');
    }
    setStage('onboarding');
  };

  const handleFinalize = async (skipOnboarding = false) => {
    setLoading(true);
    setAuthError('');
    try {
      setStage('finalizing');
      
      const profileData = {
        username: formData.username.trim(),
        fullName: formData.fullName.trim() || formData.username.trim(),
        age: parseInt(formData.age) || 25,
        gender: formData.gender,
        weight: parseFloat(formData.weight) || 70,
        height: parseFloat(formData.height) || 175,
        fitnessGoal: formData.fitnessGoal,
        productivityStyle: formData.productivityStyle,
        waterGoal: parseFloat(formData.waterGoal) || 2.5,
        bio: formData.bio || (skipOnboarding ? 'Personal Operative Profile' : '')
      };

      await new Promise(r => setTimeout(r, 1200));
      await signup(formData.email.trim(), formData.password, profileData);
      toast.success('Account created! Welcome to TaskBar OS.');
    } catch (err) {
      console.error("Registration Failure:", err);
      setStage('onboarding');
      let msg = 'Account creation failed. Please verify connection.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'This email is already registered. Please sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password is too weak. Please use a stronger password.';
      } else if (err.code === 'auth/network-request-failed') {
        msg = 'Network error. Please check your internet connection.';
      }
      setAuthError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!validateEmail(formData.email)) {
      setAuthError('Please enter a valid email address.');
      return;
    }
    if (!formData.password) {
      setAuthError('Please enter your password.');
      return;
    }
    setLoading(true);
    try {
      await login(formData.email.trim(), formData.password);
      toast.success('Authenticated successfully. Welcome back!');
    } catch (err) {
      console.error("Login Error:", err);
      let msg = 'Authentication failed. Please verify credentials.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        msg = 'Invalid email or password. Please check and try again.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many failed attempts. Please wait a moment or reset password.';
      } else if (err.code === 'auth/network-request-failed') {
        msg = 'Network unreachable. Check connection or try Local Mode.';
      }
      setAuthError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!validateEmail(formData.email)) {
      setAuthError('Please enter the email address associated with your account.');
      return;
    }
    setLoading(true);
    try {
      await requestPasswordReset(formData.email.trim());
      setResetSent(true);
      toast.success('Password reset link sent to your email.');
    } catch (err) {
      let msg = 'Failed to send reset link.';
      if (err.code === 'auth/user-not-found') {
        msg = 'No account found with this email.';
      }
      setAuthError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestEntry = () => {
    loginGuest(formData.fullName.trim() || 'Guest Operative');
    toast.success('Logged in as Guest. Running in local-first mode.');
  };

  const strength = getPasswordStrength(formData.password);

  const containerVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, scale: 0.98, transition: { duration: 0.2 } }
  };

  const stepVariants = {
    enter: { x: 30, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -30, opacity: 0 }
  };

  return (
    <div className="auth-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', position: 'relative', overflow: 'hidden' }}>
      {/* Background Ambience */}
      <div className="auth-bg" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '400px', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>
      
      <div className="auth-content-layer" style={{ width: '100%', maxWidth: '480px', padding: '24px', zIndex: 10 }}>
        <AnimatePresence mode="wait">
          {/* STAGE: WELCOME */}
          {stage === 'welcome' && (
            <motion.div key="welcome" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="auth-card" style={{ textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', padding: '36px 32px', boxShadow: 'var(--shadow-lg)' }}>
              
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', marginBottom: 24 }}>
                <Sparkles size={14} color="var(--accent-primary)" />
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent-primary)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Professional Productivity OS</span>
              </div>

              <div style={{ width: 68, height: 68, borderRadius: 20, background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 12px 28px rgba(99,102,241,0.35)' }}>
                <ShieldCheck size={36} color="#ffffff" />
              </div>

              <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.5px', margin: 0 }}>TaskBar OS</h1>
              <p style={{ color: 'var(--text-secondary)', marginTop: 10, fontSize: 14, lineHeight: 1.6, fontWeight: 500 }}>
                High-performance workspace uniting task management, progressive fitness, bio-tracking, and intelligent insights.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 32 }}>
                <button onClick={() => { setAuthError(''); setStage('login'); }} className="btn btn-primary" style={{ padding: '13px 20px', fontSize: 14, fontWeight: 700, borderRadius: 'var(--radius-md)' }}>
                  <LogIn size={18} /> Sign In to Your Workspace
                </button>
                <button onClick={() => { setAuthError(''); setStage('signup'); }} className="btn btn-secondary" style={{ padding: '13px 20px', fontSize: 14, fontWeight: 700, borderRadius: 'var(--radius-md)' }}>
                  <UserPlus size={18} /> Create New Account
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>or explore</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
                </div>
                <button onClick={handleGuestEntry} className="btn btn-ghost" style={{ padding: '11px 18px', fontSize: 13, fontWeight: 600, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
                  <Compass size={16} /> Continue as Guest (Offline Local Mode)
                </button>

                {/* 1-Click Test & Evaluation Accounts */}
                <div style={{ marginTop: 12, padding: 14, borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    🧪 Quick Test Accounts (1-Click Switcher)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <button 
                      type="button"
                      onClick={() => { loginAsTestAccount('admin'); toast.success('Logged in as Administrator!'); }}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: 12, padding: '8px 12px', borderColor: 'rgba(99, 102, 241, 0.4)', color: 'var(--accent-primary)', fontWeight: 700 }}
                      title="admin@taskbar.local (ADMIN Role)"
                    >
                      🛡️ Administrator
                    </button>
                    <button 
                      type="button"
                      onClick={() => { loginAsTestAccount('user'); toast.success('Logged in as Standard User!'); }}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: 12, padding: '8px 12px', borderColor: 'rgba(16, 185, 129, 0.4)', color: 'var(--color-success)', fontWeight: 700 }}
                      title="user@taskbar.local (USER Role)"
                    >
                      👤 Standard User
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 24, fontSize: 11, color: 'var(--text-muted)' }}>
                Zero latency · Encrypted · Works completely offline
              </div>
            </motion.div>
          )}

          {/* STAGE: LOGIN */}
          {stage === 'login' && (
            <motion.div key="login" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="auth-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', padding: '36px 32px', boxShadow: 'var(--shadow-lg)', position: 'relative' }}>
              <button onClick={() => { setAuthError(''); setStage('welcome'); }} className="btn btn-ghost btn-icon btn-sm" style={{ position: 'absolute', top: 20, left: 20 }} title="Back">
                <ArrowLeft size={16}/>
              </button>
              
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>Welcome Back</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>Authenticate to access your synchronized workspace</p>
              </div>

              {authError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: 'var(--color-danger)', fontSize: 12, marginBottom: 18 }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="auth-input-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Email Address</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 14 }} />
                    <input 
                      type="email" 
                      name="email" 
                      required 
                      className="form-input" 
                      style={{ paddingLeft: 40, width: '100%' }} 
                      placeholder="name@company.com" 
                      value={formData.email} 
                      onChange={handleInputChange} 
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="auth-input-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Password</label>
                    <button type="button" onClick={() => { setAuthError(''); setStage('forgot'); }} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                      Forgot password?
                    </button>
                  </div>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 14 }} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      name="password" 
                      required 
                      className="form-input" 
                      style={{ paddingLeft: 40, paddingRight: 40, width: '100%' }} 
                      placeholder="••••••••" 
                      value={formData.password} 
                      onChange={handleInputChange} 
                      autoComplete="current-password"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                      {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '12px', fontSize: 14, fontWeight: 700, marginTop: 6 }}>
                  {loading ? <RefreshCw className="animate-spin" size={18} /> : <>Sign In <Zap size={16}/></>}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: 22, fontSize: 13, color: 'var(--text-muted)' }}>
                Don't have an account?{' '}
                <button onClick={() => { setAuthError(''); setStage('signup'); }} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                  Create one now
                </button>
              </div>
            </motion.div>
          )}

          {/* STAGE: SIGNUP */}
          {stage === 'signup' && (
            <motion.div key="signup" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="auth-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', padding: '36px 32px', boxShadow: 'var(--shadow-lg)', position: 'relative' }}>
              <button onClick={() => { setAuthError(''); setStage('welcome'); }} className="btn btn-ghost btn-icon btn-sm" style={{ position: 'absolute', top: 20, left: 20 }}>
                <ArrowLeft size={16}/>
              </button>
              
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>Create Account</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>Establish your personal TaskBar OS identity</p>
              </div>

              {authError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: 'var(--color-danger)', fontSize: 12, marginBottom: 16 }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{authError}</span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="auth-input-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Full Name</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <User size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12 }} />
                      <input type="text" name="fullName" className="form-input" style={{ paddingLeft: 36, width: '100%', fontSize: 13 }} placeholder="Alex Hunter" value={formData.fullName} onChange={handleInputChange} />
                    </div>
                  </div>

                  <div className="auth-input-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Username</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <span style={{ position: 'absolute', left: 12, fontSize: 13, color: 'var(--text-muted)', fontWeight: 700 }}>@</span>
                      <input type="text" name="username" required className="form-input" style={{ paddingLeft: 30, width: '100%', fontSize: 13 }} placeholder="alex_h" value={formData.username} onChange={handleInputChange} />
                    </div>
                  </div>
                </div>

                <div className="auth-input-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Email Address</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Mail size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12 }} />
                    <input type="email" name="email" required className="form-input" style={{ paddingLeft: 36, width: '100%', fontSize: 13 }} placeholder="name@domain.com" value={formData.email} onChange={handleInputChange} autoComplete="email" />
                  </div>
                </div>

                <div className="auth-input-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Password</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Lock size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12 }} />
                    <input type={showPassword ? "text" : "password"} name="password" required className="form-input" style={{ paddingLeft: 36, paddingRight: 36, width: '100%', fontSize: 13 }} placeholder="At least 6 characters" value={formData.password} onChange={handleInputChange} autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 10, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}>
                      {showPassword ? <EyeOff size={15}/> : <Eye size={15}/>}
                    </button>
                  </div>

                  {formData.password && (
                    <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                        {[1, 2, 3, 4].map(idx => (
                          <div key={idx} style={{ height: 4, flex: 1, borderRadius: 2, background: idx <= strength.score ? strength.color : 'var(--bg-elevated)', transition: 'all 0.2s' }} />
                        ))}
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: strength.color }}>{strength.label}</span>
                    </div>
                  )}
                </div>

                <div className="auth-input-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Confirm Password</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Lock size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12 }} />
                    <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" required className="form-input" style={{ paddingLeft: 36, paddingRight: 36, width: '100%', fontSize: 13 }} placeholder="Repeat password" value={formData.confirmPassword} onChange={handleInputChange} autoComplete="new-password" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: 10, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}>
                      {showConfirmPassword ? <EyeOff size={15}/> : <Eye size={15}/>}
                    </button>
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} style={{ marginTop: 2 }} />
                  <span>I agree to the Terms of Service and acknowledge the Privacy Policy.</span>
                </label>

                <button onClick={startOnboarding} className="btn btn-primary" style={{ padding: '12px', fontSize: 14, fontWeight: 700, marginTop: 8 }}>
                  Continue to Personalization <ArrowRight size={16}/>
                </button>
              </div>

              <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
                Already registered?{' '}
                <button onClick={() => { setAuthError(''); setStage('login'); }} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                  Sign in
                </button>
              </div>
            </motion.div>
          )}

          {/* STAGE: FORGOT PASSWORD */}
          {stage === 'forgot' && (
            <motion.div key="forgot" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="auth-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', padding: '36px 32px', boxShadow: 'var(--shadow-lg)', position: 'relative' }}>
              <button onClick={() => { setAuthError(''); setResetSent(false); setStage('login'); }} className="btn btn-ghost btn-icon btn-sm" style={{ position: 'absolute', top: 20, left: 20 }}>
                <ArrowLeft size={16}/>
              </button>

              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>Reset Password</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>We'll send password recovery instructions to your email</p>
              </div>

              {resetSent ? (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <CheckCircle size={30} />
                  </div>
                  <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>Recovery Email Sent</h4>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    If an account exists for <strong>{formData.email}</strong>, you will receive a password reset link shortly.
                  </p>
                  <button onClick={() => { setResetSent(false); setStage('login'); }} className="btn btn-secondary" style={{ marginTop: 24, width: '100%' }}>
                    Return to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePasswordReset} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {authError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: 'var(--color-danger)', fontSize: 12 }}>
                      <AlertCircle size={16} />
                      <span>{authError}</span>
                    </div>
                  )}

                  <div className="auth-input-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Your Email Address</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 14 }} />
                      <input 
                        type="email" 
                        name="email" 
                        required 
                        className="form-input" 
                        style={{ paddingLeft: 40, width: '100%' }} 
                        placeholder="name@company.com" 
                        value={formData.email} 
                        onChange={handleInputChange} 
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '12px', fontSize: 14, fontWeight: 700 }}>
                    {loading ? <RefreshCw className="animate-spin" size={18} /> : 'Send Reset Link'}
                  </button>

                  <button type="button" onClick={() => setStage('login')} className="btn btn-ghost" style={{ fontSize: 13 }}>
                    Cancel and return to Sign In
                  </button>
                </form>
              )}
            </motion.div>
          )}

          {/* STAGE: ONBOARDING */}
          {stage === 'onboarding' && (
            <motion.div key="onboarding" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="auth-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', padding: '36px 32px', boxShadow: 'var(--shadow-lg)', maxWidth: 520 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ width: 28, height: 6, borderRadius: 3, background: onboardingStep >= i ? 'var(--accent-primary)' : 'var(--bg-elevated)', transition: 'background 0.3s' }} />
                  ))}
                </div>
                <button onClick={() => handleFinalize(true)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Skip to Dashboard →
                </button>
              </div>
              
              <AnimatePresence mode="wait">
                {onboardingStep === 1 && (
                  <motion.div key="step1" variants={stepVariants} initial="enter" animate="center" exit="exit" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ textAlign: 'center', marginBottom: 8 }}>
                      <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>Personal Profile</h3>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>How should TaskBar OS address you?</p>
                    </div>

                    <div className="auth-input-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Display Name</label>
                      <input type="text" name="fullName" className="form-input" placeholder="Alex Hunter" value={formData.fullName} onChange={handleInputChange} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div className="auth-input-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Age</label>
                        <input type="number" name="age" className="form-input" placeholder="26" value={formData.age} onChange={handleInputChange} />
                      </div>
                      <div className="auth-input-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Gender</label>
                        <select name="gender" className="form-select" value={formData.gender} onChange={handleInputChange}>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}

                {onboardingStep === 2 && (
                  <motion.div key="step2" variants={stepVariants} initial="enter" animate="center" exit="exit" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ textAlign: 'center', marginBottom: 8 }}>
                      <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>Physical Benchmarks</h3>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Used to calculate BMR and workout targets</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div className="auth-input-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Weight (kg)</label>
                        <input type="number" name="weight" className="form-input" placeholder="72" value={formData.weight} onChange={handleInputChange} />
                      </div>
                      <div className="auth-input-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Height (cm)</label>
                        <input type="number" name="height" className="form-input" placeholder="178" value={formData.height} onChange={handleInputChange} />
                      </div>
                    </div>

                    <div className="auth-input-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Primary Fitness Objective</label>
                      <select name="fitnessGoal" className="form-select" value={formData.fitnessGoal} onChange={handleInputChange}>
                        <option value="Weight Loss">Weight Loss & Lean Definition</option>
                        <option value="Muscle Gain">Hypertrophy & Strength Gain</option>
                        <option value="Endurance">Cardiovascular Endurance</option>
                        <option value="Mental Focus">Mental Focus & Resilience</option>
                        <option value="General Health">General Longevity & Health</option>
                      </select>
                    </div>
                  </motion.div>
                )}

                {onboardingStep === 3 && (
                  <motion.div key="step3" variants={stepVariants} initial="enter" animate="center" exit="exit" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ textAlign: 'center', marginBottom: 8 }}>
                      <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>Productivity Rhythm</h3>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Tailor the task & hydration engine to your style</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div className="auth-input-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Work Style</label>
                        <select name="productivityStyle" className="form-select" value={formData.productivityStyle} onChange={handleInputChange}>
                          <option value="Deep Work">Deep Work (Pomodoro)</option>
                          <option value="Multitasker">Agile Sprints</option>
                          <option value="Disciplined">Strict Time Blocking</option>
                          <option value="Creative">Free Flow Focus</option>
                        </select>
                      </div>
                      <div className="auth-input-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Daily Water (L)</label>
                        <input type="number" step="0.1" name="waterGoal" className="form-input" placeholder="2.5" value={formData.waterGoal} onChange={handleInputChange} />
                      </div>
                    </div>

                    <div className="auth-input-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Mission Statement / Bio (Optional)</label>
                      <textarea name="bio" className="form-input" style={{ height: 70, resize: 'none', padding: '10px 12px' }} placeholder="What are your high-priority goals this quarter?" value={formData.bio} onChange={handleInputChange} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                {onboardingStep > 1 && (
                  <button onClick={() => setOnboardingStep(s => s - 1)} className="btn btn-secondary" style={{ flex: 1 }}>
                    Back
                  </button>
                )}
                <button 
                  onClick={onboardingStep < 3 ? () => setOnboardingStep(s => s + 1) : () => handleFinalize(false)} 
                  className="btn btn-primary" style={{ flex: 2 }}
                >
                  {onboardingStep < 3 ? <>Next Phase <ArrowRight size={16}/></> : <>Complete Setup <ShieldCheck size={16}/></>}
                </button>
              </div>
            </motion.div>
          )}

          {/* STAGE: FINALIZING */}
          {stage === 'finalizing' && (
            <motion.div key="finalizing" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="auth-card" style={{ textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', padding: '40px 32px', boxShadow: 'var(--shadow-lg)' }}>
              <div style={{ width: 80, height: 80, margin: '0 auto 24px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  style={{ position: 'absolute', inset: 0, border: '3px solid rgba(99,102,241,0.15)', borderTop: '3px solid var(--accent-primary)', borderRadius: '50%' }}
                />
                <ShieldCheck size={36} color="var(--accent-primary)" />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>Configuring Workspace</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.6 }}>
                Initializing local encrypted database and tuning your productivity engine...
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
