import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Home, Compass, ArrowLeft, Sparkles } from 'lucide-react';

export function NotFound() {
  return (
    <div className="min-h-screen bg-[#F2F2F7] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Blobs */}
      <div className="hero-blob w-96 h-96 bg-blue-300 -top-48 -left-24 opacity-30" />
      <div className="hero-blob w-80 h-80 bg-violet-300 -bottom-16 -right-16 opacity-25" />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="text-center relative z-10 max-w-lg"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-[#1C1C1E]">CareerBridge</span>
        </div>

        {/* 404 display */}
        <div className="text-[120px] font-black text-black/5 leading-none select-none mb-4">
          404
        </div>

        <h1 className="text-3xl font-extrabold text-[#1C1C1E] mb-3 tracking-tight">
          Page not found
        </h1>
        <p className="text-[#8E8E93] text-lg mb-10 leading-relaxed">
          Looks like this page doesn't exist. But your career is still on track!
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/dashboard" className="btn-primary px-8 py-3 text-sm">
            <Home className="w-4 h-4" /> Go to Dashboard
          </Link>
          <Link to="/career-guide" className="btn-secondary px-8 py-3 text-sm">
            <Compass className="w-4 h-4" /> View Career Guide
          </Link>
        </div>

        <button onClick={() => window.history.back()} className="mt-6 flex items-center gap-2 text-sm text-[#8E8E93] hover:text-[#1C1C1E] transition-colors mx-auto">
          <ArrowLeft className="w-4 h-4" /> Go back
        </button>
      </motion.div>
    </div>
  );
}
