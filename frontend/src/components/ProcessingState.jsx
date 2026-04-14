import { useState, useEffect, useRef } from 'react';

const TERMINAL_LINES = [
  { text: 'parsing MIDI file...', delay: 0 },
  { text: 'identified primary melodic track', delay: 400 },
  { text: 'extracting note sequence', delay: 800, highlight: 'note sequence' },
  { text: 'encoding interval representation', delay: 1200 },
  { text: 'building interval sequence', delay: 1500, highlight: 'interval sequence' },
  { text: 'constructing Aho-Corasick automaton', delay: 1800 },
  { text: 'loading corpus (6 reference songs)', delay: 2000 },
  { text: 'running multi-pattern search...', delay: 2200, highlight: 'running automaton' },
  { text: 'analysis complete ✓', delay: 2400, status: true },
];

const STATES = ['q₀', 'q₁', 'q₂', 'q₃', 'q₄'];

export default function ProcessingState() {
  const [visibleLines, setVisibleLines] = useState(0);
  const [activeState, setActiveState] = useState(-1);
  const [progress, setProgress] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // Terminal lines
    const lineTimers = TERMINAL_LINES.map((line, i) =>
      setTimeout(() => {
        if (mountedRef.current) setVisibleLines(i + 1);
      }, line.delay)
    );

    // State machine progression
    const stateTimers = STATES.map((_, i) =>
      setTimeout(() => {
        if (mountedRef.current) setActiveState(i);
      }, i * 500 + 200)
    );

    // Progress bar
    const progressInterval = setInterval(() => {
      if (mountedRef.current) {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 2;
        });
      }
    }, 50);

    return () => {
      mountedRef.current = false;
      lineTimers.forEach(clearTimeout);
      stateTimers.forEach(clearTimeout);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="processing-wrapper">
      <div className="processing-title">
        <h2>Analyzing Your Melody</h2>
        <p>Running through the plagiarism detection pipeline</p>
      </div>

      <div className="processing-content">
        {/* Terminal Panel */}
        <div className="processing-terminal">
          <div className="terminal-header">
            <div className="terminal-dot red" />
            <div className="terminal-dot yellow" />
            <div className="terminal-dot green" />
            <span className="terminal-title">melodyclaim — analysis</span>
          </div>
          <div className="terminal-body">
            {TERMINAL_LINES.slice(0, visibleLines).map((line, i) => (
              <div
                key={i}
                className="terminal-line"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span className="prompt">›</span>
                <span className="content">
                  {line.status ? (
                    <span className="status">{line.text}</span>
                  ) : line.highlight ? (
                    <>
                      {line.text.split(line.highlight)[0]}
                      <span className="highlight">{line.highlight}</span>
                      {line.text.split(line.highlight)[1] || ''}
                    </>
                  ) : (
                    line.text
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Automaton Panel */}
        <div className="processing-automaton">
          <div className="automaton-label">Finite Automaton State</div>

          <div className="automaton-states">
            {STATES.map((state, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  className={`automaton-state ${
                    i < activeState ? 'completed' : i === activeState ? 'active' : ''
                  }`}
                >
                  {state}
                </div>
                {i < STATES.length - 1 && (
                  <span className={`automaton-arrow ${i <= activeState ? 'active' : ''}`}>
                    →
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="automaton-progress">
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="progress-label">
              {progress < 100 ? `Processing... ${progress}%` : 'Complete'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
