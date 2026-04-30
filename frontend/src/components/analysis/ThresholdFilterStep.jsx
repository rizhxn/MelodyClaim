import { useState, useEffect } from 'react';
import { Filter, XCircle, CheckCircle2 } from 'lucide-react';

export default function ThresholdFilterStep({ allMatches = [] }) {
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    // Trigger the filtering animation after 1.5 seconds
    const timer = setTimeout(() => setShowFilter(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  // The API only returns matches that survived filtering, so add a few rejected
  // examples to make the threshold pass visible during the processing animation.
  const displayMatches = [
    {
      id: 'rejected-short',
      songName: 'Short accidental phrase',
      artist: 'Discarded candidate',
      matchLength: 4,
      isDummy: true,
    },
    {
      id: 'rejected-fragment',
      songName: 'Fragment overlap',
      artist: 'Discarded candidate',
      matchLength: 6,
      isDummy: true,
    },
    ...allMatches.map((m, i) => ({ ...m, id: i }))
  ].slice(0, 8);

  const rejectedCount = displayMatches.filter(match => match.matchLength < 7).length;
  const keptCount = displayMatches.length - rejectedCount;

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-8"
    >
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-3 flex items-center justify-center gap-3">
          <Filter className="w-8 h-8 text-orange-400" />
          Step 4: Threshold Filter
        </h2>
        <p className="text-white/60 text-sm font-medium px-4 py-1.5 rounded-full bg-white/5 border border-white/10 inline-flex">
          Discarding coincidental matches (length &lt; 7)
        </p>
      </div>

      <div
        className="relative z-10 w-full max-w-4xl h-[430px] rounded-2xl border border-white/10 bg-[#07080d]/85 p-6 shadow-2xl backdrop-blur-xl"
      >
        <div className="mb-5 grid grid-cols-3 gap-3">
          <SummaryPill label="Candidates" value={displayMatches.length} tone="neutral" />
          <SummaryPill label="Rejected" value={showFilter ? rejectedCount : '-'} tone="reject" />
          <SummaryPill label="Kept" value={showFilter ? keptCount : '-'} tone="keep" />
        </div>

        <div className="h-[320px] min-h-0 space-y-3 overflow-y-auto custom-scrollbar pr-2">
          {displayMatches.map((match) => {
            const isRejected = match.matchLength < 7;

            return (
              <div
                key={match.id}
                className="relative overflow-hidden rounded-xl"
              >
                <div
                  className={`w-full min-h-[74px] rounded-xl border px-5 py-4 flex items-center justify-between gap-4 transition-colors duration-500 ${
                    showFilter && isRejected 
                      ? 'bg-red-500/10 border-red-400/35 text-white/70' 
                      : showFilter && !isRejected
                        ? 'bg-emerald-400/12 border-emerald-300/40 text-white shadow-[0_0_18px_rgba(52,211,153,0.12)]'
                        : 'bg-white/[0.06] border-white/12 text-white'
                  }`}
                >
                  <div className="min-w-0 flex flex-col">
                    <span className="truncate text-base font-bold">{match.songName}</span>
                    <span className="truncate text-sm text-white/55">{match.artist}</span>
                  </div>
                  
                  <div className="flex shrink-0 items-center gap-4">
                    <div className="rounded-lg border border-white/10 bg-black/35 px-3 py-1 font-mono text-sm text-white/85">
                      {match.matchLength} intervals
                    </div>
                    
                    {showFilter && (
                      <div
                        className="min-w-[142px] justify-end flex items-center gap-2 font-bold"
                      >
                        {isRejected ? (
                          <span className="text-red-300 flex items-center gap-1 text-sm"><XCircle className="w-4 h-4"/> Below Threshold</span>
                        ) : (
                          <span className="text-emerald-300 flex items-center gap-1 text-sm"><CheckCircle2 className="w-4 h-4"/> Kept</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Strikethrough Animation for rejected */}
                {showFilter && isRejected && (
                  <div
                    className="absolute top-1/2 left-0 z-10 h-[2px] w-full -translate-y-1/2 bg-red-400/90 shadow-[0_0_10px_rgba(248,113,113,0.8)]"
                  />
                )}
              </div>
            );
          })}
          
          {displayMatches.length === 0 && (
            <div className="flex h-full items-center justify-center text-center text-white/50">
              No patterns found to filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryPill({ label, value, tone }) {
  const toneClass = {
    neutral: 'border-white/10 bg-white/[0.06] text-white',
    reject: 'border-red-400/20 bg-red-500/10 text-red-200',
    keep: 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200',
  }[tone];

  return (
    <div className={`rounded-xl border px-4 py-3 ${toneClass}`}>
      <div className="text-xs font-medium uppercase tracking-wide opacity-60">{label}</div>
      <div className="mt-1 text-2xl font-bold leading-none">{value}</div>
    </div>
  );
}
