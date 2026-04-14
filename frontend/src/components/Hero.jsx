import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { FileMusic, Mic } from 'lucide-react';
import { WebGLShader } from './ui/web-gl-shader';

export default function Hero({ onFileAccepted, error }) {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (file) => {
    const ext = file.name.toLowerCase().split('.').pop();
    if (ext === 'mid' || ext === 'midi') {
      onFileAccepted(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
    e.target.value = '';
  };

  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-12 overflow-hidden">
      <WebGLShader />
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#9d4edd] opacity-20 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-6 flex flex-col items-center justify-center text-center z-10 w-full"
           onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
        
        {/* Main centered content */}
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="flex flex-col items-center gap-8"
        >
          <div className="space-y-4 flex flex-col items-center">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
              Secure your sound with <br/>
              <span className="glow-text">automata-powered</span> precision.
            </h1>
            <p className="text-lg text-white/60 max-w-xl mx-auto">
              Upload a MIDI file and our engine will scan it against a massive corpus of reference melodies for structural plagiarism.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {/* Midi Button */}
            <button 
              onClick={handleUploadClick}
              className={`group relative glass-panel flex flex-col items-center justify-center p-6 sm:w-48 transition-all duration-300 hover:scale-[1.02] ${dragActive ? 'border-[#9d4edd] bg-white/10' : ''}`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#9d4edd]/20 to-[#ff6d00]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
              <FileMusic size={32} className="text-[#9d4edd] mb-3" />
              <span className="text-lg font-semibold text-white group-hover:glow-text">Upload MIDI</span>
              <span className="text-xs text-white/40 mt-1">or Drag & Drop</span>
              <input 
                ref={fileInputRef} 
                type="file" 
                accept=".mid,.midi" 
                className="hidden" 
                onChange={handleInputChange} 
              />
            </button>

            {/* Humming Button */}
            <button 
              onClick={() => alert("coming soon")}
              className="group relative glass-panel flex flex-col items-center justify-center p-6 sm:w-48 transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#9d4edd]/20 to-[#ff6d00]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
              <Mic size={32} className="text-[#ff6d00] mb-3" />
              <span className="text-lg font-semibold text-white group-hover:glow-text">Humming</span>
              <span className="text-xs text-white/40 mt-1">Coming Soon</span>
            </button>
          </div>
          
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              ⚠ {error}
            </motion.div>
          )}
        </motion.div>

      </div>
    </section>
  );
}
