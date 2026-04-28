import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AuthComponent } from '../components/ui/sign-up';
import { WebGLShader } from '../components/ui/web-gl-shader';

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center pt-24 pb-12 overflow-hidden bg-black">
      <WebGLShader />
      {/* Background ambient glow matching the main theme */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#9d4edd] opacity-10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-3xl w-full mx-auto px-6 z-10">
        <Link to="/" className="inline-flex items-center text-white/50 hover:text-white mb-8 transition-colors">
          <ArrowLeft size={20} className="mr-2" />
          Back to Home
        </Link>
        
        <div className="relative border border-[#27272a] p-2 w-full mx-auto max-w-3xl backdrop-blur-sm">
          <main className="relative border border-[#27272a] py-16 px-4 sm:px-8 overflow-hidden flex flex-col items-center justify-center bg-black/40 min-h-[400px]">
            <AuthComponent isSignUp={false} brandName="MelodyClaim" />
            
            <div className="text-center text-white/50 relative z-50 mt-8">
              Don't have an account?{' '}
              <Link to="/signup" className="text-[#9d4edd] hover:text-[#ff6d00] font-medium transition-colors">
                Sign up
              </Link>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}