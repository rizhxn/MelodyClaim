import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Music, Activity, Link2Off, Layers, CheckCircle2, ChevronRight } from 'lucide-react';
import IntervalSequence from './IntervalSequence';
import DFAStructure from './DFAStructure';
import QueryProcessing from './QueryProcessing';
import FailureLink from './FailureLink';
import PatternMatch from './PatternMatch';

export default function AhoCorasickDashboard({ result, onComplete }) {
  const [traceStep, setTraceStep] = useState(0);

  const isLoaded = !!result;

  const primaryMatch = result?.primaryMatch;
  const matchFound = !!primaryMatch;
  const executionTrace = result?.simulationData?.executionTrace || [];
  
  // We extract intervals directly from the trace or fallback
  const queryIntervals = executionTrace.map(t => t.symbol) || [+4, +3, -3, -2, +2, -1];
  const songName = primaryMatch ? `${primaryMatch.songName} by ${primaryMatch.artist}` : 'Unknown';

  // Infinite looping animation for the dashboard overview
  useEffect(() => {
    if (!executionTrace.length) return;
    
    const interval = setInterval(() => {
      setTraceStep(prev => (prev + 1) % executionTrace.length);
    }, 400); // 400ms per step
    
    return () => clearInterval(interval);
  }, [executionTrace.length]);

  const isFailure = executionTrace[traceStep]?.usedFailure;

  if (!isLoaded) {
    return <div className="text-white/50 animate-pulse font-mono">Initializing Aho-Corasick Pipeline...</div>;
  }

  return (
    <div className="w-full max-w-[1400px] flex flex-col items-center">
      <div className="w-full mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
          Analysis Pipeline Overview
        </h1>
        <p className="text-white/60 font-mono text-sm">
          Successfully processed {executionTrace.length} algorithmic steps
        </p>
      </div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        <div className="lg:col-span-1 space-y-6 flex flex-col">
          <DashboardCard 
            title="1. Interval Encoding" 
            icon={<Music className="w-4 h-4 text-[#9d4edd]" />}
            className="min-h-[220px]"
          >
            <IntervalSequence intervals={queryIntervals} isActive={true} />
          </DashboardCard>

          <DashboardCard 
            title="2. Query Processing" 
            icon={<Activity className="w-4 h-4 text-green-400" />}
            className="min-h-[430px]"
          >
            <QueryProcessing executionTrace={executionTrace} traceStep={traceStep} isActive={true} queryNotes={result?.simulationData?.queryNotes || []} compact />
          </DashboardCard>
        </div>

        <div className="lg:col-span-2">
          <DashboardCard 
            title="3. DFA Structure" 
            icon={<Layers className="w-4 h-4 text-blue-400" />}
            className="h-full min-h-[676px]"
          >
            <DFAStructure executionTrace={executionTrace} traceStep={traceStep} isActive={true} />
          </DashboardCard>
        </div>

        <div className="lg:col-span-2">
          <DashboardCard 
            title="4. Failure Link Handlers" 
            icon={<Link2Off className="w-4 h-4 text-red-400" />}
            className="h-[280px]"
          >
            <FailureLink executionTrace={executionTrace} traceStep={traceStep} isActive={true} />
          </DashboardCard>
        </div>

        <div className="lg:col-span-1">
          <DashboardCard 
            title="5. Pattern Match Detection" 
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            className="h-[280px]"
          >
            <PatternMatch executionTrace={executionTrace} matchFound={matchFound} songName={songName} isActive={true} />
          </DashboardCard>
        </div>
      </div>

      <div className="w-full mt-8 flex justify-end">
        <button 
          onClick={onComplete}
          className="px-8 py-3 rounded-xl bg-[#9d4edd] hover:bg-[#7b2cbf] text-white font-bold transition-all duration-300 flex items-center gap-2 group shadow-[0_0_20px_rgba(157,78,221,0.4)]"
        >
          View Final Verdict
          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}

function DashboardCard({ title, icon, children, className = '' }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative glass-panel rounded-xl border border-white/10 bg-black/20 flex flex-col overflow-hidden transition-colors duration-500 hover:border-white/20 hover:bg-white/[0.02] ${className}`}
    >
      <div className="p-4 border-b border-white/5 flex items-center gap-3 bg-black/20">
        {icon}
        <h3 className="text-sm font-medium text-white/80">
          {title}
        </h3>
      </div>
      <div className="p-6 flex-1 relative flex items-center justify-center w-full h-full min-h-0">
        {children}
      </div>
    </motion.div>
  );
}
