import { getCorpus } from '../database/seed.js';
import { buildAutomaton } from './ahoCorasick.js';

let automatonInstance = null;

export function initializeAutomaton() {
  const corpus = getCorpus();
  if (corpus.length === 0) {
    console.warn('⚠️ Corpus is empty. Automaton not built.');
    return;
  }
  const patterns = corpus.map(c => c.intervals);
  automatonInstance = buildAutomaton(patterns);
  console.log('✅ Aho-Corasick Automaton successfully built and loaded into memory.');
}

export function getAutomaton() {
  if (!automatonInstance) {
    initializeAutomaton();
  }
  return automatonInstance;
}
