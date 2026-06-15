"use client"

import { motion } from 'framer-motion'



export function IntervalStream({ intervals, currentPosition }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-[#e6edf3]">Interval Sequence</h3>
      
      <div className="relative">
        <div className="flex flex-wrap gap-2 items-center font-mono text-sm">
          {intervals.map((interval, index) => {
            const isActive = index === currentPosition
            const isPast = index < currentPosition
            const isFuture = index > currentPosition

            return (
              <motion.div
                key={index}
                className={`
                  relative px-3 py-1.5 rounded-md border transition-all duration-300
                  ${isActive ? 'border-[#5DCAA5] bg-[#5DCAA5]/10 text-[#5DCAA5]' : ''}
                  ${isPast ? 'border-[#30363d] bg-[#21262d] text-[#7d8590]' : ''}
                  ${isFuture ? 'border-[#30363d] text-[#e6edf3]' : ''}
                `}
                animate={{
                  scale: isActive ? 1.1 : 1,
                  y: isActive ? -4 : 0
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20
                }}
              >
                {interval > 0 ? `+${interval}` : interval}
                
                {/* Pulse ring on active */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-md border-2 border-[#5DCAA5]"
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 1.3, opacity: 0 }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Animated cursor */}
        {currentPosition >= 0 && currentPosition < intervals.length && (
          <motion.div
            className="absolute top-full mt-2 text-[#5DCAA5] text-xs font-medium"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              left: `calc(${(currentPosition / intervals.length) * 100}%)`
            }}
          >
            ↑ processing
          </motion.div>
        )}
      </div>

      <p className="text-xs text-[#7d8590] mt-2">
        Each number represents the semitone difference between consecutive notes. 
        This encoding makes the melody key-independent.
      </p>
    </div>
  )
}