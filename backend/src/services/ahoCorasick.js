/**
 * Aho-Corasick multi-pattern string matching automaton.
 * Implemented from scratch for integer sequences (interval arrays).
 */

/**
 * A single node in the Aho-Corasick trie.
 */
class ACNode {
  constructor() {
    this.children = new Map(); // Map<number, number> — symbol → state index
    this.failure = 0;          // failure link state index
    this.output = [];          // list of pattern indices that end at this state
    this.depth = 0;            // depth = length of the string from root to this node
  }
}

/**
 * Builds an Aho-Corasick automaton from a set of integer-array patterns.
 *
 * @param {number[][]} patterns - Array of integer arrays (interval sequences)
 * @returns {{ states: ACNode[], patternLengths: number[] }}
 */
export function buildAutomaton(patterns) {
  const states = [new ACNode()]; // state 0 = root
  const patternLengths = patterns.map(p => p.length);

  // Phase 1: Build the goto function (trie)
  for (let pIdx = 0; pIdx < patterns.length; pIdx++) {
    const pattern = patterns[pIdx];
    let current = 0; // start at root

    for (let i = 0; i < pattern.length; i++) {
      const symbol = pattern[i];

      if (!states[current].children.has(symbol)) {
        const newState = new ACNode();
        newState.depth = states[current].depth + 1;
        states.push(newState);
        states[current].children.set(symbol, states.length - 1);
      }

      current = states[current].children.get(symbol);
    }

    // Mark this state as an output for this pattern
    states[current].output.push(pIdx);
  }

  // Phase 2: Build the failure function using BFS
  const queue = [];

  // Initialize: all depth-1 nodes have failure link to root
  for (const [symbol, stateIdx] of states[0].children) {
    states[stateIdx].failure = 0;
    queue.push(stateIdx);
  }

  while (queue.length > 0) {
    const current = queue.shift();

    for (const [symbol, childIdx] of states[current].children) {
      queue.push(childIdx);

      // Follow failure links to find the longest proper suffix
      let fallback = states[current].failure;

      while (fallback !== 0 && !states[fallback].children.has(symbol)) {
        fallback = states[fallback].failure;
      }

      states[childIdx].failure = states[fallback].children.has(symbol)
        ? states[fallback].children.get(symbol)
        : 0;

      // Avoid self-loop
      if (states[childIdx].failure === childIdx) {
        states[childIdx].failure = 0;
      }

      // Merge output from the failure state (output function)
      states[childIdx].output = [
        ...states[childIdx].output,
        ...states[states[childIdx].failure].output,
      ];
    }
  }

  return { states, patternLengths };
}

/**
 * Runs the Aho-Corasick search on a text (integer sequence) using a
 * pre-built automaton. Returns all matches in one pass.
 *
 * @param {{ states: ACNode[], patternLengths: number[] }} automaton
 * @param {number[]} text - The integer sequence to search
 * @returns {{ patternIndex: number, start: number, end: number, matched: number[] }[]}
 */
export function search(automaton, text) {
  const { states, patternLengths } = automaton;
  const matches = [];
  let current = 0;

  for (let i = 0; i < text.length; i++) {
    const symbol = text[i];

    // Follow failure links until we find a valid transition or reach root
    while (current !== 0 && !states[current].children.has(symbol)) {
      current = states[current].failure;
    }

    if (states[current].children.has(symbol)) {
      current = states[current].children.get(symbol);
    }
    // else current stays at 0 (root)

    // Check all outputs at this state
    for (const patternIndex of states[current].output) {
      const patternLen = patternLengths[patternIndex];
      const start = i - patternLen + 1;
      const end = i;
      const matched = text.slice(start, end + 1);

      matches.push({
        patternIndex,
        start,
        end,
        matched,
      });
    }
  }

  return matches;
}
