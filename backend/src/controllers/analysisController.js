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
import { getAutomaton } from '../services/automatonManager.js';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
function midiToNoteName(midiNumber) {
  const octave = Math.floor(midiNumber / 12) - 1;
  const noteName = NOTE_NAMES[midiNumber % 12];
  return `${noteName}${octave}`;
}

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

    // Step 3: Load corpus and get pre-built automaton
    const corpus = getCorpus();

    if (corpus.length === 0) {
      return res.status(500).json({
        error: 'Corpus database is empty. Please run the seed script first.',
      });
    }

    const automaton = getAutomaton();

    // The primary track is used for the frontend trace animation
    const primaryTrack = tracks[0] || { notes: [], trackName: 'Unknown', trackIndex: 0 };
    const mappedQueryNotes = primaryTrack.notes.map(midiToNoteName);

    // Step 4: Search all tracks and accumulate matches
    let allRawMatches = [];
    let queryIntervalCount = 0;
    let queryNoteCount = 0;
    let executionTrace = null;
    
    for (const track of tracks) {
      const qIntervals = encodeIntervals(track.notes);
      queryIntervalCount += qIntervals.length;
      queryNoteCount += track.notes.length;
      
      const { matches: rawMatches, trace } = search(automaton, qIntervals, true);
      
      if (!executionTrace) executionTrace = trace; // Capture trace from the first track

      // Inject the track info into the raw match (if needed downstream)
      rawMatches.forEach(m => m.trackIndex = track.trackIndex);
      allRawMatches.push(...rawMatches);
    }

    // Step 5: Filter
    const filteredMatches = filterMatches(allRawMatches, corpus);

    // Step 6: Verdict
    const result = generateVerdict(filteredMatches);

    const processingTime = Date.now() - startTime;
    
    // Build response
    const response = {
      verdict: result.verdict,
      summary: result.summary,
      processingTimeMs: processingTime,
      query: {
        fileName: req.file.originalname,
        trackName: primaryTrack.trackName, 
        trackIndex: primaryTrack.trackIndex,
        noteCount: primaryTrack.notes.length,
        intervalCount: Math.max(0, primaryTrack.notes.length - 1),
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
            queryNotes: [], // Frontend will use simulationData.queryNotes
            referenceNotes: result.primaryMatch.referenceNotes,
            queryIntervals: [],
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
      simulationData: {
        executionTrace,
        queryNotes: mappedQueryNotes
      }
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

export async function analyseNotesHandler(req, res) {
  const startTime = Date.now();

  const notes = req.body.notes;
  if (!notes || !Array.isArray(notes) || notes.length === 0) {
    return res.status(400).json({
      error: 'No valid notes provided in the request body.',
    });
  }

  try {
    const corpus = getCorpus();
    if (corpus.length === 0) {
      return res.status(500).json({
        error: 'Corpus database is empty. Please run the seed script first.',
      });
    }

    const automaton = getAutomaton();

    const mappedQueryNotes = notes.map(midiToNoteName);

    const qIntervals = encodeIntervals(notes);
    
    // We pass true for trace so the frontend visualizer gets it
    const { matches: rawMatches, trace } = search(automaton, qIntervals, true);
    
    // Inject trackIndex 0
    rawMatches.forEach(m => m.trackIndex = 0);

    const filteredMatches = filterMatches(rawMatches, corpus);
    const result = generateVerdict(filteredMatches);
    const processingTime = Date.now() - startTime;
    
    const response = {
      verdict: result.verdict,
      summary: result.summary,
      processingTimeMs: processingTime,
      query: {
        fileName: 'Hummed Audio',
        trackName: 'Vocal',
        trackIndex: 0,
        noteCount: notes.length,
        intervalCount: Math.max(0, notes.length - 1),
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
            queryNotes: [], // Frontend will use simulationData.queryNotes
            referenceNotes: result.primaryMatch.referenceNotes,
            queryIntervals: [],
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
      simulationData: {
        executionTrace: trace,
        queryNotes: mappedQueryNotes
      }
    };

    return res.json(response);
  } catch (err) {
    console.error('Analysis error:', err);
    return res.status(500).json({
      error: `Analysis failed: ${err.message}`,
    });
  }
}

