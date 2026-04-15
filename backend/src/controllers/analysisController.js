/**
 * Analysis controller — POST /api/analyse
 *
 * Runs the full plagiarism detection pipeline:
 *   1. Parse MIDI file
 *   2. Encode intervals
 *   3. Build Aho-Corasick automaton from corpus
 *   4. Search for matches
 *   5. Filter by threshold
 *   6. Generate verdict
 */

import fs from 'fs';
import { parseMidi } from '../services/midiParser.js';
import { encodeIntervals } from '../services/intervalEncoder.js';
import { buildAutomaton, search } from '../services/ahoCorasick.js';
import { filterMatches } from '../services/thresholdFilter.js';
import { generateVerdict } from '../services/verdictGenerator.js';
import { getCorpus } from '../database/seed.js';

/**
 * POST /api/analyse
 * Accepts multipart MIDI file upload.
 */
export async function analyseHandler(req, res) {
  const startTime = Date.now();

  if (!req.file) {
    return res.status(400).json({
      error: 'No MIDI file uploaded. Please upload a .mid or .midi file.',
    });
  }

  const filePath = req.file.path;

  try {
    // Step 1: Parse MIDI
    const fileBuffer = fs.readFileSync(filePath);
    const { tracks } = parseMidi(fileBuffer);

    // Step 3: Load corpus and build automaton
    const corpus = getCorpus();

    if (corpus.length === 0) {
      return res.status(500).json({
        error: 'Corpus database is empty. Please run the seed script first.',
      });
    }

    const patterns = corpus.map(c => c.intervals);
    const automaton = buildAutomaton(patterns);

    // Step 4: Search all tracks and accumulate matches
    let allRawMatches = [];
    let queryIntervalCount = 0;
    let queryNoteCount = 0;
    
    for (const track of tracks) {
      const qIntervals = encodeIntervals(track.notes);
      queryIntervalCount += qIntervals.length;
      queryNoteCount += track.notes.length;
      
      const rawMatches = search(automaton, qIntervals);
      
      // Inject the track info into the raw match (if needed downstream)
      rawMatches.forEach(m => m.trackIndex = track.trackIndex);
      allRawMatches.push(...rawMatches);
    }

    // Step 5: Filter
    const filteredMatches = filterMatches(allRawMatches, corpus);

    // Step 6: Verdict
    const result = generateVerdict(filteredMatches);

    const processingTime = Date.now() - startTime;

    // Use primary match track info if available, else just summarize the tracks
    const firstTrack = tracks[0] || {};
    
    // Build response
    const response = {
      verdict: result.verdict,
      summary: result.summary,
      processingTimeMs: processingTime,
      query: {
        fileName: req.file.originalname,
        trackName: tracks.length + ' melodic tracks combined', // Generalized
        trackIndex: 0,
        noteCount: queryNoteCount,
        intervalCount: queryIntervalCount,
      },
      primaryMatch: result.primaryMatch
        ? {
            songName: result.primaryMatch.songName,
            artist: result.primaryMatch.artist,
            matchedIntervalSequence: result.primaryMatch.matchedIntervalSequence,
            queryStart: result.primaryMatch.queryStart,
            queryEnd: result.primaryMatch.queryEnd,
            referenceStart: result.primaryMatch.referenceStart,
            referenceEnd: result.primaryMatch.referenceEnd,
            matchLength: result.primaryMatch.matchLength,
            queryNotes: [], // We don't save the single track anymore, or we can just send empty array
            referenceNotes: result.primaryMatch.referenceNotes,
            queryIntervals: [], // Optional
            referenceIntervals: result.primaryMatch.referenceIntervals,
            severity: result.primaryMatch.severity,
            score: result.primaryMatch.score,
          }
        : null,
      allMatches: result.allMatches,
      corpus: {
        totalSongs: corpus.length,
        songs: corpus.map(c => ({ songName: c.songName, artist: c.artist })),
      },
    };

    return res.json(response);
  } catch (err) {
    console.error('Analysis error:', err);
    return res.status(500).json({
      error: `Analysis failed: ${err.message}`,
    });
  } finally {
    // Clean up uploaded file
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (cleanupErr) {
      console.error('Failed to clean up uploaded file:', cleanupErr);
    }
  }
}
