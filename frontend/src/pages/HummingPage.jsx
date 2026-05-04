import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Music, X, Mic } from 'lucide-react';
import { HummingInput } from '../components/HummingInput';

export default function HummingPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  
  const navigate = useNavigate();

  const buildApiReportData = (match) => ({
    verdict: 'STRUCTURAL_MATCH',
    summary: `External humming recognition identified "${match.songName}" by ${match.artist}.`,
    primaryMatch: {
      songName: match.songName,
      artist: match.artist,
      year: '',
      matchLength: 0,
      severity: 'EXTERNAL_AUDIO_MATCH',
      matchedIntervalSequence: [],
      queryStart: 0,
      queryEnd: 0,
      referenceStart: 0,
      referenceEnd: 0,
    },
    query: {
      fileName: 'Hummed Audio',
      noteCount: 0,
      intervalCount: 0,
    },
    simulationData: {
      queryIntervals: [],
      queryNotes: [],
    },
  });

  const recognizeWithExternalApi = async (audioBlob) => {
    if (!audioBlob) {
      return { configured: false, match: null };
    }

    const formData = new FormData();
    formData.append('audio', audioBlob, 'humming.webm');

    const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;
    if (!API_BASE_URL) throw new Error('VITE_BACKEND_URL is not defined in the environment.');
    
    const response = await fetch(`${API_BASE_URL}/api/recognize/humming`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      return { configured: false, match: null };
    }

    const data = await response.json();
    return {
      configured: Boolean(data.configured),
      match: data.configured && data.match ? data.match : null,
    };
  };

  const analyzeWithLocalMatcher = async (notes) => {
    const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;
    if (!API_BASE_URL) throw new Error('VITE_BACKEND_URL is not defined in the environment.');
    
    const response = await fetch(`${API_BASE_URL}/api/analyse/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notes }),
    });

    if (!response.ok) throw new Error('Analysis failed');

    return response.json();
  };

  const handleHummingComplete = async ({ notes, audioBlob }) => {
    setIsProcessing(true);
    setMatchResult(null);

    try {
      const externalResult = await recognizeWithExternalApi(audioBlob);

      if (externalResult.match) {
        setMatchResult({
          found: true,
          song: externalResult.match.songName,
          artist: externalResult.match.artist,
          source: 'Humming API',
          rawData: buildApiReportData(externalResult.match),
        });
        return;
      }

      const data = await analyzeWithLocalMatcher(notes);
      
      if (data.primaryMatch) {
        setMatchResult({
          found: true,
          song: data.primaryMatch.songName,
          artist: data.primaryMatch.artist,
          source: externalResult.configured ? 'Local corpus fallback' : 'Local corpus - API not configured',
          rawData: data,
        });
      } else {
        setMatchResult({
          found: false,
          reason: externalResult.configured
            ? 'Humming API and local corpus found no match'
            : 'Humming API is not configured. Local corpus found no match.',
        });
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
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#9d4edd] opacity-10 blur-[120px] rounded-full pointer-events-none -z-10"></div>

      <div className="fixed top-4 pt-safe left-1/2 -translate-x-1/2 w-full max-w-[90%] md:max-w-md z-50 px-4 pointer-events-auto">
        {matchResult && (
            <div
              className="bg-[#121212]/90 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] rounded-[32px] p-2 flex items-center justify-between border border-white/5 overflow-hidden w-full max-w-full"
            >
              {matchResult.found ? (
                <div className="flex items-center gap-3 w-full p-2">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Music size={20} className="text-white/60" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium truncate">{matchResult.song}</p>
                    <p className="text-white/50 text-xs truncate">
                      {matchResult.artist}{matchResult.source ? ` - ${matchResult.source}` : ''}
                    </p>
                  </div>
                  <button 
                    onClick={() => navigate('/midi', { state: { result: matchResult.rawData } })}
                    className="bg-[#2E2E32] hover:bg-[#3D3D42] transition-colors rounded-full px-4 py-2 text-[#9d4edd] font-bold text-[12px] flex-shrink-0 whitespace-nowrap mr-1 tracking-wide"
                  >
                    Full Result
                  </button>
                  <button 
                    onClick={() => setMatchResult(null)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors mr-1"
                  >
                    <X size={16} className="text-white/60" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 w-full p-2">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <X size={20} className="text-white/60" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">No matches found</p>
                    <p className="text-white/50 text-xs">{matchResult.reason || 'Your melody appears to be unique'}</p>
                  </div>
                  <button 
                    onClick={() => setMatchResult(null)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors mr-1"
                  >
                    <X size={16} className="text-white/60" />
                  </button>
                </div>
              )}
            </div>
          )}
      </div>

      <div className="max-w-3xl w-full mx-auto px-6 z-10 text-center">
        <div className="flex justify-start mb-8">
          <Link to="/" className="inline-flex items-center text-white/50 hover:text-white transition-colors">
            <ArrowLeft size={20} className="mr-2" />
            Back to Home
          </Link>
        </div>

        <div 
          className="glass-panel p-8 md:p-16 text-center flex flex-col items-center justify-center min-h-[400px] border-[#9d4edd]/20"
        >
          {isProcessing ? (
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-[#9d4edd]/30 border-t-[#9d4edd] rounded-full animate-spin mx-auto mb-6"></div>
              <h2 className="text-2xl font-bold text-white mb-2">Analyzing...</h2>
              <p className="text-white/60">Checking humming recognition and local corpus</p>
            </div>
          ) : (
            <div className="text-center w-full flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-[#9d4edd]/10 flex items-center justify-center mb-6">
                <Mic size={40} className="text-[#9d4edd]" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Hum Your Melody</h2>
              <p className="text-white/60 mb-8 max-w-lg mx-auto text-lg hover:glow-text">
                Click to start humming your melody. We will search by audio first, then compare the extracted melody against the local corpus.
              </p>
              
              <HummingInput onComplete={handleHummingComplete} />
              
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
