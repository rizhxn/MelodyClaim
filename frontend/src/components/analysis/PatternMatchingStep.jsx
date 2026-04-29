import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network } from 'lucide-react';

export default function PatternMatchingStep({ executionTrace = [] }) {
  const [traceStep, setTraceStep] = useState(0);

  useEffect(() => {
    if (executionTrace.length === 0) return;
    
    // Animate through the trace
    const interval = setInterval(() => {
      setTraceStep(prev => {
        if (prev < executionTrace.length - 1) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 300); // 300ms per node traversal for a faster, brief display
    
    return () => clearInterval(interval);
  }, [executionTrace.length]);

  const WINDOW_SIZE = 6;
  const startIdx = Math.max(0, traceStep - Math.floor(WINDOW_SIZE / 2));
  const visibleTrace = executionTrace.slice(startIdx, startIdx + WINDOW_SIZE);
  
  const currentStepData = executionTrace[traceStep] || { symbol: 0, fromState: 0, toState: 0, usedFailure: false };

  return (
    <motion.div 
      initial={{ opacity: 0, filter: 'blur(10px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, filter: 'blur(10px)' }}
      transition={{ duration: 0.8 }}
      className="w-full h-full flex flex-col items-center justify-center space-y-12"
    >
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-3 flex items-center justify-center gap-3">
          <Network className="w-8 h-8 text-emerald-400" />
          Step 3: Pattern Matching
        </h2>
        <p className="text-white/60 text-sm font-medium px-4 py-1.5 rounded-full bg-white/5 border border-white/10 inline-flex">
          Aho-Corasick Automaton Search
        </p>
      </div>

      <div className="w-full max-w-3xl glass-panel p-8 rounded-2xl border border-white/10 relative overflow-hidden bg-black/20 flex flex-col items-center gap-10">
        
        {/* Interval Array Scanner Window */}
        <div className="flex gap-2 relative h-16 items-center">
          <AnimatePresence mode="popLayout">
            {visibleTrace.map((t, idx) => {
              const globalIdx = startIdx + idx;
              const isCurrent = globalIdx === traceStep;
              
              return (
                <motion.div
                  layout
                  key={`interval-${globalIdx}`}
                  initial={{ opacity: 0, scale: 0.8, x: 20 }}
                  animate={{ opacity: 1, scale: isCurrent ? 1.1 : 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: -20 }}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-mono transition-colors duration-300 ${
                    isCurrent 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] z-10' 
                      : 'bg-white/5 text-white/50 border border-white/10'
                  }`}
                >
                  {t.symbol > 0 ? `+${t.symbol}` : t.symbol}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* DFA Linear Path for the visible window */}
        <div className="relative w-full max-w-[500px] h-[60px] flex items-center justify-between px-4">
          <div className="absolute top-1/2 left-[20px] right-[20px] h-[2px] bg-white/10 -translate-y-1/2"></div>
          
          {visibleTrace.map((t, idx) => {
            const globalIdx = startIdx + idx;
            const isPassed = globalIdx <= traceStep;
            const isActiveNode = globalIdx === traceStep;
            
            return (
              <div key={`node-${globalIdx}`} className="relative z-10 flex flex-col items-center gap-2">
                <motion.div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-mono font-bold transition-colors duration-300 ${
                    isActiveNode 
                      ? (t.usedFailure ? 'bg-[#0A0A0A] border-2 border-red-400 text-red-400 shadow-[0_0_20px_rgba(248,113,113,0.5)]' : 'bg-[#0A0A0A] border-2 border-emerald-400 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)]')
                      : isPassed 
                        ? 'bg-[#0A0A0A] border-2 border-emerald-400/30 text-emerald-400/50' 
                        : 'bg-[#0A0A0A] border-2 border-white/10 text-white/30'
                  }`}
                  animate={isActiveNode && !t.usedFailure ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  q{t.toState}
                </motion.div>
              </div>
            );
          })}
        </div>
        
        {/* Live Status Text */}
        <div className="h-6 flex items-center justify-center">
          <motion.div 
            key={traceStep}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-sm font-mono ${currentStepData.usedFailure ? 'text-red-400' : 'text-emerald-400/80'}`}
          >
            {currentStepData.usedFailure 
              ? `Mismatch on interval ${currentStepData.symbol}. Used failure link to fallback state.` 
              : `Matched interval ${currentStepData.symbol}. Transition q${currentStepData.fromState} → q${currentStepData.toState}`}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
