# Humming-Based Music Detection System

## 1. Overview

- **What the system does:** Accepts a short hummed audio clip from the user via microphone, extracts the melodic pitch contour, converts it into a pitch-transposition-invariant interval sequence, and runs it through the MelodyClaim Aho-Corasick pattern matching engine to detect structural similarity against a corpus of copyrighted melodies.
- **What input it expects:** A raw audio recording (WAV or PCM stream) of a human humming a melody, minimum 3 seconds, sampled at 44100 Hz or 22050 Hz mono.
- **What output it produces:** A structured interval sequence identical in format to a MIDI-derived query, passed to the existing MelodyClaim matching pipeline, returning matched song names, matched subsequences, positions, and similarity scores.

---

## 2. Original Idea Breakdown

### What was originally suggested
Humming input was proposed as a Tier 3 optional feature — a way for users who do not have a MIDI file to query the system by singing or humming the melody they want to check. The core idea was: microphone input → pitch detection → interval encoding → same Aho-Corasick search used for MIDI.

### Clarifications on vague parts
- "Pitch detection from microphone" was left unspecified. This document specifies **YIN algorithm** as the pitch extractor operating on overlapping audio frames.
- "Convert to MIDI-like sequence" was implied. This means extracting a sequence of dominant pitches per time frame, quantizing them to the nearest semitone, and then computing semitone differences to produce the interval string.
- The humming pipeline is not a separate system — it is a **pre-processing adapter** that produces the same interval sequence format that the MIDI parser already produces, feeding the same downstream matching engine.

---

## 3. System Architecture

End-to-end pipeline:

```
Microphone Input (WAV/PCM)
        ↓
Audio Capture & Buffering
        ↓
Preprocessing (Resampling → Mono → Noise Gate → Normalization)
        ↓
Frame Segmentation (overlapping 512-sample frames, 256-sample hop)
        ↓
Pitch Extraction per Frame (YIN algorithm → Hz value or "unvoiced")
        ↓
Pitch Sequence Assembly (raw Hz sequence, one value per frame)
        ↓
Semitone Quantization (Hz → MIDI note number using 12-TET)
        ↓
Note Deduplication (collapse consecutive identical notes into one)
        ↓
Rest Filtering (remove unvoiced/silent frames from sequence)
        ↓
Interval Encoding (compute semitone differences between consecutive notes)
        ↓
Interval Sequence String (e.g., [+2, -1, +3, 0, -2])
        ↓
Aho-Corasick Pattern Matching Engine (existing MelodyClaim backend)
        ↓
Match Results JSON (song name, positions, similarity score)
```

---

## 4. Module Design

### 4.1 Audio Capture

- **Interface:** Browser `MediaRecorder` API (frontend) or `pyaudio` / `sounddevice` (backend CLI)
- **Format:** 16-bit PCM, mono, 22050 Hz sample rate
- **Duration:** Minimum 3 seconds, maximum 15 seconds. Enforce via timer with UI countdown.
- **Output:** Raw PCM byte buffer or `.wav` file written to a temp path
- **Implementation detail:** On the frontend, use `navigator.mediaDevices.getUserMedia({ audio: true })` with `MediaRecorder`, collect chunks into a `Blob`, convert to `ArrayBuffer`, and POST to the backend as `multipart/form-data`.

### 4.2 Preprocessing

Performed server-side in Python using `librosa` or `scipy`.

Steps in order:
1. **Load audio:** `librosa.load(path, sr=22050, mono=True)` — forces mono and resamples to 22050 Hz
2. **Noise gate:** Compute RMS energy per frame. Frames below threshold `0.01` (normalized amplitude) are marked as silent and excluded from pitch extraction.
3. **Normalize:** Scale waveform so peak amplitude = 1.0 using `librosa.util.normalize`
4. **Output:** Cleaned float32 numpy array `y` at `sr=22050`

### 4.3 Pitch Extraction

- **Algorithm:** YIN (de Cheveigné & Kawahara, 2002)
- **Library:** `librosa.yin()` or `crepe` (neural pitch tracker, more accurate on humming)
- **Frame size:** 512 samples (~23ms at 22050 Hz)
- **Hop size:** 256 samples (~11.6ms)
- **Output per frame:** Fundamental frequency in Hz, or `NaN` if unvoiced

```python
f0 = librosa.yin(y, fmin=80, fmax=1000, sr=22050, frame_length=512, hop_length=256)
# f0 is a numpy array of Hz values, one per frame
# NaN indicates unvoiced frame
```

- **Why YIN:** YIN is specifically designed for monophonic pitch detection. It uses the difference function and cumulative mean normalized difference to avoid octave errors, which are common in humming due to breathiness and vibrato.
- **Alternative:** `crepe` provides more accurate results on noisy/breathy input at the cost of higher compute. Use `crepe` if YIN accuracy is insufficient during testing.

### 4.4 Feature Engineering

Converts the raw Hz sequence into a clean interval string.

**Step 1 — Remove unvoiced frames:**
```python
voiced_f0 = f0[~np.isnan(f0)]
```

**Step 2 — Convert Hz to MIDI note number:**
```python
def hz_to_midi(freq):
    return round(69 + 12 * np.log2(freq / 440.0))

midi_notes = [hz_to_midi(f) for f in voiced_f0]
```

**Step 3 — Deduplicate consecutive identical notes:**
Collapse runs of the same MIDI note number into a single note event. This removes the effect of a held note spanning many frames appearing as repeated values.
```python
deduped = [midi_notes[0]]
for note in midi_notes[1:]:
    if note != deduped[-1]:
        deduped.append(note)
```

**Step 4 — Minimum note count check:**
If `len(deduped) < 4`, reject input as too short to match. Return error: `"Input too short — hum at least 5 distinct notes."`

**Step 5 — Compute interval sequence:**
```python
intervals = [deduped[i+1] - deduped[i] for i in range(len(deduped)-1)]
```

Output: `intervals` — a list of signed integers, e.g., `[+2, -1, +3, 0, -2]`

This is **identical in format** to the interval sequence produced by the MIDI parser. From this point, the humming path merges with the standard pipeline.

### 4.5 Matching Algorithm

No changes to the existing engine. The interval list from humming is passed directly to the Aho-Corasick DFA query function:

```python
results = aho_corasick_search(query_intervals, automaton, corpus)
```

The automaton was built offline over the reference corpus. The humming adapter only provides the query — it does not modify the automaton or matching logic.

### 4.6 Song Database

No changes required. The same corpus of pre-encoded interval sequences used for MIDI matching serves humming queries. No separate humming-specific database is needed.

---

## 5. Algorithms & Techniques

| Algorithm | Used In | Why |
|-----------|---------|-----|
| YIN | Pitch Extraction | Designed for monophonic signals; low octave error rate; works without ML models |
| CREPE (fallback) | Pitch Extraction | Neural network pitch tracker; more robust on breathy/vibrato humming; higher compute |
| 12-TET MIDI conversion | Feature Engineering | Standard semitone quantization; maps continuous Hz to discrete musical alphabet |
| Run-length deduplication | Feature Engineering | Eliminates held-note artifacts from frame-level pitch output |
| Aho-Corasick DFA | Matching | Linear time multi-pattern search; same engine as MIDI path; no duplication |

---

## 6. Data Flow

```
User hums into mic
    → Frontend records audio blob (MediaRecorder)
    → POST /api/hum (multipart, audio/wav)
    → Backend receives file, saves to /tmp/query.wav

/tmp/query.wav
    → librosa.load() → float32 array y at sr=22050
    → Noise gate applied → silent frames zeroed
    → librosa.yin() → f0[] Hz per frame
    → Remove NaN frames → voiced_f0[]
    → hz_to_midi() → midi_notes[]
    → Deduplication → deduped[]
    → Length check → reject if < 4 notes
    → Interval computation → intervals[]

intervals[]
    → aho_corasick_search(intervals, automaton, corpus)
    → matches[] = [{song, artist, matched_subsequence, query_pos, ref_pos, score}]

matches[]
    → Threshold filter (drop matches < 7 intervals)
    → JSON response to frontend
    → Frontend renders Analysis Dashboard (same as MIDI flow)
```

---

## 7. Edge Cases & Failure Handling

### Noisy Input
- **Problem:** Background noise corrupts pitch extraction, producing erratic f0 values.
- **Handling:** Noise gate (RMS threshold 0.01) removes low-energy frames before YIN runs. If voiced frame count after gating is < 4 notes, return: `"Too much background noise — please record in a quieter environment."`

### Off-Key Humming
- **Problem:** Humming slightly sharp or flat of a semitone.
- **Handling:** MIDI quantization via `round()` snaps to the nearest semitone automatically. Errors up to ±50 cents are absorbed by rounding. This is acceptable — the interval sequence is robust to small intonation errors.

### Tempo Variation
- **Problem:** Humming faster or slower changes how many frames each note occupies, not its pitch.
- **Handling:** Run-length deduplication eliminates duration entirely. The matching is purely structural — tempo has zero effect on the interval sequence output.

### Short Input
- **Problem:** User hums only 2–3 notes, producing 1–2 intervals — insufficient for meaningful matching.
- **Handling:** Hard reject at Feature Engineering step if `len(deduped) < 4`. Return error message to frontend before running the automaton.

### Vibrato / Pitch Wobble
- **Problem:** Vibrato causes rapid oscillation around a center pitch, producing noisy MIDI note sequences.
- **Handling:** Median smoothing on the f0 array before MIDI conversion:
```python
from scipy.signal import medfilt
f0_smoothed = medfilt(f0, kernel_size=5)
```
Apply before `hz_to_midi()`.

### Silence / No Input
- **Problem:** User submits an empty or near-silent recording.
- **Handling:** After noise gate, if total voiced frames < 20, return: `"No melody detected — please hum clearly into the microphone."`

---

## 8. Assumptions Made

1. The humming is **monophonic** — one note at a time, no chords. The YIN algorithm is designed for monophonic signals and will produce unreliable output on polyphonic input.
2. The user hums in the **pitch range 80–1000 Hz** (approximately E2 to B5), which covers normal humming range. This is enforced via `fmin` and `fmax` parameters in `librosa.yin()`.
3. The user device has a **functional microphone** accessible via the browser or OS.
4. The interval sequence produced from humming is **equivalent in semantic structure** to a MIDI-derived interval sequence, making the same automaton valid for both.
5. **Key invariance holds** — since intervals are relative, a user humming in any key will produce the same sequence as the reference melody regardless of absolute pitch.
6. The reference corpus was encoded from MIDI, not from humming. Minor pitch quantization errors in humming are acceptable because the matching is substring-based — partial matches are still detected.

---

## 9. Limitations

- **Melismatic humming** (gliding between notes) produces intermediate pitches that may insert false intervals into the sequence before deduplication stabilizes. Smoothing mitigates but does not eliminate this.
- **Rhythm-heavy melodies** where the interval content is sparse (e.g., repeated-note riffs) produce very short interval sequences with low discriminative power, increasing false positive risk.
- **Very high or low voices** outside the 80–1000 Hz range will not be captured by the configured YIN parameters.
- **CREPE** fallback significantly increases server compute time (~1–3 seconds per query vs. ~100ms for YIN). Not suitable for high-concurrency deployment without GPU.
- **Humming accuracy is inherently lower than MIDI accuracy.** The system should display a confidence caveat on humming-derived results: *"Result based on hummed input — accuracy may vary."*

---

## 10. Implementation Notes

### Tech Stack
- **Backend:** Python 3.10+, `librosa 0.10+`, `numpy`, `scipy`, `crepe` (optional), `fastapi` for the `/api/hum` endpoint
- **Frontend:** React, `MediaRecorder` API for audio capture, same Analysis Dashboard components as MIDI flow
- **Audio format:** Accept `.wav` only on the backend. Convert `.webm` (default MediaRecorder output) to `.wav` on the frontend using `AudioContext.decodeAudioData` before upload, or use `ffmpeg` server-side.

### Performance Considerations
- YIN on a 10-second clip at 22050 Hz with 512 frame size runs in ~80–120ms on CPU. Acceptable.
- If using CREPE, limit recording to 8 seconds maximum and consider async processing with a loading indicator.
- Temp files at `/tmp/query.wav` must be deleted after processing. Use `finally` block in the endpoint handler.

### Possible Improvements
- **Onset detection:** Use `librosa.onset.onset_detect()` to segment the audio into discrete note events before pitch extraction, replacing the deduplication heuristic with a more principled note boundary detection.
- **DTW fallback:** If Aho-Corasick returns zero matches, run a Dynamic Time Warping similarity scan as a secondary check to catch matches where tempo-distorted sequences produce slightly different intervals.
- **Real-time streaming:** Replace the record-then-upload model with WebSocket streaming, running pitch extraction on 500ms rolling windows and feeding intervals incrementally to the automaton. Significantly more complex but enables live feedback.