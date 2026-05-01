import { useState, useRef, useCallback } from 'react'
import { PitchDetector } from 'pitchy'

function freqToMidi(frequency) {
  return Math.round(69 + 12 * Math.log2(frequency / 440))
}

function getRms(buffer) {
  let sum = 0
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i] * buffer[i]
  }
  return Math.sqrt(sum / buffer.length)
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
  const startTimeRef = useRef(0)
  const lastFrameAtRef = useRef(0)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      streamRef.current = stream
      audioChunksRef.current = []

      if (window.MediaRecorder) {
        const preferredType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm'
        const recorder = new MediaRecorder(stream, { mimeType: preferredType })
        recorder.ondataavailable = event => {
          if (event.data?.size > 0) {
            audioChunksRef.current.push(event.data)
          }
        }
        recorder.start()
        mediaRecorderRef.current = recorder
      }

      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      audioContextRef.current = audioContext

      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 4096
      analyser.smoothingTimeConstant = 0
      analyserRef.current = analyser

      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)

      const detector = PitchDetector.forFloat32Array(analyser.fftSize)
      const buffer = new Float32Array(analyser.fftSize)

      rawNotesRef.current = []
      startTimeRef.current = performance.now()
      lastFrameAtRef.current = 0
      setDetectedNotes([])
      setCurrentNote(null)
      setIsRecording(true)

      function detectPitch() {
        if (!analyserRef.current || !audioContextRef.current) return

        const now = performance.now()
        if (now - lastFrameAtRef.current < 45) {
          frameRef.current = requestAnimationFrame(detectPitch)
          return
        }
        lastFrameAtRef.current = now

        analyserRef.current.getFloatTimeDomainData(buffer)
        const rms = getRms(buffer)
        const [frequency, clarity] = detector.findPitch(buffer, audioContextRef.current.sampleRate)

        // Accept clear, voiced pitches in a practical humming/singing range.
        if (clarity > 0.78 && rms > 0.008 && frequency > 70 && frequency < 1100) {
          const midiNote = freqToMidi(frequency)
          rawNotesRef.current.push({
            note: midiNote,
            time: now - startTimeRef.current,
            voiced: true,
          })
          setCurrentNote(midiNote)
          setDetectedNotes(segmentHummedNotes(rawNotesRef.current))
        } else {
          rawNotesRef.current.push({
            note: null,
            time: now - startTimeRef.current,
            voiced: false,
          })
          setCurrentNote(null)
        }

        frameRef.current = requestAnimationFrame(detectPitch)
      }

      frameRef.current = requestAnimationFrame(detectPitch)

    } catch (err) {
      console.error('Mic access denied:', err)
      throw new Error('Microphone access required')
    }
  }, [])

  const stopRecording = useCallback(async () => {
    // Stop animation loop
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current)
    }

    const audioBlobPromise = new Promise(resolve => {
      const recorder = mediaRecorderRef.current
      if (!recorder || recorder.state === 'inactive') {
        resolve(null)
        return
      }

      recorder.onstop = () => {
        resolve(new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' }))
      }
      recorder.stop()
    })

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
    const cleaned = segmentHummedNotes(rawNotesRef.current)
    setDetectedNotes(cleaned)

    const audioBlob = await audioBlobPromise

    return {
      notes: cleaned,
      audioBlob,
    }
  }, [])

  return { isRecording, detectedNotes, currentNote, startRecording, stopRecording }
}

function median(values) {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

function pushSegment(result, segment) {
  if (segment.length < 3) return
  const stableNote = median(segment.map(frame => frame.note))
  if (stableNote == null) return

  const previous = result[result.length - 1]
  const gapFromPrevious = segment[0].time - (previous?.endedAt ?? -Infinity)

  // Merge tiny vibrato fragments, but preserve repeated notes separated by a syllable gap.
  if (previous && previous.note === stableNote && gapFromPrevious < 140) {
    previous.endedAt = segment[segment.length - 1].time
    return
  }

  result.push({
    note: stableNote,
    endedAt: segment[segment.length - 1].time,
  })
}

// Converts frame-level pitch detections into melody notes.
// Silence creates new syllables, so repeated notes can produce 0 intervals.
export function segmentHummedNotes(frames) {
  if (!frames.length) return []

  const result = []
  let segment = []
  let silenceFrames = 0

  for (const frame of frames) {
    if (!frame.voiced || frame.note == null) {
      silenceFrames++
      if (silenceFrames >= 2) {
        pushSegment(result, segment)
        segment = []
      }
      continue
    }

    silenceFrames = 0
    const currentMedian = median(segment.slice(-5).map(item => item.note))

    if (currentMedian != null && Math.abs(frame.note - currentMedian) >= 2 && segment.length >= 3) {
      pushSegment(result, segment)
      segment = [frame]
    } else {
      segment.push(frame)
    }
  }

  pushSegment(result, segment)

  return result.map(item => item.note)
}
