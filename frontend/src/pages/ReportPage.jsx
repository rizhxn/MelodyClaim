import React from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { VerdictReport } from '../components/VerdictReport';

export default function ReportPage() {
  const location = useLocation();
  const mockResult = {
    verdict: 'STRUCTURAL_MATCH',
    summary: 'A significant structural match has been detected against "Shape of You" by Ed Sheeran.',
    primaryMatch: {
      songName: 'Shape of You',
      artist: 'Ed Sheeran',
      year: 2017,
      matchLength: 20,
      severity: 'STRUCTURAL',
      matchedIntervalSequence: [0, -2, 2, 0, 0, -2, -1, 3, 0, 0, -2, 2, 0, 0, -2, -1, -2, 2, 0, 1],
      queryStart: 0,
      queryEnd: 19,
      referenceStart: 0,
      referenceEnd: 19
    },
    query: { fileName: 'Test Melody', noteCount: 21, intervalCount: 20 }
  };
  const result = location.state?.result || mockResult;

  if (!result) {
    return <Navigate to="/" replace />;
  }

  // Map API result to VerdictReport format
  const verdictMap = {
    'STRUCTURAL_MATCH': 'STRUCTURAL_MATCH',
    'MINOR_OVERLAP': 'MINOR_OVERLAP',
    'METADATA_MATCH': 'METADATA_MATCH',
    'NO_MATCH': 'NO_MATCH'
  };

  const verdict = verdictMap[result.verdict] || 'NO_MATCH';
  
  let primaryMatch = null;
  if (result.primaryMatch) {
    primaryMatch = {
      songName: result.primaryMatch.songName,
      artist: result.primaryMatch.artist,
      year: result.primaryMatch.year || '',
      matchLength: result.primaryMatch.matchLength,
      classification: result.primaryMatch.severity || 'MINOR',
      matchedSequence: result.primaryMatch.matchedIntervalSequence || [],
      queryStart: result.primaryMatch.queryStart,
      queryEnd: result.primaryMatch.queryEnd,
      referenceStart: result.primaryMatch.referenceStart,
      referenceEnd: result.primaryMatch.referenceEnd,
      significance: result.summary,
      matchBasis: result.primaryMatch.matchBasis,
      isRepeating: false // Default since backend doesn't explicitly flag this currently
    };
  }

  const meta = {
    filename: result.query?.fileName || 'Analysis Input',
    totalNotes: result.query?.noteCount || 0,
    intervalCount: result.query?.intervalCount || 0,
    analysedAt: new Date().toISOString()
  };

  const queryIntervals = result.simulationData?.queryIntervals || [];

  return (
    <div className="relative min-h-screen py-12 px-4">
      <div className="relative z-10 max-w-4xl mx-auto mb-6">
        <Link to="/" className="inline-flex items-center text-white/50 hover:text-white transition-colors">
          <ArrowLeft size={20} className="mr-2" />
          Back to Analysis
        </Link>
      </div>
      <div className="relative z-10">
        <VerdictReport 
          verdict={verdict}
          primaryMatch={primaryMatch}
          meta={meta}
          queryIntervals={queryIntervals}
        />
      </div>
    </div>
  );
}
