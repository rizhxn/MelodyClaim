export default function IntervalEvidence({ queryIntervals = [], matchStart = 0, matchEnd = 0 }) {
  if (!queryIntervals || queryIntervals.length === 0) return null;

  return (
    <div className="interval-evidence">
      <div className="interval-evidence-title">
        📊 Interval Sequence Evidence
      </div>

      <div className="interval-sequence">
        {queryIntervals.map((val, i) => {
          const isMatched = i >= matchStart && i <= matchEnd;
          const prefix = val > 0 ? '+' : '';

          return (
            <span
              key={i}
              className={`interval-token ${isMatched ? 'matched' : 'unmatched'}`}
            >
              {prefix}{val}
            </span>
          );
        })}
      </div>

      <div className="interval-labels">
        <div className="interval-label">
          <span className="interval-label-swatch matched" />
          Matched region ({matchStart}–{matchEnd})
        </div>
        <div className="interval-label">
          <span className="interval-label-swatch unmatched" />
          Non-matching
        </div>
      </div>
    </div>
  );
}
