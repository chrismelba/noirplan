
import React, { useState } from 'react';
import { generateStoryConcept, refineStoryConcept } from '../services/geminiService';
import { MysteryData } from '../types';
import { BookOpen, RefreshCw, Loader2, ArrowRight, Dices, Home, Wand2, Sparkles, Map, Ghost, Users } from 'lucide-react';

interface StoryBuilderProps {
  data: MysteryData;
  onUpdate: (data: Partial<MysteryData>) => void;
  onNext: () => void;
  onLucky: (config: { theme: string, numGuests: number, environment: string, clueTools: string, details: string }) => void;
  isGenerating: boolean;
}

const StoryBuilder: React.FC<StoryBuilderProps> = ({ data, onUpdate, onNext, onLucky, isGenerating }) => {
  const [theme, setTheme] = useState(data.theme || "Victorian Gothic Estate");
  const [environmentInput, setEnvironmentInput] = useState(data.environment || "A decaying mansion in the moors");
  const [numGuests, setNumGuests] = useState(data.numGuests || 6);
  const [details, setDetails] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState(false);

  const handleGenerateConcept = async () => {
    setLoading(true);
    try {
      const result = await generateStoryConcept(theme, environmentInput, numGuests, details);
      onUpdate({
        title: result.title,
        victimName: result.victim,
        environment: result.atmosphere,
        coreStory: result.incident,
        generalParties: result.parties,
        twist: result.twist,
        theme,
        numGuests
      });
    } catch (error) {
      console.error(error);
      alert("Failed to generate concept.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefineConcept = async () => {
    if (!aiSuggestion.trim()) return;
    setRefining(true);
    try {
      const current = {
        title: data.title,
        victim: data.victimName,
        atmosphere: data.environment,
        incident: data.coreStory,
        parties: data.generalParties,
        twist: data.twist
      };
      const result = await refineStoryConcept(current, aiSuggestion);
      onUpdate({
        title: result.title,
        victimName: result.victim,
        environment: result.atmosphere,
        coreStory: result.incident,
        generalParties: result.parties,
        twist: result.twist
      });
      setAiSuggestion("");
    } catch (error) {
      console.error(error);
      alert("Failed to refine concept.");
    } finally {
      setRefining(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Configuration Section */}
      <div className="bg-slate-800 p-8 rounded-lg border border-slate-700 shadow-xl">
        <h2 className="text-3xl text-amber-500 font-display mb-6 flex items-center gap-2">
          <BookOpen className="w-8 h-8" /> Step 1: The Setup
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-slate-400 text-[10px] font-black uppercase mb-2">Mystery Theme</label>
            <input type="text" value={theme} onChange={e => setTheme(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-slate-100 focus:border-amber-500 outline-none" placeholder="e.g. 1920s Speakeasy" />
          </div>
          <div>
            <label className="block text-slate-400 text-[10px] font-black uppercase mb-2">Suspect Count</label>
            <input type="number" value={numGuests} onChange={e => setNumGuests(parseInt(e.target.value))} className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-slate-100 focus:border-amber-500 outline-none" />
          </div>
        </div>

        <div className="mb-6">
           <label className="block text-slate-400 text-[10px] font-black uppercase mb-2">Base Location</label>
           <input type="text" value={environmentInput} onChange={e => setEnvironmentInput(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-slate-100 text-sm focus:border-amber-500 outline-none" placeholder="e.g. A mountain cabin during a blizzard" />
        </div>

        <div className="mb-6">
           <label className="block text-slate-400 text-[10px] font-black uppercase mb-2">Custom Directives</label>
           <textarea value={details} onChange={e => setDetails(e.target.value)} className="w-full h-20 bg-slate-900 border border-slate-600 rounded p-3 text-slate-300 text-sm focus:border-amber-500 outline-none resize-none" placeholder="e.g. 'Ensure there's a heavy focus on inheritance rivalry'..." />
        </div>

        <div className="flex gap-4">
          <button onClick={handleGenerateConcept} disabled={loading || isGenerating} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded flex items-center justify-center gap-2 transition-all disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <RefreshCw className="w-5 h-5" />}
            {data.coreStory ? "Regenerate Base" : "Draft Setup"}
          </button>
          <button onClick={() => onLucky({ theme, numGuests, environment: environmentInput, clueTools: data.clueTools, details })} disabled={loading || isGenerating} className="flex-1 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 text-white font-bold py-3 rounded flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50">
            {isGenerating ? <Loader2 className="animate-spin w-5 h-5" /> : <Dices className="w-5 h-5" />} I'm Feeling Lucky
          </button>
        </div>
      </div>

      {data.coreStory && (
        <div className="bg-slate-900 p-8 rounded-lg border border-slate-800 shadow-inner animate-fade-in space-y-10">
           {/* Header Section */}
           <div className="text-center space-y-2 border-b border-slate-800 pb-8">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest block">Mystery Title</label>
              <input 
                type="text" 
                value={data.title} 
                onChange={e => onUpdate({ title: e.target.value })}
                className="w-full bg-transparent border-none text-4xl font-display text-white text-center uppercase tracking-tighter outline-none focus:text-amber-500" 
              />
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest block pt-4">The Deceased</label>
              <input 
                type="text" 
                value={data.victimName} 
                onChange={e => onUpdate({ victimName: e.target.value })}
                className="w-full bg-transparent border-none text-red-500 font-bold uppercase tracking-widest text-center outline-none focus:text-red-400" 
              />
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             {/* Location & Atmosphere */}
             <div className="space-y-3">
               <h4 className="text-xs font-black text-amber-500 uppercase flex items-center gap-2 tracking-tighter">
                 <Map className="w-4 h-4" /> Location & Atmosphere
               </h4>
               <textarea 
                  value={data.environment} 
                  onChange={e => onUpdate({ environment: e.target.value })}
                  className="w-full bg-slate-950 p-4 rounded border border-slate-800 text-slate-300 text-sm leading-relaxed outline-none focus:border-amber-500 transition-colors h-48 resize-none"
               />
             </div>

             {/* The Incident */}
             <div className="space-y-3">
               <h4 className="text-xs font-black text-red-500 uppercase flex items-center gap-2 tracking-tighter">
                 <Ghost className="w-4 h-4" /> The Incident (The Discovery)
               </h4>
               <textarea 
                  value={data.coreStory} 
                  onChange={e => onUpdate({ coreStory: e.target.value })}
                  className="w-full bg-slate-950 p-4 rounded border border-slate-800 text-slate-300 text-sm leading-relaxed outline-none focus:border-red-500 transition-colors h-48 resize-none"
               />
               <p className="text-[10px] text-slate-600 italic leading-tight">Describe how the body was found. Don't name a killer here.</p>
             </div>
           </div>

           {/* General Parties */}
           <div className="space-y-3">
             <h4 className="text-xs font-black text-cyan-500 uppercase flex items-center gap-2 tracking-tighter">
               <Users className="w-4 h-4" /> General Parties & Factions
             </h4>
             <textarea 
                value={data.generalParties} 
                onChange={e => onUpdate({ generalParties: e.target.value })}
                className="w-full bg-slate-950 p-4 rounded border border-slate-800 text-slate-300 text-sm leading-relaxed outline-none focus:border-cyan-500 transition-colors h-24 resize-none"
             />
             <p className="text-[10px] text-slate-600 italic leading-tight">Who is attending? Mention specific groups that the suspects will be drawn from later.</p>
           </div>

           {/* Mid-Game Twist */}
           <div className="space-y-3">
             <h4 className="text-xs font-black text-purple-500 uppercase flex items-center gap-2 tracking-tighter">
               <Sparkles className="w-4 h-4" /> Mid-Game Twist Concept
             </h4>
             <textarea 
                value={data.twist} 
                onChange={e => onUpdate({ twist: e.target.value })}
                className="w-full bg-slate-950 p-4 rounded border border-slate-800 text-slate-300 text-sm leading-relaxed outline-none focus:border-purple-500 transition-colors h-24 resize-none italic"
             />
           </div>

           {/* AI Refine Box */}
           <div className="bg-slate-950 p-6 rounded-lg border border-slate-800 space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2 tracking-widest">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Refine Concept via AI
              </label>
              <div className="flex gap-3">
                <input 
                  type="text" 
                  value={aiSuggestion}
                  onChange={e => setAiSuggestion(e.target.value)}
                  placeholder="e.g. 'Add a secret passage to the location', 'Make the factions more hostile'..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded px-4 py-2 text-sm text-slate-300 focus:border-amber-500 outline-none"
                  onKeyDown={e => e.key === 'Enter' && handleRefineConcept()}
                />
                <button 
                  onClick={handleRefineConcept}
                  disabled={refining || !aiSuggestion.trim()}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-6 rounded flex items-center gap-2 disabled:opacity-50 transition-all text-sm whitespace-nowrap shadow-md"
                >
                  {refining ? <Loader2 className="animate-spin w-4 h-4" /> : <Wand2 className="w-4 h-4" />}
                  Refine
                </button>
              </div>
           </div>

           <div className="flex justify-between mt-8 pt-8 border-t border-slate-800">
              <p className="text-[10px] text-slate-500 italic max-w-xs leading-tight">
                Everything above is fully editable. Your changes will be used to cast suspects in the next step.
              </p>
              <button onClick={onNext} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-10 rounded flex items-center gap-2 shadow-lg transition-all">
                Next: Cast Suspects <ArrowRight className="w-4 h-4" />
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default StoryBuilder;
