import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Binary, Scale } from 'lucide-react';

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
      icon: <Sparkles size={32} className="text-[#9d4edd]" />,
      title: "Listens with Logic",
      description: "Music today is judged by ears. MelodyClaim listens with logic. We strip away sound — leaving only structure."
    },
    {
      icon: <Binary size={32} className="text-[#ff6d00]" />,
      title: "A New Language",
      description: "Every melody becomes a sequence, a pattern, a language. What once needed opinion now has form."
    },
    {
      icon: <Scale size={32} className="text-white/80" />,
      title: "Unbiased Precision",
      description: "MelodyClaim is different. Precise. Mathematical. Unbiased. A new way to understand musical similarity."
    }
  ];

  return (
    <section className="relative py-24 pb-48 z-10 bg-gradient-to-b from-transparent to-[#0A0A0A]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
            The Idea
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            A melody that speaks in patterns
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
