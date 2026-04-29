import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network } from 'lucide-react';

export default function PatternMatchingStep({ executionTrace = [], queryNotes = [] }) {
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

      <div className="w-full max-w-3xl glass-panel p-8 rounded-2xl border border-white/5 relative overflow-hidden flex flex-col items-center gap-10" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)' }}>
        
        {/* Interval Array Scanner Window */}
        <div className="flex gap-4 relative min-h-[90px] items-end pb-4">
          <AnimatePresence mode="popLayout">
            {visibleTrace.map((t, idx) => {
              const globalIdx = startIdx + idx;
              const isCurrent = globalIdx === traceStep;
              const note1 = queryNotes[globalIdx] || '?';
              const note2 = queryNotes[globalIdx + 1] || '?';
              
              return (
                <motion.div
                  layout
                  key={`interval-${globalIdx}`}
                  initial={{ opacity: 0, scale: 0.8, x: 20 }}
                  animate={{ opacity: 1, scale: isCurrent ? 1.1 : 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: -20 }}
                  className="flex flex-col items-center gap-2"
                >
                  {/* Musical Note Visualization */}
                  <div className={`text-[10px] font-mono whitespace-nowrap flex items-center gap-1 transition-colors duration-300 ${isCurrent ? 'text-[#00ffcc]' : 'text-white/40'}`}>
                    <span>{note1}</span>
                    <span className="opacity-50">→</span>
                    <span>{note2}</span>
                  </div>
                  
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-mono transition-colors duration-300 relative ${
                      isCurrent 
                        ? 'bg-[#00ffcc]/10 text-[#00ffcc] border border-[#00ffcc]/50 shadow-[0_0_15px_rgba(0,255,204,0.3)] z-10' 
                        : 'bg-white/5 text-white/50 border border-white/10'
                    }`}
                  >
                    {t.symbol > 0 ? `+${t.symbol}` : t.symbol}
                    
                    {/* Active Audio Waveform Indicator */}
                    {isCurrent && (
                      <div className="absolute -bottom-5 flex items-center justify-center gap-[2px] h-3">
                        {[1, 2, 3, 4].map((bar) => (
                          <motion.div 
                            key={`bar-${bar}`}
                            className="w-[3px] bg-[#00ffcc] rounded-full"
                            animate={{ height: ['3px', '10px', '3px'] }}
                            transition={{ duration: 0.5, repeat: Infinity, delay: bar * 0.1, ease: 'easeInOut' }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* DFA Linear Path for the visible window */}
        <div className="relative w-full max-w-[600px] h-[80px] flex items-center justify-between px-4 mt-4">
          {/* Background edge with animated flowing glow */}
          <div className="absolute top-1/2 left-[30px] right-[30px] h-[2px] bg-white/10 -translate-y-1/2 overflow-hidden">
            <motion.div 
              className="w-1/3 h-full bg-gradient-to-r from-transparent via-[#00ffcc] to-transparent opacity-50"
              animate={{ x: ['-100%', '300%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          </div>
          
          {visibleTrace.map((t, idx) => {
            const globalIdx = startIdx + idx;
            const isPassed = globalIdx <= traceStep;
            const isActiveNode = globalIdx === traceStep;
            
            // Random floating animation for nodes
            const floatY = Math.sin(globalIdx) * 5;
            const floatX = Math.cos(globalIdx) * 3;
            
            return (
              <div key={`node-${globalIdx}`} className="relative z-10 flex flex-col items-center gap-2">
                <motion.div 
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-sm font-mono font-bold transition-all duration-300 ${
                    isActiveNode 
                      ? (t.usedFailure ? 'bg-[#0a0a0f] border border-red-500 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'bg-[#0a0a0f] border border-[#00ffcc] text-[#00ffcc] shadow-[0_0_20px_rgba(0,255,204,0.5)]')
                      : isPassed 
                        ? 'bg-[#0a0a0f] border border-[#00ffcc]/30 text-[#00ffcc]/50' 
                        : 'bg-[#0a0a0f] border border-white/10 text-white/30'
                  }`}
                  animate={{ 
                    y: isActiveNode && !t.usedFailure ? [0, -5, 0] : [floatY, -floatY, floatY],
                    x: isActiveNode ? 0 : [floatX, -floatX, floatX],
                    scale: isActiveNode && !t.usedFailure ? [1, 1.15, 1] : 1
                  }}
                  transition={{ 
                    duration: isActiveNode ? 0.4 : 3 + (globalIdx % 2), 
                    repeat: isActiveNode ? 0 : Infinity,
                    ease: "easeInOut"
                  }}
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
            className={`text-sm font-mono ${currentStepData.usedFailure ? 'text-red-500' : 'text-[#00ffcc]/80'}`}
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
