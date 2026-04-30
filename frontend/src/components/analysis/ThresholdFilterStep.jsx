import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Filter, XCircle, CheckCircle2 } from 'lucide-react';

export default function ThresholdFilterStep({ allMatches = [] }) {
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    // Trigger the filtering animation after 1.5 seconds
    const timer = setTimeout(() => setShowFilter(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  // We inject a dummy "rejected" match purely for the visual demonstration of the filter,
  // since the backend already successfully filtered these out before sending the payload!
  const displayMatches = [
    {
      id: 'dummy',
      songName: 'Unknown Motif',
      artist: 'Various',
      matchLength: 4,
      isDummy: true
    },
    ...allMatches.map((m, i) => ({ ...m, id: i }))
  ];

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
          <Filter className="w-8 h-8 text-orange-400" />
          Step 4: Threshold Filter
        </h2>
        <p className="text-white/60 text-sm font-medium px-4 py-1.5 rounded-full bg-white/5 border border-white/10 inline-flex">
          Discarding coincidental matches (length &lt; 7)
        </p>
      </div>

      <div className="w-full max-w-4xl h-[430px] glass-panel p-8 rounded-2xl border border-white/5 bg-black/20 flex items-center" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)' }}>
        <div className="w-full flex flex-col gap-4 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
          {displayMatches.map((match, idx) => {
            const isRejected = match.matchLength < 7;

            return (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.2 }}
                className="relative overflow-hidden"
              >
                <motion.div 
                  className={`w-full p-5 rounded-xl border flex items-center justify-between transition-colors duration-500 ${
                    showFilter && isRejected 
                      ? 'bg-red-500/5 border-red-500/20 text-white/30 grayscale' 
                      : showFilter && !isRejected
                        ? 'bg-[#00ffcc]/10 border-[#00ffcc]/30 text-white shadow-[0_0_15px_rgba(0,255,204,0.1)]'
                        : 'bg-white/5 border-white/10 text-white'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-lg">{match.songName}</span>
                    <span className="text-sm opacity-70">{match.artist}</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="font-mono bg-[#0a0a0f]/50 px-3 py-1 rounded-lg border border-white/5 text-sm">
                      {match.matchLength} intervals
                    </div>
                    
                    {showFilter && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-2 font-bold"
                      >
                        {isRejected ? (
                          <span className="text-red-500 flex items-center gap-1 text-sm"><XCircle className="w-4 h-4"/> Below Threshold</span>
                        ) : (
                          <span className="text-[#00ffcc] flex items-center gap-1 text-sm"><CheckCircle2 className="w-4 h-4"/> Kept</span>
                        )}
                      </motion.div>
                    )}
                  </div>
                </motion.div>

                {/* Strikethrough Animation for rejected */}
                {showFilter && isRejected && (
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.4 }}
                    className="absolute top-1/2 left-0 h-[2px] bg-red-500/80 -translate-y-1/2 z-10 shadow-[0_0_10px_rgba(239,68,68,0.8)]"
                  />
                )}
              </motion.div>
            );
          })}
          
          {displayMatches.length === 0 && (
            <div className="text-center text-white/40 py-8">No patterns found to filter.</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
