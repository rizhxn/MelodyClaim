import pkg from '@tonejs/midi';
const { Midi } = pkg;

/**
 * Parses a MIDI file buffer and extracts the primary melodic track
 * as an ordered array of MIDI note numbers (ignoring rests).
 *
 * The primary melodic track is identified as the track with the
 * highest note density (most notes).
 *
 * @param {Buffer} buffer - The raw MIDI file buffer
 * @returns {{ notes: number[], trackName: string, trackIndex: number }}
 */
export function parseMidi(buffer) {
  const midi = new Midi(buffer);

  if (!midi.tracks || midi.tracks.length === 0) {
    throw new Error('No tracks found in MIDI file');
  }

  // Find the track with the highest note density
  let bestTrack = null;
  let bestCount = 0;
  let bestIndex = -1;

  for (let i = 0; i < midi.tracks.length; i++) {
    const track = midi.tracks[i];
    const noteCount = track.notes ? track.notes.length : 0;

    if (noteCount > bestCount) {
      bestCount = noteCount;
      bestTrack = track;
      bestIndex = i;
    }
  }

  if (!bestTrack || bestCount === 0) {
    throw new Error('No notes found in any MIDI track');
  }

  // Sort notes by time (ticks), then by pitch for simultaneous notes
  const sortedNotes = [...bestTrack.notes].sort((a, b) => {
    if (a.ticks !== b.ticks) return a.ticks - b.ticks;
    return a.midi - b.midi;
  });

  // Extract MIDI note numbers, taking only the highest note for chords
  const noteNumbers = [];
  let lastTick = -1;

  for (const note of sortedNotes) {
    if (note.ticks === lastTick) {
      // For simultaneous notes (chords), replace with the highest pitch
      noteNumbers[noteNumbers.length - 1] = Math.max(
        noteNumbers[noteNumbers.length - 1],
        note.midi
      );
    } else {
      noteNumbers.push(note.midi);
      lastTick = note.ticks;
    }
  }

  return {
    notes: noteNumbers,
    trackName: bestTrack.name || `Track ${bestIndex}`,
    trackIndex: bestIndex,
  };
}
