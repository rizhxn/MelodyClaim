import React from 'react';
import { motion } from 'framer-motion';
import { WebGLShader } from '../components/ui/web-gl-shader';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mic } from 'lucide-react';

export default function HummingPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center pt-24 pb-12 overflow-hidden">
      <WebGLShader />
      <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#ff6d00] opacity-10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-3xl w-full mx-auto px-6 z-10">
        <Link to="/" className="inline-flex items-center text-white/50 hover:text-white mb-8 transition-colors">
          <ArrowLeft size={20} className="mr-2" />
          Back to Home
        </Link>
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass-panel p-8 md:p-16 text-center flex flex-col items-center justify-center min-h-[400px] border-[#ff6d00]/20"
        >
          <div className="w-20 h-20 rounded-full bg-[#ff6d00]/10 flex items-center justify-center mb-6">
             <Mic size={40} className="text-[#ff6d00]" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Humming Interface</h2>
          <p className="text-white/60 mb-8 max-w-lg mx-auto text-lg hover:glow-text">
            Our real-time pitch detection AI is still undergoing rigorous training.
          </p>
          <div className="inline-block bg-[#ff6d00]/20 text-[#ff6d00] px-4 py-2 rounded-full font-semibold border border-[#ff6d00]/30 tracking-wider">
            COMING SOON
          </div>
        </motion.div>
      </div>
    </div>
  );
}