import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle } from '../firebase';
import { motion } from 'motion/react';
import {
  ArrowRight, Sparkles, BookOpen, FileText, Target,
  TrendingUp, Play, CheckCircle, Users, Zap, Star
} from 'lucide-react';

const FEATURES = [
  {
    icon: Sparkles,
    title: 'AI Career Roadmaps',
    desc: 'Get a personalized month-by-month, day-by-day learning plan tailored to your goals, schedule, and current skill level.',
    color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100'
  },
  {
    icon: BookOpen,
    title: 'Video Learning Hub',
    desc: 'AI-matched YouTube tutorials for every topic. Track progress, resume where you left off, build streaks.',
    color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-100'
  },
  {
    icon: FileText,
    title: 'AI Resume Tailor',
    desc: 'Paste any job description and AI rewrites your resume bullets to match — 5 gorgeous templates, export to PDF.',
    color: 'text-violet-500', bg: 'bg-violet-50', border: 'border-violet-100'
  },
  {
    icon: Target,
    title: 'Skill Gap Analysis',
    desc: 'Instantly see exactly which skills you\'re missing for your target role and get a roadmap to close them.',
    color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100'
  },
  {
    icon: TrendingUp,
    title: 'Progress Tracking',
    desc: 'Daily task checkboxes, completion percentages, learning streaks — stay accountable and motivated every day.',
    color: 'text-pink-500', bg: 'bg-pink-50', border: 'border-pink-100'
  },
  {
    icon: Zap,
    title: 'Instant Course Creation',
    desc: 'One click converts your AI roadmap into a full structured video course with curated tutorials per topic.',
    color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100'
  },
];

const STATS = [
  { value: '50+', label: 'Career Paths' },
  { value: '10K+', label: 'Learning Topics' },
  { value: '5', label: 'Resume Templates' },
  { value: '100%', label: 'AI-Powered' },
];

const TESTIMONIALS = [
  { name: 'Priya M.', role: 'Now a React Developer', text: 'CareerBridge built my entire roadmap in seconds. Landed my first dev job within 4 months of following the plan.', stars: 5 },
  { name: 'Arjun K.', role: 'Data Science Intern', text: 'The AI resume tailor completely rewrote my experience section for a data science role. Got 3 callbacks in a week!', stars: 5 },
  { name: 'Sneha R.', role: 'UX Designer', text: 'The daily plan feature is insane. I know exactly what to do every single day. My skills improved faster than any bootcamp.', stars: 5 },
];

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
    <div className="min-h-screen bg-[#FAFAFA] text-[#1C1C1E] overflow-x-hidden">

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-[17px] font-bold tracking-tight">CareerBridge</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogin}
              disabled={loading}
              className="text-sm font-medium text-[#8E8E93] hover:text-[#1C1C1E] transition-colors px-4 py-2"
            >
              Sign In
            </button>
            <button
              onClick={handleLogin}
              disabled={loading}
              className="btn-primary text-sm px-5 py-2.5"
            >
              {loading ? 'Connecting…' : 'Get Started Free'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative pt-24 pb-32 px-6 overflow-hidden">
        {/* Background blobs */}
        <div className="hero-blob w-[600px] h-[600px] bg-blue-400 -top-64 -left-32" />
        <div className="hero-blob w-[500px] h-[500px] bg-violet-400 -top-32 -right-16" />
        <div className="hero-blob w-[400px] h-[400px] bg-green-400 top-1/2 left-1/2 -translate-x-1/2" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16,1,0.3,1] }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-black/8 shadow-sm text-sm font-medium text-[#8E8E93] mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            AI-powered career growth platform
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08, ease: [0.16,1,0.3,1] }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6"
          >
            Your career,{' '}
            <span className="gradient-text">planned by AI</span>
            <br />day by day.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16, ease: [0.16,1,0.3,1] }}
            className="text-xl text-[#8E8E93] max-w-2xl mx-auto leading-relaxed mb-10 font-light"
          >
            Tell us your target role and how much time you have.
            We'll build a personalized daily roadmap, find the best tutorials,
            and tailor your resume — all powered by Gemini AI.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24, ease: [0.16,1,0.3,1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={handleLogin}
              disabled={loading}
              className="btn-primary text-base px-8 py-4 shadow-xl shadow-black/10 min-w-[220px]"
            >
              {loading ? 'Connecting…' : 'Start for Free'}
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              className="flex items-center gap-2 text-sm font-semibold text-[#8E8E93] hover:text-[#1C1C1E] transition-colors px-6 py-4"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Play className="w-4 h-4" /> See how it works
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex items-center justify-center gap-6 mt-10 text-sm text-[#8E8E93]"
          >
            {['No credit card required', 'Google Sign-in only', 'Free forever'].map((t, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-500" />{t}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── STATS STRIP ─────────────────────────────────────────────────── */}
      <section className="bg-white border-y border-black/5 py-8">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="text-center"
            >
              <p className="text-3xl font-extrabold text-[#1C1C1E] tracking-tight">{s.value}</p>
              <p className="text-sm text-[#8E8E93] mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4"
            >
              Everything you need to<br />
              <span className="gradient-text">land your dream job</span>
            </motion.h2>
            <p className="text-lg text-[#8E8E93] max-w-xl mx-auto">
              One platform. AI roadmaps, video learning, resume builder — all in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.07 }}
                  className={`glass-card p-7 border ${f.border}`}
                >
                  <div className={`w-12 h-12 rounded-2xl ${f.bg} flex items-center justify-center mb-5`}>
                    <Icon className={`w-6 h-6 ${f.color}`} />
                  </div>
                  <h3 className="text-lg font-bold text-[#1C1C1E] mb-2">{f.title}</h3>
                  <p className="text-sm text-[#8E8E93] leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-white border-y border-black/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold tracking-tight mb-4">How it works</h2>
            <p className="text-lg text-[#8E8E93]">Up and running in under 2 minutes.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Tell us your goal', desc: 'Enter your target role, current skills, and how many hours per day you can study.' },
              { step: '02', title: 'Get your AI roadmap', desc: 'Gemini AI builds a full 3-month daily plan with curated YouTube tutorials for every task.' },
              { step: '03', title: 'Track & improve', desc: 'Check off daily tasks, watch progress build up, tailor your resume, and land the job.' },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="relative"
              >
                <div className="text-6xl font-black text-black/5 mb-4 leading-none">{s.step}</div>
                <h3 className="text-xl font-bold text-[#1C1C1E] mb-2">{s.title}</h3>
                <p className="text-[#8E8E93] leading-relaxed text-sm">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-extrabold tracking-tight mb-4">Loved by learners</h2>
            <div className="flex items-center justify-center gap-1 text-amber-400 mb-2">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
            </div>
            <p className="text-[#8E8E93]">Real results from real people.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass-card p-7"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.stars)].map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-sm text-[#1C1C1E] leading-relaxed mb-5 italic">"{t.text}"</p>
                <div>
                  <p className="font-bold text-sm text-[#1C1C1E]">{t.name}</p>
                  <p className="text-xs text-green-500 font-medium mt-0.5">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-card p-14 relative overflow-hidden"
          >
            <div className="hero-blob w-80 h-80 bg-blue-300 -bottom-20 -right-20 opacity-20" />
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-4xl font-extrabold tracking-tight mb-4">Start building your career today</h2>
              <p className="text-[#8E8E93] mb-8 leading-relaxed">
                Free. No credit card. Just sign in with Google and get your AI roadmap in under 30 seconds.
              </p>
              <button onClick={handleLogin} disabled={loading} className="btn-primary text-base px-10 py-4 shadow-xl shadow-black/10">
                {loading ? 'Connecting…' : 'Get Started Free'} <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-black/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold">CareerBridge</span>
          </div>
          <p className="text-xs text-[#8E8E93]">
            Built with Gemini AI · Firebase · React · © {new Date().getFullYear()} CareerBridge
          </p>
          <div className="flex items-center gap-1 text-xs text-[#8E8E93]">
            <Users className="w-3.5 h-3.5" />
            Made for ambitious learners everywhere
          </div>
        </div>
      </footer>
    </div>
  );
}
