import React, { useState } from 'react'
import { usePitchDetection } from '../hooks/usePitchDetection'
import { motion } from 'framer-motion'
import { Mic } from 'lucide-react'

export function HummingInput({ onComplete }) {
  const { isRecording, currentNote, startRecording, stopRecording } = usePitchDetection()
  const [error, setError] = useState('')

  async function handleStart() {
    setError('')
    try {
      await startRecording()
    } catch (err) {
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
                Make sure your microphone is enabled
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 w-full">
            <motion.div
              className="w-24 h-24 rounded-full bg-[#9d4edd]/20 border-4 border-[#9d4edd] flex items-center justify-center cursor-pointer"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              onClick={handleStop}
            >
               <Mic size={36} className="text-[#9d4edd]" />
            </motion.div>

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