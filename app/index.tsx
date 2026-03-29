import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { playModeSelect } from '../src/utils/sounds';
import { useSoundStore } from '../src/stores/soundStore';
import { usePremiumStore } from '../src/stores/premiumStore';
import { useStatsStore } from '../src/stores/statsStore';
import { PremiumModal } from '../src/components/PremiumModal';

const { width } = Dimensions.get('window');
const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function HomeScreen() {
  const router = useRouter();
  const pulseScale = useSharedValue(1);
  const { soundEnabled, toggleSound, loadSoundPreference } = useSoundStore();
  const { isPremium, loadPremiumStatus, setIsPremium } = usePremiumStore();
  const { totalFights, totalWins, loadStats } = useStatsStore();
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  useEffect(() => {
    loadSoundPreference();
    loadPremiumStatus();
    loadStats();
    
    // Check for Stripe payment success (web only)
    if (Platform.OS === 'web') {
      const urlParams = new URLSearchParams(window.location.search);
      const premiumStatus = urlParams.get('premium');
      
      if (premiumStatus === 'success') {
        // Verify payment with backend
        const sessionId = localStorage.getItem('stripe_session_id');
        if (sessionId) {
          fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/verify-payment/${sessionId}`)
            .then(res => res.json())
            .then(data => {
              if (data.paid) {
                setIsPremium(true);
                localStorage.removeItem('stripe_session_id');
                Alert.alert('Welcome to Premium!', 'Thank you! All ads have been removed.');
              }
            })
            .catch(console.error);
        }
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (premiumStatus === 'cancelled') {
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
    
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const handleSoloMode = () => {
    playModeSelect();
    router.push('/solo');
  };

  const handleVSMode = () => {
    playModeSelect();
    router.push('/vs-setup');
  };

  const handleSoundToggle = () => {
    toggleSound();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar with Controls */}
      <View style={styles.topBar}>
        {/* Sound Toggle */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleSoundToggle}
          activeOpacity={0.7}
        >
          <Ionicons
            name={soundEnabled ? 'volume-high' : 'volume-mute'}
            size={22}
            color={soundEnabled ? '#FFD700' : '#555'}
          />
        </TouchableOpacity>

        {/* Premium Badge/Button */}
        {isPremium ? (
          <View style={styles.premiumBadge}>
            <Ionicons name="diamond" size={14} color="#FFD700" />
            <Text style={styles.premiumBadgeText}>PRO</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => setShowPremiumModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="diamond-outline" size={16} color="#FFD700" />
            <Text style={styles.upgradeButtonText}>Go Pro</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <Animated.View style={[styles.logoContainer, pulseStyle]}>
            <Ionicons name="flash" size={60} color="#FFD700" />
          </Animated.View>
          <Text style={styles.title}>JUDGIFY</Text>
          <Text style={styles.tagline}>Settle it. Who's right?</Text>
        </View>

        {/* Mode Selection */}
        <View style={styles.modeSection}>
          <TouchableOpacity
            style={styles.modeCard}
            onPress={handleSoloMode}
            activeOpacity={0.8}
          >
            <View style={styles.modeIconContainer}>
              <Ionicons name="person" size={32} color="#FFD700" />
            </View>
            <View style={styles.modeTextContainer}>
              <Text style={styles.modeTitle}>Solo Mode</Text>
              <Text style={styles.modeDescription}>
                You vs Them - Get an instant verdict
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeCard, styles.vsCard]}
            onPress={handleVSMode}
            activeOpacity={0.8}
          >
            <View style={[styles.modeIconContainer, styles.vsIconContainer]}>
              <Ionicons name="people" size={32} color="#FF4444" />
            </View>
            <View style={styles.modeTextContainer}>
              <Text style={styles.modeTitle}>VS Mode</Text>
              <Text style={styles.modeDescription}>
                Pass the phone - Battle it out!
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Stats Bar */}
        {totalFights > 0 && (
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalFights}</Text>
              <Text style={styles.statLabel}>Fights</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalWins}</Text>
              <Text style={styles.statLabel}>Wins</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {totalFights > 0 ? Math.round((totalWins / totalFights) * 100) : 0}%
              </Text>
              <Text style={styles.statLabel}>Win Rate</Text>
            </View>
          </View>
        )}

        {/* History Button */}
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => router.push('/history')}
          activeOpacity={0.8}
        >
          <Ionicons name="time-outline" size={20} color="#888" />
          <Text style={styles.historyButtonText}>Fight History</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>No login required • 100% anonymous</Text>
        </View>
      </View>

      {/* Premium Modal */}
      <PremiumModal
        visible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2a2a1a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  premiumBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFD700',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  upgradeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 4,
  },
  tagline: {
    fontSize: 16,
    color: '#888',
    marginTop: 8,
    fontStyle: 'italic',
  },
  modeSection: {
    gap: 16,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  vsCard: {
    borderColor: '#FF4444',
    borderWidth: 1,
  },
  modeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vsIconContainer: {
    backgroundColor: '#331111',
  },
  modeTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  modeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  modeDescription: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFD700',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#333',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginTop: 8,
  },
  historyButtonText: {
    fontSize: 14,
    color: '#888',
  },
  footer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#555',
  },
});
