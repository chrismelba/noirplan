
import { GoogleGenAI, Type } from "@google/genai";
import { MysteryData, Character, Clue, StoryBeat, ConsistencyReport, ConsistencyIssue } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

async function generateWithRetry<T>(operation: () => Promise<T>, retries = 3, delayMs = 2000): Promise<T> {
  try { return await operation(); } catch (error: any) {
    if (retries > 0 && (error?.status === 429 || error?.status >= 500)) {
      await new Promise(r => setTimeout(r, delayMs));
      return generateWithRetry(operation, retries - 1, delayMs * 2);
    }
    throw error;
  }
}

/**
 * Step 1: Base Story Concept (No Killer Identity Yet)
 */
export const generateStoryConcept = async (theme: string, location: string, numGuests: number, details: string): Promise<{ title: string; victim: string; atmosphere: string; incident: string; parties: string; twist: string }> => {
  return generateWithRetry(async () => {
    const ai = getAI();
    const prompt = `
      Design a murder mystery concept. 
      IMPORTANT: DO NOT specify who the killer is yet. Focus on the setup.

      THEME: ${theme}
      PROPOSED LOCATION: ${location}
      SUSPECT COUNT: ${numGuests}
      USER PREFERENCES: ${details}
      
      Requirements:
      1. title: A compelling name for the mystery.
      2. victim: Name and role of the person found dead.
      3. atmosphere: A detailed description of the setting and the mood of the event.
      4. incident: A description of HOW the murder occurred (the mechanics/scene), but NOT WHO did it.
      5. parties: Describe the general groups, factions, or types of people present.
      6. twist: A mid-game complication or external chaos factor.

      Return JSON.
    `;
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            victim: { type: Type.STRING },
            atmosphere: { type: Type.STRING },
            incident: { type: Type.STRING },
            parties: { type: Type.STRING },
            twist: { type: Type.STRING }
          },
          required: ["title", "victim", "atmosphere", "incident", "parties", "twist"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  });
};

/**
 * Refine Story Concept
 */
export const refineStoryConcept = async (current: { title: string; victim: string; atmosphere: string; incident: string; parties: string; twist: string }, suggestion: string): Promise<{ title: string; victim: string; atmosphere: string; incident: string; parties: string; twist: string }> => {
  return generateWithRetry(async () => {
    const ai = getAI();
    const prompt = `
      Modify the current mystery concept based on the user's suggestion.
      
      CURRENT:
      Title: ${current.title}
      Victim: ${current.victim}
      Atmosphere: ${current.atmosphere}
      Incident: ${current.incident}
      Parties: ${current.parties}
      Twist: ${current.twist}

      USER SUGGESTION: "${suggestion}"

      Update the JSON fields. DO NOT assign a killer yet.
    `;
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            victim: { type: Type.STRING },
            atmosphere: { type: Type.STRING },
            incident: { type: Type.STRING },
            parties: { type: Type.STRING },
            twist: { type: Type.STRING }
          },
          required: ["title", "victim", "atmosphere", "incident", "parties", "twist"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  });
};

/**
 * Step 2: Casting
 */
export const generateCastList = async (incident: string, parties: string, numGuests: number): Promise<Character[]> => {
  return generateWithRetry(async () => {
    const ai = getAI();
    const prompt = `
      Create ${numGuests} unique suspects for a mystery.
      CONTEXT: ${incident}
      GROUPS INVOLVED: ${parties}
      
      For each suspect, provide: Name, Gender (male/female), Archetype, and Initial Motive.
      Return a JSON array.
    `;
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              gender: { type: Type.STRING, enum: ["male", "female"] },
              archetype: { type: Type.STRING },
              initialMotive: { type: Type.STRING }
            },
            required: ["id", "name", "gender", "archetype", "initialMotive"]
          }
        }
      }
    });
    const partials = JSON.parse(response.text || "[]");
    return partials.map((p: any) => ({
      ...p,
      preGameBlurb: "", background: "", relationships: "", secrets: "", connectionToVictim: "",
      isFleshed: false,
      round1: { publicInfo: [], privateInfo: [] }, round2: { publicInfo: [], privateInfo: [] }
    }));
  });
};

/**
 * Step 3: Detailed Timeline
 */
export const generateDetailedTimeline = async (
  incidentDescription: string, 
  cast: Character[], 
  killerId: string, 
  saboteurId: string,
  atmosphere: string
): Promise<string> => {
  return generateWithRetry(async () => {
    const ai = getAI();
    const killer = cast.find(c => c.id === killerId);
    const saboteur = cast.find(c => c.id === saboteurId);
    const guestList = cast.map(c => `${c.name} (${c.archetype})`).join(", ");

    const prompt = `
      Create the definitive Chronological Timeline and "Truth" for the mystery.
      
      THE INCIDENT SETUP: ${incidentDescription}
      ATMOSPHERE: ${atmosphere}
      GUESTS: ${guestList}
      
      ASSIGNED ROLES:
      - KILLER: ${killer?.name}
      - SABOTEUR: ${saboteur?.name}

      Requirements:
      1. Invent the "TRUTH": How exactly did ${killer?.name} commit the murder?
      2. Construct a 15-minute increment timeline for the 2 hours preceding and following the discovery.
      3. Account for all guests. Ensure suspicious overlaps.
    `;
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt
    });
    return response.text || "";
  });
};

/**
 * Step 4: Character Dossier Fleshing (The Web of Suspicion)
 */
export const generateCharacterDossier = async (
  character: Character,
  isKiller: boolean,
  isSaboteur: boolean,
  incident: string, 
  timeline: string, 
  twist: string,
  allSuspects: Character[]
): Promise<Character> => {
  return generateWithRetry(async () => {
    const ai = getAI();
    const otherGuestsList = allSuspects.filter(c => c.id !== character.id).map(c => c.name).join(", ");
    
    const prompt = `
      Flesh out the full dossier for: ${character.name} (${character.archetype}).
      ROLE STATUS: ${isKiller ? 'THE ACTUAL KILLER' : (isSaboteur ? 'THE SABOTEUR' : 'INNOCENT SUSPECT')}
      
      THE TRUTH (Timeline): ${timeline}
      OTHER GUESTS IN THE GAME: ${otherGuestsList}

      WEB OF SUSPICION ARCHITECTURE:
      1. PRIVATE INFO (Self-Incrimination / Dark Act): 
         - Assign this character a "Dark Act"—an action they took that *could* have had lethal consequences for the victim (e.g., swapping pills, sabotaging equipment, leaving a door open for an enemy).
         - Lethal intent is OPTIONAL; the act could be a prank, petty revenge, or negligence, as long as it results in lethal potential.
         - CRITICAL: The character MUST be uncertain of the outcome (e.g., they fled before the consequence occurred). They must believe they *might* be the killer.

      2. PUBLIC INFO (Incriminating Others): 
         - This section MUST contain gossip, sightings, or overheard whispers about OTHER guests from the provided list.
         - These sightings must allude to the "Dark Acts" hidden in those other characters' dossiers.
         - Use the TIMELINE to ground these sightings in reality (e.g., if Suspect X was in the Hallway at 10 PM, this character might have seen them there).

      Requirements:
      - Background: 2-3 paragraphs of personal history.
      - Relationships: How they feel about the other guests.
      - Round 1 Private: Details of THEIR "Dark Act" and their subsequent guilt/fear.
      - Round 1 Public: 3-4 sightings of OTHER guests that make them look suspicious.
      - Round 2: Info related to the Twist: ${twist}.

      Return JSON.
    `;
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            preGameBlurb: { type: Type.STRING },
            background: { type: Type.STRING },
            relationships: { type: Type.STRING },
            connectionToVictim: { type: Type.STRING },
            round1: {
              type: Type.OBJECT,
              properties: {
                publicInfo: { type: Type.ARRAY, items: { type: Type.STRING } },
                privateInfo: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            },
            round2: {
              type: Type.OBJECT,
              properties: {
                publicInfo: { type: Type.ARRAY, items: { type: Type.STRING } },
                privateInfo: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          }
        }
      }
    });
    const result = JSON.parse(response.text || "{}");
    return { ...character, ...result };
  });
};

export const generateClues = async (incident: string, timeline: string, atmosphere: string, clueTools: string): Promise<Clue[]> => {
  return generateWithRetry(async () => {
    const ai = getAI();
    const prompt = `
      Generate 6-8 physical clues based on:
      THE INCIDENT: ${incident}
      THE TRUTH/TIMELINE: ${timeline}
      SETTING: ${atmosphere}
      FABRICATION TOOLS: ${clueTools}
      
      Return a JSON array of Clues.
    `;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              locationToHide: { type: Type.STRING },
              relevance: { type: Type.STRING }
            },
            required: ["id", "name", "description", "locationToHide", "relevance"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  });
};

export const checkConsistency = async (mystery: MysteryData): Promise<ConsistencyReport> => {
  return generateWithRetry(async () => {
    const ai = getAI();
    const dossiersSummary = mystery.characters.map(c => `SUSPECT: ${c.name}\nROUND 1 PUBLIC: ${c.round1?.publicInfo?.join(", ")}\nROUND 1 PRIVATE: ${c.round1?.privateInfo?.join(", ")}`).join("\n\n");
    
    const prompt = `
      Audit this murder mystery for the 'Web of Suspicion' and 'Ambiguous Guilt' logic.
      
      AUDIT CHECKLIST:
      1. AMBIGUOUS GUILT: Does every suspect have a Private 'Dark Act' (an action with potentially lethal consequences) that makes them doubt their innocence?
      2. WEB OF SUSPICION: Does the Public Info of characters successfully point to or incriminate the 'Dark Acts' of OTHER guests? Every private secret should be alluded to by at least one other character's public info.
      3. TIMELINE ADHERENCE: Do sightings in Public Info match the movements and locations in the master Timeline?
      4. SOLVABILITY: Is the 'Truth' (the actual killer's method) distinguishable from the 'False Leads' (the dark acts of the innocent) through logical deduction?

      DATA:
      ${dossiersSummary}
      TIMELINE: ${mystery.timeline}
      CLUES: ${mystery.clues.map(c => c.name).join(", ")}

      Return JSON with issues and verdict.
    `;
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValid: { type: Type.BOOLEAN },
            issues: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT, 
                properties: { 
                  id: { type: Type.STRING }, 
                  description: { type: Type.STRING }, 
                  suggestion: { type: Type.STRING } 
                },
                required: ["id", "description", "suggestion"]
              } 
            },
            notes: { type: Type.STRING }
          },
          required: ["isValid", "issues", "notes"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  });
};

export const analyzeRuleOfThree = async (mystery: MysteryData): Promise<StoryBeat[]> => {
  return generateWithRetry(async () => {
    const ai = getAI();
    const prompt = `
      Analyze the "Rule of Three" for this mystery. 
      Identify 3-5 major Story Beats and list the evidence supporting each.
      STORY: ${mystery.coreStory}
      TIMELINE: ${mystery.timeline}
    `;
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              beatName: { type: Type.STRING },
              description: { type: Type.STRING },
              clues: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["beatName", "description", "clues"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  });
};

export const resolveInconsistency = async (
  mystery: MysteryData, 
  issueDescription: string
): Promise<{ timeline: string; summary: string }> => {
  return generateWithRetry(async () => {
    const ai = getAI();
    const prompt = `
      Fix this logical inconsistency: "${issueDescription}"
      Rewrite the timeline or suggest a tweak.
    `;
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            timeline: { type: Type.STRING },
            summary: { type: Type.STRING }
          },
          required: ["timeline", "summary"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  });
};
