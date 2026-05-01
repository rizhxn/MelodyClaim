# MelodyClaim

MelodyClaim is an advanced music plagiarism detection platform that evaluates musical similarity not by ear, but by logical, mathematical sequence matching. By stripping away sound and focusing purely on the structural intervals of a melody, MelodyClaim provides precise, unbiased detection.

## Features

- **Humming & Audio Recognition**: Record yourself humming or upload an audio file. MelodyClaim analyzes the pitch to detect similarities against a known corpus of songs.
- **MIDI Upload & Analysis**: Upload direct MIDI files for deep structural analysis.
- **Advanced Pattern Matching**: Utilizes Interval Encoding and an Aho-Corasick Automaton to mathematically detect exact musical patterns and matches.
- **Detailed Verdict Reports**: Get visual insights, match logs, interval sequences, and confidence scores for potential claims.
- **Modern UI/UX**: A dark-themed, glassmorphic UI built with Framer Motion, providing smooth, tech-forward animations.

## Tech Stack

### Frontend
- **React** + **Vite**
- **TailwindCSS** for styling
- **Framer Motion** & **GSAP** for fluid animations
- **React Router** for navigation

### Backend
- **Node.js** + **Express**
- **Better-SQLite3** for lightweight database management
- **Aho-Corasick** algorithm implementation for fast sequence matching

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/rizhxn/MelodyClaim.git
   cd MelodyClaim
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   *The backend will run on `http://localhost:3001`.*

3. **Frontend Setup**
   Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *The frontend will run on `http://localhost:5173`.*

## Documentation

For more deep-dives into the architecture, pattern matching logic, and design decisions, please see the `frontend/docs/` directory.