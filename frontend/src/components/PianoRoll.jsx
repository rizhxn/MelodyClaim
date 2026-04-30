import { useEffect, useMemo, useRef } from 'react';

const ACCENT_COLOR = '#22d6a0';
const ACCENT_DARK = '#0b7f65';
const MUTED_NOTE = '#68717d';
const BG_TOP = '#07101a';
const BG_BOTTOM = '#08121c';
const GRID_COLOR = 'rgba(255,255,255,0.07)';
const TEXT_COLOR = 'rgba(255,255,255,0.58)';

export default function PianoRoll({
  queryNotes = [],
  referenceNotes = [],
  queryVisualNotes = [],
  referenceVisualNotes = [],
  matchStart = 0,
  matchEnd = 0,
  referenceStart = 0,
  referenceEnd = 0,
}) {
  const queryCanvasRef = useRef(null);
  const refCanvasRef = useRef(null);

  const preparedQuery = useMemo(
    () => prepareRollData(queryVisualNotes.length ? queryVisualNotes : queryNotes),
    [queryNotes, queryVisualNotes]
  );
  const preparedReference = useMemo(
    () => prepareRollData(referenceVisualNotes.length ? referenceVisualNotes : referenceNotes),
    [referenceNotes, referenceVisualNotes]
  );

  usePianoRollCanvas(queryCanvasRef, preparedQuery, matchStart, matchEnd, 0.2);
  usePianoRollCanvas(refCanvasRef, preparedReference, referenceStart, referenceEnd, 0.35);

  return (
    <div className="piano-roll-section">
      <div className="piano-roll-title mb-2 text-base font-medium leading-none text-white">
        Piano Roll Comparison
      </div>

      <div className="grid gap-1.5">
        <RollPanel
          title="Your Melody"
          canvasRef={queryCanvasRef}
          noteCount={preparedQuery.notes.length}
          emptyText="No query notes available"
        />
        <RollPanel
          title="Reference Match"
          canvasRef={refCanvasRef}
          noteCount={preparedReference.notes.length}
          emptyText="No reference notes available"
        />
      </div>
    </div>
  );
}

function RollPanel({ title, canvasRef, noteCount, emptyText }) {
  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-center justify-between gap-3 text-base font-medium leading-none text-white/95">
        <span>{title}</span>
      </div>
      <div className="relative h-[220px] overflow-hidden rounded-md border border-black/50 bg-[#07101a] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_28px_rgba(0,0,0,0.28)]">
        <canvas ref={canvasRef} className="block h-full w-full" />
      </div>
    </div>
  );
}

function usePianoRollCanvas(canvasRef, rollData, matchStart, matchEnd, initialProgress = 0) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    let animationFrame = 0;
    let startTime = performance.now();

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawFrame = (now) => {
      const rect = canvas.getBoundingClientRect();
      drawPianoRoll(ctx, rect.width, rect.height, rollData, matchStart, matchEnd, now - startTime, initialProgress);
      animationFrame = window.requestAnimationFrame(drawFrame);
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    animationFrame = window.requestAnimationFrame(drawFrame);

    return () => {
      resizeObserver.disconnect();
      window.cancelAnimationFrame(animationFrame);
    };
  }, [canvasRef, rollData, matchStart, matchEnd, initialProgress]);
}

function prepareRollData(inputNotes) {
  const rawNotes = Array.isArray(inputNotes) ? inputNotes : [];
  const notes = rawNotes
    .map((note, index) => normalizeNote(note, index))
    .filter(note => Number.isFinite(note.midi));

  if (notes.length === 0) {
    return { notes: [], minPitch: 48, maxPitch: 72, start: 0, end: 1, timeUnit: 'steps' };
  }

  const minPitch = Math.min(...notes.map(note => note.midi)) - 2;
  const maxPitch = Math.max(...notes.map(note => note.midi)) + 2;
  const start = Math.min(...notes.map(note => note.start));
  const end = Math.max(...notes.map(note => note.start + note.duration));

  return {
    notes,
    minPitch,
    maxPitch,
    start,
    end: end > start ? end : start + notes.length,
    timeUnit: notes.some(note => note.timeUnit === 'seconds') ? 'seconds' : notes.some(note => note.timeUnit === 'ticks') ? 'ticks' : 'steps',
  };
}

function normalizeNote(note, index) {
  if (typeof note === 'number') {
    return {
      midi: note,
      start: index,
      duration: 0.78,
      velocity: 0.74,
      timeUnit: 'steps',
    };
  }

  const midi = Number(note?.midi ?? note?.note ?? note?.pitch);
  const hasSeconds = Number.isFinite(note?.time) || Number.isFinite(note?.duration);
  const start = hasSeconds ? Number(note?.time || 0) : Number(note?.ticks ?? index);
  const duration = hasSeconds
    ? Number(note?.duration || 0.18)
    : Number(note?.durationTicks || 0.78);

  return {
    midi,
    start: Number.isFinite(start) ? start : index,
    duration: Number.isFinite(duration) && duration > 0 ? duration : 0.18,
    velocity: clamp(Number(note?.velocity ?? 0.74), 0.35, 1),
    timeUnit: hasSeconds ? 'seconds' : 'ticks',
  };
}

function drawPianoRoll(ctx, width, height, rollData, matchStart, matchEnd, elapsedMs, initialProgress) {
  const W = width || 1;
  const H = height || 1;

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, BG_TOP);
  bg.addColorStop(1, BG_BOTTOM);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const notes = rollData.notes;
  if (notes.length === 0) {
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = '13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No note data to display', W / 2, H / 2);
    return;
  }

  const padding = { top: 18, right: 12, bottom: 28, left: 12 };
  const plotW = Math.max(1, W - padding.left - padding.right);
  const plotH = Math.max(1, H - padding.top - padding.bottom);
  const minPitch = rollData.minPitch;
  const maxPitch = rollData.maxPitch;
  const pitchRange = Math.max(1, maxPitch - minPitch);
  const timeRange = Math.max(1, rollData.end - rollData.start);
  const beat = (elapsedMs / 1000) % 9;
  const playheadProgress = (initialProgress + beat / 9) % 1;
  const currentTime = rollData.start + playheadProgress * timeRange;

  drawGrid(ctx, padding, plotW, plotH, minPitch, maxPitch, timeRange);
  drawMatchRegion(ctx, padding, plotW, plotH, notes, matchStart, matchEnd, rollData.start, timeRange);

  notes.forEach((note, index) => {
    const isMatched = index >= matchStart && index <= matchEnd;
    const isActive = currentTime >= note.start && currentTime <= note.start + note.duration;
    drawNote(ctx, note, index, {
      isMatched,
      isActive,
      padding,
      plotW,
      plotH,
      minPitch,
      pitchRange,
      rollStart: rollData.start,
      timeRange,
      totalNotes: notes.length,
      elapsedMs,
    });
  });

  drawPlayhead(ctx, padding, plotW, plotH, playheadProgress);
  drawFooter(ctx, W, H, notes, timeRange, rollData.timeUnit, playheadProgress);
}

function drawGrid(ctx, padding, plotW, plotH, minPitch, maxPitch, timeRange) {
  ctx.strokeStyle = GRID_COLOR;
  ctx.lineWidth = 1;

  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.strokeRect(padding.left, padding.top, plotW, plotH);
  ctx.strokeStyle = GRID_COLOR;

  for (let midi = minPitch; midi <= maxPitch; midi += 2) {
    const y = padding.top + plotH - ((midi - minPitch) / Math.max(1, maxPitch - minPitch)) * plotH;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + plotW, y);
    ctx.stroke();
  }

  const verticalLines = clamp(Math.round(timeRange), 4, 12);
  for (let i = 0; i <= verticalLines; i += 1) {
    const x = padding.left + (i / verticalLines) * plotW;
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, padding.top + plotH);
    ctx.stroke();
  }
}

function drawMatchRegion(ctx, padding, plotW, plotH, notes, matchStart, matchEnd, rollStart, timeRange) {
  if (matchEnd <= matchStart || matchStart < 0 || matchStart >= notes.length) return;

  const first = notes[Math.max(0, matchStart)];
  const last = notes[Math.min(notes.length - 1, matchEnd)];
  const x1 = padding.left + ((first.start - rollStart) / timeRange) * plotW;
  const x2 = padding.left + (((last.start + last.duration) - rollStart) / timeRange) * plotW;

  ctx.fillStyle = 'rgba(34, 214, 160, 0.14)';
  ctx.fillRect(x1, padding.top, Math.max(4, x2 - x1), plotH);

  ctx.strokeStyle = 'rgba(34, 214, 160, 0.28)';
  ctx.setLineDash([5, 6]);
  ctx.strokeRect(x1, padding.top, Math.max(4, x2 - x1), plotH);
  ctx.setLineDash([]);
}

function drawNote(ctx, note, index, options) {
  const {
    isMatched,
    isActive,
    padding,
    plotW,
    plotH,
    minPitch,
    pitchRange,
    rollStart,
    timeRange,
    totalNotes,
    elapsedMs,
  } = options;

  const x = padding.left + ((note.start - rollStart) / timeRange) * plotW;
  const y = padding.top + plotH - ((note.midi - minPitch) / pitchRange) * plotH;
  const durationW = (note.duration / timeRange) * plotW;
  const fallbackW = plotW / Math.max(totalNotes, 1) * 0.72;
  const noteW = Number.isFinite(durationW) && durationW > 0 ? clamp(durationW, 7, plotW) : fallbackW;
  const noteH = clamp(plotH / Math.max(14, pitchRange + 4), 6, 13);
  const pulse = isActive ? 1 + Math.sin(elapsedMs / 160 + index) * 0.08 : 1;
  const alpha = isMatched ? 0.82 + note.velocity * 0.18 : 0.42 + note.velocity * 0.25;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = isMatched ? ACCENT_COLOR : 'rgba(255,255,255,0.16)';
  ctx.shadowBlur = isMatched ? 18 * pulse : isActive ? 8 : 0;
  ctx.fillStyle = isMatched ? ACCENT_COLOR : MUTED_NOTE;
  roundRect(ctx, x, y - noteH / 2, noteW * pulse, noteH, 3);
  ctx.fill();

  if (isMatched) {
    const shine = ctx.createLinearGradient(x, y - noteH / 2, x, y + noteH / 2);
    shine.addColorStop(0, 'rgba(255,255,255,0.28)');
    shine.addColorStop(1, ACCENT_DARK);
    ctx.fillStyle = shine;
    roundRect(ctx, x, y - noteH / 2, noteW * pulse, noteH, 3);
    ctx.fill();
  }
  ctx.restore();
}

function drawPlayhead(ctx, padding, plotW, plotH, progress) {
  const x = padding.left + progress * plotW;
  const gradient = ctx.createLinearGradient(x - 18, 0, x + 18, 0);
  gradient.addColorStop(0, 'rgba(34,214,160,0)');
  gradient.addColorStop(0.5, 'rgba(255,255,255,0.12)');
  gradient.addColorStop(1, 'rgba(34,214,160,0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(x - 18, padding.top, 36, plotH);
  ctx.strokeStyle = 'rgba(235,241,246,0.92)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, padding.top);
  ctx.lineTo(x, padding.top + plotH);
  ctx.stroke();

  ctx.fillStyle = 'rgba(235,241,246,0.92)';
  ctx.beginPath();
  ctx.arc(x, padding.top - 3, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawFooter(ctx, W, H, notes, timeRange, timeUnit, playheadProgress) {
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = '11px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${notes.length} notes`, W / 2, H - 8);

  ctx.textAlign = 'right';
  ctx.fillText(`${Math.round(playheadProgress * 100)}%`, W - 14, H - 8);
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, Math.abs(width) / 2, Math.abs(height) / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
