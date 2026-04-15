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

  // Group by patternIndex and alignment offset
  // If an n-gram matches at query[10] and ref[5], offset = 10 - 5 = 5.
  // The next overlapping n-gram matches at query[11] and ref[6], offset = 11 - 6 = 5.
  // This allows us to perfectly stitch them!
  const fragmentsByAlignment = new Map();
  
  for (const m of validMatches) {
    const offset = m.start - m.referenceStart;
    const key = `${m.patternIndex}::${offset}::${m.trackIndex || 0}`;
    
    if (!fragmentsByAlignment.has(key)) {
      fragmentsByAlignment.set(key, {
        patternIndex: m.patternIndex,
        queryStart: m.start,
        queryEnd: m.end,
        referenceStart: m.referenceStart,
        matched: [...m.matched]
      });
    } else {
      const merged = fragmentsByAlignment.get(key);
      // Extend the end bound
      if (m.end > merged.queryEnd) {
        // Append the new items that fall outside the previous end
        const diff = m.end - merged.queryEnd;
        merged.matched.push(...m.matched.slice(m.matched.length - diff));
        merged.queryEnd = m.end;
      }
    }
  }

  const stitchedMatches = Array.from(fragmentsByAlignment.values());

  // Step 2: Classify each match
  const classified = stitchedMatches.map(m => {
    const corpus = corpusEntries[m.patternIndex];
    if (!corpus) return null;
    
    const matchLength = m.matched.length;
    const severity = matchLength >= 10 ? 'STRUCTURAL' : 'MINOR';

    return {
      patternIndex: m.patternIndex,
      songName: corpus.songName,
      artist: corpus.artist,
      matchLength,
      severity,
      queryStart: m.queryStart,
      queryEnd: m.queryEnd,
      matchedIntervalSequence: m.matched,
      referenceStart: m.referenceStart,
      referenceEnd: m.referenceStart + matchLength - 1,
      referenceNotes: corpus.notes || [],
      referenceIntervals: corpus.intervals,
      densityMultiplier: 1,
      score: matchLength,
    };
  }).filter(Boolean);
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
