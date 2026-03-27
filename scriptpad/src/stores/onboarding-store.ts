import { create } from "zustand";

interface OnboardingState {
  currentStep: number;
  isActive: boolean;
  start: () => void;
  nextStep: () => void;
  dismiss: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  currentStep: 0,
  isActive: false,

  start: () => set({ isActive: true, currentStep: 0 }),

  nextStep: () => {
    const { currentStep } = get();
    if (currentStep >= 2) {
      // Last step — dismiss
      get().dismiss();
    } else {
      set({ currentStep: currentStep + 1 });
    }
  },

  dismiss: () => set({ isActive: false, currentStep: 0 }),
}));
