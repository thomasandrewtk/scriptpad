import { create } from "zustand";

export type SaveState = "idle" | "saving" | "saved";

export interface SectionStat {
  type: string;
  label: string;
  wordCount: number;
  durationSeconds: number;
}

interface EditorState {
  saveState: SaveState;
  wordCount: number;
  charCount: number;
  estimatedDurationSeconds: number;
  sectionStats: SectionStat[];
  setSaveState: (state: SaveState) => void;
  setStats: (stats: {
    wordCount: number;
    charCount: number;
    estimatedDurationSeconds: number;
    sectionStats?: SectionStat[];
  }) => void;
  reset: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  saveState: "idle",
  wordCount: 0,
  charCount: 0,
  estimatedDurationSeconds: 0,
  sectionStats: [],
  setSaveState: (saveState) => set({ saveState }),
  setStats: (stats) =>
    set({
      wordCount: stats.wordCount,
      charCount: stats.charCount,
      estimatedDurationSeconds: stats.estimatedDurationSeconds,
      sectionStats: stats.sectionStats ?? [],
    }),
  reset: () =>
    set({
      saveState: "idle",
      wordCount: 0,
      charCount: 0,
      estimatedDurationSeconds: 0,
      sectionStats: [],
    }),
}));
