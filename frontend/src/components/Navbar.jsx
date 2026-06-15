import React from 'react';
import { motion } from 'framer-motion';
import { LogIn } from 'lucide-react';

export default function Navbar() {
  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
    >
      <div className="max-w-7xl mx-auto glass-panel px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-[#9d4edd] to-[#ff6d00] flex items-center justify-center shadow-[0_0_15px_rgba(157,78,221,0.5)]">
            <span className="text-white text-lg font-bold leading-none">♪</span>
          </div>
          <span className="text-xl font-bold tracking-wide text-white font-sans">
            Melody<span className="glow-text">claim</span>
          </span>
        </div>

        {/* Right Side */}
        <button 
          onClick={() => alert("Coming soon")}
          className="group relative px-5 py-2 glass-panel hover:bg-white/10 transition-all duration-300 flex items-center gap-2 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#9d4edd]/20 to-[#ff6d00]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">Sign In</span>
          <LogIn size={16} className="text-white/70 group-hover:text-white transition-colors" />
        </button>
      </div>
    </motion.nav>
  );
}
