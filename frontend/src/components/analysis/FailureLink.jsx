import { motion, AnimatePresence } from 'framer-motion';

export default function FailureLink({ executionTrace, traceStep, isActive }) {
  if (!isActive || !executionTrace || executionTrace.length === 0) {
    return <div className="text-white/20 text-xs text-center">Waiting for scan completion...</div>;
  }

  const currentStepData = executionTrace[traceStep] || executionTrace[executionTrace.length - 1];
  const isFailure = currentStepData.usedFailure;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
      <svg className="w-full max-w-[340px] h-[140px] overflow-visible" viewBox="0 0 340 140">
        
        {/* Normal Path representation */}
        <line x1="40" y1="60" x2="160" y2="60" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="4 4" />
        
        {/* Nodes */}
        <circle cx="40" cy="60" r="20" fill="#0a0a0f" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
        <text x="40" y="60" fill="rgba(255,255,255,0.4)" fontSize="12" textAnchor="middle" alignmentBaseline="middle">q?</text>

        {/* Failed State Node */}
        <circle 
          cx="160" cy="60" r="24" 
          fill="#0a0a0f" 
          stroke={isFailure ? "rgba(239,68,68,1)" : "rgba(255,255,255,0.2)"} 
          strokeWidth="2" 
          style={{ filter: isFailure ? 'drop-shadow(0 0 10px rgba(239,68,68,0.5))' : 'none' }}
        />
        <text x="160" y="60" fill={isFailure ? "rgba(239,68,68,1)" : "rgba(255,255,255,0.4)"} fontSize="14" textAnchor="middle" alignmentBaseline="middle" className="font-bold">
          q{currentStepData.fromState}
        </text>

        {/* Fallback Target Node */}
        <circle 
          cx="280" cy="60" r="24" 
          fill="#0a0a0f" 
          stroke={isFailure ? "rgba(239,68,68,1)" : "rgba(255,255,255,0.2)"} 
          strokeWidth="2" 
          style={{ filter: isFailure ? 'drop-shadow(0 0 10px rgba(239,68,68,0.5))' : 'none' }}
        />
        <text x="280" y="60" fill={isFailure ? "rgba(239,68,68,1)" : "rgba(255,255,255,0.4)"} fontSize="14" textAnchor="middle" alignmentBaseline="middle">
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
              x1="160" y1="60" x2="220" y2="10" 
              stroke="rgba(239,68,68,1)" strokeWidth="3" 
            />
          )}
        </AnimatePresence>

        {/* Failure Link curved path */}
        {isFailure && (
          <motion.path 
            initial={{ pathLength: 0 }} 
            animate={{ pathLength: 1 }} 
            transition={{ duration: 0.3 }}
            d="M 160 84 Q 220 150 280 84" 
            fill="none" stroke="rgba(239,68,68,1)" strokeWidth="2" strokeDasharray="4 4"
            style={{ filter: 'drop-shadow(0 0 5px rgba(239,68,68,0.5))' }}
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
