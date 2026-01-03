import React from 'react';
import { MysteryData } from '../types';
import { Printer, ArrowLeft, Download } from 'lucide-react';

interface OutputViewProps {
  data: MysteryData;
  onBack: () => void;
}

const OutputView: React.FC<OutputViewProps> = ({ data, onBack }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Screen Controls - Hidden during print */}
      <div className="print:hidden p-6 space-y-6">
        <div className="flex justify-between items-center bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl">
          <div>
            <h2 className="text-2xl text-amber-500 font-display flex items-center gap-2">
              <Printer className="w-8 h-8" />
              Final Dossiers
            </h2>
            <p className="text-slate-400 mt-1">Review character sheets and print the final game kit.</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={onBack}
              className="text-slate-400 hover:text-white font-bold py-3 px-6 rounded flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Analysis
            </button>
            <button 
              onClick={handlePrint}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded flex items-center gap-2 shadow-lg"
            >
              <Printer className="w-4 h-4" /> Print / Save as PDF
            </button>
          </div>
        </div>

        <div className="bg-slate-900/50 p-4 border border-slate-800 rounded text-center text-slate-500 italic">
          Scroll down to see the print preview. Click "Print" to export to PDF.
        </div>
      </div>

      {/* Printable Area - styled for print */}
      <div className="print-content bg-white text-black p-8 max-w-[210mm] mx-auto min-h-screen">
        <style>{`
          @media print {
            body { 
              background: white; 
              color: black;
            }
            .print:hidden { 
              display: none !important; 
            }
            header, footer, nav {
              display: none !important;
            }
            .print-content {
               margin: 0;
               padding: 0;
               width: 100%;
               max-width: none;
            }
            .page-break { 
              page-break-after: always; 
              break-after: page;
            }
            /* Reset typical web styles for print */
            * {
               -webkit-print-color-adjust: exact;
            }
          }
          @media screen {
             .print-content {
                background: #f8fafc; /* Slate 50 */
                color: #1e293b; /* Slate 800 */
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
             }
          }
        `}</style>

        {/* Cover Page */}
        <div className="page-break flex flex-col items-center justify-center min-h-[900px] text-center border-4 border-double border-black p-12 mb-8">
           <h1 className="text-6xl font-display mb-8 uppercase tracking-widest">{data.title || "Murder Mystery"}</h1>
           <div className="w-24 h-1 bg-black mb-8"></div>
           <h2 className="text-2xl font-serif mb-4">A "Shot in the Dark" Mystery</h2>
           <p className="text-xl mb-12">Designed for {data.characters.length} Suspects</p>
           
           <div className="text-left max-w-lg mt-12 border p-6">
             <h3 className="font-bold uppercase mb-2">Host Instructions</h3>
             <ul className="list-disc pl-5 space-y-2">
               <li>Distribute dossiers to guests upon arrival.</li>
               <li>Do NOT reveal the "Twist" (Part 2) information until mid-game.</li>
               <li>Ensure players understand they must share "Public" info but hide "Private" info unless questioned.</li>
             </ul>
           </div>
        </div>

        {/* Character Dossiers */}
        {data.characters.map((char, idx) => (
          <div key={char.id} className="page-break mb-12 last:mb-0">
            {/* Dossier Header */}
            <div className="border-b-4 border-black pb-4 mb-6 flex justify-between items-end">
               <div>
                  <h1 className="text-4xl font-display font-bold uppercase">{char.name}</h1>
                  <p className="text-xl italic font-serif text-slate-700">{char.archetype}</p>
               </div>
               <div className="text-right">
                  <span className="block text-sm font-bold uppercase text-slate-500">Dossier #{idx + 1}</span>
                  <span className="block text-xs uppercase tracking-wider">Confidential</span>
               </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
               
               {/* Pre-Game Invite (Cutout) */}
               <div className="border-2 border-dashed border-gray-300 p-4 bg-gray-50 mb-4">
                  <h4 className="font-bold uppercase text-sm text-gray-500 mb-2">Pre-Game Invite Info (Send to player beforehand)</h4>
                  <p className="italic font-serif text-sm">{char.preGameBlurb}</p>
               </div>

               {/* Background & Relations */}
               <section>
                 <h3 className="bg-black text-white px-3 py-1 font-bold uppercase inline-block mb-3">Background & History</h3>
                 <p className="text-justify mb-4 leading-relaxed font-serif whitespace-pre-wrap">{char.background}</p>
                 
                 <h4 className="font-bold uppercase text-sm border-b border-gray-300 pb-1 mb-2">Relationships</h4>
                 <p className="whitespace-pre-wrap font-serif text-sm">{char.relationships}</p>
                 
                 <h4 className="font-bold uppercase text-sm border-b border-gray-300 pb-1 mb-2 mt-4">Connection to Victim</h4>
                 <p className="font-serif text-sm">{char.connectionToVictim}</p>
               </section>

               <hr className="border-gray-300" />

               {/* Part 1 */}
               <section>
                 <h3 className="bg-slate-800 text-white px-3 py-1 font-bold uppercase inline-block mb-4">Round 1: The Murder</h3>
                 <p className="italic text-sm text-slate-600 mb-4">Read this at the start of the party.</p>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-slate-100 p-4 border border-slate-300">
                     <h4 className="font-bold text-center uppercase mb-3 border-b border-slate-300 pb-2">Public Knowledge</h4>
                     <p className="text-xs text-center italic mb-3">Share these freely. Gossip about them.</p>
                     <ul className="list-disc pl-5 space-y-2 text-sm font-serif">
                       {char.round1?.publicInfo?.map((info, i) => <li key={i}>{info}</li>)}
                     </ul>
                   </div>
                   <div className="bg-slate-200 p-4 border border-slate-400">
                     <h4 className="font-bold text-center uppercase mb-3 border-b border-slate-400 pb-2">Confidential</h4>
                     <p className="text-xs text-center italic mb-3">Reveal ONLY if directly questioned.</p>
                     <ul className="list-disc pl-5 space-y-2 text-sm font-serif">
                       {char.round1?.privateInfo?.map((info, i) => <li key={i}>{info}</li>)}
                     </ul>
                   </div>
                 </div>
               </section>

               {/* Part 2 - Cut Line */}
               <div className="border-t-2 border-dashed border-gray-400 my-8 relative text-center">
                  <span className="bg-white px-4 text-xs font-bold text-gray-500 absolute top-[-10px] left-1/2 transform -translate-x-1/2">
                    FOLD OR CUT HERE - REVEAL ONLY AFTER TWIST ANNOUNCEMENT
                  </span>
               </div>

               {/* Part 2 */}
               <section>
                 <h3 className="bg-slate-800 text-white px-3 py-1 font-bold uppercase inline-block mb-4">Round 2: The Twist</h3>
                 <p className="italic text-sm text-slate-600 mb-4">Open this only when the Host announces the Mid-Game Twist.</p>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-slate-100 p-4 border border-slate-300">
                     <h4 className="font-bold text-center uppercase mb-3 border-b border-slate-300 pb-2">New Public Info</h4>
                     <ul className="list-disc pl-5 space-y-2 text-sm font-serif">
                       {char.round2?.publicInfo?.map((info, i) => <li key={i}>{info}</li>)}
                     </ul>
                   </div>
                   <div className="bg-slate-200 p-4 border border-slate-400">
                     <h4 className="font-bold text-center uppercase mb-3 border-b border-slate-400 pb-2">New Secrets</h4>
                     <ul className="list-disc pl-5 space-y-2 text-sm font-serif">
                       {char.round2?.privateInfo?.map((info, i) => <li key={i}>{info}</li>)}
                     </ul>
                   </div>
                 </div>
               </section>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OutputView;