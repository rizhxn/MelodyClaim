/**
 * Takes an array of MIDI note numbers and returns a signed integer array
 * of semitone differences between each consecutive pair.
 *
 * - Repeated notes produce 0
 * - Null/undefined values are skipped
 *
 * @param {number[]} notes - Array of MIDI note numbers
 * @returns {number[]} Array of signed semitone intervals
 */
export function encodeIntervals(notes) {
  if (!notes || notes.length < 2) {
    return [];
  }

  // Filter out null/undefined values while preserving order
  const filtered = notes.filter(n => n != null && !isNaN(n));

  if (filtered.length < 2) {
    return [];
  }

  const intervals = [];

  for (let i = 1; i < filtered.length; i++) {
    const diff = filtered[i] - filtered[i - 1]; // signed difference
    intervals.push(diff);
  }

  return intervals;
}

/**
 * Decodes an interval sequence back to note numbers given a starting note.
 *
 * @param {number[]} intervals - Array of signed semitone intervals
 * @param {number} startNote - The starting MIDI note number
 * @returns {number[]} Reconstructed note number array
 */
export function decodeIntervals(intervals, startNote) {
  if (!intervals || intervals.length === 0) {
    return [startNote];
  }

  const notes = [startNote];

  for (const interval of intervals) {
    notes.push(notes[notes.length - 1] + interval);
  }

  return notes;
}
