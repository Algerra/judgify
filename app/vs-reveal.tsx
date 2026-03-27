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
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { playDrumroll, playReveal, playVictory } from '../src/utils/sounds';

const { width, height } = Dimensions.get('window');

export default function VSRevealScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [phase, setPhase] = useState<'versus' | 'fight' | 'reveal'>('versus');
  
  const player1Name = params.player1Name as string;
  const player2Name = params.player2Name as string;
  const verdict = params.verdict as string;

  const player1X = useSharedValue(-width);
  const player2X = useSharedValue(width);
  const vsScale = useSharedValue(0);
  const fightScale = useSharedValue(0);
  const flashOpacity = useSharedValue(0);

  useEffect(() => {
    startAnimation();
  }, []);

  const startAnimation = async () => {
    // Phase 1: Players slide in
    player1X.value = withSpring(0, { damping: 12 });
    player2X.value = withSpring(0, { damping: 12 });
    
    // VS appears
    setTimeout(() => {
      vsScale.value = withSequence(
        withSpring(1.3),
        withSpring(1)
      );
    }, 400);

    // Phase 2: FIGHT!
    setTimeout(() => {
      setPhase('fight');
      playDrumroll();
      fightScale.value = withSequence(
        withSpring(1.5),
        withSpring(1)
      );
    }, 1500);

    // Phase 3: Flash and reveal
    setTimeout(() => {
      flashOpacity.value = withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(0, { duration: 300 })
      );
      playReveal();
    }, 2500);

    // Navigate to result
    setTimeout(() => {
      playVictory();
      router.replace({
        pathname: '/result',
        params: {
          verdict,
          mode: params.mode,
          situation: params.situation,
          player1Name,
          player2Name,
          category: params.category,
          fromReveal: 'true',
        },
      });
    }, 3000);
  };

  const player1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: player1X.value }],
  }));

  const player2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: player2X.value }],
  }));

  const vsStyle = useAnimatedStyle(() => ({
    transform: [{ scale: vsScale.value }],
    opacity: vsScale.value,
  }));

  const fightStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fightScale.value }],
    opacity: fightScale.value,
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Player 1 */}
        <Animated.View style={[styles.playerContainer, styles.player1, player1Style]}>
          <View style={styles.playerCircle}>
            <Text style={styles.playerNumber}>1</Text>
          </View>
          <Text style={styles.playerName}>{player1Name}</Text>
        </Animated.View>

        {/* VS / FIGHT */}
        <View style={styles.centerContainer}>
          {phase === 'versus' && (
            <Animated.View style={[styles.vsContainer, vsStyle]}>
              <Text style={styles.vsText}>VS</Text>
            </Animated.View>
          )}
          {phase === 'fight' && (
            <Animated.View style={[styles.fightContainer, fightStyle]}>
              <Text style={styles.fightText}>FIGHT!</Text>
            </Animated.View>
          )}
        </View>

        {/* Player 2 */}
        <Animated.View style={[styles.playerContainer, styles.player2, player2Style]}>
          <View style={[styles.playerCircle, styles.player2Circle]}>
            <Text style={styles.playerNumber}>2</Text>
          </View>
          <Text style={styles.playerName}>{player2Name}</Text>
        </Animated.View>
      </View>

      {/* Flash overlay */}
      <Animated.View style={[styles.flash, flashStyle]} pointerEvents="none" />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  playerContainer: {
    alignItems: 'center',
    width: 100,
  },
  player1: {},
  player2: {},
  playerCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  player2Circle: {
    backgroundColor: '#FF4444',
  },
  playerNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0c0c0c',
  },
  playerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vsContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  vsText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFD700',
  },
  fightContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  fightText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FF4444',
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFD700',
  },
});
