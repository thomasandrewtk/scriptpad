import { create } from "zustand";

export type SaveState = "idle" | "saving" | "saved";

interface EditorState {
  saveState: SaveState;
  wordCount: number;
  charCount: number;
  estimatedDurationSeconds: number;
  setSaveState: (state: SaveState) => void;
  setStats: (stats: {
    wordCount: number;
    charCount: number;
    estimatedDurationSeconds: number;
  }) => void;
  reset: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  saveState: "idle",
  wordCount: 0,
  charCount: 0,
  estimatedDurationSeconds: 0,
  setSaveState: (saveState) => set({ saveState }),
  setStats: (stats) => set(stats),
  reset: () =>
    set({
      saveState: "idle",
      wordCount: 0,
      charCount: 0,
      estimatedDurationSeconds: 0,
    }),
}));
