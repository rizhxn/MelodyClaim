import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Activity, Link2Off, Layers, CheckCircle2, ChevronRight } from 'lucide-react';
import IntervalSequence from './IntervalSequence';
import DFAStructure from './DFAStructure';
import QueryProcessing from './QueryProcessing';
import FailureLink from './FailureLink';
import PatternMatch from './PatternMatch';

export default function AhoCorasickDashboard({ result, onComplete }) {
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [traceStep, setTraceStep] = useState(0);

  const isLoaded = !!result;

  const primaryMatch = result?.primaryMatch;
  const matchFound = !!primaryMatch;
  const executionTrace = result?.simulationData?.executionTrace || [];
  
  // We extract intervals directly from the trace or fallback
  const queryIntervals = executionTrace.map(t => t.symbol) || [+4, +3, -3, -2, +2, -1];
  const songName = primaryMatch ? `${primaryMatch.songName} by ${primaryMatch.artist}` : 'Unknown';

  // Dynamic phases based on trace length
  const scanningDuration = Math.max(5000, executionTrace.length * 500); // 500ms per step
  
  const PHASES = [
    { id: 'encoding', label: '1. Interval Encoding', duration: 4000 },
    { id: 'dfa', label: '2. DFA Construction', duration: 4000 },
    { id: 'scanning', label: '3 & 4. Query Processing & Failures', duration: scanningDuration },
    { id: 'match', label: '5. Pattern Match', duration: 4000 }
  ];

  const totalDuration = PHASES.reduce((acc, p) => acc + p.duration, 0);

  useEffect(() => {
    if (!isLoaded) return;

    let startTime = Date.now();
    let animationFrame;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progressPct = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(progressPct);

      let timeAccumulator = 0;
      let activeIdx = 0;
      for (let i = 0; i < PHASES.length; i++) {
        timeAccumulator += PHASES[i].duration;
        if (elapsed < timeAccumulator) {
          activeIdx = i;
          break;
        }
      }
      
      if (elapsed >= totalDuration) {
        activeIdx = PHASES.length - 1;
      }

      if (activeIdx !== currentPhaseIdx) {
        setCurrentPhaseIdx(activeIdx);
      }

      // If in scanning phase, calculate exactly which step of the trace we are on
      if (activeIdx === 2) {
        const phaseStartTime = PHASES[0].duration + PHASES[1].duration;
        const timeInPhase = elapsed - phaseStartTime;
        const step = Math.floor(timeInPhase / 500);
        setTraceStep(Math.min(step, executionTrace.length - 1));
      }

      if (elapsed >= totalDuration) {
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 2000);
      } else {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [isLoaded, totalDuration, onComplete, currentPhaseIdx, executionTrace.length]);

  if (!isLoaded) {
    return <div className="text-white/50 animate-pulse font-mono">Initializing Aho-Corasick Pipeline...</div>;
  }

  const currentPhase = PHASES[currentPhaseIdx];

  // We split Phase 3 UI into two logical components based on current trace step
  const isFailure = executionTrace[traceStep]?.usedFailure;

  return (
    <div className="w-full max-w-[1400px] flex flex-col items-center">
      <div className="w-full mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
          MelodyClaim — Aho-Corasick DFA Processing Animation
        </h1>
        <p className="text-white/60 font-mono text-sm">
          Tracing {executionTrace.length} real algorithmic steps
        </p>
      </div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-1 space-y-6 flex flex-col">
          <DashboardCard 
            title="1. Interval Encoding" 
            icon={<Music className="w-4 h-4 text-[#9d4edd]" />}
            isActive={currentPhaseIdx >= 0}
            isFocus={currentPhaseIdx === 0}
          >
            <IntervalSequence intervals={queryIntervals} isActive={currentPhaseIdx >= 0} />
          </DashboardCard>

          <DashboardCard 
            title="2. DFA Structure (Dynamic Subgraph)" 
            icon={<Layers className="w-4 h-4 text-blue-400" />}
            isActive={currentPhaseIdx >= 1}
            isFocus={currentPhaseIdx === 1}
            className="flex-1"
          >
            <DFAStructure executionTrace={executionTrace} traceStep={traceStep} isActive={currentPhaseIdx >= 1} />
          </DashboardCard>
        </div>

        <div className="lg:col-span-2">
          <DashboardCard 
            title="3. Query Processing" 
            icon={<Activity className="w-4 h-4 text-green-400" />}
            isActive={currentPhaseIdx >= 2}
            isFocus={currentPhaseIdx === 2 && !isFailure}
            className="h-full min-h-[300px]"
          >
            <QueryProcessing executionTrace={executionTrace} traceStep={traceStep} isActive={currentPhaseIdx >= 2} />
          </DashboardCard>
        </div>

        <div className="lg:col-span-2">
          <DashboardCard 
            title="4. Aho-Corasick Failure Link" 
            icon={<Link2Off className="w-4 h-4 text-red-400" />}
            isActive={currentPhaseIdx >= 2}
            isFocus={currentPhaseIdx === 2 && isFailure}
            className="h-full min-h-[250px]"
          >
            <FailureLink executionTrace={executionTrace} traceStep={traceStep} isActive={currentPhaseIdx >= 2} />
          </DashboardCard>
        </div>

        <div className="lg:col-span-1">
          <DashboardCard 
            title="5. Pattern Match Detection" 
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            isActive={currentPhaseIdx >= 3}
            isFocus={currentPhaseIdx === 3}
            className="h-full min-h-[250px]"
          >
            <PatternMatch executionTrace={executionTrace} matchFound={matchFound} songName={songName} isActive={currentPhaseIdx >= 3} />
          </DashboardCard>
        </div>
      </div>

      <div className="w-full mt-8 flex items-center justify-between glass-panel p-4 rounded-xl">
        <div className="flex-1 mr-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white/80 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {currentPhase.label}
            </span>
            <span className="text-xs font-mono text-white/50">
              {Math.round((progress / 100) * (totalDuration / 1000))}s / {Math.round(totalDuration / 1000)}s
            </span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-[#9d4edd] to-emerald-400"
              style={{ width: `${progress}%` }}
              layoutId="progress"
            />
          </div>
        </div>

        <button 
          onClick={onComplete}
          className="px-6 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-sm font-medium transition-colors flex items-center gap-2 group border border-white/10"
        >
          Skip to results
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}

function DashboardCard({ title, icon, children, isActive, isFocus, className = '' }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isActive ? 1 : 0.3, y: isActive ? 0 : 10 }}
      className={`relative glass-panel rounded-xl border flex flex-col overflow-hidden transition-colors duration-500 ${
        isFocus ? 'border-white/30 bg-white/[0.03]' : 'border-white/5 bg-black/20'
      } ${className}`}
    >
      <div className="p-4 border-b border-white/5 flex items-center gap-3 bg-black/20">
        {icon}
        <h3 className={`text-sm font-medium ${isFocus ? 'text-white' : 'text-white/60'}`}>
          {title}
        </h3>
      </div>
      <div className="p-6 flex-1 relative flex items-center justify-center w-full h-full">
        {children}
      </div>
    </motion.div>
  );
}
