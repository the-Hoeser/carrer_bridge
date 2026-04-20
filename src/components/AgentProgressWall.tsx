import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Sparkles, CheckCircle2, Clock } from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AgentProgressWallProps {
  total: number;
  completed: number;
  title?: string;
  subtitle?: string;
}

export function AgentProgressWall({ 
  total = 50, 
  completed = 0,
  title = "Agent Workload",
  subtitle = "Constructing project architecture..."
}: AgentProgressWallProps) {
  const bricksPerRow = 10;
  const rows = Math.ceil(total / bricksPerRow);
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  // Prevent overflow
  const boundedCompleted = Math.min(completed, total);

  const renderBricks = () => {
    let bricks = [];
    for (let i = 0; i < total; i++) {
      const isCompleted = i < boundedCompleted;
      const row = Math.floor(i / bricksPerRow);
      
      // Calculate delay so bricks fall in sequence
      // We want newly completed bricks to fall quickly.
      // Easiest is just a staggered delay based on index.
      const delay = Math.min((i % bricksPerRow) * 0.05 + (row * 0.1), 1.5);

      bricks.push(
        <div key={i} className="relative w-10 h-5 mx-[2px] sm:w-14 sm:h-6 sm:mx-1">
          {/* Unfilled Outline Base */}
          <div className="absolute inset-0 rounded-[4px] border border-[#86868B]/20 bg-black/5" />
          
          {/* Animated Filled Brick */}
          <motion.div
            initial={false}
            animate={{ 
              opacity: isCompleted ? 1 : 0, 
              y: isCompleted ? 0 : -20, 
              scale: isCompleted ? 1 : 0.8,
            }}
            transition={{
              duration: 0.5,
              type: "spring",
              stiffness: 200,
              damping: 15
            }}
            className={cn(
              "absolute inset-0 rounded-[4px] shadow-sm",
              "bg-gradient-to-tr from-[#0066CC] to-[#5AC8FA]",
              "border border-white/20",
              isCompleted && "shadow-[0_0_10px_rgba(90,200,250,0.3)]"
            )}
          />
        </div>
      );
    }
    
    // Group bricks into rows
    let rowElements = [];
    for (let r = 0; r < rows; r++) {
      const rowBricks = bricks.slice(r * bricksPerRow, (r + 1) * bricksPerRow);
      // Determine offset for brick-laying pattern
      const isOddRow = r % 2 === 1;
      
      rowElements.push(
        <div 
          key={r} 
          className={cn(
            "flex justify-center mb-[4px] sm:mb-2",
            isOddRow ? "ml-5 sm:ml-8" : "" 
          )}
        >
          {rowBricks}
        </div>
      );
    }
    
    // Reverse so row 0 is at bottom
    return rowElements.reverse();
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-1 rounded-3xl bg-gradient-to-b from-white/60 to-white/20 backdrop-blur-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 relative overflow-hidden">
      
      {/* Glossy Top Highlight */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />
      
      <div className="p-6 sm:p-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0066CC]/10 text-[#0066CC] text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>LIVE PROGRESS</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F]">
              {title}
            </h3>
            <p className="text-[#86868B] font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {subtitle}
            </p>
          </div>
          
          <div className="text-left sm:text-right">
            <div className="flex items-baseline gap-1 sm:justify-end">
              <span className="text-4xl sm:text-5xl font-black text-[#1D1D1F] tracking-tighter">
                {percentage}
              </span>
              <span className="text-xl font-bold text-[#86868B]">%</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-sm font-medium text-[#86868B]">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>{boundedCompleted} of {total} tasks completed</span>
            </div>
          </div>
        </div>
        
        {/* Visualizer Area */}
        <div className="relative pt-12 pb-6 px-4 bg-white/40 rounded-2xl border border-black/5 shadow-inner flex flex-col items-center justify-end min-h-[320px] overflow-hidden">
          
          {/* Subtle grid background */}
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#000000 0.5px, transparent 0.5px)', backgroundSize: '16px 16px', opacity: 0.03 }}></div>
          
          {/* Glowing orb behind wall */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-[#5AC8FA]/20 blur-[60px] rounded-full pointer-events-none" />

          {/* Wall Container */}
          <div className="relative z-10 w-full flex flex-col items-center">
            {renderBricks()}
          </div>
          
          {/* Ground Line */}
          <div className="absolute bottom-0 inset-x-4 h-2 bg-gradient-to-t from-black/5 to-transparent rounded-t-full" />
        </div>
      </div>
    </div>
  );
}

// Simple wrapper component to demo the visualizer with auto-progress
export function AgentProgressWallDemo() {
  const [completed, setCompleted] = useState(0);
  const total = 45;

  useEffect(() => {
    // Simulate an agent doing work
    const interval = setInterval(() => {
      setCompleted(prev => {
        if (prev >= total) {
          clearInterval(interval);
          return total;
        }
        // Randomly skip updates sometimes to make it feel organic
        if (Math.random() > 0.3) {
          return prev + 1;
        }
        return prev;
      });
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full py-12">
      <AgentProgressWall 
        total={total} 
        completed={completed} 
        title="Agent Task Execution"
        subtitle="Assembling site sections..."
      />
      <div className="text-center mt-6">
        <button 
          onClick={() => setCompleted(0)}
          className="text-sm font-medium text-[#0066CC] hover:text-[#004499] transition-colors"
        >
          Restart Animation
        </button>
      </div>
    </div>
  );
}