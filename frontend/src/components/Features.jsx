import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Binary, Scale, Music2, Keyboard, Mic } from 'lucide-react';
import { Link } from 'react-router-dom';

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
    <div className="relative z-10 pb-24">
      <section id="about" className="scroll-mt-32 py-24">
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

      <section id="midi" className="scroll-mt-32 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <motion.article
            variants={item}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="glass-panel p-6 md:p-10"
          >
            <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-8 lg:gap-10 items-center">
              <div>
                <h3 className="text-2xl md:text-3xl font-semibold text-white mb-4">MIDI</h3>
                <p className="text-white/60 text-sm md:text-base leading-relaxed">
                  Upload a MIDI melody and MelodyClaim turns the note data into interval patterns. The system compares those patterns against known songs with the same matching pipeline, helping reveal structural similarity without depending on key, instrument, or production style.
                </p>
              </div>
              <Link
                to="/midi"
                className="block rounded-[28px] border border-white/10 bg-black/35 p-5 md:p-7 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[#9d4edd]/40 hover:bg-white/[0.07]"
                aria-label="Open MIDI upload"
              >
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#9d4edd]/15">
                  <Music2 size={32} className="text-[#9d4edd]" />
                </div>
                <h4 className="mb-3 text-2xl md:text-3xl font-bold text-white">Upload MIDI</h4>
                <p className="mx-auto mb-7 max-w-md text-sm md:text-base leading-relaxed text-white/60">
                  Upload your MIDI sequence. We will extract its structural progression and analyze it against our database.
                </p>
                <div className="rounded-2xl border-2 border-dashed border-white/20 bg-white/5 p-7 transition-colors duration-300 hover:border-[#9d4edd]/50 hover:bg-[#9d4edd]/5">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#9d4edd]/20">
                    <Keyboard size={26} className="text-[#9d4edd]" />
                  </div>
                  <p className="text-lg font-semibold text-[#9d4edd]">Browse files or drag & drop</p>
                  <p className="mt-1 text-sm text-white/50">Supports .mid and .midi</p>
                </div>
              </Link>
            </div>
          </motion.article>
        </div>
      </section>

      <section id="humming" className="scroll-mt-32 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <motion.article
            variants={item}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="glass-panel p-6 md:p-10"
          >
            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-10 items-center">
              <Link
                to="/humming"
                className="block rounded-[28px] border border-white/10 bg-black/35 p-5 md:p-7 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[#9d4edd]/40 hover:bg-white/[0.07]"
                aria-label="Open humming input"
              >
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#9d4edd]/15">
                  <Mic size={32} className="text-[#9d4edd]" />
                </div>
                <h4 className="mb-3 text-2xl md:text-3xl font-bold text-white">Hum Your Melody</h4>
                <p className="mx-auto mb-7 max-w-md text-sm md:text-base leading-relaxed text-white/60">
                  Click to start humming your melody. We will search by audio first, then compare the extracted melody against the local corpus.
                </p>
                <div className="rounded-2xl border-2 border-dashed border-[#9d4edd]/50 bg-white/5 p-7 transition-colors duration-300 hover:bg-[#9d4edd]/5">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#9d4edd]/20">
                    <Mic size={28} className="text-[#9d4edd]" />
                  </div>
                  <p className="text-lg font-semibold text-[#9d4edd]">Click to Start Humming</p>
                  <p className="mt-1 text-sm text-white/50">Hum 8-12 seconds of the hook</p>
                </div>
              </Link>
              <div>
                <h3 className="text-2xl md:text-3xl font-semibold text-white mb-4">Humming</h3>
                <p className="text-white/60 text-sm md:text-base leading-relaxed">
                  Hum or sing a short melody through the microphone when you do not have a MIDI file. MelodyClaim extracts the pitch contour, converts it into a MIDI-like interval sequence, then sends it through the same plagiarism detection flow used for uploaded melodies.
                </p>
              </div>
            </div>
          </motion.article>
        </div>
      </section>
    </div>
  );
}
