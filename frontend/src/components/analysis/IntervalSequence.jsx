import { motion } from 'framer-motion';

export default function IntervalSequence({ intervals, isActive }) {
  if (!isActive) {
    return <div className="text-white/20 text-xs text-center">Waiting for previous stage...</div>;
  }

  return (
    <div className="w-full flex flex-col items-center justify-center gap-6">
      {/* Musical Staff Mockup */}
      <div className="relative w-full max-w-[200px] h-[60px] flex items-center justify-center">
        {/* Staff lines */}
        <div className="absolute inset-0 flex flex-col justify-between py-2 opacity-30">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="w-full h-[1px] bg-white"></div>
          ))}
        </div>
        
        {/* Treble Clef Mockup */}
        <div className="absolute left-0 top-0 h-full text-white/50 text-4xl leading-none flex items-center select-none font-serif">
          𝄞
        </div>

        {/* Notes */}
        <div className="absolute left-8 right-0 flex items-center justify-around h-full">
          {intervals.slice(0, 5).map((_, i) => (
            <motion.div
              key={`note-${i}`}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: [0, 5, 0], opacity: 1 }}
              transition={{ delay: i * 0.3, duration: 0.5 }}
              className="w-3 h-3 rounded-full bg-emerald-400 relative"
            >
              <div className="absolute top-0 right-0 w-[1px] h-6 bg-emerald-400 -mt-5"></div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        {intervals.slice(0, 5).map((interval, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8, x: -10, rotateX: 90 }}
            animate={{ opacity: 1, scale: 1, x: 0, rotateX: 0 }}
            transition={{ delay: 1.5 + (i * 0.2), duration: 0.6, type: "spring" }}
            className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-sm font-mono font-bold text-white/50 relative group"
          >
            {/* Glow overlay that animates in */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 + (i * 0.2) + 0.3, duration: 0.5 }}
              className="absolute inset-0 rounded-full border border-[#00ffcc] bg-[#00ffcc]/10 shadow-[0_0_15px_rgba(0,255,204,0.3)] pointer-events-none"
            />
            <span className="relative z-10 group-hover:text-[#00ffcc] transition-colors">{interval > 0 ? `+${interval}` : interval}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
