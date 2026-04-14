import React from 'react';
import { motion } from 'framer-motion';
import { Download, Mic2, FileSearch } from 'lucide-react';

export default function Features() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 50 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const features = [
    {
      icon: <FileSearch size={32} className="text-[#9d4edd]" />,
      title: "Automata Scanning",
      description: "Aho-Corasick trie structures rapidly scan your melody against thousands of references in O(N)."
    },
    {
      icon: <Download size={32} className="text-[#ff6d00]" />,
      title: "MIDI Export",
      description: "Extract directly from your DAW. We compare purely the structural melodic core."
    },
    {
      icon: <Mic2 size={32} className="text-white/80" />,
      title: "Voice-to-Melody",
      description: "Hum your idea directly. We convert audio to symbolic MIDI via real-time pitch detection. (Coming Soon)"
    }
  ];

  return (
    <section className="relative py-24 pb-48 z-10 bg-gradient-to-b from-transparent to-[#0A0A0A]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
            Powerful Pipeline
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            Our technology seamlessly parses, normalizes, and compares structures mathematically.
          </p>
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-3 gap-8"
        >
          {features.map((feat, i) => (
            <motion.div 
              key={i}
              variants={item}
              className="glass-panel p-8 group hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(157,78,221,0.2)] hover:border-[#9d4edd]/50 transition-all duration-300 focus-within:-translate-y-2 focus-within:shadow-[0_20px_40px_rgba(157,78,221,0.2)] focus-within:border-[#9d4edd]/50"
              tabIndex={0}
            >
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 focus-within:scale-110 transition-transform duration-300 border border-white/10 group-hover:border-[#9d4edd]/30 focus-within:border-[#9d4edd]/30">
                {feat.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 group-hover:glow-text focus-within:glow-text">{feat.title}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{feat.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
