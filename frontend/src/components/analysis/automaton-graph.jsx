"use client"

import { useCallback, useEffect, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MarkerType,
  useNodesState,
  useEdgesState
} from 'reactflow'
import 'reactflow/dist/style.css'
import { motion } from 'framer-motion'



// Custom node component with glow effect
function StateNode({ data }) {
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
}) {
  const nodeTypes = { stateNode: StateNode }

  // Convert automaton structure to ReactFlow format
  const initialNodes = states.map((state, index) => ({
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

  const initialEdges = [
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