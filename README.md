# MelodyClaim 

MelodyClaim is a structural plagiarism detection engine for melodies. Instead of relying on subjective listening or error-prone audio waveform analysis, MelodyClaim strips sound down to its mathematical structure: **interval patterns**. 

By comparing the structural progression of a melody against a massive database of reference songs using an Aho-Corasick automaton, MelodyClaim offers an unbiased, mathematically precise way to identify musical similarity across keys, instruments, and production styles.

## Features

- **Interval-Based Matching**: Extracts pitch contour and converts it into pure intervallic sequences.
- **Aho-Corasick Automaton**: Pre-compiles reference melodies from the database into a multi-pattern DFA for single-pass, instant pattern matching.
- **MIDI Support**: Upload raw `.mid` files directly to the engine for analysis.
- **Humming Support**: Sing or hum directly into your microphone. Pitch detection converts it into a sequence for structural comparison.
- **Visual Analysis**: Provides detailed interval sequence breakdowns and visually aligns matched piano rolls.

## Architecture

1. **Frontend**: React, Vite, TailwindCSS, Framer Motion, and WebGL for ambient UI.
2. **Backend**: Node.js, Express, Aho-Corasick algorithm implementation.
3. **Database**: MongoDB (used to store base corpus data and song metadata, which is compiled into the automaton in memory on server start).

## Getting Started

### Prerequisites
- Node.js
- MongoDB

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/rizhxn/MelodyClaim.git
   cd MelodyClaim
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   # Set up .env variables (see inside backend directory)
   npm start
   ```

3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## How It Works

- **Offline Phase:** The backend reads query intervals from the `corpus_songs` database and builds ONE single multi-pattern DFA containing all patterns.
- **Online Phase:** The user uploads a MIDI or hums. The sequence is run through the automaton in a single pass to immediately find all matches.

> "A melody that speaks in patterns."
