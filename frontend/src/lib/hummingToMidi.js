import { PitchDetector } from 'pitchy';
import MidiWriter from 'midi-writer-js';

export async function processAudioToMidi(audioBlob) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioContext.sampleRate;
  
  // Pitch detector params
  const windowSize = 2048;
  const detector = PitchDetector.forFloat32Array(windowSize);
  
  const stepSize = 1024;
  const notes = [];
  
  let currentPitch = null;
  let syllableFrames = 0;
  
  for (let i = 0; i < channelData.length - windowSize; i += stepSize) {
    const input = channelData.slice(i, i + windowSize);
    const [pitch, clarity] = detector.findPitch(input, sampleRate);
    
    // Calculate RMS (volume level) to detect rests/breaths
    let sum = 0;
    for(let j=0; j < input.length; j++) sum += input[j]*input[j];
    const rms = Math.sqrt(sum / input.length);
    
    // If there is enough clarity and volume, treat it as singing
    if (clarity > 0.6 && pitch > 50 && pitch < 2000 && rms > 0.01) {
      const midiNote = Math.round(69 + 12 * Math.log2(pitch / 440));
      
      if (currentPitch === null) {
        currentPitch = midiNote;
        syllableFrames = 1;
      } else {
        // If the pitch changes by at least 1 semitone, push the old note and start a new one
        if (Math.abs(currentPitch - midiNote) >= 1) {
          if (syllableFrames > 1) notes.push(currentPitch);
          currentPitch = midiNote;
          syllableFrames = 1;
        } else {
          // It's the same note, being held
          syllableFrames++;
        }
      }
    } else {
      // Silence or unpitched breath! Marks the end of a syllable.
      if (currentPitch !== null) {
        // Only keep if they held it for at least 2 frames (prevents micro-glitches)
        if (syllableFrames > 1) {
          notes.push(currentPitch);
        }
        currentPitch = null;
        syllableFrames = 0;
      }
    }
  }
  
  if (currentPitch !== null && syllableFrames > 1) {
    notes.push(currentPitch);
  }
  
  // Create a minimal valid MIDI sequence
  const track = new MidiWriter.Track();
  if (notes.length === 0) {
    throw new Error('No pitches detected in audio');
  }

  // We pass notes directly now. 
  // The logic above naturally separated notes by breaths (silence) OR pitch changes.
  for (const n of notes) {
    track.addEvent(
      new MidiWriter.NoteEvent({
        pitch: n,
        duration: '16',
        velocity: 100
      })
    );
  }
  
  const write = new MidiWriter.Writer(track);
  const u8Array = write.buildData();
  
  return new Blob([u8Array], { type: 'audio/midi' });
}
