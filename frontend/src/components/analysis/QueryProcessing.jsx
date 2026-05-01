import { motion, AnimatePresence } from 'framer-motion';

export default function QueryProcessing({ executionTrace, traceStep, isActive, queryNotes = [], compact = false }) {
  if (!isActive || !executionTrace || executionTrace.length === 0) {
    return <div className="text-white/20 text-xs text-center">Waiting for DFA construction...</div>;
  }

  // To prevent the UI from stretching infinitely, we only show a window of ~6 intervals around the current step
  const WINDOW_SIZE = 6;
  const startIdx = Math.max(0, traceStep - Math.floor(WINDOW_SIZE / 2));
  const visibleTrace = executionTrace.slice(startIdx, startIdx + WINDOW_SIZE);
  
  const currentStepData = executionTrace[traceStep] || executionTrace[executionTrace.length - 1];

  return (
    <div className={`w-full h-full flex flex-col items-center justify-center relative overflow-hidden ${compact ? 'gap-8' : 'gap-14'}`}>
      
      {/* Interval Array Scanner Window */}
      <div className={`flex relative items-end pb-4 ${compact ? 'gap-3 min-h-[96px]' : 'gap-5 min-h-[110px]'}`}>
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
                  className={`${compact ? 'w-12 h-12' : 'w-14 h-14'} rounded-xl flex items-center justify-center ${compact ? 'text-sm' : 'text-base'} font-mono transition-colors duration-300 relative ${
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
      <div className={`relative w-full ${compact ? 'max-w-[360px] h-[70px]' : 'max-w-[620px] h-[90px]'} flex items-center justify-between px-4 mt-4`}>
        
        {/* Background edges with flowing glow */}
        <div className="absolute top-1/2 left-[20px] right-[20px] h-[2px] bg-white/10 -translate-y-1/2 overflow-hidden">
          <motion.div 
            className="w-1/3 h-full bg-gradient-to-r from-transparent via-[#00ffcc] to-transparent opacity-50"
            animate={{ x: ['-100%', '300%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        </div>
        
        {/* Nodes */}
        {visibleTrace.map((t, idx) => {
          const globalIdx = startIdx + idx;
          const isPassed = globalIdx <= traceStep;
          const isActiveNode = globalIdx === traceStep;
          
          // Random floating animation
          const floatY = Math.sin(globalIdx) * 5;
          const floatX = Math.cos(globalIdx) * 3;
          
          return (
            <div key={`node-${globalIdx}`} className="relative z-10 flex flex-col items-center gap-2">
              <motion.div 
                className={`${compact ? 'w-12 h-12 text-xs' : 'w-16 h-16 text-sm'} rounded-full flex items-center justify-center font-mono font-bold transition-all duration-300 ${
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
      <div className={`absolute bottom-2 ${compact ? 'text-[11px] px-4 text-center' : 'text-sm'} font-mono`}>
        <motion.div 
          key={traceStep}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={currentStepData.usedFailure ? 'text-red-500' : 'text-[#00ffcc]/80'}
        >
          {currentStepData.usedFailure 
            ? `Mismatch on interval ${currentStepData.symbol}. Using failure link.` 
            : `Match on interval ${currentStepData.symbol}. Transition q${currentStepData.fromState} → q${currentStepData.toState}`}
        </motion.div>
      </div>
    </div>
  );
}
