import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle } from '../firebase';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles, BookOpen, FileText } from 'lucide-react';

export function Landing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-app-base text-[#1D1D1F] flex flex-col items-center justify-center p-4 overflow-hidden relative">
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="z-10 max-w-4xl text-center space-y-12"
      >
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white text-[#86868B] text-sm font-medium border border-black/5 shadow-sm">
          <Sparkles className="w-4 h-4 text-accent-blue opacity-80" />
          <span>AI-Powered Career Growth</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
          Bridge the gap between <br/>
          <span className="text-accent-blue">
            education and career
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-[#86868B] max-w-2xl mx-auto font-light leading-relaxed">
          Get personalized skill roadmaps, track your learning progress, and build ATS-friendly resumes with the power of AI.
        </p>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleLogin}
            disabled={loading}
            className="btn-primary text-lg px-8 py-4"
          >
            {loading ? 'Connecting...' : 'Continue with Google'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <div className="pt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {[
            { icon: Sparkles, title: 'AI Roadmaps', desc: 'Personalized learning paths based on your goals.' },
            { icon: BookOpen, title: 'Skill Building', desc: 'Curated courses for coding and life skills.' },
            { icon: FileText, title: 'Resume Builder', desc: 'Generate ATS-optimized resumes instantly.' },
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="glass-card p-8"
            >
              <div className="w-12 h-12 rounded-xl bg-[#F5F5F7] flex items-center justify-center mb-6">
                <feature.icon className="w-6 h-6 text-accent-blue" />
              </div>
              <h3 className="text-lg font-medium text-[#1D1D1F] mb-2">{feature.title}</h3>
              <p className="text-sm text-[#86868B] leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
