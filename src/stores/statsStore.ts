import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { Platform, Alert } from 'react-native';

interface StatsState {
  totalFights: number;
  totalWins: number;
  hasRatedApp: boolean;
  loadStats: () => Promise<void>;
  recordFight: (didWin: boolean) => Promise<void>;
  checkAndPromptRating: () => Promise<void>;
}

const STATS_KEY = 'judgify_stats';
const RATED_KEY = 'judgify_rated';
const FIGHTS_BEFORE_RATING = 3;

export const useStatsStore = create<StatsState>((set, get) => ({
  totalFights: 0,
  totalWins: 0,
  hasRatedApp: false,

  loadStats: async () => {
    try {
      const statsJson = await AsyncStorage.getItem(STATS_KEY);
      const ratedJson = await AsyncStorage.getItem(RATED_KEY);
      
      if (statsJson) {
        const stats = JSON.parse(statsJson);
        set({ 
          totalFights: stats.totalFights || 0, 
          totalWins: stats.totalWins || 0 
        });
      }
      
      if (ratedJson) {
        set({ hasRatedApp: JSON.parse(ratedJson) });
      }
    } catch (e) {
      console.log('Error loading stats');
    }
  },

  recordFight: async (didWin: boolean) => {
    const { totalFights, totalWins } = get();
    const newStats = {
      totalFights: totalFights + 1,
      totalWins: didWin ? totalWins + 1 : totalWins,
    };
    
    set(newStats);
    
    try {
      await AsyncStorage.setItem(STATS_KEY, JSON.stringify(newStats));
    } catch (e) {
      console.log('Error saving stats');
    }
  },

  checkAndPromptRating: async () => {
    const { totalFights, hasRatedApp } = get();
    
    // Only prompt after N fights and if not already rated
    if (totalFights >= FIGHTS_BEFORE_RATING && !hasRatedApp) {
      // Check if store review is available
      const isAvailable = await StoreReview.isAvailableAsync();
      
      if (isAvailable && Platform.OS !== 'web') {
        // Use native store review
        try {
          await StoreReview.requestReview();
          set({ hasRatedApp: true });
          await AsyncStorage.setItem(RATED_KEY, JSON.stringify(true));
        } catch (e) {
          console.log('Store review error:', e);
        }
      } else {
        // Fallback: Show custom alert
        Alert.alert(
          'Enjoying Judgify? ⚖️',
          'If you like settling arguments with AI, please rate us! It really helps.',
          [
            {
              text: 'Maybe Later',
              style: 'cancel',
            },
            {
              text: 'Rate Now ⭐',
              onPress: async () => {
                set({ hasRatedApp: true });
                await AsyncStorage.setItem(RATED_KEY, JSON.stringify(true));
                // In production, this would open the store
              },
            },
            {
              text: "Don't Ask Again",
              onPress: async () => {
                set({ hasRatedApp: true });
                await AsyncStorage.setItem(RATED_KEY, JSON.stringify(true));
              },
            },
          ]
        );
      }
    }
  },
}));
