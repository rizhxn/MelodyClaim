Data Pipeline & Communication
Q1. Data Transfer method:
Use a single JSON payload sent after processing completes. WebSockets/SSE adds unnecessary complexity for a PBL project. The backend runs all 4 steps, packages the complete trace history as one structured JSON object, and sends it to the frontend to animate sequentially at its own pace.

Visualizing Step 3 — Note Sequence
Q2. Note Representation:
Use text badges (C4, E4, G4) arranged in a horizontal scrollable sequence. A mini piano roll is overkill for this step — Step 3's only job is to confirm what was extracted before encoding begins. Keep it simple and readable.
Q3. Polyphony Handling:
The backend should isolate Track 0 / the highest-density melodic track automatically. The UI should display a small notice: "Analyzing primary melodic line only" so the user understands multi-track MIDIs are reduced to one voice.

Visualizing Step 5 — Pattern Matching
Q4. DFA Subgraph:
Confirmed — the backend must send only the traversed subgraph: the specific states visited, the transitions taken, and the failure links actually followed during the query's run. Sending the full automaton is not feasible. The frontend renders only what was walked.

Visualizing Step 6 — Threshold Filter
Q5. Threshold Definition:
Base it purely on match length — minimum 7 consecutive intervals. This is simple, explainable, and defensible. Anything shorter risks flagging common musical phrases like scales or arpeggios that appear in thousands of songs coincidentally.
Q6. Visual Rejection:
Yes — show the match first, then apply a fade + strikethrough + "Below Threshold" tag. The brief appearance before rejection makes the filtering step visually meaningful. If it just never appeared, the step would look like nothing happened.