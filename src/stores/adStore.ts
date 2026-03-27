import { create } from 'zustand';

interface AdState {
  shouldShowAd: boolean;
  fightCount: number;
  lastAdShown: number;
  setShouldShowAd: (show: boolean) => void;
  incrementFightCount: () => void;
  markAdShown: () => void;
  checkShouldShowAd: () => boolean;
}

// Show ad after every fight (can adjust frequency here)
const AD_FREQUENCY = 1; // Show ad after every N fights

export const useAdStore = create<AdState>((set, get) => ({
  shouldShowAd: false,
  fightCount: 0,
  lastAdShown: 0,

  setShouldShowAd: (show: boolean) => {
    set({ shouldShowAd: show });
  },

  incrementFightCount: () => {
    const newCount = get().fightCount + 1;
    set({ fightCount: newCount });
  },

  markAdShown: () => {
    set({ lastAdShown: get().fightCount, shouldShowAd: false });
  },

  checkShouldShowAd: () => {
    const { fightCount, lastAdShown } = get();
    const fightsSinceLastAd = fightCount - lastAdShown;
    return fightsSinceLastAd >= AD_FREQUENCY;
  },
}));
