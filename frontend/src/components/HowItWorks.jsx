const STEPS = [
  {
    icon: '📤',
    title: 'Upload MIDI',
    desc: 'Drop your melody file and we extract every note from the densest track.',
  },
  {
    icon: '🔢',
    title: 'Interval Encoding',
    desc: 'Notes become a chain of pitch differences — the melodic fingerprint of your tune.',
  },
  {
    icon: '⚙️',
    title: 'Automaton Search',
    desc: 'A multi-pattern engine scans your fingerprint against the entire reference corpus in one pass.',
  },
  {
    icon: '✅',
    title: 'Result',
    desc: 'Matches are scored, classified by severity, and delivered with visual evidence.',
  },
];

export default function HowItWorks() {
  return (
    <section className="how-it-works" id="how-it-works">
      <h2>How It Works</h2>
      <p className="how-it-works-subtitle">
        Four steps from upload to verdict — no music theory degree required.
      </p>

      <div className="how-steps">
        {STEPS.map((step, i) => (
          <div key={i} className="how-step" id={`how-step-${i}`}>
            <div className="how-step-number">{i + 1}</div>
            <div className="how-step-icon">{step.icon}</div>
            <div className="how-step-title">{step.title}</div>
            <div className="how-step-desc">{step.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
