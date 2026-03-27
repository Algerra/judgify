import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const HISTORY_KEY = 'judgify_history';

export interface StoredVerdict {
  id: string;
  mode: string;
  winner: string;
  player1_name: string;
  player2_name: string;
  player1_percentage: number;
  player2_percentage: number;
  one_word_verdict: string;
  one_line_explanation: string;
  spicy_line?: string;
  category?: string;
  is_draw: boolean;
  timestamp: string;
}

export const saveVerdict = async (verdict: StoredVerdict): Promise<void> => {
  try {
    // Skip on web if there are issues
    if (Platform.OS === 'web') {
      try {
        const existing = await getHistory();
        const updated = [verdict, ...existing].slice(0, 50);
        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      } catch (webError) {
        console.log('Web storage not available, skipping save');
      }
      return;
    }
    
    const existing = await getHistory();
    const updated = [verdict, ...existing].slice(0, 50); // Keep last 50
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    console.log('Verdict saved successfully');
  } catch (error) {
    console.log('Error saving verdict (non-critical):', error);
    // Don't throw - this is non-critical
  }
};

export const getHistory = async (): Promise<StoredVerdict[]> => {
  try {
    const data = await AsyncStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.log('Error getting history:', error);
    return [];
  }
};

export const clearHistory = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.log('Error clearing history:', error);
  }
};
