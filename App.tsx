
import React, { useState, useEffect } from 'react';
import StoryBuilder from './components/StoryBuilder';
import CharacterManager from './components/CharacterManager';
import ClueManager from './components/ClueManager';
import BlueprintManager from './components/BlueprintManager';
import AuditManager from './components/AuditManager';
import OutputView from './components/OutputView';
import DossierManager from './components/DossierManager';
import { MysteryData, ViewState, Character } from './types';
import { Fingerprint, Loader2, PlusCircle, ShieldCheck } from 'lucide-react';
import { 
  generateStoryConcept,
  generateCastList,
  generateDetailedTimeline,
  generateCharacterDossier,
  generateClues
} from './services/geminiService';

const STORAGE_KEY = 'noirplan_mystery_data_v4';
const VIEW_KEY = 'noirplan_current_view_v4';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.SETUP);
  const [generatingStep, setGeneratingStep] = useState<ViewState | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  
  const [mysteryData, setMysteryData] = useState<MysteryData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return {
      title: "", theme: "", victimName: "",
      environment: "A grand Victorian estate",
      generalParties: "High-society relatives and staff",
      clueTools: "Printer, household items, glue, ink",
      coreStory: "", timeline: "", twist: "", numGuests: 6,
      characters: [], clues: [], beats: [], consistencyReport: null
    };
  });

  useEffect(() => {
    const savedView = localStorage.getItem(VIEW_KEY) as ViewState;
    if (savedView && Object.values(ViewState).includes(savedView)) setView(savedView);
  }, []);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(mysteryData)); }, [mysteryData]);
  useEffect(() => { localStorage.setItem(VIEW_KEY, view); }, [view]);

  const updateData = (newData: Partial<MysteryData>) => setMysteryData(prev => ({ ...prev, ...newData }));

  const handleNewMystery = () => {
    if (confirm("Start a new mystery? Current progress will be lost.")) {
      const fresh = {
        title: "", theme: "", victimName: "",
        environment: "A grand Victorian estate",
        generalParties: "High-society relatives and staff",
        clueTools: "Printer, household items, glue, ink",
        coreStory: "", timeline: "", twist: "", numGuests: 6,
        characters: [], clues: [], beats: [], consistencyReport: null
      };
      setMysteryData(fresh);
      setView(ViewState.SETUP);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(VIEW_KEY);
    }
  };

  const handleLuckyGeneration = async (config: { theme: string, numGuests: number, environment: string, clueTools: string, details: string }) => {
    try {
      setGeneratingStep(ViewState.SETUP);
      
      setLoadingMessage("Building the setup...");
      const concept = await generateStoryConcept(config.theme, config.environment, config.numGuests, config.details);
      updateData({ 
        title: concept.title, 
        victimName: concept.victim, 
        environment: concept.atmosphere, 
        coreStory: concept.incident,
        generalParties: concept.parties,
        twist: concept.twist,
        theme: config.theme,
        numGuests: config.numGuests,
        clueTools: config.clueTools
      });

      setGeneratingStep(ViewState.CASTING);
      setLoadingMessage("Populating the factions...");
      const cast = await generateCastList(concept.incident, concept.parties, config.numGuests);
      const killerId = cast[Math.floor(Math.random() * cast.length)].id;
      const saboteurId = cast[Math.floor(Math.random() * cast.length)].id;
      const preparedCast = cast.map(c => ({ ...c, isFleshed: false }));
      updateData({ characters: preparedCast, killerId, saboteurId });

      setGeneratingStep(ViewState.PLANNING);
      setLoadingMessage("Writing the hidden truth...");
      const timeline = await generateDetailedTimeline(concept.incident, preparedCast, killerId, saboteurId, concept.atmosphere);
      updateData({ timeline });

      setGeneratingStep(ViewState.CLUES);
      setLoadingMessage("Planting the clues...");
      const clues = await generateClues(concept.incident, timeline, concept.atmosphere, config.clueTools);
      updateData({ clues });

      setGeneratingStep(ViewState.DOSSIERS);
      const fullCharacters: Character[] = [];
      for (let i = 0; i < preparedCast.length; i++) {
        setLoadingMessage(`Writing dossier for ${preparedCast[i].name} (${i+1}/${preparedCast.length})...`);
        const full = await generateCharacterDossier(preparedCast[i], preparedCast[i].id === killerId, preparedCast[i].id === saboteurId, concept.incident, timeline, concept.twist, preparedCast);
        fullCharacters.push({ ...full, isFleshed: true });
        updateData({ characters: [...fullCharacters, ...preparedCast.slice(i + 1)] });
      }

      setGeneratingStep(null);
      setLoadingMessage("");
      setView(ViewState.OUTPUT);

    } catch (error) {
      console.error(error);
      alert("Lucky generation hit a snag. Some steps may be incomplete.");
      setGeneratingStep(null);
    }
  };

  const renderView = () => {
    switch (view) {
      case ViewState.SETUP:
        return <StoryBuilder data={mysteryData} onUpdate={updateData} onNext={() => setView(ViewState.CASTING)} onLucky={handleLuckyGeneration} isGenerating={generatingStep !== null} />;
      case ViewState.CASTING:
        return <CharacterManager data={mysteryData} onUpdate={updateData} onNext={() => setView(ViewState.PLANNING)} onBack={() => setView(ViewState.SETUP)} />;
      case ViewState.PLANNING:
        return <BlueprintManager data={mysteryData} onUpdate={updateData} onBack={() => setView(ViewState.CASTING)} onNext={() => setView(ViewState.CLUES)} />;
      case ViewState.CLUES:
        return <ClueManager data={mysteryData} onUpdate={updateData} onNext={() => setView(ViewState.DOSSIERS)} onBack={() => setView(ViewState.PLANNING)} />;
      case ViewState.DOSSIERS:
        return <DossierManager data={mysteryData} onUpdate={updateData} onNext={() => setView(ViewState.AUDIT)} onBack={() => setView(ViewState.CLUES)} />;
      case ViewState.AUDIT:
        return <AuditManager data={mysteryData} onUpdate={updateData} onNext={() => setView(ViewState.OUTPUT)} onBack={() => setView(ViewState.DOSSIERS)} />;
      case ViewState.OUTPUT:
        return <OutputView data={mysteryData} onBack={() => setView(ViewState.AUDIT)} />;
      default:
        return null;
    }
  };

  const steps = [
    { id: ViewState.SETUP, label: "Concept" },
    { id: ViewState.CASTING, label: "Casting" },
    { id: ViewState.PLANNING, label: "Timeline" },
    { id: ViewState.CLUES, label: "Clues" },
    { id: ViewState.DOSSIERS, label: "Dossiers" },
    { id: ViewState.AUDIT, label: "Audit" },
    { id: ViewState.OUTPUT, label: "Print" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-amber-900 selection:text-white pb-16">
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur border-b border-slate-800 shadow-lg print:hidden">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Fingerprint className="text-amber-600 w-8 h-8" />
            <h1 className="text-2xl font-display font-bold tracking-wide text-white hidden sm:block">Noir<span className="text-amber-600">Plan</span></h1>
          </div>
          <div className="flex gap-1 items-center overflow-x-auto no-scrollbar py-2">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex items-center">
                <button onClick={() => setView(step.id)} className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold transition-all whitespace-nowrap ${view === step.id ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                  {idx + 1}. {step.label}
                </button>
                {idx < steps.length - 1 && <div className="w-2 sm:w-4 h-px bg-slate-800 mx-1"></div>}
              </div>
            ))}
          </div>
          <button onClick={handleNewMystery} className="text-slate-400 hover:text-red-400 p-2"><PlusCircle className="w-5 h-5" /></button>
        </div>
      </header>
      <main className="py-8 px-4">{renderView()}</main>
      <footer className="fixed bottom-0 w-full bg-slate-900 border-t border-slate-800 text-[10px] py-2 px-6 flex justify-between text-slate-500 z-40 print:hidden">
        <div className="truncate flex items-center gap-2"><ShieldCheck className="w-3 h-3" /> {mysteryData.title || "Untitled"}</div>
        <div className="flex items-center gap-4">
           {generatingStep ? <span className="text-amber-500 animate-pulse font-bold flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> {loadingMessage}</span> : <span>Autosaved</span>}
        </div>
      </footer>
    </div>
  );
};

export default App;
