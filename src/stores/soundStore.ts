import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SoundState {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  toggleSound: () => void;
  loadSoundPreference: () => Promise<void>;
}

export const useSoundStore = create<SoundState>((set, get) => ({
  soundEnabled: true,
  
  setSoundEnabled: async (enabled: boolean) => {
    set({ soundEnabled: enabled });
    try {
      await AsyncStorage.setItem('sound_enabled', JSON.stringify(enabled));
    } catch (e) {
      console.log('Error saving sound preference');
    }
  },
  
  toggleSound: () => {
    const current = get().soundEnabled;
    get().setSoundEnabled(!current);
  },
  
  loadSoundPreference: async () => {
    try {
      const value = await AsyncStorage.getItem('sound_enabled');
      if (value !== null) {
        set({ soundEnabled: JSON.parse(value) });
      }
    } catch (e) {
      console.log('Error loading sound preference');
    }
  },
}));
