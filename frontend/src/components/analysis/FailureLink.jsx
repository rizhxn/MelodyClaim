import { motion, AnimatePresence } from 'framer-motion';

export default function FailureLink({ executionTrace, traceStep, isActive }) {
  if (!isActive || !executionTrace || executionTrace.length === 0) {
    return <div className="text-white/20 text-xs text-center">Waiting for scan completion...</div>;
  }

  const currentStepData = executionTrace[traceStep] || executionTrace[executionTrace.length - 1];
  const isFailure = currentStepData.usedFailure;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
      <svg className="w-full max-w-[560px] h-[210px] overflow-visible" viewBox="0 0 560 210">
        
        {/* Normal Path representation */}
        <line x1="90" y1="90" x2="260" y2="90" stroke="rgba(255,255,255,0.13)" strokeWidth="3" strokeDasharray="5 6" />
        
        {/* Nodes */}
        <circle cx="90" cy="90" r="28" fill="#0a0a0f" stroke="rgba(255,255,255,0.2)" strokeWidth="2.5" />
        <text x="90" y="90" fill="rgba(255,255,255,0.4)" fontSize="15" textAnchor="middle" alignmentBaseline="middle">q?</text>

        {/* Failed State Node */}
        <circle 
          cx="260" cy="90" r="34" 
          fill="#0a0a0f" 
          stroke={isFailure ? "rgba(239,68,68,1)" : "rgba(255,255,255,0.2)"} 
          strokeWidth="2.5" 
          style={{ filter: isFailure ? 'drop-shadow(0 0 16px rgba(239,68,68,0.6))' : 'none' }}
        />
        <text x="260" y="90" fill={isFailure ? "rgba(239,68,68,1)" : "rgba(255,255,255,0.4)"} fontSize="17" textAnchor="middle" alignmentBaseline="middle" className="font-bold">
          q{currentStepData.fromState}
        </text>

        {/* Fallback Target Node */}
        <circle 
          cx="440" cy="90" r="34" 
          fill="#0a0a0f" 
          stroke={isFailure ? "rgba(239,68,68,1)" : "rgba(255,255,255,0.2)"} 
          strokeWidth="2.5" 
          style={{ filter: isFailure ? 'drop-shadow(0 0 16px rgba(239,68,68,0.6))' : 'none' }}
        />
        <text x="440" y="90" fill={isFailure ? "rgba(239,68,68,1)" : "rgba(255,255,255,0.4)"} fontSize="17" textAnchor="middle" alignmentBaseline="middle">
          q{currentStepData.toState}
        </text>

        {/* Failed attempt line */}
        <AnimatePresence>
          {isFailure && (
            <motion.line 
              initial={{ pathLength: 0, opacity: 1 }} 
              animate={{ pathLength: 1, opacity: 0 }} 
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              x1="260" y1="90" x2="340" y2="24" 
              stroke="rgba(239,68,68,1)" strokeWidth="4" 
            />
          )}
        </AnimatePresence>

        {/* Failure Link curved path */}
        {isFailure && (
          <motion.path 
            initial={{ pathLength: 0 }} 
            animate={{ pathLength: 1 }} 
            transition={{ duration: 0.3 }}
            d="M 260 124 Q 350 202 440 124" 
            fill="none" stroke="rgba(239,68,68,1)" strokeWidth="3" strokeDasharray="5 6"
            style={{ filter: 'drop-shadow(0 0 8px rgba(239,68,68,0.55))' }}
          />
        )}
      </svg>
      
      <div className="absolute bottom-2 text-center w-full min-h-[20px]">
        <AnimatePresence mode="wait">
          {!isFailure ? (
            <motion.div key="no-fail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-white/20 text-xs font-mono">
              Direct transitions OK...
            </motion.div>
          ) : (
            <motion.div key="fail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-red-500 text-xs font-mono font-medium">
              Mismatch. Backtracking via failure link to q{currentStepData.toState}.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
