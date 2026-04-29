import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Music, X, Mic } from 'lucide-react';
import { WebGLShader } from '../components/ui/web-gl-shader';
import { motion, AnimatePresence } from 'framer-motion';
import { HummingInput } from '../components/HummingInput';

export default function HummingPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  
  const navigate = useNavigate();

  const handleHummingComplete = async (notes) => {
    setIsProcessing(true);
    setMatchResult(null);

    try {
      const response = await fetch('/api/analyse/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) throw new Error('Analysis failed');

      const data = await response.json();
      
      if (data.primaryMatch) {
        setMatchResult({
          found: true,
          song: data.primaryMatch.songName,
          artist: data.primaryMatch.artist,
          rawData: data
        });
      } else {
        setMatchResult({ found: false });
      }
    } catch (error) {
      console.error(error);
      setMatchResult({ found: false });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center pt-24 pb-12 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <WebGLShader />
      </div>
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#9d4edd] opacity-10 blur-[120px] rounded-full pointer-events-none -z-10"></div>

      <div className="fixed top-4 pt-safe left-1/2 -translate-x-1/2 w-full max-w-[90%] md:max-w-md z-50 px-4 pointer-events-auto">
        <AnimatePresence>
          {matchResult && (
            <motion.div
              initial={{ y: -50, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -50, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', bounce: 0.4, duration: 0.6 }}
              className="bg-[#121212]/90 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] rounded-[32px] p-2 flex items-center justify-between border border-white/5 overflow-hidden w-full max-w-full"
            >
              {matchResult.found ? (
                <>
                  <div className="flex items-center gap-3 w-full overflow-hidden">
                    {/* Album Art Placeholder */}
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-tr from-[#9d4edd] to-purple-500 shrink-0 flex items-center justify-center relative">
                      <Music size={22} className="text-white opacity-80" />
                    </div>
                    
                    {/* Song Info */}
                    <div className="flex flex-col flex-1 min-w-0 pr-2">
                      <h3 className="text-white font-semibold text-[15px] leading-snug truncate">{matchResult.song}</h3>
                      <p className="text-white/60 font-medium text-[13px] leading-snug truncate">{matchResult.artist}</p>
                    </div>

                    {/* Action Button */}
                    <button 
                      onClick={() => navigate('/midi', { state: { result: matchResult.rawData } })}
                      className="bg-[#2E2E32] hover:bg-[#3D3D42] transition-colors rounded-full px-4 py-2 text-[#9d4edd] font-bold text-[12px] flex-shrink-0 whitespace-nowrap mr-1 tracking-wide"
                    >
                      Full Result
                    </button>
                    <button onClick={() => setMatchResult(null)} className="p-1 mr-1 opacity-50 hover:opacity-100 transition-opacity text-white shrink-0">
                      <X size={16} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3 w-full p-2">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <X size={20} className="text-white/60" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">No matches found</p>
                    <p className="text-white/50 text-xs">Your melody appears to be unique</p>
                  </div>
                  <button 
                    onClick={() => setMatchResult(null)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors mr-1"
                  >
                    <X size={16} className="text-white/60" />
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="max-w-3xl w-full mx-auto px-6 z-10 text-center">
        <div className="flex justify-start mb-8">
          <Link to="/" className="inline-flex items-center text-white/50 hover:text-white transition-colors">
            <ArrowLeft size={20} className="mr-2" />
            Back to Home
          </Link>
        </div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="glass-panel p-8 md:p-16 text-center flex flex-col items-center justify-center min-h-[400px] border-[#9d4edd]/20"
        >
          {isProcessing ? (
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-[#9d4edd]/30 border-t-[#9d4edd] rounded-full animate-spin mx-auto mb-6"></div>
              <h2 className="text-2xl font-bold text-white mb-2">Analyzing...</h2>
              <p className="text-white/60">Scanning corpus for structural overlaps</p>
            </div>
          ) : (
            <div className="text-center w-full flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-[#9d4edd]/10 flex items-center justify-center mb-6">
                <Mic size={40} className="text-[#9d4edd]" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Hum Your Melody</h2>
              <p className="text-white/60 mb-8 max-w-lg mx-auto text-lg hover:glow-text">
                Click to start humming your melody. We will extract its structural progression and analyze it against our database.
              </p>
              
              <HummingInput onComplete={handleHummingComplete} />
              
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
