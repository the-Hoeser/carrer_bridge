import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { ArrowRight, Loader2, Sparkles, Code, Database, Palette, Briefcase, GraduationCap } from 'lucide-react';

const INTEREST_OPTIONS = [
  { label: 'Web Dev', icon: '🌐' }, { label: 'AI / ML', icon: '🤖' },
  { label: 'Data Science', icon: '📊' }, { label: 'Mobile', icon: '📱' },
  { label: 'Design', icon: '🎨' }, { label: 'DevOps', icon: '⚙️' },
  { label: 'Cybersecurity', icon: '🔒' }, { label: 'Freelancing', icon: '💼' },
  { label: 'Game Dev', icon: '🎮' }, { label: 'Blockchain', icon: '⛓️' },
  { label: 'Cloud', icon: '☁️' }, { label: 'Startups', icon: '🚀' },
];

const EDU_OPTIONS = [
  'High School', 'Bachelor\'s (pursuing)', 'Bachelor\'s (completed)',
  'Master\'s (pursuing)', 'Master\'s (completed)', 'Self-taught', 'Bootcamp graduate'
];

const STEPS = ['Education', 'Interests', 'Skills'];

export function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    education: '',
    interests: [] as string[],
    currentSkills: ''
  });

  const toggleInterest = (label: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(label)
        ? prev.interests.filter(i => i !== label)
        : [...prev.interests, label]
    }));
  };

  const canNext = () => {
    if (step === 0) return formData.education !== '';
    if (step === 1) return formData.interests.length > 0;
    return formData.currentSkills.trim().length > 0;
  };

  const handleNext = () => {
    if (step < 2) { setStep(s => s + 1); return; }
    handleSubmit();
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
        await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        education: formData.education,
        interests: formData.interests,
        currentSkills: formData.currentSkills.split(',').map(s => s.trim()).filter(Boolean),
        streak: 1,
        lastActiveDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        createdAt: new Date().toISOString()
      });
      navigate('/dashboard');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* BG blobs */}
      <div className="hero-blob w-96 h-96 bg-blue-300 -top-48 -left-24" />
      <div className="hero-blob w-80 h-80 bg-violet-300 -bottom-24 -right-16" />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-200">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-[#1C1C1E]">CareerBridge</span>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            {STEPS.map((s, i) => (
              <React.Fragment key={s}>
                <div className="flex items-center gap-1.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    i < step ? 'bg-green-500 text-white' : i === step ? 'bg-blue-500 text-white' : 'bg-black/8 text-[#8E8E93]'
                  }`}>
                    {i < step ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block transition-colors ${i === step ? 'text-[#1C1C1E]' : 'text-[#8E8E93]'}`}>{s}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 rounded-full transition-all duration-500 ${i < step ? 'bg-green-400' : 'bg-black/8'}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step 0 — Education */}
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}>
              <div className="text-center mb-7">
                <div className="text-4xl mb-3">🎓</div>
                <h2 className="text-2xl font-extrabold text-[#1C1C1E]">What's your education?</h2>
                <p className="text-sm text-[#8E8E93] mt-1">So we can tailor your roadmap difficulty</p>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {EDU_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setFormData(f => ({ ...f, education: opt }))}
                    className={`py-3 px-4 rounded-xl text-sm font-medium text-left transition-all border ${
                      formData.education === opt
                        ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                        : 'bg-[#F9F9F9] border-black/5 text-[#1C1C1E] hover:border-black/15'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Or type your own (e.g. MCA, Diploma)…"
                className="glass-input mt-3 text-sm"
                value={EDU_OPTIONS.includes(formData.education) ? '' : formData.education}
                onChange={e => setFormData(f => ({ ...f, education: e.target.value }))}
              />
            </motion.div>
          )}

          {/* Step 1 — Interests */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}>
              <div className="text-center mb-7">
                <div className="text-4xl mb-3">✨</div>
                <h2 className="text-2xl font-extrabold text-[#1C1C1E]">What excites you?</h2>
                <p className="text-sm text-[#8E8E93] mt-1">Pick all that apply — we'll use this to personalize your roadmap</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {INTEREST_OPTIONS.map(({ label, icon }) => {
                  const selected = formData.interests.includes(label);
                  return (
                    <button
                      key={label}
                      onClick={() => toggleInterest(label)}
                      className={`py-3 px-3 rounded-xl text-sm font-medium flex items-center gap-2 transition-all border ${
                        selected
                          ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                          : 'bg-[#F9F9F9] border-black/5 text-[#1C1C1E] hover:border-black/15'
                      }`}
                    >
                      <span>{icon}</span>{label}
                    </button>
                  );
                })}
              </div>
              {formData.interests.length > 0 && (
                <p className="text-xs text-green-500 font-medium text-center mt-3">
                  {formData.interests.length} selected ✓
                </p>
              )}
            </motion.div>
          )}

          {/* Step 2 — Skills */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}>
              <div className="text-center mb-7">
                <div className="text-4xl mb-3">💡</div>
                <h2 className="text-2xl font-extrabold text-[#1C1C1E]">What can you do today?</h2>
                <p className="text-sm text-[#8E8E93] mt-1">List your current skills — even basic ones count!</p>
              </div>
              <textarea
                rows={4}
                placeholder="e.g. HTML, CSS, a bit of Python, Excel, basic JavaScript…"
                className="glass-input resize-none text-sm leading-relaxed"
                value={formData.currentSkills}
                onChange={e => setFormData(f => ({ ...f, currentSkills: e.target.value }))}
              />
              <p className="text-xs text-[#8E8E93] mt-2">Comma-separated. Don't worry about formatting — just list what you know.</p>
            </motion.div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 gap-3">
            {step > 0 ? (
              <button onClick={() => setStep(s => s - 1)} className="btn-secondary py-3 px-5 text-sm">
                ← Back
              </button>
            ) : <div />}
            <button
              onClick={handleNext}
              disabled={!canNext() || loading}
              className="btn-primary py-3 px-6 text-sm flex-1 max-w-[200px]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {step === 2 ? (loading ? 'Setting up…' : 'Launch CareerBridge') : 'Continue'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-[#8E8E93] mt-4">
          Welcome, {user?.displayName?.split(' ')[0] || 'there'} 👋  Let's build your future.
        </p>
      </motion.div>
    </div>
  );
}
