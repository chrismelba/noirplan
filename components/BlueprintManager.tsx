
import React, { useState } from 'react';
import { generateDetailedTimeline } from '../services/geminiService';
import { MysteryData } from '../types';
import { Clock, Loader2, ArrowRight, Home } from 'lucide-react';

interface BlueprintManagerProps {
  data: MysteryData;
  onUpdate: (data: Partial<MysteryData>) => void;
  onBack: () => void;
  onNext: () => void;
}

const BlueprintManager: React.FC<BlueprintManagerProps> = ({ data, onUpdate, onBack, onNext }) => {
  const [loading, setLoading] = useState(false);

  const handleGenerateTimeline = async () => {
    setLoading(true);
    try {
      const timeline = await generateDetailedTimeline(data.coreStory, data.characters, data.killerId || "", data.saboteurId || "", data.environment);
      onUpdate({ timeline });
    } catch (e) {
      console.error(e);
      alert("Timeline generation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
       <div className="flex justify-between items-center bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl">
        <div>
          <h2 className="text-2xl text-amber-500 font-display flex items-center gap-2">
            <Clock className="w-6 h-6" /> Step 3: The Timeline
          </h2>
          <p className="text-slate-400 text-sm mt-1">Map out exactly where everyone was and when. This locks the logic for later.</p>
        </div>
        
        <button 
          onClick={handleGenerateTimeline}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded flex items-center gap-2 shadow-lg disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Clock className="w-5 h-5" />}
          {data.timeline ? "Regenerate Timeline" : "Build Timeline"}
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-8 rounded-lg min-h-[400px]">
         {!data.timeline && !loading ? (
           <div className="flex flex-col items-center justify-center py-20 text-slate-600 italic">
             <Clock className="w-16 h-16 opacity-10 mb-4" />
             <p>No timeline generated yet. Click the button to start.</p>
           </div>
         ) : loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="w-12 h-12 animate-spin mb-4 text-amber-500" />
              <p className="animate-pulse">Coordinating guest movements...</p>
            </div>
         ) : (
           <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-cyan-100 bg-slate-950 p-6 border border-cyan-900/30 rounded shadow-inner">
              {data.timeline}
           </div>
         )}
      </div>

      <div className="flex justify-between pt-6 border-t border-slate-800">
         <button onClick={onBack} className="text-slate-400 hover:text-white font-bold py-3 px-6 rounded transition-colors">&larr; Back to Casting</button>
         <button 
            onClick={onNext} 
            disabled={!data.timeline || loading} 
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded flex items-center gap-2 disabled:opacity-50 shadow-lg"
          >
            Next: Evidence Kit <ArrowRight className="w-4 h-4" />
          </button>
      </div>
    </div>
  );
};

export default BlueprintManager;
