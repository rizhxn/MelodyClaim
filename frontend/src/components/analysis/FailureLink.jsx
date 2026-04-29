import { motion, AnimatePresence } from 'framer-motion';

export default function FailureLink({ executionTrace, traceStep, isActive }) {
  if (!isActive || !executionTrace || executionTrace.length === 0) {
    return <div className="text-white/20 text-xs text-center">Waiting for scan completion...</div>;
  }

  const currentStepData = executionTrace[traceStep] || executionTrace[executionTrace.length - 1];
  const isFailure = currentStepData.usedFailure;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
      <svg className="w-full max-w-[300px] h-[120px] overflow-visible" viewBox="0 0 300 120">
        
        {/* Normal Path representation */}
        <line x1="50" y1="60" x2="150" y2="60" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="4 4" />
        
        {/* Nodes */}
        <circle cx="50" cy="60" r="16" fill="#0A0A0A" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
        <text x="50" y="60" fill="rgba(255,255,255,0.4)" fontSize="10" textAnchor="middle" alignmentBaseline="middle">q?</text>

        <circle cx="150" cy="60" r="20" fill="#0A0A0A" stroke={isFailure ? "rgba(248,113,113,1)" : "rgba(255,255,255,0.2)"} strokeWidth="2" />
        <text x="150" y="60" fill={isFailure ? "rgba(248,113,113,1)" : "rgba(255,255,255,0.4)"} fontSize="12" textAnchor="middle" alignmentBaseline="middle font-bold">
          q{currentStepData.fromState}
        </text>

        <circle cx="250" cy="60" r="16" fill="#0A0A0A" stroke={isFailure ? "rgba(248,113,113,1)" : "rgba(255,255,255,0.2)"} strokeWidth="2" />
        <text x="250" y="60" fill={isFailure ? "rgba(248,113,113,1)" : "rgba(255,255,255,0.4)"} fontSize="10" textAnchor="middle" alignmentBaseline="middle">
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
              x1="150" y1="60" x2="200" y2="20" 
              stroke="rgba(248,113,113,1)" strokeWidth="3" 
            />
          )}
        </AnimatePresence>

        {/* Failure Link curved path */}
        {isFailure && (
          <motion.path 
            initial={{ pathLength: 0 }} 
            animate={{ pathLength: 1 }} 
            transition={{ duration: 0.3 }}
            d="M 150 80 Q 200 140 250 80" 
            fill="none" stroke="rgba(248,113,113,1)" strokeWidth="2" strokeDasharray="4 4"
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
            <motion.div key="fail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-red-400 text-xs font-mono font-medium">
              Mismatch. Backtracking via failure link to q{currentStepData.toState}.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
