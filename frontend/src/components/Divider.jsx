import React from 'react';

export default function Divider() {
  return (
    <div className="w-full relative h-[150px] overflow-hidden leading-[0]">
      {/* 3D Organic Wave Divider */}
      <svg 
        viewBox="0 0 1440 320" 
        className="absolute bottom-0 w-full h-[150%] opacity-30 drop-shadow-[0_-5px_15px_rgba(157,78,221,0.5)]" 
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9d4edd" />
            <stop offset="50%" stopColor="#ff6d00" />
            <stop offset="100%" stopColor="#8338ec" />
          </linearGradient>
        </defs>
        <path 
          fill="url(#wave-gradient)" 
          d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,245.3C1248,256,1344,224,1392,208L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        ></path>
      </svg>
    </div>
  );
}
