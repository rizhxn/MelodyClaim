import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WebGLShader } from './ui/web-gl-shader';
import { ChevronRight } from 'lucide-react';

// Import individual steps
import NoteSequenceStep from './analysis/NoteSequenceStep';
import IntervalEncoderStep from './analysis/IntervalEncoderStep';
import PatternMatchingStep from './analysis/PatternMatchingStep';
import ThresholdFilterStep from './analysis/ThresholdFilterStep';

// Import final dashboard
import AhoCorasickDashboard from './analysis/AhoCorasickDashboard';

export default function ProcessingState({ result, onComplete }) {
  // sequence: 0 = Note Sequence, 1 = Interval Encoder, 2 = Pattern Matching, 3 = Threshold Filter, 4 = Final Dashboard
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // If there's no result yet, stay on loading (step 0 doesn't advance until result is ready)
    if (!result) return;

    // Timeings for each step
    const stepDurations = [
      4000, // 0: Note Sequence
      4000, // 1: Interval Encoder
      // Pattern Matching: Cap at 6 seconds to avoid unnecessary delay, min 5s
      Math.min(6000, Math.max(5000, (result?.simulationData?.executionTrace?.length || 0) * 300 + 1000)), // 2: Pattern Matching
      4000, // 3: Threshold Filter
    ];

    if (currentStep < 4) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, stepDurations[currentStep]);

      return () => clearTimeout(timer);
    }
  }, [currentStep, result]);

  // Extract necessary data from result
  const queryNotes = result?.simulationData?.queryNotes || [];
  const executionTrace = result?.simulationData?.executionTrace || [];
  const queryIntervals = executionTrace.map(t => t.symbol) || [];
  const allMatches = result?.allMatches || [];

  return (
    <div className="w-full relative z-10 flex flex-col items-center justify-center overflow-hidden pt-8 min-h-[80vh]">
      <WebGLShader />
      
      <div className="relative z-10 w-full flex flex-col items-center justify-center flex-1 px-4">
        
        {/* Render Step One By One */}
        <div className="w-full max-w-5xl relative flex items-center justify-center h-full min-h-[500px]">
          <AnimatePresence mode="wait">
            {!result && (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-white/50 animate-pulse font-mono text-xl"
              >
                Initializing Plagiarism Detection Engine...
              </motion.div>
            )}

            {result && currentStep === 0 && (
              <NoteSequenceStep key="step-0" notes={queryNotes} />
            )}
            
            {result && currentStep === 1 && (
              <IntervalEncoderStep key="step-1" intervals={queryIntervals} />
            )}
            
            {result && currentStep === 2 && (
              <PatternMatchingStep key="step-2" executionTrace={executionTrace} />
            )}
            
            {result && currentStep === 3 && (
              <ThresholdFilterStep key="step-3" allMatches={allMatches} />
            )}

            {result && currentStep === 4 && (
              <motion.div
                key="step-final"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="w-full flex justify-center"
              >
                <AhoCorasickDashboard result={result} onComplete={onComplete} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Global Skip Button - Only shown when NOT on the final dashboard (step 4) */}
        {result && currentStep < 4 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-10 z-20"
          >
            <button 
              onClick={() => setCurrentStep(4)} // Skip to final dashboard
              className="px-8 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-all duration-300 flex items-center gap-2 group border border-white/10 hover:border-white/20 shadow-lg backdrop-blur-md"
            >
              Skip to results overview
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
