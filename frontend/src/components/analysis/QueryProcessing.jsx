import { motion } from 'framer-motion';

export default function QueryProcessing({ executionTrace, traceStep, isActive }) {
  if (!isActive || !executionTrace || executionTrace.length === 0) {
    return <div className="text-white/20 text-xs text-center">Waiting for DFA construction...</div>;
  }

  // To prevent the UI from stretching infinitely, we only show a window of ~6 intervals around the current step
  const WINDOW_SIZE = 6;
  const startIdx = Math.max(0, traceStep - Math.floor(WINDOW_SIZE / 2));
  const visibleTrace = executionTrace.slice(startIdx, startIdx + WINDOW_SIZE);
  
  const currentStepData = executionTrace[traceStep] || executionTrace[executionTrace.length - 1];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-12 relative overflow-hidden">
      
      {/* Interval Array Scanner Window */}
      <div className="flex gap-2 relative">
        {visibleTrace.map((t, idx) => {
          const globalIdx = startIdx + idx;
          const isCurrent = globalIdx === traceStep;
          
          return (
            <div
              key={`interval-${globalIdx}`}
              className={`w-12 h-12 rounded flex items-center justify-center text-sm font-mono transition-all duration-300 ${
                isCurrent 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-110 z-10' 
                  : 'bg-white/5 text-white/50 border border-white/10 scale-100'
              }`}
            >
              {t.symbol > 0 ? `+${t.symbol}` : t.symbol}
            </div>
          );
        })}
      </div>

      {/* DFA Linear Path for the visible window */}
      <div className="relative w-full max-w-[500px] h-[60px] flex items-center justify-between px-4">
        
        {/* Background edges */}
        <div className="absolute top-1/2 left-[20px] right-[20px] h-[2px] bg-white/10 -translate-y-1/2"></div>
        
        {/* Nodes */}
        {visibleTrace.map((t, idx) => {
          const globalIdx = startIdx + idx;
          const isPassed = globalIdx <= traceStep;
          const isActiveNode = globalIdx === traceStep;
          
          return (
            <div key={`node-${globalIdx}`} className="relative z-10 flex flex-col items-center gap-2">
              <motion.div 
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-mono transition-colors duration-300 ${
                  isActiveNode 
                    ? (t.usedFailure ? 'bg-[#0A0A0A] border-2 border-red-400 text-red-400 shadow-[0_0_20px_rgba(248,113,113,0.5)]' : 'bg-[#0A0A0A] border-2 border-emerald-400 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)]')
                    : isPassed 
                      ? 'bg-[#0A0A0A] border border-emerald-400/50 text-emerald-400/50' 
                      : 'bg-[#0A0A0A] border border-white/20 text-white/40'
                }`}
                animate={isActiveNode && !t.usedFailure ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                q{t.toState}
              </motion.div>
            </div>
          );
        })}
      </div>
      
      {/* Live Status Text */}
      <div className="absolute bottom-2 text-white/40 text-xs font-mono">
        {currentStepData.usedFailure 
          ? `Mismatch on interval ${currentStepData.symbol}. Using failure link.` 
          : `Match on interval ${currentStepData.symbol}. Transition q${currentStepData.fromState} -> q${currentStepData.toState}`}
      </div>
    </div>
  );
}
