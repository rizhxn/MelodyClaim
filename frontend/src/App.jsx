import { useState, useCallback, useRef, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import ProcessingState from './components/ProcessingState';
import VerdictCard from './components/VerdictCard';
import PianoRoll from './components/PianoRoll';
import IntervalEvidence from './components/IntervalEvidence';
import HowItWorks from './components/HowItWorks';
import { Navbar } from './components/ui/mini-navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import MidiPage from './pages/MidiPage';
import HummingPage from './pages/HummingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import { AuthCallback } from './pages/AuthCallback.jsx';

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

  const location = useLocation();
  const navigate = useNavigate();
  const hideNavbar = location.pathname === '/midi' || location.pathname === '/humming';

  // Listen for redirected state from HummingPage's "Full Analysis" Dynamic Island button
  useEffect(() => {
    if (location.state && location.state.result && appState === STATE.UPLOAD) {
      setResult(location.state.result);
      setAppState(STATE.RESULTS);
      // Clear the state so refreshing doesn't lock it
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, appState, navigate, location.pathname]);

  return (
    <div className="bg-[#0A0A0A] min-h-screen text-white font-sans overflow-x-hidden selection:bg-[#9d4edd]/30 flex flex-col">
      {!hideNavbar && <Navbar />}

      <main className="relative flex-1 flex flex-col">
        {/* Upload State / Landing Page with Routing */}
        {appState === STATE.UPLOAD && (
          <Routes>
            <Route path="/" element={
              <div className="relative">
                <Hero />
                <Features />
              </div>
            } />
            <Route path="/midi" element={<MidiPage onFileAccepted={handleFileAccepted} error={error} />} />
            <Route path="/humming" element={<HummingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
          </Routes>
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

      {/* Custom Transparent Footer */}
      <footer className="w-full relative z-10 text-white/50 bg-transparent">
        <div className="max-w-7xl mx-auto px-6 pb-8 flex flex-col items-center">
            <div className="w-full border-t border-white/10 mb-8"></div>
            <p className="text-center max-w-xl text-sm font-normal leading-relaxed text-white/70 mb-8">
                Empowering creators worldwide with the most advanced AI music plagiarism detection tools. Transform your ideas into reality without fear of copyright strikes.
            </p>
            <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-sm font-normal">Copyright © 2026 <a href="#" className="text-white hover:text-[#9d4edd] transition-colors">MelodyClaim</a>. All rights reserved.</p>
                <div className="flex items-center gap-6 text-sm">
                    <a href="#" className="font-medium text-white/70 hover:text-white transition-all">
                        Brand Guidelines
                    </a>
                    <div className="h-4 w-px bg-white/20"></div>
                    <a href="#" className="font-medium text-white/70 hover:text-white transition-all">
                        Trademark Policy
                    </a>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}
