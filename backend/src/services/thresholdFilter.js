/**
 * Threshold filter for Aho-Corasick matches.
 *
 * Match classification:
 *   - Length < 6:   DISCARDED
 *   - Length 6–9:   MINOR
 *   - Length >= 10:  STRUCTURAL
 *
 * Applies density multiplier when multiple matches exist against the same
 * reference song.
 */

/**
 * @typedef {Object} RawMatch
 * @property {number} patternIndex
 * @property {number} start
 * @property {number} end
 * @property {number[]} matched
 */

/**
 * @typedef {Object} CorpusEntry
 * @property {number} id
 * @property {string} songName
 * @property {string} artist
 * @property {number[]} intervals
 * @property {number[]} notes
 */

/**
 * @typedef {Object} FilteredMatch
 * @property {number} patternIndex
 * @property {string} songName
 * @property {string} artist
 * @property {number} matchLength
 * @property {string} severity — 'MINOR' | 'STRUCTURAL'
 * @property {number} queryStart
 * @property {number} queryEnd
 * @property {number[]} matchedIntervalSequence
 * @property {number} referenceStart
 * @property {number} referenceEnd
 * @property {number} densityMultiplier
 * @property {number} score
 */

/**
 * Filters and classifies raw matches from the Aho-Corasick search.
 *
 * @param {RawMatch[]} rawMatches
 * @param {CorpusEntry[]} corpusEntries
 * @returns {FilteredMatch[]}
 */
export function filterMatches(rawMatches, corpusEntries) {
  // Step 1: Discard matches shorter than 6
  const validMatches = rawMatches.filter(m => m.matched.length >= 6);

  if (validMatches.length === 0) return [];

  // Step 2: Classify each match
  const classified = validMatches.map(m => {
    const corpus = corpusEntries[m.patternIndex];
    const matchLength = m.matched.length;
    const severity = matchLength >= 10 ? 'STRUCTURAL' : 'MINOR';

    // Find where in the reference this pattern starts
    // The pattern IS the full corpus interval, so the match offset within
    // the reference is found by searching for the sub-pattern
    const refIntervals = corpus.intervals;
    let referenceStart = 0;

    // Search for the matched subsequence in the reference intervals
    const matchStr = JSON.stringify(m.matched);
    for (let i = 0; i <= refIntervals.length - matchLength; i++) {
      const sub = refIntervals.slice(i, i + matchLength);
      if (JSON.stringify(sub) === matchStr) {
        referenceStart = i;
        break;
      }
    }

    return {
      patternIndex: m.patternIndex,
      songName: corpus.songName,
      artist: corpus.artist,
      matchLength,
      severity,
      queryStart: m.start,
      queryEnd: m.end,
      matchedIntervalSequence: m.matched,
      referenceStart,
      referenceEnd: referenceStart + matchLength - 1,
      referenceNotes: corpus.notes || [],
      referenceIntervals: corpus.intervals,
      densityMultiplier: 1,
      score: matchLength,
    };
  });

  // Step 3: Group by reference song and apply density multiplier
  const songGroups = new Map();

  for (const match of classified) {
    const key = `${match.songName}::${match.artist}`;
    if (!songGroups.has(key)) {
      songGroups.set(key, []);
    }
    songGroups.get(key).push(match);
  }

  const results = [];

  for (const [, group] of songGroups) {
    const multiplier = group.length > 1 ? 1 + (group.length - 1) * 0.25 : 1;

    for (const match of group) {
      match.densityMultiplier = multiplier;
      match.score = Math.round(match.matchLength * multiplier * 10) / 10;
      results.push(match);
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results;
}
