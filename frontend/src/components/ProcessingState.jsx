import { useState, useEffect } from 'react';
import { AutomatonProcessing } from './analysis/automaton-processing';
import { WebGLShader } from './ui/web-gl-shader';

// Mock data matching the AutomatonStructure
const mockAutomaton = {
  states: [
    { id: 0, isAccepting: false },
    { id: 1, isAccepting: false },
    { id: 2, isAccepting: true },
    { id: 3, isAccepting: false },
    { id: 4, isAccepting: true },
  ],
  transitions: [
    { from: 0, to: 1, symbol: 2 },
    { from: 1, to: 2, symbol: -1 },
    { from: 0, to: 3, symbol: 4 },
    { from: 3, to: 4, symbol: 0 },
  ],
  failureLinks: [
    { from: 1, to: 0 },
    { from: 2, to: 0 },
    { from: 3, to: 0 },
    { from: 4, to: 0 },
  ]
};

const mockQueryIntervals = [2, -1, 4, 0, 7, -2];

const mockExecutionTrace = [
  { position: 0, symbol: 2, fromState: 0, toState: 1, usedFailure: false, matchFired: false, matches: [] },
  { position: 1, symbol: -1, fromState: 1, toState: 2, usedFailure: false, matchFired: true, matches: ['Shape of You - Ed Sheeran'] },
  { position: 2, symbol: 4, fromState: 2, toState: 3, usedFailure: true, matchFired: false, matches: [] },
  { position: 3, symbol: 0, fromState: 3, toState: 4, usedFailure: false, matchFired: true, matches: ['Blinding Lights - The Weeknd'] },
  { position: 4, symbol: 7, fromState: 4, toState: 0, usedFailure: true, matchFired: false, matches: [] },
  { position: 5, symbol: -2, fromState: 0, toState: 0, usedFailure: true, matchFired: false, matches: [] },
];

export default function ProcessingState() {
  return (
    <div className="w-full relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] overflow-hidden">
      <WebGLShader />
      <div className="relative z-10 w-full">
        <AutomatonProcessing 
          executionTrace={mockExecutionTrace}
          queryIntervals={mockQueryIntervals}
          automaton={mockAutomaton}
          onComplete={() => {}}
        />
      </div>
    </div>
  );
}
