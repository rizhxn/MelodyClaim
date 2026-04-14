import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { FileMusic, Mic } from 'lucide-react';
import { WebGLShader } from './ui/web-gl-shader';

export default function Hero({ onFileAccepted, error }) {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, -100]);
  const y2 = useTransform(scrollY, [0, 500], [0, -150]);

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
      
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center z-10 w-full"
           onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
        
        {/* Left text column */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="flex flex-col gap-8"
        >
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
              Secure your sound with <br/>
              <span className="glow-text">automata-powered</span> precision.
            </h1>
            <p className="text-lg text-white/60 max-w-xl">
              Upload a MIDI file and our engine will scan it against a massive corpus of reference melodies for structural plagiarism.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
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

        {/* Right 3D Cards parallax */}
        <div className="relative h-[500px] hidden lg:block">
          <motion.div style={{ y: y1 }} className="absolute top-10 right-20 z-20">
            <div className="glass-panel w-64 h-80 p-6 flex flex-col justify-between overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#9d4edd]/10 to-transparent"></div>
              <div className="w-full flex justify-between items-start">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">♪</div>
                <div className="px-3 py-1 rounded-full bg-[#1D9E75]/20 text-[#1D9E75] text-xs font-mono font-bold">MATCH</div>
              </div>
              <div className="space-y-3 mt-auto relative z-10">
                <div className="h-2 w-3/4 bg-white/20 rounded-full"></div>
                <div className="h-2 w-1/2 bg-white/20 rounded-full"></div>
                <div className="mt-4 flex gap-1 items-end h-12">
                   {[40, 70, 45, 90, 60, 30].map((h, i) => (
                     <div key={i} className="w-full bg-[#9d4edd] rounded-t-sm" style={{height: `${h}%`}}></div>
                   ))}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div style={{ y: y2 }} className="absolute top-40 right-0 z-10 opacity-60">
            <div className="glass-panel w-56 h-72 p-6 flex flex-col justify-between overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#ff6d00]/10 to-transparent"></div>
              <div className="w-full flex justify-between items-start">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">♬</div>
                <div className="px-3 py-1 rounded-full bg-[#d4a843]/20 text-[#d4a843] text-xs font-mono font-bold">SCANNING</div>
              </div>
              <div className="space-y-3 mt-auto relative z-10">
                <div className="h-2 w-full bg-white/20 rounded-full"></div>
                <div className="h-2 w-2/3 bg-white/20 rounded-full"></div>
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
