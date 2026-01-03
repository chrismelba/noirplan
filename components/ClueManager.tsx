import React, { useState } from 'react';
import { generateClues } from '../services/geminiService';
import { MysteryData, Clue } from '../types';
import { Search, PlusCircle, Loader2, Trash2, Hammer } from 'lucide-react';

interface ClueManagerProps {
  data: MysteryData;
  onUpdate: (data: Partial<MysteryData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const ClueManager: React.FC<ClueManagerProps> = ({ data, onUpdate, onNext, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [clueTools, setClueTools] = useState(data.clueTools || "3d printer, AI Photo software to create incriminating photos of characters (recieving bribes etc), Paper printer, various household knick-knacks");

  const handleGenerate = async () => {
    setLoading(true);
    try {
      // Sync tools to main data before generating
      onUpdate({ clueTools });
      // Corrected arguments: (story, timeline, environment, clueTools)
      const clues = await generateClues(data.coreStory, data.timeline, data.environment, clueTools);
      onUpdate({ clues });
    } catch (error) {
      console.error(error);
      alert("Failed to generate clues.");
    } finally {
      setLoading(false);
    }
  };

  const deleteClue = (id: string) => {
    onUpdate({ clues: data.clues.filter(c => c.id !== id) });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl gap-4">
        <div>
          <h2 className="text-2xl text-amber-500 font-display flex items-center gap-2">
            <Search className="w-6 h-6" />
            Step 3: Physical Evidence
          </h2>
          <p className="text-slate-400 text-sm mt-1">Design items you can physically place in your home.</p>
        </div>
        
        {data.clues.length === 0 ? (
           <button 
            onClick={handleGenerate}
            disabled={loading}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded flex items-center gap-2 disabled:opacity-50 transition-all shadow-lg"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
            Generate Evidence Kit
          </button>
        ) : (
           <button 
            onClick={handleGenerate}
            disabled={loading}
            className="text-slate-400 hover:text-white text-sm underline flex items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin w-3 h-3" /> : <PlusCircle className="w-3 h-3" />}
            Regenerate Evidence Kit
          </button>
        )}
      </div>

      {/* Clue Construction Config */}
      <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-800 space-y-4">
        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
          <Hammer className="w-4 h-4 text-amber-600" />
          Evidence Fabrication Tools
        </label>
        <textarea 
          value={clueTools}
          onChange={(e) => {
            setClueTools(e.target.value);
            onUpdate({ clueTools: e.target.value });
          }}
          className="w-full h-24 bg-slate-950 border border-slate-700 rounded p-4 text-sm text-slate-300 focus:border-amber-500 focus:outline-none"
          placeholder="e.g. 3D printer, AI Photo software, Paper printer, Various household knick-knacks..."
        />
        <p className="text-xs text-slate-500 italic">Tell the AI what tools you have available to make clues (e.g. "I have a printer and a glue stick").</p>
      </div>

      <div className="space-y-4">
        {data.clues.map((clue, index) => (
          <div key={clue.id || index} className="bg-slate-800 p-6 rounded-lg border border-slate-700 flex flex-col md:flex-row gap-6 items-start hover:border-amber-500/30 transition-colors animate-in fade-in slide-in-from-bottom-2">
            <div className="flex-shrink-0 bg-slate-950 w-12 h-12 rounded-full flex items-center justify-center text-amber-500 font-bold font-display border border-slate-700 shadow-inner">
              #{index + 1}
            </div>
            <div className="flex-grow space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white tracking-tight">{clue.name}</h3>
                <button onClick={() => deleteClue(clue.id)} className="text-slate-500 hover:text-red-500 p-2 transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block">How to Make It</span>
                  <p className="text-slate-300 text-sm leading-relaxed">{clue.description}</p>
                </div>
                <div className="space-y-1">
                   <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block">Where to Hide It</span>
                   <p className="text-slate-300 text-sm italic font-serif bg-slate-900/50 p-2 rounded border border-slate-700/50">{clue.locationToHide}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-700/50">
                 <span className="text-[10px] text-amber-600 uppercase font-black tracking-widest block mb-1">Deductive Relevance</span>
                 <p className="text-slate-400 text-xs italic">{clue.relevance}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-10 border-t border-slate-800">
         <button 
            onClick={onBack}
            className="text-slate-400 hover:text-white font-bold py-3 px-6 rounded transition-colors"
          >
            &larr; Back to Suspects
          </button>
          <button 
            onClick={onNext}
            disabled={data.clues.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-10 rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all"
          >
            Next: Logical Audit &rarr;
          </button>
      </div>
    </div>
  );
};

export default ClueManager;