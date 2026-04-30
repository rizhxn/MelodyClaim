import React, { useCallback, useEffect, useRef, useState } from 'react'
import { usePitchDetection } from '../hooks/usePitchDetection'
import { Mic } from 'lucide-react'

const MAX_RECORDING_MS = 12000
const MIN_NOTES = 8

export function HummingInput({ onComplete }) {
  const { isRecording, detectedNotes, currentNote, startRecording, stopRecording } = usePitchDetection()
  const [error, setError] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef(null)
  const stopTimeoutRef = useRef(null)

  async function handleStart() {
    setError('')
    setElapsed(0)
    try {
      await startRecording()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleStop = useCallback(async () => {
    if (!isRecording) return

    clearInterval(timerRef.current)
    clearTimeout(stopTimeoutRef.current)

    const { notes, audioBlob } = await stopRecording()
    
    if (notes.length < MIN_NOTES) {
      setError(`Only ${notes.length} notes detected. Hum a clearer melody for 8-12 seconds.`)
      return
    }

    // Send both raw audio and extracted notes. The backend can use audio for
    // external humming recognition and notes for local structural matching.
    onComplete({ notes, audioBlob })
  }, [isRecording, onComplete, stopRecording])

  useEffect(() => {
    if (!isRecording) return undefined

    const startedAt = Date.now()
    timerRef.current = setInterval(() => {
      setElapsed(Date.now() - startedAt)
    }, 200)
    stopTimeoutRef.current = setTimeout(() => {
      handleStop()
    }, MAX_RECORDING_MS)

    return () => {
      clearInterval(timerRef.current)
      clearTimeout(stopTimeoutRef.current)
    }
  }, [handleStop, isRecording])

  const progress = Math.min(100, (elapsed / MAX_RECORDING_MS) * 100)

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center justify-center">
      <div
        className={`w-full ${isRecording ? 'border-[#9d4edd] bg-[#9d4edd]/10' : 'border-white/20 bg-white/5'} border-dashed border-2 hover:border-[#9d4edd]/50 hover:bg-[#9d4edd]/5 rounded-2xl p-8 transition-all duration-300 relative group flex flex-col items-center justify-center`}
      >
        {!isRecording ? (
          <div 
            onClick={handleStart}
            className="flex flex-col items-center justify-center text-center space-y-3 cursor-pointer w-full"
          >
            <div className="w-16 h-16 rounded-full bg-[#9d4edd]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
               <Mic size={28} className="text-[#9d4edd]" />
            </div>
            <div>
              <div className="text-[#9d4edd] font-semibold text-lg">
                Click to Start Humming
              </div>
              <div className="text-white/50 text-sm mt-1">
                Hum 8-12 seconds of the hook
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 w-full">
            <div
              className="w-24 h-24 rounded-full bg-[#9d4edd]/20 border-4 border-[#9d4edd] flex items-center justify-center cursor-pointer animate-pulse"
              onClick={handleStop}
            >
               <Mic size={36} className="text-[#9d4edd]" />
            </div>

            <div className="text-center">
              <div className="text-[#9d4edd] font-semibold text-lg mb-2">
                Listening... Click mic to stop
              </div>
              {currentNote !== null ? (
                <p className="text-white font-mono bg-black/30 px-3 py-1 rounded-md inline-block">
                  Detecting: {midiToNoteName(currentNote)}
                </p>
              ) : (
                <p className="text-white/50 font-mono bg-black/30 px-3 py-1 rounded-md inline-block">
                  Waiting for pitch...
                </p>
              )}
            </div>

            <div className="w-full max-w-xs">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#9d4edd] transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs text-white/45">
                <span>{Math.ceil((MAX_RECORDING_MS - elapsed) / 1000)}s left</span>
                <span>{detectedNotes.length} captured</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm w-full text-center">
          ⚠️ {error}
        </div>
      )}
    </div>
  )
}

function midiToNoteName(midi) {
  const notes = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
  return `${notes[midi % 12]}${Math.floor(midi / 12) - 1}`
}
