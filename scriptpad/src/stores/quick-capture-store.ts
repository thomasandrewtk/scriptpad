import { create } from "zustand";

interface QuickCaptureState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useQuickCaptureStore = create<QuickCaptureState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
