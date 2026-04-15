import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, User, Lock, Mail } from 'lucide-react';
import { WebGLShader } from '../components/ui/web-gl-shader';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = (e) => {
    e.preventDefault();
    // Simulate signup for now
    alert("Signup implementation coming soon");
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center pt-24 pb-12 overflow-hidden">
      <WebGLShader />
      {/* Background ambient glow matching the main theme - alternate side */}
      <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#ff6d00] opacity-20 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-md w-full mx-auto px-6 z-10 relative">
        <Link to="/" className="inline-flex items-center text-white/50 hover:text-white mb-8 transition-colors">
          <ArrowLeft size={20} className="mr-2" />
          Back to Home
        </Link>
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass-panel p-8 md:p-10 relative overflow-hidden"
        >
          {/* subtle header gradient */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#ff6d00] to-[#9d4edd] opacity-80" />

          <h2 className="text-3xl font-bold mb-2 text-white text-center">Join MelodyClaim</h2>
          <p className="text-white/50 text-center mb-8">Start organizing and protecting your melodies.</p>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-white/40" />
                </div>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-[#0A0A0A]/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-white/30 focus:outline-none focus:border-[#9d4edd] focus:ring-1 focus:ring-[#9d4edd] transition-all"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-white/40" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#0A0A0A]/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-white/30 focus:outline-none focus:border-[#ff6d00] focus:ring-1 focus:ring-[#ff6d00] transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-white/40" />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-[#0A0A0A]/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-white/30 focus:outline-none focus:border-[#9d4edd] focus:ring-1 focus:ring-[#9d4edd] transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full relative group mt-8"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#ff6d00] to-[#9d4edd] rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative border border-white/20 bg-black/50 py-3 rounded-xl font-semibold text-white tracking-wide hover:bg-transparent transition-colors duration-300 text-center">
                Create Account
              </div>
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-white/50">
            Already have an account?{' '}
            <Link to="/login" className="text-[#ff6d00] hover:text-[#9d4edd] font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}