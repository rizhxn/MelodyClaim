import { useState, useCallback, useRef } from 'react';
import ProcessingState from './components/ProcessingState';
import VerdictCard from './components/VerdictCard';
import PianoRoll from './components/PianoRoll';
import IntervalEvidence from './components/IntervalEvidence';
import HowItWorks from './components/HowItWorks';
import { Navbar } from './components/ui/mini-navbar';
import Hero from './components/Hero';
import Divider from './components/Divider';
import Features from './components/Features';

// App states
const STATE = {
  UPLOAD: 'upload',
  PROCESSING: 'processing',
  RESULTS: 'results',
};

// Minimum display time for processing state (ms)
const MIN_PROCESSING_TIME = 2500;

export default function App() {
  const [appState, setAppState] = useState(STATE.UPLOAD);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const processingStartRef = useRef(null);

  const handleFileAccepted = useCallback(async (file) => {
    setAppState(STATE.PROCESSING);
    setError(null);
    processingStartRef.current = Date.now();

    try {
      const formData = new FormData();
      formData.append('midi', file);

      const responsePromise = fetch('/api/analyse', {
        method: 'POST',
        body: formData,
      });

      // Wait for both the API response and minimum display time
      const [response] = await Promise.all([
        responsePromise,
        new Promise(resolve => {
          const checkElapsed = () => {
            const elapsed = Date.now() - processingStartRef.current;
            if (elapsed >= MIN_PROCESSING_TIME) {
              resolve();
            } else {
              setTimeout(resolve, MIN_PROCESSING_TIME - elapsed);
            }
          };
          checkElapsed();
        }),
      ]);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      setAppState(STATE.RESULTS);
    } catch (err) {
      console.error('Analysis failed:', err);
      setError(err.message || 'Analysis failed. Please try again.');
      setAppState(STATE.UPLOAD);
    }
  }, []);

  const handleReset = useCallback(() => {
    setAppState(STATE.UPLOAD);
    setResult(null);
    setError(null);
  }, []);

  return (
    <div className="bg-[#0A0A0A] min-h-screen text-white font-sans overflow-x-hidden selection:bg-[#9d4edd]/30 flex flex-col">
      <Navbar />

      <main className="relative flex-1">
        {/* Upload State / Landing Page */}
        {appState === STATE.UPLOAD && (
          <div className="relative">
            <Hero onFileAccepted={handleFileAccepted} error={error} />
            <Features />
          </div>
        )}

        {/* Processing State */}
        {appState === STATE.PROCESSING && (
          <div className="max-w-7xl mx-auto px-6 py-24 min-h-[80vh] flex items-center justify-center">
             <ProcessingState />
          </div>
        )}

        {/* Results State */}
        {appState === STATE.RESULTS && result && (
          <div className="max-w-7xl mx-auto px-6 py-32 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6 pt-10">
              <h2 className="text-4xl font-bold tracking-tight">Analysis <span className="glow-text">Results</span></h2>
              <button
                id="reset-button"
                className="group relative px-6 py-3 glass-panel hover:bg-white/10 transition-all duration-300 overflow-hidden flex items-center justify-center"
                onClick={handleReset}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#9d4edd]/20 to-[#ff6d00]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="text-white relative z-10 font-medium tracking-wide">← Analyze Another</span>
              </button>
            </div>

            <div className="grid gap-8">
              <div className="glass-panel p-2">
                <VerdictCard result={result} />
              </div>

              {result.primaryMatch && (
                <>
                  <div className="glass-panel p-6 border-white/10 mt-4">
                    <PianoRoll
                      queryNotes={result.primaryMatch.queryNotes || []}
                      referenceNotes={result.primaryMatch.referenceNotes || []}
                      matchStart={result.primaryMatch.queryStart}
                      matchEnd={result.primaryMatch.queryEnd}
                      referenceStart={result.primaryMatch.referenceStart}
                      referenceEnd={result.primaryMatch.referenceEnd}
                    />
                  </div>

                  <div className="glass-panel p-6 border-white/10 mt-8">
                    <IntervalEvidence
                      queryIntervals={result.primaryMatch.queryIntervals || []}
                      matchStart={result.primaryMatch.queryStart}
                      matchEnd={result.primaryMatch.queryEnd}
                    />
                  </div>
                </>
              )}
            </div>
            
            <div className="mt-32">
               <HowItWorks />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 border-t border-white/10 text-white/40 text-sm mt-auto relative z-10 glass-panel border-b-0 border-l-0 border-r-0 rounded-none rounded-t-3xl">
        MelodyClaim — Built with <span className="text-[#9d4edd]">Aho-Corasick automata</span> and formal interval theory
      </footer>
    </div>
  );
}
