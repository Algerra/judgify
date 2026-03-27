import { Platform } from 'react-native';

// Ad Unit IDs - stored here for reference, used by native builds
export const AD_UNIT_IDS = {
  ios: 'ca-app-pub-3983494417917594/6055808545',
  android: 'ca-app-pub-3983494417917594/2088643376',
};

// This is a stub hook that always returns "not available"
// Real AdMob only works in production EAS builds, not in Expo Go or web
export const useInterstitialAd = () => {
  return {
    isLoaded: false,
    isShowing: false,
    error: null,
    showAd: async (): Promise<boolean> => {
      console.log('AdMob not available in Expo Go/Web - using mock ads');
      return false;
    },
    loadAd: () => {},
    isAvailable: false,
  };
};

// Initialize Mobile Ads SDK - stub for Expo Go/Web
export const initializeAds = async () => {
  console.log('AdMob SDK not available in Expo Go/Web');
  return false;
};
