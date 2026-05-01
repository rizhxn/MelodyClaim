import React from 'react';
import { motion } from 'framer-motion';

// Verdict Badge Component
function VerdictBadge({ verdict }) {
  const config = {
    STRUCTURAL_MATCH: {
      color: 'border-[#ef4444] bg-[#ef4444]/10 text-[#ef4444]',
      icon: '⚠',
      label: 'Structural Match'
    },
    MINOR_OVERLAP: {
      color: 'border-[#f59e0b] bg-[#f59e0b]/10 text-[#f59e0b]',
      icon: '◐',
      label: 'Minor Overlap'
    },
    METADATA_MATCH: {
      color: 'border-[#60a5fa] bg-[#60a5fa]/10 text-[#60a5fa]',
      icon: 'i',
      label: 'Reference Identified'
    },
    NO_MATCH: {
      color: 'border-[#5DCAA5] bg-[#5DCAA5]/10 text-[#5DCAA5]',
      icon: '✓',
      label: 'No Match'
    }
  };

  const { color, icon, label } = config[verdict] || config.NO_MATCH;

  return (
    <div className={`
      inline-flex items-center gap-2 px-3 py-1.5 rounded-full border font-medium text-sm
      ${color}
    `}>
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

export function VerdictReport({ verdict, primaryMatch, meta, queryIntervals }) {
  const isMetadataMatch = verdict === 'METADATA_MATCH';
  const timestamp = meta.analysedAt || new Date().toISOString();
  const formattedDate = new Date(timestamp).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto bg-[#0d1117] border border-[#30363d] rounded-lg overflow-hidden verdict-report"
    >
      {/* Header Section */}
      <div className={`
        px-8 py-6 border-b border-[#30363d]
        ${verdict === 'STRUCTURAL_MATCH' ? 'bg-gradient-to-r from-[#ef4444]/10 to-transparent' : ''}
        ${verdict === 'MINOR_OVERLAP' ? 'bg-gradient-to-r from-[#f59e0b]/10 to-transparent' : ''}
        ${verdict === 'METADATA_MATCH' ? 'bg-gradient-to-r from-[#60a5fa]/10 to-transparent' : ''}
        ${verdict === 'NO_MATCH' ? 'bg-gradient-to-r from-[#5DCAA5]/10 to-transparent' : ''}
      `}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <VerdictBadge verdict={verdict} />
              <h1 className="text-2xl font-bold text-[#e6edf3]">
                Plagiarism Analysis Report
              </h1>
            </div>
            <p className="text-sm text-[#7d8590]">
              Generated on {formattedDate}
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-xs text-[#7d8590] mb-1">Analysis ID</div>
            <div className="font-mono text-sm text-[#e6edf3]">
              {timestamp.slice(0, 19).replace(/[-:]/g, '').replace('T', '-')}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8 space-y-8">
        
        {/* Verdict Summary */}
        <section>
          <h2 className="text-lg font-semibold text-[#e6edf3] mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-[#5DCAA5] rounded-full"></span>
            Summary
          </h2>
          
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
            {verdict === 'NO_MATCH' ? (
              <div className="space-y-2">
                <p className="text-[#e6edf3] text-base">
                  No significant melodic similarities detected in the reference corpus.
                </p>
                <p className="text-sm text-[#7d8590]">
                  Your melody does not structurally match any of the {meta.intervalCount} reference songs analyzed.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-[#e6edf3] text-base leading-relaxed">
                  {verdict === 'STRUCTURAL_MATCH' 
                    ? `A significant structural match has been detected against "${primaryMatch?.songName}" by ${primaryMatch?.artist}.`
                    : verdict === 'METADATA_MATCH'
                    ? `The uploaded MIDI title or track metadata identifies "${primaryMatch?.songName}" by ${primaryMatch?.artist}, but no qualifying structural interval overlap was detected.`
                    : `A minor melodic overlap has been detected with "${primaryMatch?.songName}" by ${primaryMatch?.artist}.`
                  }
                </p>
                
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#30363d]">
                  <div>
                    <div className="text-xs text-[#7d8590] mb-1">Match Length</div>
                    <div className="text-xl font-semibold text-[#e6edf3]">
                      {verdict === 'METADATA_MATCH' ? 'Title metadata' : `${primaryMatch?.matchLength} intervals`}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#7d8590] mb-1">Classification</div>
                    <div className="text-xl font-semibold text-[#e6edf3]">
                      {verdict === 'METADATA_MATCH' ? 'Identified' : primaryMatch?.classification}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#7d8590] mb-1">Pattern Type</div>
                    <div className="text-xl font-semibold text-[#e6edf3]">
                      {verdict === 'METADATA_MATCH' ? 'Metadata' : primaryMatch?.isRepeating ? 'Recurring' : 'Single'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Match Details (only if match exists) */}
        {primaryMatch && (
          <>
            <section>
              <h2 className="text-lg font-semibold text-[#e6edf3] mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-[#5DCAA5] rounded-full"></span>
                Matched Reference
              </h2>
              
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-[#e6edf3] mb-1">
                      {primaryMatch.songName}
                    </h3>
                    <p className="text-sm text-[#7d8590]">
                      {primaryMatch.artist} {primaryMatch.year ? `• ${primaryMatch.year}` : ''}
                    </p>
                  </div>
                </div>

                <div className={isMetadataMatch ? 'hidden' : 'grid grid-cols-2 gap-4 pt-4 border-t border-[#30363d]'}>
                  <div>
                    <div className="text-xs text-[#7d8590] mb-2">{isMetadataMatch ? 'Identification Source' : 'Match Position in Your Melody'}</div>
                    <div className="font-mono text-sm text-[#e6edf3]">
                      Intervals {primaryMatch.queryStart}–{primaryMatch.queryEnd}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#7d8590] mb-2">{isMetadataMatch ? 'Interval Scan' : 'Match Position in Reference'}</div>
                    <div className="font-mono text-sm text-[#e6edf3]">
                      Intervals {primaryMatch.referenceStart}–{primaryMatch.referenceEnd}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Matched Interval Sequence */}
            <section className={isMetadataMatch ? 'hidden' : ''}>
              <h2 className="text-lg font-semibold text-[#e6edf3] mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-[#5DCAA5] rounded-full"></span>
                Matched Interval Sequence
              </h2>
              
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  {primaryMatch.matchedSequence?.map((interval, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 bg-[#5DCAA5]/10 border border-[#5DCAA5]/30 rounded-md font-mono text-sm text-[#5DCAA5]"
                    >
                      {interval > 0 ? `+${interval}` : interval}
                    </span>
                  ))}
                </div>
                
                <p className="text-xs text-[#7d8590]">
                  This {primaryMatch.matchLength}-interval sequence represents the structural melodic pattern 
                  shared between your composition and the reference song.
                </p>
              </div>
            </section>

            {/* Significance Analysis */}
            <section>
              <h2 className="text-lg font-semibold text-[#e6edf3] mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-[#5DCAA5] rounded-full"></span>
                Significance Analysis
              </h2>
              
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
                <p className="text-sm text-[#e6edf3] leading-relaxed">
                  {primaryMatch.significance}
                </p>
              </div>
            </section>
          </>
        )}

        {/* Query Metadata */}
        <section>
          <h2 className="text-lg font-semibold text-[#e6edf3] mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-[#5DCAA5] rounded-full"></span>
            Analysis Metadata
          </h2>
          
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-xs text-[#7d8590] mb-2">Source File</div>
                <div className="font-mono text-sm text-[#e6edf3]">{meta.filename}</div>
              </div>
              <div>
                <div className="text-xs text-[#7d8590] mb-2">Total Notes Analyzed</div>
                <div className="font-mono text-sm text-[#e6edf3]">{meta.totalNotes}</div>
              </div>
              <div>
                <div className="text-xs text-[#7d8590] mb-2">Interval Count</div>
                <div className="font-mono text-sm text-[#e6edf3]">{meta.intervalCount}</div>
              </div>
              <div>
                <div className="text-xs text-[#7d8590] mb-2">Analysis Method</div>
                <div className="font-mono text-sm text-[#e6edf3]">Aho-Corasick DFA</div>
              </div>
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="pt-6 border-t border-[#30363d]">
          <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-5">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-[#7d8590] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-xs text-[#7d8590] leading-relaxed">
                <p className="mb-2">
                  <strong className="text-[#e6edf3]">Legal Disclaimer:</strong> This report constitutes a 
                  structural melodic similarity analysis based on interval sequence pattern matching. It is not 
                  a legal determination of copyright infringement. Musical similarity and legal plagiarism are 
                  distinct concepts that require evaluation of multiple factors beyond melodic structure alone.
                </p>
                <p>
                  This analysis should be considered as evidence to support further investigation, not as a 
                  conclusive verdict. Consult qualified legal counsel for copyright-related decisions.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="px-8 py-4 bg-[#161b22] border-t border-[#30363d] flex items-center justify-between">
        <div className="text-xs text-[#7d8590]">
          MelodyClaim — Built with Aho-Corasick automata and formal interval theory
        </div>
        <button 
          onClick={() => window.print()}
          className="text-xs text-[#e6edf3] hover:text-[#5DCAA5] transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Report
        </button>
      </div>
    </motion.div>
  );
}
