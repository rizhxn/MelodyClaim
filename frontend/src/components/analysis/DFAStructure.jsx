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
    const WINDOW_SIZE = 6;
    const startIdx = Math.max(0, traceStep - WINDOW_SIZE);
    
    let localIndex = 0;
    
    const getCoords = (stateId, localIdx) => {
      // Clean vertical layout: main chain goes straight down.
      // Small horizontal zig-zag just to prevent perfect overlap if there's backtracking,
      // but Aho-Corasick normally has a straight trie path.
      if (stateId === 0) return { cx: 150, cy: 40 };
      
      const xOffsets = [0, -30, 30, -15, 15];
      const xOffset = xOffsets[localIdx % xOffsets.length];
      
      return { 
        cx: 150 + xOffset, 
        cy: 40 + (localIdx * 60)
      };
    };

    // Build the graph from the local sliding window of the trace
    for (let i = startIdx; i <= traceStep; i++) {
      const step = executionTrace[i];
      if (!step) continue;

      if (!newNodes.has(step.fromState)) {
        newNodes.set(step.fromState, { id: step.fromState, ...getCoords(step.fromState, localIndex++) });
      }
      if (!newNodes.has(step.toState)) {
        newNodes.set(step.toState, { id: step.toState, ...getCoords(step.toState, localIndex++) });
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

  // Calculate dynamic viewBox height to keep the local window visible
  const maxCy = nodesArray.length > 0 ? Math.max(...nodesArray.map(n => n.cy)) + 60 : 400;
  const viewBoxY = Math.max(0, maxCy - 400);

  return (
    <div className="w-full h-full min-h-[300px] flex items-center justify-center relative overflow-hidden">
      <svg className="w-full h-full" viewBox={`0 ${viewBoxY} 300 400`} preserveAspectRatio="xMidYMid meet">
        
        {/* Draw edges */}
        {edgesArray.map((edge) => {
          const fromNode = nodes.get(edge.from);
          const toNode = nodes.get(edge.to);
          if (!fromNode || !toNode) return null;

          // For failure links (backtracking), draw cleanly curved paths so they don't overlap with regular edges
          const isUpward = toNode.cy < fromNode.cy;
          const curveOffset = isUpward ? 60 : 20;
          const midX = (fromNode.cx + toNode.cx) / 2 + (edge.isFailure ? curveOffset : 0);
          const midY = (fromNode.cy + toNode.cy) / 2;

          return (
            <motion.g key={edge.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {edge.isFailure ? (
                <path 
                  d={`M ${fromNode.cx} ${fromNode.cy} Q ${midX + 40} ${midY} ${toNode.cx} ${toNode.cy}`}
                  fill="none"
                  stroke="rgba(239,68,68,0.8)" 
                  strokeWidth="1.5" 
                  strokeDasharray="4 4"
                  style={{ filter: 'drop-shadow(0 0 5px rgba(239,68,68,0.5))' }}
                />
              ) : (
                <line 
                  x1={fromNode.cx} y1={fromNode.cy} 
                  x2={toNode.cx} y2={toNode.cy} 
                  stroke="rgba(255,255,255,0.15)" 
                  strokeWidth="1.5" 
                />
              )}
              <text 
                x={midX} 
                y={midY}
                fill="rgba(255,255,255,0.6)"
                fontSize="10"
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
                scale: isActiveNode ? 1.1 : 1,
                y: isActiveNode ? [0, -2, 0] : 0
              }} 
              transition={{ type: 'spring', duration: 0.4 }}
            >
              <circle 
                cx={node.cx} cy={node.cy} r="14" 
                fill="#0a0a0f" 
                stroke={isActiveNode ? (isFailureNode ? "rgba(239,68,68,1)" : "rgba(0,255,204,1)") : "rgba(255,255,255,0.3)"} 
                strokeWidth={isActiveNode ? "2.5" : "1.5"} 
                style={{ filter: isActiveNode ? (isFailureNode ? 'drop-shadow(0 0 10px rgba(239,68,68,0.5))' : 'drop-shadow(0 0 10px rgba(0,255,204,0.5))') : 'none' }}
              />
              <text 
                x={node.cx} y={node.cy} 
                fill={isActiveNode ? (isFailureNode ? "rgba(239,68,68,1)" : "rgba(0,255,204,1)") : "white"} 
                fontSize="10" 
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
