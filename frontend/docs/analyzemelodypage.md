# MelodyClaim — Automaton Processing Page Component

You are given a task to create an automaton visualization processing page that displays real-time DFA execution for melody plagiarism detection.

## Project Requirements

The codebase should support:
- React 18+ with TypeScript
- Tailwind CSS
- shadcn/ui component structure
- React Flow for graph visualization

If dependencies are missing, provide setup instructions.

## Critical Design Constraints

**DO NOT CHANGE:**
- Existing background shader or gradient
- Overall website dark aesthetic (#0d1117 background, #e6edf3 text)
- Accent color scheme (teal #1F4E79 / #5DCAA5 for active elements)
- Typography style (clean sans-serif for UI, monospace for data)
- Border and spacing consistency with rest of site

**MUST MAINTAIN:**
- Full visual consistency with existing MelodyClaim design language
- Smooth, slow, intentional animations (no abrupt transitions)
- Professional, academic tone suitable for a computer science demonstration

## Core Functionality

This page visualizes the Aho-Corasick multi-pattern DFA executing on an interval sequence query. It must clearly demonstrate:

1. **State-to-state transitions** — as each interval is processed, the active state changes
2. **Goto function** — arrows between states highlight when taken
3. **Failure links** — dashed red arrows activate when backtracking occurs
4. **Output function** — accepting states pulse when pattern matches fire
5. **Linear time processing** — the entire sequence processed in a single left-to-right pass

The visualization teaches automata theory through observable computation.

---

## Data Structure from Backend

The component receives this data shape from the `/api/analyse` endpoint:

```typescript
interface AnalysisResponse {
  success: boolean
  meta: {
    filename: string
    trackName: string
    totalNotes: number
    intervalCount: number
  }
  executionTrace: ExecutionStep[]
  automaton: AutomatonStructure
  verdict: 'STRUCTURAL_MATCH' | 'MINOR_OVERLAP' | 'NO_MATCH'
  primaryMatch: MatchEvidence | null
  queryIntervals: number[]
}

interface ExecutionStep {
  position: number           // index in query string (0-based)
  symbol: number            // interval value being processed
  fromState: number         // state before this step
  toState: number          // state after this step
  usedFailure: boolean     // true if failure link was followed
  matchFired: boolean      // true if output function triggered
  matches: string[]        // song names if matchFired is true
}

interface AutomatonStructure {
  states: AutomatonState[]
  transitions: Transition[]
  failureLinks: FailureLink[]
}

interface AutomatonState {
  id: number
  isAccepting: boolean
  patterns?: string[]      // song names that end at this state
}

interface Transition {
  from: number
  to: number
  symbol: number           // interval value that triggers this transition
}

interface FailureLink {
  from: number
  to: number
}

interface MatchEvidence {
  songName: string
  artist: string
  matchLength: number
  matchedSequence: number[]
  queryStart: number
  queryEnd: number
  // ... additional fields
}
```

---

## Component Structure

Copy these components to `/components/analysis/`:

### 1. Main Processing Container

```tsx
// components/analysis/automaton-processing.tsx
"use client"

import { useState, useEffect } from 'react'
import { IntervalStream } from './interval-stream'
import { AutomatonGraph } from './automaton-graph'
import { MatchLog } from './match-log'
import { motion, AnimatePresence } from 'framer-motion'

interface AutomatonProcessingProps {
  executionTrace: ExecutionStep[]
  queryIntervals: number[]
  automaton: AutomatonStructure
  onComplete: () => void
}

export function AutomatonProcessing({
  executionTrace,
  queryIntervals,
  automaton,
  onComplete
}: AutomatonProcessingProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [speed, setSpeed] = useState(200) // ms per step

  const currentTrace = executionTrace[currentStep]
  const isComplete = currentStep >= executionTrace.length

  // Auto-advance through execution trace
  useEffect(() => {
    if (isPaused || isComplete) return

    const timer = setTimeout(() => {
      setCurrentStep(prev => prev + 1)
    }, speed)

    return () => clearTimeout(timer)
  }, [currentStep, isPaused, isComplete, speed])

  // Trigger completion callback
  useEffect(() => {
    if (isComplete) {
      const completionTimer = setTimeout(() => {
        onComplete()
      }, 1500) // delay before transitioning to results
      return () => clearTimeout(completionTimer)
    }
  }, [isComplete, onComplete])

  // Collect all matches that have fired up to current step
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
      
      {/* Header */}
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

      {/* Three-zone visualization */}
      <div className="w-full max-w-6xl space-y-6">
        
        {/* Zone 1: Interval Stream */}
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

        {/* Zone 2: Automaton Graph */}
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

        {/* Zone 3: Match Log */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="border border-[#30363d] rounded-lg bg-[#0d1117]/50 backdrop-blur-sm p-6"
        >
          <MatchLog matches={firedMatches} />
        </motion.div>
      </div>

      {/* Progress indicator */}
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

      {/* Pause/Resume controls (optional, can be hidden) */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="px-4 py-2 text-xs border border-[#30363d] rounded-md text-[#e6edf3] hover:bg-[#21262d] transition-colors"
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>
        <button
          onClick={() => setSpeed(speed === 200 ? 100 : speed === 100 ? 50 : 200)}
          className="px-4 py-2 text-xs border border-[#30363d] rounded-md text-[#e6edf3] hover:bg-[#21262d] transition-colors"
        >
          Speed: {speed === 200 ? 'Normal' : speed === 100 ? 'Fast' : 'Very Fast'}
        </button>
      </div>
    </div>
  )
}
```

---

### 2. Interval Stream Component

```tsx
// components/analysis/interval-stream.tsx
"use client"

import { motion } from 'framer-motion'

interface IntervalStreamProps {
  intervals: number[]
  currentPosition: number
}

export function IntervalStream({ intervals, currentPosition }: IntervalStreamProps) {
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
```

---

### 3. Automaton Graph Component

```tsx
// components/analysis/automaton-graph.tsx
"use client"

import { useCallback, useEffect, useState } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MarkerType,
  useNodesState,
  useEdgesState
} from 'reactflow'
import 'reactflow/dist/style.css'
import { motion } from 'framer-motion'

interface AutomatonGraphProps {
  states: AutomatonState[]
  transitions: Transition[]
  failureLinks: FailureLink[]
  activeState: number
  activeTransition: { from: number; to: number } | null
  usedFailure: boolean
}

// Custom node component with glow effect
function StateNode({ data }: { data: any }) {
  const isActive = data.isActive
  const isAccepting = data.isAccepting
  const matchFired = data.matchFired

  return (
    <motion.div
      className={`
        relative flex items-center justify-center
        w-16 h-16 rounded-full border-2 font-mono text-sm font-semibold
        transition-all duration-300
        ${isActive 
          ? 'border-[#5DCAA5] bg-[#5DCAA5]/20 text-[#5DCAA5] shadow-lg shadow-[#5DCAA5]/50' 
          : isAccepting
          ? 'border-[#1F4E79] bg-[#1F4E79]/10 text-[#e6edf3]'
          : 'border-[#30363d] bg-[#0d1117] text-[#e6edf3]'
        }
      `}
      animate={{
        scale: isActive ? 1.15 : matchFired ? [1, 1.2, 1] : 1
      }}
      transition={{
        scale: {
          duration: matchFired ? 0.6 : 0.3,
          ease: "easeOut"
        }
      }}
    >
      q{data.id}
      
      {/* Pulsing ring for active state */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-[#5DCAA5]"
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      {/* Accepting state double circle */}
      {isAccepting && (
        <div className="absolute inset-1 rounded-full border border-[#1F4E79]" />
      )}
    </motion.div>
  )
}

export function AutomatonGraph({
  states,
  transitions,
  failureLinks,
  activeState,
  activeTransition,
  usedFailure
}: AutomatonGraphProps) {
  const nodeTypes = { stateNode: StateNode }

  // Convert automaton structure to ReactFlow format
  const initialNodes: Node[] = states.map((state, index) => ({
    id: `q${state.id}`,
    type: 'stateNode',
    position: { 
      x: (index % 5) * 180 + 50, 
      y: Math.floor(index / 5) * 150 + 50 
    },
    data: { 
      id: state.id,
      isActive: state.id === activeState,
      isAccepting: state.isAccepting,
      matchFired: false,
      label: `q${state.id}`
    }
  }))

  const initialEdges: Edge[] = [
    // Goto transitions
    ...transitions.map((t, i) => ({
      id: `e${i}`,
      source: `q${t.from}`,
      target: `q${t.to}`,
      label: t.symbol.toString(),
      type: 'smoothstep',
      animated: activeTransition?.from === t.from && activeTransition?.to === t.to && !usedFailure,
      style: {
        stroke: 
          activeTransition?.from === t.from && activeTransition?.to === t.to && !usedFailure
            ? '#5DCAA5'
            : '#30363d',
        strokeWidth: 
          activeTransition?.from === t.from && activeTransition?.to === t.to && !usedFailure
            ? 3 
            : 1.5
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: 
          activeTransition?.from === t.from && activeTransition?.to === t.to && !usedFailure
            ? '#5DCAA5'
            : '#30363d'
      },
      labelStyle: {
        fill: '#e6edf3',
        fontSize: 11,
        fontFamily: 'monospace'
      },
      labelBgStyle: {
        fill: '#0d1117',
        fillOpacity: 0.9
      }
    })),
    
    // Failure links
    ...failureLinks.map((fl, i) => ({
      id: `f${i}`,
      source: `q${fl.from}`,
      target: `q${fl.to}`,
      type: 'step',
      animated: usedFailure && activeTransition?.from === fl.from,
      style: {
        stroke: usedFailure && activeTransition?.from === fl.from ? '#ef4444' : '#374151',
        strokeWidth: usedFailure && activeTransition?.from === fl.from ? 2 : 1,
        strokeDasharray: '5,5'
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: usedFailure && activeTransition?.from === fl.from ? '#ef4444' : '#374151'
      },
      label: 'fail',
      labelStyle: {
        fill: '#7d8590',
        fontSize: 9,
        fontFamily: 'monospace'
      }
    }))
  ]

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Update active state highlighting
  useEffect(() => {
    setNodes(nds =>
      nds.map(node => ({
        ...node,
        data: {
          ...node.data,
          isActive: node.data.id === activeState
        }
      }))
    )
  }, [activeState, setNodes])

  // Update edge highlighting
  useEffect(() => {
    setEdges(eds =>
      eds.map(edge => {
        const isActiveGoto = 
          edge.id.startsWith('e') &&
          activeTransition &&
          edge.source === `q${activeTransition.from}` &&
          edge.target === `q${activeTransition.to}` &&
          !usedFailure

        const isActiveFailure =
          edge.id.startsWith('f') &&
          usedFailure &&
          activeTransition &&
          edge.source === `q${activeTransition.from}`

        return {
          ...edge,
          animated: isActiveGoto || isActiveFailure,
          style: {
            ...edge.style,
            stroke: isActiveGoto 
              ? '#5DCAA5' 
              : isActiveFailure 
              ? '#ef4444' 
              : edge.id.startsWith('f') 
              ? '#374151' 
              : '#30363d',
            strokeWidth: (isActiveGoto || isActiveFailure) ? 3 : edge.style?.strokeWidth || 1.5
          },
          markerEnd: {
            ...edge.markerEnd,
            color: isActiveGoto 
              ? '#5DCAA5' 
              : isActiveFailure 
              ? '#ef4444' 
              : edge.id.startsWith('f') 
              ? '#374151' 
              : '#30363d'
          }
        }
      })
    )
  }, [activeTransition, usedFailure, setEdges])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-[#e6edf3]">
          Finite Automaton — Multi-Pattern DFA
        </h3>
        <div className="flex gap-4 text-xs text-[#7d8590]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-[#5DCAA5] bg-[#5DCAA5]/20" />
            <span>Active State</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-[#1F4E79]" />
            <span>Accepting</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-[#ef4444] border-dashed" />
            <span>Failure Link</span>
          </div>
        </div>
      </div>

      <div 
        className="w-full rounded-md border border-[#30363d] overflow-hidden bg-[#0d1117]" 
        style={{ height: '500px' }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          zoomOnScroll={false}
          panOnDrag={false}
          attributionPosition="bottom-right"
        >
          <Background color="#21262d" gap={16} />
        </ReactFlow>
      </div>

      <p className="text-xs text-[#7d8590]">
        States transition via goto arrows when matching intervals. 
        Failure links (dashed) backtrack when no direct transition exists.
      </p>
    </div>
  )
}
```

---

### 4. Match Log Component

```tsx
// components/analysis/match-log.tsx
"use client"

import { motion, AnimatePresence } from 'framer-motion'

interface MatchEntry {
  song: string
  position: number
  state: number
  timestamp: number
}

interface MatchLogProps {
  matches: MatchEntry[]
}

export function MatchLog({ matches }: MatchLogProps) {
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
```

---

## TypeScript Interfaces

Create `/types/automaton.ts`:

```typescript
export interface ExecutionStep {
  position: number
  symbol: number
  fromState: number
  toState: number
  usedFailure: boolean
  matchFired: boolean
  matches: string[]
}

export interface AutomatonStructure {
  states: AutomatonState[]
  transitions: Transition[]
  failureLinks: FailureLink[]
}

export interface AutomatonState {
  id: number
  isAccepting: boolean
  patterns?: string[]
}

export interface Transition {
  from: number
  to: number
  symbol: number
}

export interface FailureLink {
  from: number
  to: number
}

export interface MatchEvidence {
  songName: string
  artist: string
  matchLength: number
  classification: 'STRUCTURAL' | 'MINOR'
  matchedSequence: number[]
  queryStart: number
  queryEnd: number
  referenceStart: number
  referenceEnd: number
  isRepeating: boolean
  significance: string
}

export interface AnalysisResponse {
  success: boolean
  meta: {
    filename: string
    trackName: string
    totalNotes: number
    intervalCount: number
  }
  executionTrace: ExecutionStep[]
  automaton: AutomatonStructure
  verdict: 'STRUCTURAL_MATCH' | 'MINOR_OVERLAP' | 'NO_MATCH'
  primaryMatch: MatchEvidence | null
  queryIntervals: number[]
  allMatches: MatchEvidence[]
  summary: string
}
```

---

## Custom Scrollbar Styles

Add to `globals.css`:

```css
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #0d1117;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #30363d;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #484f58;
}
```

---

## Installation Instructions

Install required dependencies:

```bash
npm install reactflow framer-motion lucide-react
```

If React Flow isn't working, verify these peer dependencies:
```bash
npm install react react-dom
```

---

## Integration Instructions

### 1. Import and Use in Your Analysis Flow

```tsx
// In your main analysis page/component
import { useState } from 'react'
import { AutomatonProcessing } from '@/components/analysis/automaton-processing'
import { ResultsDisplay } from '@/components/analysis/results-display'

export function AnalysisPage() {
  const [analysisData, setAnalysisData] = useState<AnalysisResponse | null>(null)
  const [showResults, setShowResults] = useState(false)

  // After MIDI upload completes and backend responds:
  const handleAnalysisComplete = (data: AnalysisResponse) => {
    setAnalysisData(data)
  }

  if (!analysisData) {
    return <UploadInterface onComplete={handleAnalysisComplete} />
  }

  if (!showResults) {
    return (
      <AutomatonProcessing
        executionTrace={analysisData.executionTrace}
        queryIntervals={analysisData.queryIntervals}
        automaton={analysisData.automaton}
        onComplete={() => setShowResults(true)}
      />
    )
  }

  return <ResultsDisplay data={analysisData} />
}
```

### 2. Backend Modification Required

Your `/api/analyse` endpoint must return the execution trace and automaton structure.

Modify `ahoCorasick.js` search function to record every step:

```javascript
function search(automaton, text, patterns) {
  const { gotoFn, fail, output } = automaton
  const matches = []
  const trace = []
  let currentState = 0

  for (let i = 0; i < text.length; i++) {
    const symbol = text[i]
    const fromState = currentState

    // Follow failure links
    while (currentState !== 0 && !gotoFn[currentState].has(symbol)) {
      currentState = fail[currentState]
    }

    // Take goto transition if exists
    if (gotoFn[currentState].has(symbol)) {
      currentState = gotoFn[currentState].get(symbol)
    }

    const matchFired = output[currentState].length > 0

    // Record this step
    trace.push({
      position: i,
      symbol,
      fromState,
      toState: currentState,
      usedFailure: fromState !== currentState && !gotoFn[fromState].has(symbol),
      matchFired,
      matches: matchFired ? output[currentState].map(idx => 
        patterns[idx].songName || `Pattern ${idx}`
      ) : []
    })

    // Collect matches
    if (matchFired) {
      for (const patternIndex of output[currentState]) {
        // ... existing match collection logic
      }
    }
  }

  return { matches, trace }
}
```

Then in your controller, include the trace in the response:

```javascript
const { matches, trace } = search(automaton, queryIntervals, patterns)

return res.json({
  success: true,
  executionTrace: trace,
  automaton: {
    states: automaton.states,
    transitions: automaton.transitions,
    failureLinks: automaton.failureLinks
  },
  // ... rest of response
})
```

---

## Animation Timing Guidelines

Follow these exact timing values for consistency:

- **Step duration**: 200ms (adjustable via speed controls)
- **State scale animation**: 300ms with spring easing
- **Glow pulse**: 1500ms repeat cycle
- **Match pulse**: 600ms one-shot
- **Edge highlight**: 300ms ease-out
- **Component entrance**: 400ms with 0.2s stagger

All transitions use `ease-out` or spring physics for smooth, professional feel.

---

## Responsive Behavior

- Graph height: Fixed 500px on desktop, 400px on mobile
- Max container width: 1280px (6xl)
- Interval stream wraps on small screens
- Match log max height: 192px with scroll
- Controls stack vertically below 640px

---

## Accessibility Notes

- All interactive elements have focus states
- Color contrast meets WCAG AA standards
- Pause/resume controls keyboard accessible
- Animations respect `prefers-reduced-motion`

---

## Questions to Validate Before Implementation

1. **Data flow**: Is the backend returning `executionTrace` and `automaton` structure?
2. **State management**: Where in the app does the processing screen appear?
3. **Transition**: How does the app move from upload → processing → results?
4. **Error handling**: What happens if trace is empty or malformed?
5. **Testing**: Do you have sample execution trace data to test with?

---

## Final Integration Steps

0. Copy all components to `/components/analysis/`
1. Install dependencies: `reactflow`, `framer-motion`
2. Create types file at `/types/automaton.ts`
3. Add custom scrollbar styles to `globals.css`
4. Modify backend to return execution trace
5. Wire up the component in your main analysis flow
6. Test with a known melody pair from your corpus

The visualization will make the automata theory visibly clear to your panel.