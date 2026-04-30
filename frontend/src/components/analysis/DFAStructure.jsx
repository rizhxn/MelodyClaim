import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function DFAStructure({ executionTrace, traceStep, isActive }) {
  if (!isActive || !executionTrace || executionTrace.length === 0) {
    return <div className="text-white/20 text-xs text-center">Constructing from corpus...</div>;
  }

  // Dynamically build a small graph representing the visited states
  const [nodes, setNodes] = useState(new Map());
  const [edges, setEdges] = useState(new Set());

  useEffect(() => {
    const newNodes = new Map();
    const newEdges = new Set();
    
    // We want a clean layout. We will display a localized window of the DFA
    // around the current trace step so it doesn't become a cluttered hairball.
    const WINDOW_SIZE = 8;
    const startIdx = Math.max(0, traceStep - WINDOW_SIZE);
    
    let localIndex = 0;
    
    const usedCoords = [];

    const getCoords = (stateId, localIdx) => {
      if (stateId === 0) return { cx: 260, cy: 54 };

      const positions = [
        { cx: 120, cy: 88 },
        { cx: 260, cy: 86 },
        { cx: 400, cy: 88 },
        { cx: 170, cy: 180 },
        { cx: 350, cy: 184 },
        { cx: 100, cy: 288 },
        { cx: 260, cy: 292 },
        { cx: 420, cy: 288 },
        { cx: 170, cy: 398 },
        { cx: 350, cy: 398 },
      ];

      const base = positions[localIdx % positions.length];
      let candidate = { ...base };
      let attempts = 0;

      while (usedCoords.some(point => distance(point, candidate) < 76) && attempts < 12) {
        const ring = Math.floor(attempts / 4) + 1;
        const direction = attempts % 4;
        const dx = direction === 0 ? 24 * ring : direction === 1 ? -24 * ring : 0;
        const dy = direction === 2 ? 24 * ring : direction === 3 ? -24 * ring : 0;
        candidate = {
          cx: clamp(base.cx + dx, 70, 450),
          cy: clamp(base.cy + dy, 60, 430),
        };
        attempts += 1;
      }

      return candidate;
    };

    // Build the graph from the local sliding window of the trace
    for (let i = startIdx; i <= traceStep; i++) {
      const step = executionTrace[i];
      if (!step) continue;

      if (!newNodes.has(step.fromState)) {
        const coords = getCoords(step.fromState, localIndex++);
        usedCoords.push(coords);
        newNodes.set(step.fromState, { id: step.fromState, ...coords });
      }
      if (!newNodes.has(step.toState)) {
        const coords = getCoords(step.toState, localIndex++);
        usedCoords.push(coords);
        newNodes.set(step.toState, { id: step.toState, ...coords });
      }

      const edgeKey = `${step.fromState}-${step.toState}-${step.symbol}-${i}`;
      newEdges.add(JSON.stringify({ 
        id: edgeKey, 
        from: step.fromState, 
        to: step.toState, 
        label: step.symbol,
        isFailure: step.usedFailure
      }));
    }

    setNodes(newNodes);
    setEdges(newEdges);
  }, [executionTrace, traceStep]);

  const nodesArray = Array.from(nodes.values());
  const edgesArray = Array.from(edges).map(e => JSON.parse(e));

  const currentStepData = executionTrace[traceStep];
  const activeNodeId = currentStepData?.toState;

  return (
    <div className="w-full h-full min-h-[560px] flex items-center justify-center relative overflow-hidden">
      <svg className="w-full h-full" viewBox="0 0 520 500" preserveAspectRatio="xMidYMid meet">
        
        {/* Draw edges */}
        {edgesArray.map((edge) => {
          const fromNode = nodes.get(edge.from);
          const toNode = nodes.get(edge.to);
          if (!fromNode || !toNode) return null;

          // For failure links (backtracking), draw cleanly curved paths so they don't overlap with regular edges
          const isUpward = toNode.cy < fromNode.cy;
          const curveOffset = isUpward ? 90 : 34;
          const midX = (fromNode.cx + toNode.cx) / 2 + (edge.isFailure ? curveOffset : 0);
          const midY = (fromNode.cy + toNode.cy) / 2;

          return (
            <motion.g key={edge.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {edge.isFailure ? (
                <path 
                  d={`M ${fromNode.cx} ${fromNode.cy} Q ${midX + 40} ${midY} ${toNode.cx} ${toNode.cy}`}
                  fill="none"
                  stroke="rgba(239,68,68,0.8)" 
                  strokeWidth="2.4" 
                  strokeDasharray="5 6"
                  style={{ filter: 'drop-shadow(0 0 8px rgba(239,68,68,0.55))' }}
                />
              ) : (
                <line 
                  x1={fromNode.cx} y1={fromNode.cy} 
                  x2={toNode.cx} y2={toNode.cy} 
                  stroke="rgba(255,255,255,0.15)" 
                  strokeWidth="2" 
                />
              )}
              <text 
                x={midX} 
                y={midY}
                fill="rgba(255,255,255,0.6)"
                fontSize="14"
                textAnchor="middle"
                className="font-mono bg-black"
                dy="-5"
              >
                {edge.label > 0 ? `+${edge.label}` : edge.label}
              </text>
            </motion.g>
          );
        })}

        {/* Draw nodes */}
        {nodesArray.map((node) => {
          const isActiveNode = node.id === activeNodeId;
          const isFailureNode = isActiveNode && currentStepData?.usedFailure;
          
          return (
            <motion.g 
              key={`node-${node.id}`} 
              initial={{ scale: 0 }} 
              animate={{ 
                scale: isActiveNode ? 1.16 : 1,
                y: isActiveNode ? [0, -2, 0] : 0
              }} 
              transition={{ type: 'spring', duration: 0.4 }}
            >
              <circle 
                cx={node.cx} cy={node.cy} r="24" 
                fill="#0a0a0f" 
                stroke={isActiveNode ? (isFailureNode ? "rgba(239,68,68,1)" : "rgba(0,255,204,1)") : "rgba(255,255,255,0.3)"} 
                strokeWidth={isActiveNode ? "3" : "2"} 
                style={{ filter: isActiveNode ? (isFailureNode ? 'drop-shadow(0 0 18px rgba(239,68,68,0.6))' : 'drop-shadow(0 0 18px rgba(0,255,204,0.6))') : 'none' }}
              />
              <text 
                x={node.cx} y={node.cy} 
                fill={isActiveNode ? (isFailureNode ? "rgba(239,68,68,1)" : "rgba(0,255,204,1)") : "white"} 
                fontSize="15" 
                textAnchor="middle" 
                alignmentBaseline="middle"
                className={isActiveNode ? "font-bold font-mono" : "font-mono"}
              >
                q{node.id}
              </text>
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}

function distance(a, b) {
  return Math.hypot(a.cx - b.cx, a.cy - b.cy);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
