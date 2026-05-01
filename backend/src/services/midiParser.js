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

  const validTracks = [];

  for (let i = 0; i < midi.tracks.length; i++) {
    const track = midi.tracks[i];
    
    // Skip percussion/drum tracks (channel 9 in 0-indexed tonejs means 10 in MIDI)
    if (track.instrument && track.instrument.percussion) continue;
    if (track.channel === 9) continue;
    
    const noteCount = track.notes ? track.notes.length : 0;
    if (noteCount < 4) continue; // Skip near empty tracks

    // Sort notes by time (ticks), then by pitch for simultaneous notes
    const sortedNotes = [...track.notes].sort((a, b) => {
      if (a.ticks !== b.ticks) return a.ticks - b.ticks;
      return a.midi - b.midi;
    });

    // Extract MIDI note numbers, taking only the highest note for chords.
    // Keep separate visual metadata so the frontend piano roll can represent
    // timing/duration without changing the matcher input.
    const noteNumbers = [];
    const visualNotes = [];
    let lastTick = -1;

    for (const note of sortedNotes) {
      if (note.ticks === lastTick) {
        // For simultaneous notes (chords), replace with the highest pitch
        const currentIndex = noteNumbers.length - 1;
        if (note.midi > noteNumbers[currentIndex]) {
          noteNumbers[currentIndex] = note.midi;
          visualNotes[currentIndex] = {
            midi: note.midi,
            time: note.time || 0,
            duration: note.duration || 0,
            ticks: note.ticks || 0,
            durationTicks: note.durationTicks || 0,
            velocity: note.velocity ?? 0.75,
          };
        }
      } else {
        noteNumbers.push(note.midi);
        visualNotes.push({
          midi: note.midi,
          time: note.time || 0,
          duration: note.duration || 0,
          ticks: note.ticks || 0,
          durationTicks: note.durationTicks || 0,
          velocity: note.velocity ?? 0.75,
        });
        lastTick = note.ticks;
      }
    }

    validTracks.push({
      notes: noteNumbers,
      visualNotes,
      trackName: track.name || `Track ${i}`,
      trackIndex: i,
    });
  }

  if (validTracks.length === 0) {
    throw new Error('No valid melodic tracks found in MIDI file');
  }

  return {
    tracks: validTracks
  };
}
