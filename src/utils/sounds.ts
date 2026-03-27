import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { useSoundStore } from '../stores/soundStore';

// Bundled sound files
const SOUNDS = {
  tap: require('../../assets/sounds/tap.wav'),
  thinking: require('../../assets/sounds/thinking.wav'),
  reveal: require('../../assets/sounds/reveal.wav'),
  victory: require('../../assets/sounds/victory.wav'),
};

// Sound cache
let loadedSounds: { [key: string]: Audio.Sound } = {};
let thinkingSound: Audio.Sound | null = null;
let thinkingInterval: NodeJS.Timeout | null = null;
let isInitialized = false;

// Check if sound is enabled
const isSoundEnabled = () => useSoundStore.getState().soundEnabled;

// Initialize audio
export const initAudio = async () => {
  if (isInitialized) return;
  
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    isInitialized = true;
    
    // Preload tap sound
    const { sound } = await Audio.Sound.createAsync(SOUNDS.tap);
    loadedSounds.tap = sound;
    console.log('Audio initialized & tap preloaded');
  } catch (error) {
    console.log('Audio init error:', error);
  }
};

// Play a bundled sound
const playBundledSound = async (
  key: keyof typeof SOUNDS, 
  volume: number = 0.7, 
  loop: boolean = false
): Promise<Audio.Sound | null> => {
  // Check if sound is enabled
  if (!isSoundEnabled()) return null;
  
  try {
    if (key === 'tap' && loadedSounds.tap) {
      await loadedSounds.tap.setPositionAsync(0);
      await loadedSounds.tap.setVolumeAsync(volume);
      await loadedSounds.tap.playAsync();
      return loadedSounds.tap;
    }
    
    const { sound } = await Audio.Sound.createAsync(
      SOUNDS[key],
      { shouldPlay: true, volume, isLooping: loop }
    );
    
    if (!loop) {
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    }
    
    return sound;
  } catch (error) {
    console.log(`Sound ${key} error:`, error);
    return null;
  }
};

// ========== PUBLIC API ==========

// Mode select (Solo/VS buttons)
export const playModeSelect = async () => {
  await playBundledSound('tap', 0.8);
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
};

// Button tap
export const playTap = async () => {
  await playBundledSound('tap', 0.6);
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};

// Thinking - loops while judging
export const playThinking = async () => {
  try {
    await stopThinking();
    thinkingSound = await playBundledSound('thinking', 0.4, true);
    
    if (Platform.OS !== 'web') {
      thinkingInterval = setInterval(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 350);
    }
  } catch (error) {
    console.log('Thinking error:', error);
  }
};

export const stopThinking = async () => {
  try {
    if (thinkingSound) {
      await thinkingSound.stopAsync();
      await thinkingSound.unloadAsync();
      thinkingSound = null;
    }
    if (thinkingInterval) {
      clearInterval(thinkingInterval);
      thinkingInterval = null;
    }
  } catch (error) {
    console.log('Stop thinking error:', error);
  }
};

// Reveal - when result shows
export const playReveal = async () => {
  await stopThinking();
  await playBundledSound('reveal', 0.9);
  if (Platform.OS !== 'web') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
};

// Victory - winner celebration
export const playVictory = async () => {
  await playBundledSound('victory', 1.0);
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 150);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 300);
  }
};

// Drumroll
export const playDrumroll = async () => {
  await playTap();
};

// Selection haptic
export const playSelection = async () => {
  if (Platform.OS !== 'web') {
    Haptics.selectionAsync();
  }
};

// Cleanup
export const unloadAllSounds = async () => {
  await stopThinking();
  for (const sound of Object.values(loadedSounds)) {
    await sound.unloadAsync();
  }
  loadedSounds = {};
};
