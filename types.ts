
export interface CharacterInfo {
  publicInfo: string[]; // Things to share (3-5 items)
  privateInfo: string[]; // Things to hide/self-incriminating (2-4 items)
}

export interface Character {
  id: string;
  name: string;
  gender: 'male' | 'female';
  archetype: string;
  initialMotive: string; // Brief motive generated in Step 2
  preGameBlurb: string; // Costume/Acting guide for the player
  background: string; // Detailed 3-paragraph history
  relationships: string; // Relations to other characters and host
  secrets: string; // System-only notes
  connectionToVictim: string;
  isFleshed: boolean; // Tracking if the full dossier is generated
  // Round 1: Pre-Twist
  round1: CharacterInfo;
  // Round 2: Post-Twist
  round2: CharacterInfo;
}

export interface Clue {
  id: string;
  name: string;
  description: string;
  locationToHide: string;
  relevance: string; // How it connects to the story
}

export interface StoryBeat {
  beatName: string;
  description: string;
  clues: string[]; // List of clue IDs or descriptions
}

export interface ConsistencyIssue {
  id: string;
  description: string;
  suggestion: string;
  fixed: boolean;
}

export interface ConsistencyReport {
  isValid: boolean;
  issues: ConsistencyIssue[];
  notes: string;
}

export interface MysteryData {
  title: string;
  theme: string;
  victimName: string;
  environment: string; // This will now hold the detailed Location/Atmosphere
  generalParties: string; // The factions or groups involved
  clueTools: string; 
  coreStory: string; // The specific "How it happened" description (Incident)
  timeline: string; // Detailed Chronological Plan (includes the Truth)
  twist: string; // The Part 2 Sabotage/Plot Twist
  numGuests: number;
  characters: Character[];
  clues: Clue[];
  killerId?: string;
  saboteurId?: string;
  beats: StoryBeat[]; 
  consistencyReport: ConsistencyReport | null;
}

export enum ViewState {
  SETUP = 'SETUP',           // Theme & Concept
  CASTING = 'CASTING',       // Characters & Motives
  PLANNING = 'PLANNING',     // Timeline & Logic
  CLUES = 'CLUES',           // Evidence
  DOSSIERS = 'DOSSIERS',     // Writing player cards
  AUDIT = 'AUDIT',           // Logical Consistency Check
  OUTPUT = 'OUTPUT'          // Final Review & Print
}
