import React from 'react';
import { motion } from 'framer-motion';
import { Music, Mic } from 'lucide-react';
import { WebGLShader } from './ui/web-gl-shader';
import { Link } from 'react-router-dom';

export default function Hero() {

  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-12 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <WebGLShader />
      </div>
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#9d4edd] opacity-20 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-6 flex flex-col items-center justify-center text-center z-10 w-full">
        
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
              Upload a MIDI file or hum your melody and our engine will scan it against a massive corpus of reference melodies for structural plagiarism.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {/* Midi Button */}
            <Link 
              to="/midi"
              className="group relative glass-panel flex flex-col items-center justify-center p-6 w-full sm:w-48 transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#9d4edd]/20 to-[#ff6d00]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
              <Music size={32} className="text-[#9d4edd] mb-3" />
              <span className="text-lg font-semibold text-white group-hover:glow-text">Import</span>
              <span className="text-xs text-white/40 mt-1">Feed Melody</span>
            </Link>

            {/* Humming Button */}
            <Link 
              to="/humming"
              className="group relative glass-panel flex flex-col items-center justify-center p-6 sm:w-48 transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#9d4edd]/20 to-[#ff6d00]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
              <Mic size={32} className="text-[#ff6d00] mb-3" />
              <span className="text-lg font-semibold text-white group-hover:glow-text">Humming</span>
              <span className="text-xs text-white/40 mt-1">Record Melody</span>
            </Link>
          </div>
          
        </motion.div>

      </div>
    </section>
  );
}
