export default function VerdictCard({ result }) {
  if (!result) return null;

  const { verdict, summary, primaryMatch, query } = result;

  const verdictClass =
    verdict === 'STRUCTURAL_MATCH' ? 'structural' :
    verdict === 'MINOR_OVERLAP' ? 'minor' : 'none';

  const verdictLabel =
    verdict === 'STRUCTURAL_MATCH' ? 'Structural Match' :
    verdict === 'MINOR_OVERLAP' ? 'Minor Overlap' : 'No Match';

  const verdictEmoji =
    verdict === 'STRUCTURAL_MATCH' ? '🔴' :
    verdict === 'MINOR_OVERLAP' ? '🟡' : '🟢';

  return (
    <div id="verdict-card" className={`verdict-card ${verdictClass}`}>
      <div className={`verdict-badge ${verdictClass}`}>
        <span className="verdict-badge-dot" />
        {verdict}
      </div>

      <h3 className="verdict-title">
        {verdictEmoji} {verdictLabel}
      </h3>

      <p className="verdict-summary">{summary}</p>

      {primaryMatch && (
        <div className="verdict-meta">
          <div className="verdict-meta-item">
            <span className="verdict-meta-label">Matched Song</span>
            <span className="verdict-meta-value">
              {primaryMatch.songName}
            </span>
          </div>
          <div className="verdict-meta-item">
            <span className="verdict-meta-label">Artist</span>
            <span className="verdict-meta-value">
              {primaryMatch.artist}
            </span>
          </div>
          <div className="verdict-meta-item">
            <span className="verdict-meta-label">Match Length</span>
            <span className="verdict-meta-value">
              {primaryMatch.matchLength} intervals
            </span>
          </div>
          <div className="verdict-meta-item">
            <span className="verdict-meta-label">Query Position</span>
            <span className="verdict-meta-value">
              {primaryMatch.queryStart}–{primaryMatch.queryEnd}
            </span>
          </div>
          <div className="verdict-meta-item">
            <span className="verdict-meta-label">Reference Position</span>
            <span className="verdict-meta-value">
              {primaryMatch.referenceStart}–{primaryMatch.referenceEnd}
            </span>
          </div>
          {query && (
            <div className="verdict-meta-item">
              <span className="verdict-meta-label">Notes Analyzed</span>
              <span className="verdict-meta-value">
                {query.noteCount}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
