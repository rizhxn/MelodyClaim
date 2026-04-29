Here's the complete implementation path for humming, based on everything we've discussed.

---

## The Stack

**Browser → Pitch Detection → Note Sequence → Your Existing Backend**

No separate backend needed. Humming produces the same output as MIDI upload — a note array — so it uses 99% of the same pipeline.

---

## Step-by-Step Implementation

### 1. Install Pitchy on Frontend

```bash
cd frontend
npm install pitchy
```

### 2. Create the Pitch Detection Hook

Create `/frontend/src/hooks/usePitchDetection.ts`:

```typescript
import { useState, useRef, useCallback } from 'react'
import { PitchDetector } from 'pitchy'

function freqToMidi(frequency: number): number {
  return Math.round(69 + 12 * Math.log2(frequency / 440))
}

export function usePitchDetection() {
  const [isRecording, setIsRecording] = useState(false)
  const [detectedNotes, setDetectedNotes] = useState<number[]>([])
  const [currentNote, setCurrentNote] = useState<number | null>(null)

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const frameRef = useRef<number | null>(null)
  const rawNotesRef = useRef<number[]>([])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const audioContext = new AudioContext()
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
function collapseNotes(rawNotes: number[]): number[] {
  if (rawNotes.length === 0) return []

  const MIN_FRAMES = 3 // Note must appear 3+ times to count (filters noise)
  const result: number[] = []
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
```

---

### 3. Create the Humming Component

Create `/frontend/src/components/HummingInput.tsx`:

```typescript
import { useState } from 'react'
import { usePitchDetection } from '../hooks/usePitchDetection'
import { motion } from 'framer-motion'

interface HummingInputProps {
  onComplete: (notes: number[]) => void
}

export function HummingInput({ onComplete }: HummingInputProps) {
  const { isRecording, currentNote, startRecording, stopRecording } = usePitchDetection()
  const [error, setError] = useState('')

  async function handleStart() {
    setError('')
    try {
      await startRecording()
    } catch (err: any) {
      setError(err.message)
    }
  }

  function handleStop() {
    const notes = stopRecording()
    
    if (notes.length < 7) {
      setError('Not enough notes detected. Please hum a longer melody.')
      return
    }

    // Send notes to backend for analysis
    onComplete(notes)
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {!isRecording ? (
        <button
          onClick={handleStart}
          className="px-8 py-4 bg-[#5DCAA5] text-black rounded-lg font-medium hover:bg-[#4db894] transition-colors"
        >
          Start Humming
        </button>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <motion.div
            className="w-32 h-32 rounded-full bg-[#5DCAA5]/20 border-4 border-[#5DCAA5] flex items-center justify-center"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <svg className="w-16 h-16 text-[#5DCAA5]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          </motion.div>

          {currentNote !== null && (
            <p className="text-white font-mono">
              Detecting: {midiToNoteName(currentNote)}
            </p>
          )}

          <button
            onClick={handleStop}
            className="px-6 py-2 bg-white text-black rounded-md font-medium hover:bg-gray-100 transition-colors"
          >
            Stop & Analyze
          </button>
        </div>
      )}

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  )
}

function midiToNoteName(midi: number): string {
  const notes = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
  return `${notes[midi % 12]}${Math.floor(midi / 12) - 1}`
}
```

---

### 4. Backend Endpoint for Note Arrays

Add to `/backend/src/controllers/analysisController.js`:

```javascript
/**
 * POST /api/analyse/notes
 * Accepts raw note array from humming/pitch detection
 */
async function analyseFromNotes(req, res) {
  const { notes } = req.body

  if (!Array.isArray(notes) || notes.length < 7) {
    return res.status(400).json({ 
      error: 'Invalid note sequence. Minimum 7 notes required.' 
    })
  }

  try {
    // Skip MIDI parsing — start directly from interval encoding
    const queryIntervals = encodeIntervals(notes)

    if (queryIntervals.length < 6) {
      return res.status(400).json({ 
        error: 'Melody too short after encoding.' 
      })
    }

    // Run same pipeline as MIDI upload
    const patterns = corpusSongs.map(s => JSON.parse(s.interval_sequence))
    const rawMatches = search(automaton, queryIntervals, patterns)
    const filteredMatches = filterMatches(rawMatches, corpusSongs)
    const result = generateVerdict(filteredMatches, queryIntervals, notes)

    // Optionally save to history if user is authenticated
    if (req.user) {
      db.prepare(`
        INSERT INTO analysis_history 
        (user_id, original_filename, query_intervals, verdict, 
         matched_song_id, match_length, matched_sequence)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        req.user.id,
        'humming-input',
        JSON.stringify(queryIntervals),
        result.verdict,
        result.primaryMatch?.songId ?? null,
        result.primaryMatch?.matchLength ?? null,
        result.primaryMatch ? JSON.stringify(result.primaryMatch.matchedSequence) : null
      )
    }

    return res.status(200).json({
      success: true,
      meta: {
        source: 'humming',
        totalNotes: notes.length,
        intervalCount: queryIntervals.length
      },
      ...result
    })

  } catch (err) {
    console.error('Humming analysis error:', err)
    return res.status(500).json({ error: 'Analysis failed' })
  }
}

module.exports = { analyse, analyseFromNotes, getCorpus, reloadCorpus }
```

Add route in `/backend/src/routes/analysisRoutes.js`:

```javascript
const { optionalAuth } = require('../middleware/auth')

router.post('/analyse/notes', optionalAuth, analyseFromNotes)
```

---

### 5. Wire It Up in Your UI

In your humming page:

```typescript
import { HummingInput } from '@/components/HummingInput'
import { useNavigate } from 'react-router-dom'

export function HummingPage() {
  const navigate = useNavigate()

  async function handleNotesDetected(notes: number[]) {
    try {
      const token = localStorage.getItem('token')
      
      const res = await fetch('http://localhost:3001/api/analyse/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ notes })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error)
      }

      const data = await res.json()
      
      // Navigate to results with data
      navigate('/results', { state: { data } })
      
    } catch (err) {
      console.error('Analysis failed:', err)
      alert('Analysis failed: ' + err.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <HummingInput onComplete={handleNotesDetected} />
    </div>
  )
}
```

---

## That's It

**Flow:**
1. User clicks "Start Humming"
2. Browser requests mic access
3. Pitchy detects pitch every 50ms
4. Raw detections stored
5. User clicks "Stop"
6. Raw notes collapsed into clean sequence
7. Note array sent to `/api/analyse/notes`
8. Backend encodes to intervals
9. Same automaton search runs
10. Results returned

**What you get:**
- Humming detection that produces same output format as MIDI
- No separate backend complexity
- Same results page
- Same automaton engine

