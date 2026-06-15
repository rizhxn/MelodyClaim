import { Music, User, Clock, AlertTriangle, CheckCircle2, Info, Disc, Download } from 'lucide-react';

export default function VerdictCard({ result, onDownloadReport }) {
  if (!result) return null;

  const { verdict, summary, primaryMatch, query } = result;

  const isStructural = verdict === 'STRUCTURAL_MATCH';
  const isMinor = verdict === 'MINOR_OVERLAP';
  const isMetadata = verdict === 'METADATA_MATCH';
  const isNoMatch = verdict === 'NO_MATCH';

  const themeColor = isStructural ? 'text-red-500 border-red-500/50 bg-red-500/10 shadow-[0_0_30px_rgba(239,68,68,0.2)]'
    : isMinor ? 'text-yellow-500 border-yellow-500/50 bg-yellow-500/10 shadow-[0_0_30px_rgba(234,179,8,0.2)]'
    : isMetadata ? 'text-blue-400 border-blue-400/50 bg-blue-400/10 shadow-[0_0_30px_rgba(96,165,250,0.2)]'
    : 'text-[#00ffcc] border-[#00ffcc]/50 bg-[#00ffcc]/10 shadow-[0_0_30px_rgba(0,255,204,0.2)]';

  const defaultGradient = isStructural ? 'from-red-500/20 to-black' 
    : isMinor ? 'from-yellow-500/20 to-black' 
    : isMetadata ? 'from-blue-500/20 to-black'
    : 'from-[#00ffcc]/20 to-black';

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${themeColor} transition-all duration-500`}>
      {/* Background Gradient similar to Spotify's artist header */}
      <div className={`absolute top-0 left-0 w-full h-48 bg-gradient-to-b ${defaultGradient} z-0 opacity-50`}></div>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-0"></div>

      <div className="relative z-10 p-8">
        
        {/* Header Section: Verdict */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-full bg-black/50 border border-white/10 ${isStructural ? 'text-red-500' : isMinor ? 'text-yellow-500' : isMetadata ? 'text-blue-400' : 'text-[#00ffcc]'}`}>
              {isNoMatch ? <CheckCircle2 className="w-8 h-8" /> : isMetadata ? <Info className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight uppercase">
                {isStructural ? 'Structural Match' : isMinor ? 'Minor Overlap' : isMetadata ? 'Reference Identified' : 'No Match Found'}
              </h2>
              <div className="flex items-center gap-2 mt-1 opacity-80">
                <span className="relative flex h-3 w-3">
                  {!isNoMatch && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isStructural ? 'bg-red-400' : isMinor ? 'bg-yellow-400' : 'bg-blue-400'}`}></span>}
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${isStructural ? 'bg-red-500' : isMinor ? 'bg-yellow-500' : isMetadata ? 'bg-blue-400' : 'bg-[#00ffcc]'}`}></span>
                </span>
                <span className="text-sm font-mono tracking-wider text-white/70">
                  {isNoMatch ? 'ORIGINAL COMPOSITION' : isMetadata ? 'TITLE METADATA MATCH' : 'COPYRIGHT OVERLAP DETECTED'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Download Plagiarism Report Action Button */}
          <button 
            onClick={onDownloadReport}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all font-medium text-sm group"
          >
            <Download className="w-4 h-4 opacity-70 group-hover:scale-110 transition-transform" />
            <span className="opacity-90 group-hover:opacity-100">Download Plagiarism Report</span>
          </button>
        </div>

        {/* Primary Match details inspired by Spotify's "About" section */}
        {primaryMatch ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8 border-t border-white/10 pt-8">
            
            {/* The "Artist/Song" Feature Box */}
            <div className="lg:col-span-2 relative group overflow-hidden rounded-xl bg-black/50 border border-white/10 p-6 flex flex-col justify-end min-h-[220px]">
              <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-black"></div>
              
              {/* Optional Placeholder Avatar/Cover */}
              <div className="absolute top-6 right-6 opacity-10">
                <Disc className="w-32 h-32 animate-[spin_10s_linear_infinite]" />
              </div>

              <div className="relative z-10">
                <p className="text-sm font-bold uppercase tracking-widest text-white/50 mb-2">Matched Entity</p>
                <h3 className="text-4xl sm:text-5xl font-black text-white mb-2 tracking-tight group-hover:scale-[1.01] origin-left transition-transform">
                  {primaryMatch.songName}
                </h3>
                <div className="flex items-center gap-2 text-xl text-white/80 font-medium">
                  <User className="w-5 h-5 opacity-50" />
                  {primaryMatch.artist}
                </div>
              </div>
            </div>

            {/* Meta Data Box */}
            <div className="lg:col-span-1 flex flex-col gap-3">
              <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Music className="w-5 h-5 text-[#9d4edd]" />
                  <span className="text-sm text-white/60">{isMetadata ? 'Evidence' : 'Match Length'}</span>
                </div>
                <span className="font-mono font-bold">{isMetadata ? 'Title' : `${primaryMatch.matchLength} intervals`}</span>
              </div>

              <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <span className="text-sm text-white/60">{isMetadata ? 'Interval Scan' : 'Query Pos'}</span>
                </div>
                <span className="font-mono font-bold bg-white/10 px-2 py-1 rounded">
                  {isMetadata ? 'No overlap' : `${primaryMatch.queryStart}-${primaryMatch.queryEnd}`}
                </span>
              </div>

              <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Info className="w-5 h-5 text-teal-400" />
                  <span className="text-sm text-white/60">{isMetadata ? 'Matched By' : 'Ref Pos'}</span>
                </div>
                <span className="font-mono font-bold bg-white/10 px-2 py-1 rounded">
                  {isMetadata ? 'Filename/track' : `${primaryMatch.referenceStart}-${primaryMatch.referenceEnd}`}
                </span>
              </div>
              
              {query && (
                <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex items-center justify-between mt-auto">
                  <span className="text-sm text-white/60 font-medium tracking-wide border-b border-white/20 pb-1">Total Query Notes Analyzed</span>
                  <span className="font-mono font-bold text-xl">{query.noteCount}</span>
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="mt-6 border-t border-white/10 pt-8 flex flex-col items-center justify-center p-12 text-center bg-black/30 rounded-xl border border-white/5">
            <Music className="w-16 h-16 text-[#00ffcc]/30 mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Original Melody</h3>
            <p className="text-white/60 max-w-md">{summary || "Our multi-pattern Aho-Corasick automaton scanned your composition and found zero structural overlaps within our database corpus."}</p>
          </div>
        )}
      </div>
    </div>
  );
}
