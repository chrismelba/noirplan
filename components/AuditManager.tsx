
import React, { useState, useEffect } from 'react';
import { checkConsistency, analyzeRuleOfThree, resolveInconsistency } from '../services/geminiService';
import { MysteryData, StoryBeat, ConsistencyIssue } from '../types';
import { ShieldCheck, Loader2, ArrowRight, CheckCircle, Footprints, AlertTriangle, Wand2, RefreshCw, FileWarning, Ghost } from 'lucide-react';

interface AuditManagerProps {
  data: MysteryData;
  onUpdate: (data: Partial<MysteryData>) => void;
  onBack: () => void;
  onNext: () => void;
}

const AuditManager: React.FC<AuditManagerProps> = ({ data, onUpdate, onBack, onNext }) => {
  const [loading, setLoading] = useState(false);
  const [fixingId, setFixingId] = useState<string | null>(null);
  const [tab, setTab] = useState<'audit' | 'rule3' | 'guilt'>('audit');

  const handleRunAnalysis = async () => {
    setLoading(true);
    try {
      const [report, beats] = await Promise.all([
        checkConsistency(data),
        analyzeRuleOfThree(data)
      ]);
      onUpdate({ consistencyReport: report, beats });
    } catch (e) {
      console.error(e);
      alert("Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleFixIssue = async (issue: ConsistencyIssue) => {
    setFixingId(issue.id);
    try {
      const result = await resolveInconsistency(data, issue.description);
      
      const updatedIssues = data.consistencyReport?.issues?.map(i => 
        i.id === issue.id ? { ...i, fixed: true, suggestion: result.summary } : i
      );

      onUpdate({
        timeline: result.timeline,
        consistencyReport: data.consistencyReport ? {
          ...data.consistencyReport,
          issues: updatedIssues || [],
          notes: data.consistencyReport.notes + `\n(Fixed: ${result.summary})`
        } : null
      });
    } catch (e) {
      console.error(e);
      alert("Failed to auto-fix issue.");
    } finally {
      setFixingId(null);
    }
  };

  useEffect(() => {
    if (!data.consistencyReport) {
      handleRunAnalysis();
    }
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
       <div className="flex justify-between items-center bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl">
        <div>
          <h2 className="text-2xl text-amber-500 font-display flex items-center gap-2">
            <ShieldCheck className="w-6 h-6" /> Step 6: Logical Audit
          </h2>
          <p className="text-slate-400 text-sm mt-1">Checking dossiers, clues, and timeline for absolute consistency.</p>
        </div>
        
        <button 
          onClick={handleRunAnalysis}
          disabled={loading}
          className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded flex items-center gap-2 shadow-lg disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Re-run Audit
        </button>
      </div>

      <div className="flex gap-4 border-b border-slate-700 overflow-x-auto no-scrollbar">
        <button onClick={() => setTab('audit')} className={`px-4 py-2 font-bold transition-all whitespace-nowrap ${tab === 'audit' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-300'}`}>Logical Integrity</button>
        <button onClick={() => setTab('guilt')} className={`px-4 py-2 font-bold transition-all whitespace-nowrap ${tab === 'guilt' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-300'}`}>Ambiguous Guilt</button>
        <button onClick={() => setTab('rule3')} className={`px-4 py-2 font-bold transition-all whitespace-nowrap ${tab === 'rule3' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-300'}`}>Clue Solvability</button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-12 h-12 animate-spin mb-4 text-amber-500" />
          <p className="animate-pulse">Auditing your masterpiece...</p>
        </div>
      )}

      {!loading && tab === 'audit' && (
        <div className="space-y-6">
           {data.consistencyReport ? (
             <>
               <div className={`p-6 rounded-lg border ${data.consistencyReport.isValid ? 'bg-green-900/20 border-green-800' : 'bg-red-900/20 border-red-800'}`}>
                  <h3 className="font-bold mb-2 flex items-center gap-2 text-lg">
                    {data.consistencyReport.isValid ? <CheckCircle className="text-green-500" /> : <AlertTriangle className="text-red-500" />}
                    {data.consistencyReport.isValid ? "Audit Complete: Logical" : "Potential Gaps Detected"}
                  </h3>
                  <p className="text-sm opacity-80 leading-relaxed whitespace-pre-wrap">{data.consistencyReport.notes}</p>
               </div>

               <div className="grid gap-4">
                  {data.consistencyReport.issues.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 italic border border-dashed border-slate-800 rounded">No critical contradictions detected in character dossiers.</div>
                  ) : (
                    data.consistencyReport.issues.map((issue) => (
                      <div key={issue.id} className={`p-4 rounded-lg border ${issue.fixed ? 'bg-green-950/20 border-green-900/30 opacity-60' : 'bg-slate-900 border-slate-800'} flex justify-between items-start gap-4`}>
                        <div className="space-y-1">
                           <div className="flex items-center gap-2">
                             {issue.fixed ? <CheckCircle className="w-4 h-4 text-green-500" /> : <FileWarning className="w-4 h-4 text-red-500" />}
                             <p className={`font-bold text-sm ${issue.fixed ? 'line-through' : 'text-slate-200'}`}>{issue.description}</p>
                           </div>
                           <p className="text-xs text-slate-400 italic">Recommendation: {issue.suggestion}</p>
                        </div>
                        {!issue.fixed && (
                          <button 
                            onClick={() => handleFixIssue(issue)}
                            disabled={fixingId !== null}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3 rounded flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
                          >
                            {fixingId === issue.id ? <Loader2 className="animate-spin w-3 h-3" /> : <Wand2 className="w-3 h-3" />}
                            Auto-Fix Timeline
                          </button>
                        )}
                      </div>
                    ))
                  )}
               </div>
             </>
           ) : null}
        </div>
      )}

      {!loading && tab === 'guilt' && (
        <div className="space-y-6">
           <div className="bg-slate-900/50 p-4 rounded border border-purple-900/30 text-xs text-purple-200 flex gap-3 items-start">
             <Ghost className="w-4 h-4 mt-0.5 flex-shrink-0" />
             <p><strong>Ambiguous Guilt Rule:</strong> Every suspect must believe they <em>might</em> have killed the victim. Their dossiers should describe incriminating actions without confirming the final result.</p>
           </div>
           
           <div className="grid gap-4">
             {data.characters.map((char) => (
               <div key={char.id} className="bg-slate-800 border border-slate-700 p-5 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      {char.name}
                    </h3>
                    {char.id === data.killerId ? (
                      <span className="text-[10px] bg-red-950 text-red-400 px-2 py-0.5 border border-red-800 rounded font-black uppercase">The Truth</span>
                    ) : (
                      <span className="text-[10px] bg-slate-700 text-slate-400 px-2 py-0.5 rounded font-black uppercase">Innocent</span>
                    )}
                  </div>
                  <div className="bg-slate-950 p-3 rounded border border-slate-700/50">
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter mb-1">Dossier Guilt Hooks</p>
                    <div className="text-sm text-slate-300 italic">
                      {char.round1?.privateInfo?.filter(p => p.toLowerCase().includes('poison') || p.toLowerCase().includes('tamper') || p.toLowerCase().includes('stab') || p.toLowerCase().includes('blood') || p.toLowerCase().includes('weapon') || p.toLowerCase().includes('took') || p.toLowerCase().includes('left')).map((p, i) => (
                        <div key={i} className="mb-1 flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 mt-1 text-green-500 flex-shrink-0" />
                          <span>{p}</span>
                        </div>
                      ))}
                      {(!char.round1?.privateInfo || char.round1.privateInfo.length === 0) && (
                        <p className="text-red-400">No incriminating secrets found. Re-generate dossier to fix!</p>
                      )}
                    </div>
                  </div>
               </div>
             ))}
           </div>
        </div>
      )}

      {!loading && tab === 'rule3' && (
        <div className="grid gap-6">
          <div className="bg-slate-900/50 p-4 rounded border border-blue-900/30 text-xs text-blue-200 flex gap-3 items-start">
             <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
             <p><strong>Rule of Three:</strong> Every key secret should be solvable via at least three separate pieces of evidence or statements found in dossiers.</p>
          </div>
          {(!data.beats || data.beats.length === 0) ? (
            <p className="text-slate-600 italic text-center py-20">No clue paths found yet.</p>
          ) : (
            data.beats.map((beat, idx) => (
              <div key={idx} className="bg-slate-800 rounded-lg border border-slate-700 p-6 shadow-md">
                 <div className="flex justify-between items-start mb-4">
                   <h3 className="text-lg font-bold flex items-center gap-2">
                     <Footprints className="text-amber-500 w-5 h-5" />
                     {beat.beatName}
                   </h3>
                   <span className={`text-[10px] px-2 py-1 rounded font-black uppercase ${beat.clues.length >= 3 ? 'bg-green-900/40 text-green-400 border border-green-800' : 'bg-red-900/40 text-red-400 border border-red-800'}`}>
                     {beat.clues.length} / 3 Paths
                   </span>
                 </div>
                 <p className="text-sm text-slate-400 mb-4 italic">{beat.description}</p>
                 <div className="flex flex-wrap gap-2">
                   {beat.clues.map((clue, ci) => (
                     <div key={ci} className="bg-slate-950 px-3 py-1.5 rounded-full text-xs border border-slate-700 text-slate-300">
                        {clue}
                     </div>
                   ))}
                 </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="flex justify-between pt-6 border-t border-slate-800">
         <button onClick={onBack} className="text-slate-400 hover:text-white font-bold py-3 px-6 rounded transition-colors">&larr; Back to Dossiers</button>
         <button 
            onClick={onNext} 
            disabled={loading} 
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded flex items-center gap-2 disabled:opacity-50 shadow-lg"
          >
            Final Review & Print <ArrowRight className="w-4 h-4" />
          </button>
      </div>
    </div>
  );
};

export default AuditManager;
