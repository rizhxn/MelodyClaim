import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, Square, Loader2, Music, X } from 'lucide-react';
import { WebGLShader } from '../components/ui/web-gl-shader';
import { processAudioToMidi } from '../lib/hummingToMidi';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCw } from 'lucide-react';

export default function HummingPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyzerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [audioData, setAudioData] = useState(new Array(5).fill(20));
  
  const navigate = useNavigate();

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Audio Analyzer for Live Visuals
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const analyzer = audioCtx.createAnalyser();
      analyzer.fftSize = 32;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyzer);
      analyzerRef.current = analyzer;

      const dataArray = new Uint8Array(analyzer.frequencyBinCount);
      const updateWaveform = () => {
        analyzer.getByteFrequencyData(dataArray);
        setAudioData([
          dataArray[2] || 20,
          dataArray[4] || 20,
          dataArray[6] || 20,
          dataArray[8] || 20,
          dataArray[10] || 20,
        ]);
        animationFrameRef.current = requestAnimationFrame(updateWaveform);
      };
      updateWaveform();

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current) audioContextRef.current.close();
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleAudioProcessing(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setMatchResult(null);
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Microphone access is required to use this feature.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const handleAudioProcessing = async (audioBlob) => {
    try {
      const midiBlob = await processAudioToMidi(audioBlob);
      const formData = new FormData();
      formData.append('midi', midiBlob, 'hummed.mid');

      const response = await fetch('http://localhost:3001/api/analyse', {
        method: 'POST',
        body: formData,
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
      <WebGLShader />
      <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#ff6d00] opacity-10 blur-[120px] rounded-full pointer-events-none"></div>

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
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-tr from-[#ff6d00] to-orange-500 shrink-0 flex items-center justify-center relative">
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
                      className="bg-[#2E2E32] hover:bg-[#3D3D42] transition-colors rounded-full px-4 py-2 text-[#ff6d00] font-bold text-[12px] flex-shrink-0 whitespace-nowrap mr-1 tracking-wide"
                    >
                      Full Result
                    </button>
                    <button onClick={() => setMatchResult(null)} className="p-1 mr-1 opacity-50 hover:opacity-100 transition-opacity text-white shrink-0">
                      <X size={16} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-1 items-center justify-between px-5 py-2">
                    <span className="text-white font-semibold text-[16px]">No song found.</span>
                    <button 
                      onClick={() => setMatchResult(null)} 
                      className="w-10 h-10 rounded-full bg-[#2E2E32] hover:bg-[#3D3D42] transition-colors shrink-0 flex items-center justify-center text-[#ff6d00]"
                    >
                      <RotateCw size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="max-w-3xl w-full mx-auto px-6 z-10">
        <Link to="/" className="inline-flex items-center text-white/50 hover:text-white mb-8 transition-colors">
          <ArrowLeft size={20} className="mr-2" />
          Back to Home
        </Link>
        <div className="glass-panel p-8 md:p-16 text-center flex flex-col items-center justify-center min-h-[400px] border-[#ff6d00]/20">
          
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Humming Interface</h2>
          <p className="text-white/60 mb-8 max-w-lg mx-auto text-lg hover:glow-text">
            Tap and hold to hum a melody. We\'ll find out where it structurally comes from.
          </p>

          <div className="relative h-48 flex items-center justify-center w-full mb-4">
            {!isProcessing ? (
              <button
                onMouseDown={handleStartRecording}
                onMouseUp={handleStopRecording}
                onTouchStart={handleStartRecording}
                onTouchEnd={handleStopRecording}
                className={`absolute z-20 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isRecording
                    ? "bg-[#ff6d00] scale-[0.85] shadow-[0_0_50px_rgba(255,109,0,0.6)]"
                    : "bg-[#ff6d00]/10 text-[#ff6d00] hover:bg-[#ff6d00]/20 border border-[#ff6d00]/30"
                }`}
              >
                {isRecording ? <Square size={40} className="text-white" /> : <Mic size={48} />}
              </button>
            ) : (
              <div className="flex flex-col items-center text-[#ff6d00] z-20">
                <Loader2 className="w-16 h-16 animate-spin mb-4" />
                <p className="font-semibold text-lg animate-pulse">Processing Audio...</p>
              </div>
            )}

            {/* Live Audio Waveform Animation behind the button */}
            {isRecording && (
              <div className="absolute inset-0 flex items-center justify-center gap-1 z-10 opacity-70">
                {audioData.map((val, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: Math.max(20, val) }}
                    transition={{ type: 'tween', duration: 0.1 }}
                    className="w-3 bg-[#ff6d00]/50 rounded-full"
                  />
                ))}
              </div>
            )}
          </div>

          <p className="mt-2 text-white/40 text-sm font-medium">
            {isRecording ? "Listening... Release to analyze" : "Press and hold"}
          </p>
        </div>
      </div>
    </div>
  );
}
