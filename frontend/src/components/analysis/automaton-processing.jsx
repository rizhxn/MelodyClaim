"use client"

import { useState, useEffect } from 'react'
import { IntervalStream } from './interval-stream'
import { AutomatonGraph } from './automaton-graph'
import { MatchLog } from './match-log'
import { motion, AnimatePresence } from 'framer-motion'

export function AutomatonProcessing({
  executionTrace,
  queryIntervals,
  automaton,
  onComplete
}) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [speed, setSpeed] = useState(2500)

  const currentTrace = executionTrace[currentStep]
  const isComplete = currentStep >= executionTrace.length

  useEffect(() => {
    if (isPaused || isComplete) return

    const timer = setTimeout(() => {
      setCurrentStep(prev => prev + 1)
    }, speed)

    return () => clearTimeout(timer)
  }, [currentStep, isPaused, isComplete, speed])

  useEffect(() => {
    if (isComplete) {
      const completionTimer = setTimeout(() => {
        onComplete()
      }, 20000)
      return () => clearTimeout(completionTimer)
    }
  }, [isComplete, onComplete])

  const firedMatches = executionTrace
    .slice(0, currentStep + 1)
    .filter(step => step.matchFired)
    .flatMap(step => step.matches.map((song, i) => ({
      song,
      position: step.position,
      state: step.toState,
      timestamp: Date.now() + i * 100
    })))

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center px-4 py-12">
      
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-6xl mb-8"
      >
        <h1 className="text-2xl font-semibold text-[#e6edf3] mb-2">
          Analyzing Your Melody
        </h1>
        <p className="text-sm text-[#7d8590]">
          Running through the plagiarism detection pipeline — automaton state {currentTrace?.toState ?? 0}
        </p>
      </motion.div>

      <div className="w-full max-w-6xl space-y-6">
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="border border-[#30363d] rounded-lg bg-[#0d1117]/50 backdrop-blur-sm p-6"
        >
          <IntervalStream 
            intervals={queryIntervals}
            currentPosition={currentTrace?.position ?? -1}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="border border-[#30363d] rounded-lg bg-[#0d1117]/50 backdrop-blur-sm p-6"
        >
          <AutomatonGraph
            states={automaton.states}
            transitions={automaton.transitions}
            failureLinks={automaton.failureLinks}
            activeState={currentTrace?.toState ?? 0}
            activeTransition={currentTrace ? {
              from: currentTrace.fromState,
              to: currentTrace.toState
            } : null}
            usedFailure={currentTrace?.usedFailure ?? false}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="border border-[#30363d] rounded-lg bg-[#0d1117]/50 backdrop-blur-sm p-6"
        >
          <MatchLog matches={firedMatches} />
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-6xl mt-6"
      >
        <div className="flex items-center justify-between text-xs text-[#7d8590] mb-2">
          <span>Processing interval {currentTrace?.position ?? 0} of {queryIntervals.length}</span>
          <span>{Math.round((currentStep / executionTrace.length) * 100)}%</span>
        </div>
        <div className="h-1 bg-[#21262d] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#5DCAA5]"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / executionTrace.length) * 100}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
      </motion.div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="px-4 py-2 text-xs border border-[#30363d] rounded-md text-[#e6edf3] hover:bg-[#21262d] transition-colors"
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>
        <button
          onClick={() => setSpeed(speed === 2500 ? 1000 : speed === 1000 ? 500 : 2500)}
          className="px-4 py-2 text-xs border border-[#30363d] rounded-md text-[#e6edf3] hover:bg-[#21262d] transition-colors"
        >
          Speed: {speed === 2500 ? 'Normal' : speed === 1000 ? 'Fast' : 'Very Fast'}
        </button>
      </div>
    </div>
  )
}
