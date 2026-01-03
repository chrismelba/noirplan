
import React, { useState } from 'react';
import { generateCharacterDossier } from '../services/geminiService';
import { MysteryData, Character } from '../types';
import { FileText, Loader2, Wand2, CheckCircle, RefreshCw, ArrowRight, Ghost, ShieldAlert, Sparkles, Users, UserCheck } from 'lucide-react';

interface DossierManagerProps {
  data: MysteryData;
  onUpdate: (data: Partial<MysteryData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const DossierManager: React.FC<DossierManagerProps> = ({ data, onUpdate, onNext, onBack }) => {
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [loadingAll, setLoadingAll] = useState(false);

  const handleFleshDossier = async (char: Character) => {
    setGeneratingId(char.id);
    try {
      const full = await generateCharacterDossier(
        char, 
        char.id === data.killerId, 
        char.id === data.saboteurId, 
        data.coreStory, 
        data.timeline, 
        data.twist, 
        data.characters
      );
      const updated = data.characters.map(c => c.id === char.id ? { ...full, isFleshed: true } : c);
      onUpdate({ characters: updated });
    } catch (e) {
      console.error(e);
      alert(`Failed to flesh out ${char.name}`);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleFleshAll = async () => {
    setLoadingAll(true);
    const updatedChars = [...data.characters];
    try {
      for (let i = 0; i < updatedChars.length; i++) {
        const char = updatedChars[i];
        if (char.isFleshed) continue;
        
        const full = await generateCharacterDossier(
          char, 
          char.id === data.killerId, 
          char.id === data.saboteurId, 
          data.coreStory, 
          data.timeline, 
          data.twist, 
          data.characters
        );
        updatedChars[i] = { ...full, isFleshed: true };
        onUpdate({ characters: [...updatedChars] });
        await new Promise(r => setTimeout(r, 1000));
      }
    } catch (e) {
      console.error(e);
      alert("Batch generation stopped due to an error. Progress saved.");
    } finally {
      setLoadingAll(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
       <div className="flex justify-between items-center bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl">
        <div>
          <h2 className="text-2xl text-amber-500 font-display flex items-center gap-2">
            <FileText className="w-6 h-6" /> Step 5: Character Dossiers
          </h2>
          <p className="text-slate-400 text-sm mt-1">Finalize the public info and dark secrets for every guest.</p>
        </div>
        
        <button 
          onClick={handleFleshAll}
          disabled={loadingAll || generatingId !== null}
          className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded flex items-center gap-2 shadow-lg disabled:opacity-50"
        >
          {loadingAll ? <Loader2 className="animate-spin" /> : <Wand2 className="w-5 h-5" />}
          Generate All Dossiers
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-purple-900/10 border border-purple-600/30 p-5 rounded-lg space-y-2">
           <div className="flex items-center gap-2 text-purple-400 font-bold uppercase tracking-widest text-xs">
             <ShieldAlert className="w-4 h-4" /> Private: Ambiguous Guilt
           </div>
           <p className="text-slate-400 text-[11px] leading-relaxed">
             Every suspect's <span className="text-white">Private Info</span> is an action that <span className="text-purple-300 font-bold">could have been lethal</span>, even if unintended (e.g., swapping meds for candy). Suspects remain uncertain of the outcome.
           </p>
        </div>
        <div className="bg-cyan-900/10 border border-cyan-600/30 p-5 rounded-lg space-y-2">
           <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-widest text-xs">
             <Users className="w-4 h-4" /> Public: Web of Suspicion
           </div>
           <p className="text-slate-400 text-[11px] leading-relaxed">
             Suspects' <span className="text-white">Public Info</span> contains sightings of OTHER guests. These sightings are the only way to reveal the hidden 'Dark Acts' in others' dossiers.
           </p>
        </div>
      </div>

      <div className="grid gap-4">
        {data.characters.map((char) => (
          <div key={char.id} className={`p-6 rounded-lg border flex justify-between items-center transition-all ${char.isFleshed ? 'bg-slate-900 border-green-900/30 shadow-inner' : 'bg-slate-900 border-slate-800'}`}>
            <div className="flex items-center gap-4">
               {char.isFleshed ? (
                 <UserCheck className="w-8 h-8 text-green-500" />
               ) : (
                 <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-700 animate-pulse" />
               )}
               <div>
                 <h3 className="font-bold text-lg text-white">{char.name}</h3>
                 <p className="text-xs text-amber-500 font-bold uppercase tracking-widest">{char.archetype}</p>
                 <div className="flex gap-4 mt-1 text-[10px] text-slate-500">
                   <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> Motive: {char.initialMotive ? 'Set' : 'Missing'}</span>
                   <span className="flex items-center gap-1"><Ghost className="w-3 h-3" /> Integrity: {char.isFleshed ? 'Full Web' : 'Pending...'}</span>
                 </div>
               </div>
            </div>

            <button 
              onClick={() => handleFleshDossier(char)}
              disabled={loadingAll || generatingId !== null}
              className={`p-2 rounded flex items-center gap-2 text-xs font-bold transition-colors ${char.isFleshed ? 'text-slate-500 hover:text-white' : 'bg-slate-700 hover:bg-slate-600 text-white shadow-md'}`}
            >
              {generatingId === char.id ? <Loader2 className="animate-spin w-4 h-4" /> : char.isFleshed ? <RefreshCw className="w-4 h-4" /> : <Wand2 className="w-4 h-4" />}
              {char.isFleshed ? "Regenerate" : "Write Dossier"}
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-6 border-t border-slate-800">
         <button onClick={onBack} className="text-slate-400 hover:text-white font-bold py-3 px-6 rounded transition-colors">&larr; Back to Evidence</button>
         <button 
            onClick={onNext} 
            disabled={!data.characters.every(c => c.isFleshed)} 
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded flex items-center gap-2 disabled:opacity-50 shadow-lg transition-all"
          >
            Next: Logical Audit <ArrowRight className="w-4 h-4" />
          </button>
      </div>
    </div>
  );
};

export default DossierManager;
