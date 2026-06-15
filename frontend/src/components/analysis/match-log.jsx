"use client"

import { motion, AnimatePresence } from 'framer-motion'

export function MatchLog({ matches }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-[#e6edf3]">Pattern Matches Detected</h3>
      
      <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {matches.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-[#7d8590] py-4 text-center"
            >
              No matches detected yet — automaton still searching...
            </motion.p>
          ) : (
            matches.map((match, index) => (
              <motion.div
                key={match.timestamp}
                initial={{ opacity: 0, x: -20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                  delay: index * 0.05
                }}
                className="
                  flex items-start gap-3 p-3 rounded-md 
                  border border-[#5DCAA5]/30 bg-[#5DCAA5]/5
                  hover:bg-[#5DCAA5]/10 transition-colors
                "
              >
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-[#5DCAA5] animate-pulse" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#e6edf3] truncate">
                    {match.song}
                  </p>
                  <p className="text-xs text-[#7d8590] mt-0.5 font-mono">
                    State q{match.state} → interval position {match.position}
                  </p>
                </div>

                <div className="flex-shrink-0">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-6 h-6 rounded-full bg-[#5DCAA5] flex items-center justify-center"
                  >
                    <svg 
                      className="w-4 h-4 text-[#0d1117]" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <p className="text-xs text-[#7d8590]">
        Accepting states fire when a complete pattern from the corpus is matched.
        Each match represents a potential melodic similarity.
      </p>
    </div>
  )
}
