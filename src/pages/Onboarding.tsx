import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { ArrowRight, Loader2 } from 'lucide-react';

export function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    education: '',
    interests: '',
    currentSkills: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        education: formData.education,
        interests: formData.interests.split(',').map(i => i.trim()),
        currentSkills: formData.currentSkills.split(',').map(s => s.trim()),
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
    <div className="min-h-screen bg-app-base text-[#1D1D1F] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md glass-card p-10 z-10"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-[#1D1D1F] mb-3">Welcome to CareerBridge</h1>
          <p className="text-[#86868B] text-sm font-light">Let's set up your profile to personalize your experience.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#1D1D1F] mb-2">Education Level</label>
            <input 
              required
              type="text" 
              placeholder="e.g. B.S. in Computer Science"
              className="glass-input"
              value={formData.education}
              onChange={e => setFormData({...formData, education: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1D1D1F] mb-2">Current Skills (comma separated)</label>
            <input 
              required
              type="text" 
              placeholder="e.g. Python, React, Communication"
              className="glass-input"
              value={formData.currentSkills}
              onChange={e => setFormData({...formData, currentSkills: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1D1D1F] mb-2">Interests (comma separated)</label>
            <input 
              required
              type="text" 
              placeholder="e.g. AI, Web Development, Design"
              className="glass-input"
              value={formData.interests}
              onChange={e => setFormData({...formData, interests: e.target.value})}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full mt-4"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Complete Setup'}
            {!loading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
