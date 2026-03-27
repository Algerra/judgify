import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PremiumState {
  isPremium: boolean;
  setIsPremium: (premium: boolean) => void;
  loadPremiumStatus: () => Promise<void>;
  purchasePremium: () => Promise<boolean>;
  restorePurchase: () => Promise<boolean>;
}

const PREMIUM_KEY = 'judgify_premium';
const PREMIUM_PRICE = '$1.39';

export const usePremiumStore = create<PremiumState>((set, get) => ({
  isPremium: false,

  setIsPremium: async (premium: boolean) => {
    set({ isPremium: premium });
    try {
      await AsyncStorage.setItem(PREMIUM_KEY, JSON.stringify(premium));
    } catch (e) {
      console.log('Error saving premium status');
    }
  },

  loadPremiumStatus: async () => {
    try {
      const value = await AsyncStorage.getItem(PREMIUM_KEY);
      if (value !== null) {
        set({ isPremium: JSON.parse(value) });
      }
    } catch (e) {
      console.log('Error loading premium status');
    }
  },

  // Mock purchase - in real app would use expo-iap
  purchasePremium: async () => {
    try {
      // Simulate purchase delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      // Mock successful purchase
      await get().setIsPremium(true);
      return true;
    } catch (e) {
      console.log('Purchase error:', e);
      return false;
    }
  },

  // Mock restore - in real app would use expo-iap
  restorePurchase: async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const value = await AsyncStorage.getItem(PREMIUM_KEY);
      if (value && JSON.parse(value) === true) {
        set({ isPremium: true });
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },
}));

export const PREMIUM_PRICE_DISPLAY = PREMIUM_PRICE;
