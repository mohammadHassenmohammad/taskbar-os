import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogIn, UserPlus, Lock, Mail, ShieldCheck, ArrowLeft, ArrowRight, 
  RefreshCw, User, Calendar, Ruler, Weight, Target, Zap, Droplets, Info, Eye, EyeOff, CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Auth() {
  const [stage, setStage] = useState('welcome'); // welcome, login, signup, onboarding, finalizing
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    fullName: '',
    age: '',
    gender: 'Other',
    weight: '',
    height: '',
    fitnessGoal: 'General Health',
    productivityStyle: 'Deep Work',
    waterGoal: '2.5',
    bio: ''
  });

  const { login, signup, requestPasswordReset } = useStore();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const startOnboarding = () => {
    if (!formData.email || !formData.password || !formData.username) {
      return toast.error('Identity credentials incomplete.');
    }
    if (formData.password.length < 6) {
      return toast.error('Security code too short (min 6).');
    }
    setStage('onboarding');
  };

  const handleFinalize = async () => {
    setLoading(true);
    try {
      setStage('finalizing');
      
      const profileData = {
        username: formData.username,
        fullName: formData.fullName,
        age: parseInt(formData.age) || 0,
        gender: formData.gender,
        weight: parseFloat(formData.weight) || 0,
        height: parseFloat(formData.height) || 0,
        fitnessGoal: formData.fitnessGoal,
        productivityStyle: formData.productivityStyle,
        waterGoal: parseFloat(formData.waterGoal) || 2.5,
        bio: formData.bio
      };

      // Simulating a "real professional app" delay for effect
      await new Promise(r => setTimeout(r, 2000));
      
      await signup(formData.email, formData.password, profileData);
      toast.success('Protocol Initialized. Access Granted. ⚡');
    } catch (err) {
      console.error("Registration Phase Failure:", err);
      setStage('onboarding');
      toast.error(err.message || 'Identity Transmission Failed. Check your network or credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      toast.success('Access Authenticated. Welcome back.');
    } catch (err) {
      toast.error(err.message || 'Authentication rejected.');
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.3 } }
  };

  const stepVariants = {
    enter: { x: 50, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 }
  };

  return (
    <div className="auth-container">
      <div className="auth-bg">
        <div className="auth-mesh" />
      </div>
      
      <div className="auth-content-layer">
        <AnimatePresence mode="wait">
          {stage === 'welcome' && (
            <motion.div key="welcome" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="auth-card" style={{ textAlign: 'center' }}>
              <motion.div 
                animate={{ rotateY: [0, 360] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                style={{ 
                  width: 80, height: 80, borderRadius: 24, background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 30px',
                  boxShadow: '0 20px 40px rgba(99, 102, 241, 0.4)'
                }}
              >
                <ShieldCheck size={40} color="white" />
              </motion.div>
              <h1 style={{ fontSize: 32, fontWeight: 900, color: 'white', letterSpacing: '-1px' }}>TaskBar OS</h1>
              <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 10, fontSize: 15, lineHeight: 1.6 }}>
                The next-generation productivity environment for the elite. Validate your identity to continue.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 15, marginTop: 40 }}>
                <button onClick={() => setStage('signup')} className="auth-btn-primary">
                  <UserPlus size={20} /> Initialize New Profile
                </button>
                <button onClick={() => setStage('login')} className="auth-btn-ghost">
                  <LogIn size={20} /> Authenticate Existing Unit
                </button>
              </div>
            </motion.div>
          )}

          {stage === 'login' && (
            <motion.div key="login" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="auth-card">
              <button onClick={() => setStage('welcome')} className="btn btn-ghost btn-icon btn-sm" style={{ position: 'absolute', top: 20, left: 20 }}><ArrowLeft size={16}/></button>
              <div style={{ textAlign: 'center', marginBottom: 35 }}>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: 'white' }}>Identity Validation</h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>Enter secure credentials to enter the system.</p>
              </div>
              <form onSubmit={handleLogin}>
                <div className="auth-input-group">
                  <label>Email Protocol</label>
                  <Mail className="icon" size={18} />
                  <input type="email" name="email" required className="auth-input-field" placeholder="name@nexus.com" value={formData.email} onChange={handleInputChange} />
                </div>
                <div className="auth-input-group">
                  <label>Access Code</label>
                  <Lock className="icon" size={18} />
                  <input type={showPassword ? "text" : "password"} name="password" required className="auth-input-field" placeholder="••••••••" value={formData.password} onChange={handleInputChange} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 15, top: 38, background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer' }}>
                    {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>
                </div>
                <button type="submit" disabled={loading} className="auth-btn-primary" style={{ marginTop: 10 }}>
                  {loading ? <RefreshCw className="animate-spin" /> : <>Access System <Zap size={18}/></>}
                </button>
              </form>
            </motion.div>
          )}

          {stage === 'signup' && (
            <motion.div key="signup" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="auth-card">
              <button onClick={() => setStage('welcome')} className="btn btn-ghost btn-icon btn-sm" style={{ position: 'absolute', top: 20, left: 20 }}><ArrowLeft size={16}/></button>
              <div style={{ textAlign: 'center', marginBottom: 35 }}>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: 'white' }}>Profile Initialization</h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>Establish your identity within the TaskBar environment.</p>
              </div>
              <div className="auth-input-group">
                <label>Username</label>
                <User className="icon" size={18} />
                <input type="text" name="username" required className="auth-input-field" placeholder="agent_zero" value={formData.username} onChange={handleInputChange} />
              </div>
              <div className="auth-input-group">
                <label>Email Protocol</label>
                <Mail className="icon" size={18} />
                <input type="email" name="email" required className="auth-input-field" placeholder="name@nexus.com" value={formData.email} onChange={handleInputChange} />
              </div>
              <div className="auth-input-group">
                <label>Access Code</label>
                <Lock className="icon" size={18} />
                <input type="password" name="password" required className="auth-input-field" placeholder="Min. 6 characters" value={formData.password} onChange={handleInputChange} />
              </div>
              <button onClick={startOnboarding} className="auth-btn-primary" style={{ marginTop: 10 }}>
                Next Phase <ArrowRight size={18}/>
              </button>
            </motion.div>
          )}

          {stage === 'onboarding' && (
            <motion.div key="onboarding" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="auth-card" style={{ maxWidth: 520 }}>
              <div className="auth-step-indicator">
                {[1, 2, 3].map(i => <div key={i} className={`auth-step-dot ${onboardingStep >= i ? 'active' : ''}`} />)}
              </div>
              
              <AnimatePresence mode="wait">
                {onboardingStep === 1 && (
                  <motion.div key="step1" variants={stepVariants} initial="enter" animate="center" exit="exit" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 800, color: 'white', textAlign: 'center' }}>Who are you?</h3>
                    <div className="auth-input-group">
                      <label>Full Name</label>
                      <Info className="icon" size={18} />
                      <input type="text" name="fullName" required className="auth-input-field" placeholder="John Wick" value={formData.fullName} onChange={handleInputChange} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                      <div className="auth-input-group">
                        <label>Age</label>
                        <Calendar className="icon" size={18} />
                        <input type="number" name="age" className="auth-input-field" placeholder="25" value={formData.age} onChange={handleInputChange} />
                      </div>
                      <div className="auth-input-group">
                        <label>Gender</label>
                        <select name="gender" className="auth-input-field" style={{ paddingLeft: 15 }} value={formData.gender} onChange={handleInputChange}>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}

                {onboardingStep === 2 && (
                  <motion.div key="step2" variants={stepVariants} initial="enter" animate="center" exit="exit" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 800, color: 'white', textAlign: 'center' }}>Biometric Profile</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                      <div className="auth-input-group">
                        <label>Weight (kg)</label>
                        <Weight className="icon" size={18} />
                        <input type="number" name="weight" className="auth-input-field" placeholder="75" value={formData.weight} onChange={handleInputChange} />
                      </div>
                      <div className="auth-input-group">
                        <label>Height (cm)</label>
                        <Ruler className="icon" size={18} />
                        <input type="number" name="height" className="auth-input-field" placeholder="180" value={formData.height} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div className="auth-input-group">
                      <label>Mission Objective</label>
                      <Target className="icon" size={18} />
                      <select name="fitnessGoal" className="auth-input-field" value={formData.fitnessGoal} onChange={handleInputChange}>
                        <option value="Weight Loss">Weight Loss</option>
                        <option value="Muscle Gain">Muscle Gain</option>
                        <option value="Endurance">Endurance</option>
                        <option value="Mental Focus">Mental Focus</option>
                        <option value="General Health">General Health</option>
                      </select>
                    </div>
                  </motion.div>
                )}

                {onboardingStep === 3 && (
                  <motion.div key="step3" variants={stepVariants} initial="enter" animate="center" exit="exit" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 800, color: 'white', textAlign: 'center' }}>Operational Style</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                      <div className="auth-input-group">
                        <label>Workflow Style</label>
                        <Zap className="icon" size={18} />
                        <select name="productivityStyle" className="auth-input-field" value={formData.productivityStyle} onChange={handleInputChange}>
                          <option value="Deep Work">Deep Work</option>
                          <option value="Multitasker">Multitasker</option>
                          <option value="Creative">Creative</option>
                          <option value="Disciplined">Disciplined</option>
                        </select>
                      </div>
                      <div className="auth-input-group">
                        <label>Water Goal (L)</label>
                        <Droplets className="icon" size={18} />
                        <input type="number" step="0.1" name="waterGoal" className="auth-input-field" placeholder="2.5" value={formData.waterGoal} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div className="auth-input-group">
                      <label>Operative Bio (Optional)</label>
                      <textarea name="bio" className="auth-input-field" style={{ height: 80, padding: '12px 15px', resize: 'none' }} placeholder="Brief tactical summary..." value={formData.bio} onChange={handleInputChange} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ display: 'flex', gap: 15, marginTop: 30 }}>
                {onboardingStep > 1 && (
                  <button onClick={() => setOnboardingStep(s => s - 1)} className="auth-btn-ghost" style={{ flex: 1 }}>Back</button>
                )}
                <button 
                  onClick={onboardingStep < 3 ? () => setOnboardingStep(s => s + 1) : handleFinalize} 
                  className="auth-btn-primary" style={{ flex: 2 }}
                >
                  {onboardingStep < 3 ? <>Next Phase <ArrowRight size={18}/></> : <>Synchronize Profile <ShieldCheck size={18}/></>}
                </button>
              </div>
            </motion.div>
          )}

          {stage === 'finalizing' && (
            <motion.div key="finalizing" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="auth-card" style={{ textAlign: 'center', width: '100%', maxWidth: 440 }}>
              <div style={{ position: 'relative', width: 'clamp(80px, 20vw, 120px)', height: 'clamp(80px, 20vw, 120px)', margin: '0 auto 30px' }}>
                <motion.div 
                  animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  style={{ position: 'absolute', inset: 0, border: '4px solid rgba(255,255,255,0.05)', borderTop: '4px solid var(--accent-primary)', borderRadius: '50%' }}
                />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <RefreshCw size={36} color="var(--accent-primary)" className="animate-spin" />
                </div>
              </div>
              <h2 className="loader-title" style={{ fontSize: 24, fontWeight: 900, color: 'white' }}>Establishing Identity</h2>
              <p className="loader-subtitle" style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 10, lineHeight: 1.6 }}>
                Synchronizing your biometric data with the global Nexus...<br />Preparing your high-performance environment.
              </p>
              <div style={{ marginTop: 30, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['Encrypting access code...', 'Allocating neural storage...', 'Finalizing OS protocols...'].map((text, i) => (
                  <motion.div 
                    key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.6 }}
                    style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}
                  >
                    {text}
                  </motion.div>
                ))}
              </div>
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
