import { useState, useRef, useCallback } from 'react';
import { Music } from 'lucide-react';

export default function UploadZone({ onFileAccepted }) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const validateFile = useCallback((file) => {
    if (!file) return 'No file selected.';
    const ext = file.name.toLowerCase().split('.').pop();
    if (ext !== 'mid' && ext !== 'midi') {
      return 'Invalid file type. Please upload a .mid or .midi file.';
    }
    if (file.size > 10 * 1024 * 1024) {
      return 'File too large. Maximum size is 10MB.';
    }
    return null;
  }, []);

  const handleFile = useCallback((file) => {
    const err = validateFile(file);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    onFileAccepted(file);
  }, [validateFile, onFileAccepted]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, [handleFile]);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleInputChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
    e.target.value = '';
  }, [handleFile]);

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center justify-center">
      <div className="w-20 h-20 rounded-full bg-[#9d4edd]/10 flex items-center justify-center mb-6">
        <Music size={40} className="text-[#9d4edd]" />
      </div>
      
      <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Upload MIDI</h2>
      
      <p className="text-white/60 mb-8 max-w-lg mx-auto text-lg hover:glow-text text-center">
        Upload your MIDI sequence. We will extract its structural progression and analyze it against our database.
      </p>

      <div
        id="upload-drop-zone"
        className={`w-full ${dragOver ? 'border-[#9d4edd] bg-[#9d4edd]/10' : 'border-white/20 bg-white/5'} border-dashed border-2 hover:border-[#9d4edd]/50 hover:bg-[#9d4edd]/5 rounded-2xl p-8 cursor-pointer transition-all duration-300 relative group`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
        aria-label="Upload MIDI file"
      >
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#9d4edd]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
             <span className="text-2xl" role="img" aria-label="upload">🎹</span>
          </div>
          <div>
            <div className="text-[#9d4edd] font-semibold text-lg">
              Browse files or drag & drop
            </div>
            <div className="text-white/50 text-sm mt-1">
              Supports .mid and .midi
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div id="upload-error" className="upload-error mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm w-full text-center">
          ⚠️ {error}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".mid,.midi"
        className="upload-hidden-input hidden"
        onChange={handleInputChange}
        aria-hidden="true"
      />
    </div>
  );
}
