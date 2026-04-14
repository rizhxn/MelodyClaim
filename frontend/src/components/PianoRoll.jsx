import { useRef, useEffect } from 'react';

const ACCENT_COLOR = '#1D9E75';
const ACCENT_LIGHT = '#2bc48f';
const MUTED_COLOR = '#30363d';
const MUTED_NOTE = '#484f58';
const BG_COLOR = '#0d1117';
const GRID_COLOR = '#161b22';
const TEXT_COLOR = '#7d8590';

/**
 * Renders a piano roll visualization on an HTML canvas.
 * Notes within the matched range are rendered in accent color.
 */
export default function PianoRoll({
  queryNotes = [],
  referenceNotes = [],
  matchStart = 0,
  matchEnd = 0,
  referenceStart = 0,
  referenceEnd = 0,
}) {
  const queryCanvasRef = useRef(null);
  const refCanvasRef = useRef(null);

  useEffect(() => {
    if (queryNotes.length > 0) {
      drawPianoRoll(queryCanvasRef.current, queryNotes, matchStart, matchEnd, 'Your Melody');
    }
  }, [queryNotes, matchStart, matchEnd]);

  useEffect(() => {
    if (referenceNotes.length > 0) {
      drawPianoRoll(refCanvasRef.current, referenceNotes, referenceStart, referenceEnd, 'Reference');
    }
  }, [referenceNotes, referenceStart, referenceEnd]);

  return (
    <div className="piano-roll-section">
      <div className="piano-roll-title">
        🎹 Piano Roll Comparison
      </div>

      <div className="piano-roll-container">
        <div className="piano-roll-column">
          <div className="piano-roll-label">Your Melody</div>
          <div className="piano-roll-canvas-wrap">
            <canvas
              ref={queryCanvasRef}
              id="piano-roll-query"
              width={440}
              height={200}
            />
          </div>
        </div>

        <div className="piano-roll-column">
          <div className="piano-roll-label">Reference Match</div>
          <div className="piano-roll-canvas-wrap">
            <canvas
              ref={refCanvasRef}
              id="piano-roll-reference"
              width={440}
              height={200}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function drawPianoRoll(canvas, notes, matchStart, matchEnd, label) {
  if (!canvas || notes.length === 0) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const displayWidth = canvas.clientWidth || canvas.width;
  const displayHeight = canvas.clientHeight || canvas.height;

  canvas.width = displayWidth * dpr;
  canvas.height = displayHeight * dpr;
  ctx.scale(dpr, dpr);

  const W = displayWidth;
  const H = displayHeight;

  // Clear
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, W, H);

  // Find note range
  const minNote = Math.min(...notes) - 2;
  const maxNote = Math.max(...notes) + 2;
  const noteRange = maxNote - minNote || 1;

  // Layout
  const padding = { top: 16, bottom: 24, left: 8, right: 8 };
  const plotW = W - padding.left - padding.right;
  const plotH = H - padding.top - padding.bottom;

  const noteWidth = Math.max(4, (plotW / notes.length) - 2);
  const noteHeight = Math.max(4, Math.min(12, plotH / noteRange));

  // Draw subtle grid lines
  ctx.strokeStyle = GRID_COLOR;
  ctx.lineWidth = 0.5;
  for (let n = minNote; n <= maxNote; n += 2) {
    const y = padding.top + plotH - ((n - minNote) / noteRange) * plotH;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(W - padding.right, y);
    ctx.stroke();
  }

  // Draw match region background highlight
  if (matchEnd > matchStart) {
    const x1 = padding.left + (matchStart / notes.length) * plotW;
    const x2 = padding.left + ((matchEnd + 1) / notes.length) * plotW;
    ctx.fillStyle = 'rgba(29, 158, 117, 0.06)';
    ctx.fillRect(x1, padding.top, x2 - x1, plotH);

    // Match region border
    ctx.strokeStyle = 'rgba(29, 158, 117, 0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(x1, padding.top, x2 - x1, plotH);
    ctx.setLineDash([]);
  }

  // Draw notes
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    const x = padding.left + (i / notes.length) * plotW;
    const y = padding.top + plotH - ((note - minNote) / noteRange) * plotH - noteHeight / 2;

    const isMatched = i >= matchStart && i <= matchEnd;

    if (isMatched) {
      // Glow effect
      ctx.shadowColor = ACCENT_COLOR;
      ctx.shadowBlur = 6;
      ctx.fillStyle = ACCENT_COLOR;
      ctx.beginPath();
      ctx.roundRect(x, y, noteWidth, noteHeight, 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = MUTED_NOTE;
      ctx.beginPath();
      ctx.roundRect(x, y, noteWidth, noteHeight, 2);
      ctx.fill();
    }
  }

  // Draw axis label
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = '10px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${notes.length} notes`, W / 2, H - 4);
}
