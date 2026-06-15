import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function PatternMatch({ executionTrace, matchFound, songName, isActive }) {
  const [showMatch, setShowMatch] = useState(false);

  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => {
        setShowMatch(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowMatch(false);
    }
  }, [isActive]);

  if (!isActive) {
    return <div className="text-white/20 text-xs text-center">Waiting for scan completion...</div>;
  }

  const finalStateId = executionTrace && executionTrace.length > 0 
    ? executionTrace[executionTrace.length - 1].toState 
    : '?';

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative p-4 overflow-hidden">
      
      {/* Node Container with Ripples */}
      <div className="relative flex items-center justify-center">
        {/* Background ripples */}
        <AnimatePresence>
          {showMatch && matchFound && (
            <>
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={`ripple-${i}`}
                  initial={{ scale: 0.8, opacity: 0.8 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.4, ease: "easeOut" }}
                  className="absolute w-20 h-20 rounded-full border-2 border-[#00ffcc]/45 z-0 pointer-events-none"
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Target Node (Accepting State) */}
        <motion.div 
          className="relative z-10 w-20 h-20 rounded-full flex shrink-0 items-center justify-center border-[3px]"
          animate={{ 
            borderColor: showMatch ? (matchFound ? '#00ffcc' : '#ef4444') : 'rgba(255,255,255,0.1)',
            backgroundColor: showMatch ? (matchFound ? 'rgba(0,255,204,0.1)' : 'rgba(239,68,68,0.1)') : '#0a0a0f',
            boxShadow: showMatch ? (matchFound ? '0 0 40px rgba(0,255,204,0.4)' : '0 0 40px rgba(239,68,68,0.2)') : 'none'
          }}
          transition={{ duration: 0.5 }}
        >
          <span className={`text-3xl font-mono font-bold ${showMatch ? (matchFound ? 'text-[#00ffcc]' : 'text-red-500') : 'text-white/40'}`}>
            q{finalStateId}
          </span>
        </motion.div>
      </div>

      {/* Match Toast Notification */}
      <AnimatePresence>
        {showMatch && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`relative z-20 w-full max-w-[300px] mt-5 p-3 rounded-xl border flex items-center justify-center text-left gap-3 ${
              matchFound 
                ? 'bg-[#00ffcc]/10 border-[#00ffcc]/50 text-[#00ffcc] shadow-[0_0_20px_rgba(0,255,204,0.1)]'
                : 'bg-red-500/10 border-red-500/50 text-red-100 shadow-[0_0_20px_rgba(239,68,68,0.1)]'
            }`}
            style={{ backdropFilter: 'blur(8px)' }}
          >
            {matchFound ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <div className="flex-1">
              <h4 className="text-sm font-bold tracking-wider mb-0.5">
                {matchFound ? 'MATCH FOUND' : 'NO MATCH FOUND'}
              </h4>
              <p className="text-xs leading-snug opacity-80 text-white">
                {matchFound ? `"${songName}"` : 'Your melody is completely original.'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
