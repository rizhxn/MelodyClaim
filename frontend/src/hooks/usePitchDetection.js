import { useState, useRef, useCallback } from 'react'
import { PitchDetector } from 'pitchy'

function freqToMidi(frequency) {
  return Math.round(69 + 12 * Math.log2(frequency / 440))
}

export function usePitchDetection() {
  const [isRecording, setIsRecording] = useState(false)
  const [detectedNotes, setDetectedNotes] = useState([])
  const [currentNote, setCurrentNote] = useState(null)

  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const streamRef = useRef(null)
  const frameRef = useRef(null)
  const rawNotesRef = useRef([])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      audioContextRef.current = audioContext

      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 2048
      analyserRef.current = analyser

      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)

      const detector = PitchDetector.forFloat32Array(analyser.fftSize)
      const buffer = new Float32Array(analyser.fftSize)

      rawNotesRef.current = []
      setDetectedNotes([])
      setIsRecording(true)

      function detectPitch() {
        if (!analyserRef.current || !audioContextRef.current) return

        analyserRef.current.getFloatTimeDomainData(buffer)
        const [frequency, clarity] = detector.findPitch(buffer, audioContextRef.current.sampleRate)

        // Only accept clear pitches from human voice range
        if (clarity > 0.9 && frequency > 80 && frequency < 1200) {
          const midiNote = freqToMidi(frequency)
          rawNotesRef.current.push(midiNote)
          setCurrentNote(midiNote)
        }

        frameRef.current = requestAnimationFrame(detectPitch)
      }

      frameRef.current = requestAnimationFrame(detectPitch)

    } catch (err) {
      console.error('Mic access denied:', err)
      throw new Error('Microphone access required')
    }
  }, [])

  const stopRecording = useCallback(() => {
    // Stop animation loop
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current)
    }

    // Stop mic
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }

    setIsRecording(false)
    setCurrentNote(null)

    // Clean up raw detections into usable note sequence
    const cleaned = collapseNotes(rawNotesRef.current)
    setDetectedNotes(cleaned)

    return cleaned
  }, [])

  return { isRecording, detectedNotes, currentNote, startRecording, stopRecording }
}

// Collapse consecutive identical notes and filter noise
function collapseNotes(rawNotes) {
  if (rawNotes.length === 0) return []

  const MIN_FRAMES = 3 // Note must appear 3+ times to count (filters noise)
  const result = []
  let current = rawNotes[0]
  let count = 1

  for (let i = 1; i < rawNotes.length; i++) {
    if (rawNotes[i] === current) {
      count++
    } else {
      if (count >= MIN_FRAMES) {
        result.push(current)
      }
      current = rawNotes[i]
      count = 1
    }
  }

  if (count >= MIN_FRAMES) {
    result.push(current)
  }

  return result
}