import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function DFAStructure({ executionTrace, traceStep, isActive }) {
  if (!isActive || !executionTrace || executionTrace.length === 0) {
    return <div className="text-white/20 text-xs text-center">Constructing from corpus...</div>;
  }

  // Dynamically build a small graph representing the visited states
  // We'll accumulate nodes and edges up to the current traceStep.
  const [nodes, setNodes] = useState(new Map());
  const [edges, setEdges] = useState(new Set());

  useEffect(() => {
    const newNodes = new Map();
    const newEdges = new Set();
    
    // We map arbitrary states to visual coordinates (very simple layout)
    // q0 is at center-left. Subsequent states spiral outwards.
    const getCoords = (stateId, index) => {
      if (stateId === 0) return { cx: 40, cy: 80 };
      // Simple pseudo-random but deterministic placement based on stateId
      const angle = (stateId * 137.5) * (Math.PI / 180);
      const radius = 40 + (index * 15);
      return { 
        cx: 40 + Math.abs(Math.cos(angle) * radius) + (index * 20), // push right over time
        cy: 80 + (Math.sin(angle) * 40)
      };
    };

    // Build the graph from trace history up to traceStep
    for (let i = 0; i <= traceStep; i++) {
      const step = executionTrace[i];
      if (!step) continue;

      if (!newNodes.has(step.fromState)) {
        newNodes.set(step.fromState, { id: step.fromState, ...getCoords(step.fromState, i) });
      }
      if (!newNodes.has(step.toState)) {
        newNodes.set(step.toState, { id: step.toState, ...getCoords(step.toState, i + 1) });
      }

      const edgeKey = `${step.fromState}-${step.toState}-${step.symbol}`;
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
    <div className="w-full h-full min-h-[200px] flex items-center justify-center relative overflow-hidden">
      <svg className="w-full max-w-[400px] h-full" viewBox="0 0 400 160">
        
        {/* Draw edges */}
        {edgesArray.map((edge) => {
          const fromNode = nodes.get(edge.from);
          const toNode = nodes.get(edge.to);
          if (!fromNode || !toNode) return null;

          return (
            <motion.g key={edge.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <line 
                x1={fromNode.cx} y1={fromNode.cy} 
                x2={toNode.cx} y2={toNode.cy} 
                stroke={edge.isFailure ? "rgba(248,113,113,0.5)" : "rgba(255,255,255,0.2)"} 
                strokeWidth="1.5" 
                strokeDasharray={edge.isFailure ? "4 4" : "none"}
              />
              <text 
                x={(fromNode.cx + toNode.cx) / 2} 
                y={((fromNode.cy + toNode.cy) / 2) - 5}
                fill="rgba(255,255,255,0.6)"
                fontSize="10"
                textAnchor="middle"
                className="font-mono"
              >
                {edge.label > 0 ? `+${edge.label}` : edge.label}
              </text>
            </motion.g>
          );
        })}

        {/* Draw nodes */}
        {nodesArray.map((node) => {
          const isActiveNode = node.id === activeNodeId;
          return (
            <motion.g key={`node-${node.id}`} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
              <circle 
                cx={node.cx} cy={node.cy} r="14" 
                fill="#0A0A0A" 
                stroke={isActiveNode ? "rgba(16,185,129,1)" : "rgba(255,255,255,0.3)"} 
                strokeWidth={isActiveNode ? "3" : "1.5"} 
              />
              <text 
                x={node.cx} y={node.cy} 
                fill={isActiveNode ? "rgba(16,185,129,1)" : "white"} 
                fontSize="10" 
                textAnchor="middle" 
                alignmentBaseline="middle"
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
