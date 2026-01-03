
import React, { useState } from 'react';
import { generateCastList } from '../services/geminiService';
import { MysteryData, Character } from '../types';
import { Users, UserPlus, Loader2, ShieldAlert, ArrowRight, Mars, Venus, Trash2 } from 'lucide-react';

interface CharacterManagerProps {
  data: MysteryData;
  onUpdate: (data: Partial<MysteryData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const CharacterManager: React.FC<CharacterManagerProps> = ({ data, onUpdate, onNext, onBack }) => {
  const [loading, setLoading] = useState(false);

  const handleGenerateCast = async () => {
    setLoading(true);
    try {
      // Pass both the Incident description and the Factions to guide suspect generation
      const cast = await generateCastList(data.coreStory, data.generalParties, data.numGuests);
      const castPrepared = cast.map(c => ({ ...c, isFleshed: false }));
      onUpdate({ characters: castPrepared });
    } catch (error) {
      console.error(error);
      alert("Failed to generate suspects.");
    } finally {
      setLoading(false);
    }
  };

  const updateChar = (id: string, updates: Partial<Character>) => {
    const newChars = data.characters.map(c => c.id === id ? { ...c, ...updates } : c);
    onUpdate({ characters: newChars });
  };

  const toggleGender = (id: string) => {
    const char = data.characters.find(c => c.id === id);
    if (!char) return;
    const nextGender: 'male' | 'female' = char.gender === 'male' ? 'female' : 'male';
    updateChar(id, { gender: nextGender });
  };

  const removeChar = (id: string) => {
    onUpdate({ characters: data.characters.filter(c => c.id !== id) });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
       <div className="bg-amber-900/20 border border-amber-600/50 p-4 rounded-lg flex items-start gap-4">
         <ShieldAlert className="text-amber-500 w-6 h-6 flex-shrink-0 mt-1" />
         <div className="text-sm">
           <h3 className="font-bold text-amber-500 mb-1 uppercase tracking-wider">Step 2: Cast the Suspects</h3>
           <p className="text-amber-200/80 leading-relaxed">
             Suspects are generated based on the parties and factions described in the Setup. You can manually tweak their archetypes and motives before proceeding.
           </p>
         </div>
       </div>

       <div className="flex justify-between items-center bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl">
        <h2 className="text-2xl text-amber-500 font-display flex items-center gap-2">
          <Users className="w-6 h-6" />
          Casting Suspects
        </h2>
        
        <button 
          onClick={handleGenerateCast}
          disabled={loading}
          className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2 disabled:opacity-50 transition-all"
        >
          {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          {data.characters.length > 0 ? "Regenerate Cast" : "Cast Suspects"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.characters.map((char) => (
          <div key={char.id} className={`bg-slate-800 rounded-lg border p-5 transition-all relative group ${char.id === data.killerId ? 'border-red-900/50' : 'border-slate-700 hover:border-amber-500/50'}`}>
            <button 
              onClick={() => removeChar(char.id)}
              className="absolute top-2 right-2 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
               <button 
                 onClick={() => toggleGender(char.id)}
                 title={`Toggle to ${char.gender === 'male' ? 'Female' : 'Male'}`}
                 className={`w-12 h-12 rounded-lg flex items-center justify-center border-2 transition-all shadow-md ${char.gender === 'male' ? 'bg-indigo-900/30 border-indigo-500 text-indigo-400' : 'bg-rose-900/30 border-rose-500 text-rose-400'}`}
               >
                 {char.gender === 'male' ? <Mars className="w-7 h-7" /> : <Venus className="w-7 h-7" />}
               </button>
               <div className="flex-1">
                 <input 
                   type="text" 
                   value={char.name} 
                   onChange={(e) => updateChar(char.id, { name: e.target.value })}
                   className="w-full bg-transparent border-b border-transparent focus:border-amber-500 font-bold text-white text-lg outline-none" 
                 />
                 <input 
                   type="text" 
                   value={char.archetype} 
                   onChange={(e) => updateChar(char.id, { archetype: e.target.value })}
                   className="w-full bg-transparent text-xs text-amber-500 uppercase tracking-widest font-bold outline-none" 
                 />
               </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-tighter">Initial Motive</label>
              <textarea 
                value={char.initialMotive} 
                onChange={(e) => updateChar(char.id, { initialMotive: e.target.value })}
                className="w-full h-20 bg-slate-950 p-3 rounded text-sm text-slate-400 italic outline-none focus:bg-slate-900 border border-slate-700/30 transition-colors resize-none"
              />
            </div>

            {char.id === data.killerId && (
              <div className="mt-3 text-[10px] bg-red-950 text-red-400 px-2 py-0.5 border border-red-800 rounded inline-flex items-center gap-1 font-bold">
                <ShieldAlert className="w-3 h-3" /> TARGET: THE KILLER
              </div>
            )}
          </div>
        ))}
        
        {data.characters.length > 0 && data.characters.length < 12 && (
          <button 
            onClick={() => onUpdate({ characters: [...data.characters, { 
              id: Math.random().toString(36).substr(2, 9), 
              name: 'New Suspect', 
              gender: 'female', 
              archetype: 'The Outsider', 
              initialMotive: 'Unknown...', 
              isFleshed: false,
              preGameBlurb: '', background: '', relationships: '', secrets: '', connectionToVictim: '',
              round1: { publicInfo: [], privateInfo: [] }, round2: { publicInfo: [], privateInfo: [] }
            }] })}
            className="border-2 border-dashed border-slate-700 rounded-lg p-5 flex flex-col items-center justify-center text-slate-600 hover:text-amber-500 hover:border-amber-500/50 transition-all bg-slate-900/40 min-h-[180px]"
          >
            <UserPlus className="w-10 h-10 mb-2 opacity-50" />
            <span className="text-sm font-bold uppercase tracking-widest">Add Manual Suspect</span>
          </button>
        )}
      </div>

      <div className="flex justify-between pt-6 border-t border-slate-800">
         <button onClick={onBack} className="text-slate-400 hover:text-white font-bold py-3 px-6 rounded transition-colors">&larr; Back to Setup</button>
         <button 
            onClick={onNext}
            disabled={data.characters.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-10 rounded flex items-center gap-2 disabled:opacity-50 shadow-lg transition-all"
          >
            Next: Build Timeline <ArrowRight className="w-4 h-4" />
          </button>
      </div>
    </div>
  );
};

export default CharacterManager;
