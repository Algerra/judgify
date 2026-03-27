import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { playThinking, stopThinking } from '../src/utils/sounds';
import { useAdStore } from '../src/stores/adStore';

const { width } = Dimensions.get('window');
const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function JudgingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [status, setStatus] = useState('Analyzing');
  const [error, setError] = useState<string | null>(null);
  const { incrementFightCount } = useAdStore();

  // Elegant typing dots animation
  const dot1Opacity = useSharedValue(0.3);
  const dot2Opacity = useSharedValue(0.3);
  const dot3Opacity = useSharedValue(0.3);
  
  // Subtle glow animation
  const glowOpacity = useSharedValue(0.2);
  const glowScale = useSharedValue(1);

  // Player bars animation
  const bar1Width = useSharedValue(0);
  const bar2Width = useSharedValue(0);

  const statusMessages = [
    'Analyzing',
    'Reading the vibes',
    'Weighing both sides',
    'Calculating',
    'Almost there',
  ];

  useEffect(() => {
    // Start thinking sound
    playThinking();

    // Elegant dot animation (typing indicator style)
    dot1Opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 300 }),
        withDelay(600, withTiming(0.3, { duration: 300 }))
      ),
      -1,
      false
    );
    
    dot2Opacity.value = withDelay(200, withRepeat(
      withSequence(
        withTiming(1, { duration: 300 }),
        withDelay(600, withTiming(0.3, { duration: 300 }))
      ),
      -1,
      false
    ));
    
    dot3Opacity.value = withDelay(400, withRepeat(
      withSequence(
        withTiming(1, { duration: 300 }),
        withDelay(600, withTiming(0.3, { duration: 300 }))
      ),
      -1,
      false
    ));

    // Subtle glow pulse
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 1500, easing: Easing.ease }),
        withTiming(0.2, { duration: 1500, easing: Easing.ease })
      ),
      -1,
      true
    );

    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1500, easing: Easing.ease }),
        withTiming(1, { duration: 1500, easing: Easing.ease })
      ),
      -1,
      true
    );

    // Animate progress bars
    bar1Width.value = withRepeat(
      withSequence(
        withTiming(70, { duration: 2000, easing: Easing.ease }),
        withTiming(40, { duration: 1500, easing: Easing.ease })
      ),
      -1,
      true
    );

    bar2Width.value = withRepeat(
      withSequence(
        withTiming(50, { duration: 1800, easing: Easing.ease }),
        withTiming(75, { duration: 1700, easing: Easing.ease })
      ),
      -1,
      true
    );

    // Cycle through status messages
    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % statusMessages.length;
      setStatus(statusMessages[messageIndex]);
    }, 2500);

    // Make API call
    fetchVerdict();

    return () => {
      clearInterval(messageInterval);
      stopThinking();
    };
  }, []);

  const fetchVerdict = async () => {
    try {
      const mode = params.mode as string;
      const situation = params.situation as string;
      const player1Name = params.player1Name as string;
      const player2Name = params.player2Name as string;
      const roundsStr = params.rounds as string;
      const category = params.category as string;

      let endpoint = `${EXPO_PUBLIC_BACKEND_URL}/api/solo/judge`;
      let body: any = {
        situation,
        category: category || undefined,
      };

      if (mode === 'vs') {
        endpoint = `${EXPO_PUBLIC_BACKEND_URL}/api/vs/judge`;
        const rounds = roundsStr ? JSON.parse(roundsStr) : [];
        body = {
          player1_name: player1Name,
          player2_name: player2Name,
          situation,
          rounds,
          category: category || undefined,
        };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Failed to get verdict');
      }

      const verdict = await response.json();

      // Increment fight count for ad tracking
      incrementFightCount();

      // For VS mode, go to dramatic reveal screen
      if (mode === 'vs') {
        router.replace({
          pathname: '/vs-reveal',
          params: {
            verdict: JSON.stringify(verdict),
            mode,
            situation,
            player1Name,
            player2Name,
            category,
          },
        });
      } else {
        // For solo mode, brief pause then go to result
        setTimeout(() => {
          router.replace({
            pathname: '/result',
            params: {
              verdict: JSON.stringify(verdict),
              mode,
              situation,
              player1Name,
              player2Name,
              category,
            },
          });
        }, 800);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    }
  };

  const dot1Style = useAnimatedStyle(() => ({
    opacity: dot1Opacity.value,
  }));

  const dot2Style = useAnimatedStyle(() => ({
    opacity: dot2Opacity.value,
  }));

  const dot3Style = useAnimatedStyle(() => ({
    opacity: dot3Opacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const bar1Style = useAnimatedStyle(() => ({
    width: `${bar1Width.value}%`,
  }));

  const bar2Style = useAnimatedStyle(() => ({
    width: `${bar2Width.value}%`,
  }));

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>😵</Text>
          <Text style={styles.errorText}>Something went wrong</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
          <Text
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            ← Go Back
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Main Status Area */}
        <Animated.View entering={FadeIn.duration(500)} style={styles.mainArea}>
          {/* Elegant Glow Circle */}
          <View style={styles.glowContainer}>
            <Animated.View style={[styles.glowOuter, glowStyle]} />
            <View style={styles.glowInner}>
              <Text style={styles.judgeIcon}>⚖️</Text>
            </View>
          </View>

          {/* Status with typing dots */}
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>{status}</Text>
            <View style={styles.dotsContainer}>
              <Animated.View style={[styles.dot, dot1Style]} />
              <Animated.View style={[styles.dot, dot2Style]} />
              <Animated.View style={[styles.dot, dot3Style]} />
            </View>
          </View>
        </Animated.View>

        {/* Players Section */}
        <Animated.View 
          entering={FadeInDown.delay(300).duration(500)} 
          style={styles.playersSection}
        >
          <View style={styles.playerRow}>
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>
                {params.player1Name || 'You'}
              </Text>
            </View>
            <View style={styles.barContainer}>
              <Animated.View style={[styles.bar, styles.bar1, bar1Style]} />
            </View>
          </View>

          <View style={styles.vsContainer}>
            <View style={styles.vsLine} />
            <Text style={styles.vsText}>vs</Text>
            <View style={styles.vsLine} />
          </View>

          <View style={styles.playerRow}>
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>
                {params.player2Name || 'Them'}
              </Text>
            </View>
            <View style={styles.barContainer}>
              <Animated.View style={[styles.bar, styles.bar2, bar2Style]} />
            </View>
          </View>
        </Animated.View>

        {/* Footer hint */}
        <Animated.View 
          entering={FadeIn.delay(600).duration(500)} 
          style={styles.footerHint}
        >
          <Text style={styles.hintText}>
            The judge is considering all perspectives...
          </Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  mainArea: {
    alignItems: 'center',
    marginBottom: 60,
  },
  glowContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  glowOuter: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFD700',
  },
  glowInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2a2a2a',
  },
  judgeIcon: {
    fontSize: 40,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#fff',
    letterSpacing: 0.5,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFD700',
  },
  playersSection: {
    width: '100%',
    maxWidth: 320,
  },
  playerRow: {
    marginBottom: 8,
  },
  playerInfo: {
    marginBottom: 8,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#888',
  },
  barContainer: {
    height: 6,
    backgroundColor: '#1a1a1a',
    borderRadius: 3,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 3,
  },
  bar1: {
    backgroundColor: '#FFD700',
  },
  bar2: {
    backgroundColor: '#FF4444',
  },
  vsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    gap: 12,
  },
  vsLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#222',
  },
  vsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#444',
    textTransform: 'lowercase',
  },
  footerHint: {
    position: 'absolute',
    bottom: 60,
    left: 32,
    right: 32,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 13,
    color: '#444',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
});
