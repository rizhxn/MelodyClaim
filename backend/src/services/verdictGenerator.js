/**
 * Verdict generator — takes filtered matches and produces a final verdict.
 *
 * Verdict levels:
 *   - STRUCTURAL_MATCH — at least one match with severity STRUCTURAL
 *   - MINOR_OVERLAP    — at least one match with severity MINOR (but no STRUCTURAL)
 *   - NO_MATCH         — no qualifying matches
 */

/**
 * Generates the final verdict from filtered matches.
 *
 * @param {import('./thresholdFilter.js').FilteredMatch[]} filteredMatches
 * @returns {{
 *   verdict: string,
 *   primaryMatch: object | null,
 *   allMatches: object[],
 *   summary: string
 * }}
 */
export function generateVerdict(filteredMatches) {
  if (!filteredMatches || filteredMatches.length === 0) {
    return {
      verdict: 'NO_MATCH',
      primaryMatch: null,
      allMatches: [],
      summary: 'No significant melodic similarities were detected in the corpus.',
    };
  }

  const hasStructural = filteredMatches.some(m => m.severity === 'STRUCTURAL' || m.score >= 12);
  const verdict = hasStructural ? 'STRUCTURAL_MATCH' : 'MINOR_OVERLAP';

  // The primary match is the one with the highest score
  const primaryMatch = filteredMatches[0];
  
  // Upgrade the UI severity flag if the multiplier pushed it to structural
  if (primaryMatch && primaryMatch.score >= 12 && primaryMatch.severity === 'MINOR') {
    primaryMatch.severity = 'STRUCTURAL';
  }

  const summary = hasStructural
    ? `Structural melodic similarity detected with "${primaryMatch.songName}" by ${primaryMatch.artist}. ` +
      `A ${primaryMatch.matchLength}-interval sequence matches at position ${primaryMatch.queryStart}–${primaryMatch.queryEnd} ` +
      `in your melody (reference position ${primaryMatch.referenceStart}–${primaryMatch.referenceEnd}).`
    : `Minor melodic overlap detected with "${primaryMatch.songName}" by ${primaryMatch.artist}. ` +
      `A ${primaryMatch.matchLength}-interval sequence was found but falls below the structural threshold.`;

  return {
    verdict,
    primaryMatch: {
      songName: primaryMatch.songName,
      artist: primaryMatch.artist,
      matchedIntervalSequence: primaryMatch.matchedIntervalSequence,
      queryStart: primaryMatch.queryStart,
      queryEnd: primaryMatch.queryEnd,
      referenceStart: primaryMatch.referenceStart,
      referenceEnd: primaryMatch.referenceEnd,
      matchLength: primaryMatch.matchLength,
      severity: primaryMatch.severity,
      score: primaryMatch.score,
      densityMultiplier: primaryMatch.densityMultiplier,
      referenceNotes: primaryMatch.referenceNotes,
      referenceIntervals: primaryMatch.referenceIntervals,
    },
    allMatches: filteredMatches.map(m => ({
      songName: m.songName,
      artist: m.artist,
      matchLength: m.matchLength,
      severity: m.severity,
      queryStart: m.queryStart,
      queryEnd: m.queryEnd,
      referenceStart: m.referenceStart,
      referenceEnd: m.referenceEnd,
      score: m.score,
    })),
    summary,
  };
}
