import { motion } from 'framer-motion';
import { Layers } from 'lucide-react';

export default function IntervalEncoderStep({ intervals = [] }) {
  return (
    <motion.div 
      initial={{ opacity: 0, filter: 'blur(10px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, filter: 'blur(10px)' }}
      transition={{ duration: 0.8 }}
      className="w-full h-full flex flex-col items-center justify-center space-y-8"
    >
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-3 flex items-center justify-center gap-3">
          <Layers className="w-8 h-8 text-blue-400" />
          Step 2: Interval Encoder
        </h2>
        <p className="text-white/60 text-sm font-medium px-4 py-1.5 rounded-full bg-white/5 border border-white/10 inline-flex">
          Converting absolute pitches to key-invariant semitone differences
        </p>
      </div>

      <div className="w-full max-w-3xl glass-panel p-8 rounded-2xl border border-white/5 relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)' }}>
        <div className="flex flex-wrap gap-3 justify-center max-h-[300px] overflow-y-auto custom-scrollbar">
          {intervals.map((interval, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.8, x: -10, rotateX: 90 }}
              animate={{ opacity: 1, scale: 1, x: 0, rotateX: 0 }}
              transition={{ delay: Math.min(idx * 0.05, 2), duration: 0.6, type: "spring" }}
              className="w-14 h-14 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/50 font-mono font-bold text-lg relative group"
            >
              {/* Glow overlay that animates in */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(idx * 0.05 + 0.3, 2.3), duration: 0.5 }}
                className="absolute inset-0 rounded-full border border-[#00ffcc] bg-[#00ffcc]/10 shadow-[0_0_15px_rgba(0,255,204,0.3)] pointer-events-none"
              />
              <span className="relative z-10 group-hover:text-[#00ffcc] transition-colors">{interval > 0 ? `+${interval}` : interval}</span>
            </motion.div>
          ))}
          {intervals.length === 0 && (
            <div className="text-white/40 font-mono">No intervals to display...</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
