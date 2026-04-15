import React from 'react';
import { motion } from 'framer-motion';
import UploadZone from '../components/UploadZone';
import { WebGLShader } from '../components/ui/web-gl-shader';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function MidiPage({ onFileAccepted, error }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center pt-24 pb-12 overflow-hidden">
      <WebGLShader />
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#9d4edd] opacity-10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-3xl w-full mx-auto px-6 z-10">
        <Link to="/" className="inline-flex items-center text-white/50 hover:text-white mb-8 transition-colors">
          <ArrowLeft size={20} className="mr-2" />
          Back to Home
        </Link>
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass-panel p-8 md:p-16 text-center flex flex-col items-center justify-center min-h-[400px] border-[#9d4edd]/20"
        >
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              ⚠ {error}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}