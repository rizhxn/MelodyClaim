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
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Background ripples */}
      <AnimatePresence>
        {showMatch && matchFound && (
          <>
            {[1, 2, 3].map((i) => (
              <motion.div
                key={`ripple-${i}`}
                initial={{ scale: 0.5, opacity: 0.5 }}
                animate={{ scale: 3, opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.4, ease: "easeOut" }}
                className="absolute w-20 h-20 rounded-full border border-emerald-400/50"
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Target Node (Accepting State) */}
      <motion.div 
        className="relative z-10 w-16 h-16 rounded-full flex items-center justify-center border-4"
        animate={{ 
          borderColor: showMatch ? (matchFound ? '#10b981' : '#f87171') : 'rgba(255,255,255,0.1)',
          backgroundColor: showMatch ? (matchFound ? 'rgba(16,185,129,0.1)' : 'rgba(248,113,113,0.1)') : '#0A0A0A',
          boxShadow: showMatch ? (matchFound ? '0 0 40px rgba(16,185,129,0.4)' : '0 0 40px rgba(248,113,113,0.2)') : 'none'
        }}
        transition={{ duration: 0.5 }}
      >
        <span className={`text-xl font-mono font-bold ${showMatch ? (matchFound ? 'text-emerald-400' : 'text-red-400') : 'text-white/40'}`}>
          q{finalStateId}
        </span>
      </motion.div>

      {/* Match Toast Notification */}
      <AnimatePresence>
        {showMatch && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`absolute bottom-4 left-4 right-4 p-3 rounded-lg border flex items-start gap-3 backdrop-blur-md ${
              matchFound 
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-100'
                : 'bg-red-950/80 border-red-500/50 text-red-100'
            }`}
          >
            {matchFound ? <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5" /> : <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />}
            <div className="flex-1">
              <h4 className="text-sm font-semibold mb-0.5">
                {matchFound ? 'MATCH FOUND' : 'NO MATCH FOUND'}
              </h4>
              <p className="text-xs opacity-80">
                {matchFound ? `"${songName}"` : 'Your melody is completely original.'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
