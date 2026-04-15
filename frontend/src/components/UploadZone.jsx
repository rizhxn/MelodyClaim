import { useState, useRef, useCallback } from 'react';

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
    <div className="upload-zone-wrapper">
      <div className="upload-hero-title">
        <h1>Detect Melodic Plagiarism</h1>
      </div>
      <p className="upload-hero-subtitle">
        Upload a MIDI file and our automata-powered engine will scan it against
        a corpus of reference melodies for structural similarity.
      </p>

      <div
        id="upload-drop-zone"
        className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
        aria-label="Upload MIDI file"
      >
        <div className="upload-zone-icon">🎹</div>
        <div className="upload-zone-text">
          <div className="upload-zone-title">
            Drop your MIDI file here
          </div>
          <div className="upload-zone-subtitle">
            or click to browse your files
          </div>
          <div className="upload-zone-formats">
            <span className="upload-format-badge">.mid</span>
            <span className="upload-format-badge">.midi</span>
          </div>
        </div>
      </div>

      {error && (
        <div id="upload-error" className="upload-error">
          ⚠ {error}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".mid,.midi"
        className="upload-hidden-input"
        onChange={handleInputChange}
        aria-hidden="true"
      />
    </div>
  );
}
