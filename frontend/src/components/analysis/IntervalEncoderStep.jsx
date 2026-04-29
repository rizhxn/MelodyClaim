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

      <div className="w-full max-w-3xl glass-panel p-8 rounded-2xl border border-white/10 relative overflow-hidden bg-black/20">
        <div className="flex flex-wrap gap-3 justify-center max-h-[300px] overflow-y-auto custom-scrollbar">
          {intervals.map((interval, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.05, 2), duration: 0.4 }}
              className="w-14 h-14 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-white font-mono font-bold text-lg shadow-[0_0_15px_rgba(59,130,246,0.15)]"
            >
              {interval > 0 ? `+${interval}` : interval}
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
