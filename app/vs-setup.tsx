import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { playTap } from '../src/utils/sounds';

export default function VSSetupScreen() {
  const router = useRouter();
  const [player1Name, setPlayer1Name] = useState('');
  const [player2Name, setPlayer2Name] = useState('');
  const [rounds, setRounds] = useState(3);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const handleStartBattle = () => {
    if (!player1Name.trim() || !player2Name.trim()) return;
    playTap();

    router.push({
      pathname: '/vs-play',
      params: {
        player1Name: player1Name.trim(),
        player2Name: player2Name.trim(),
        totalRounds: rounds.toString(),
        isAnonymous: isAnonymous ? 'true' : 'false',
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>VS Mode</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.vsIcon}>
              <Ionicons name="people" size={50} color="#FF4444" />
            </View>
            <Text style={styles.title}>Enter the fighters!</Text>

            {/* Player 1 */}
            <View style={styles.playerCard}>
              <View style={styles.playerBadge}>
                <Text style={styles.playerNumber}>1</Text>
              </View>
              <TextInput
                style={styles.nameInput}
                placeholder="Player 1 name"
                placeholderTextColor="#555"
                value={player1Name}
                onChangeText={setPlayer1Name}
                maxLength={20}
              />
            </View>

            {/* VS */}
            <View style={styles.vsContainer}>
              <View style={styles.vsLine} />
              <Text style={styles.vsText}>VS</Text>
              <View style={styles.vsLine} />
            </View>

            {/* Player 2 */}
            <View style={styles.playerCard}>
              <View style={[styles.playerBadge, styles.player2Badge]}>
                <Text style={styles.playerNumber}>2</Text>
              </View>
              <TextInput
                style={styles.nameInput}
                placeholder="Player 2 name"
                placeholderTextColor="#555"
                value={player2Name}
                onChangeText={setPlayer2Name}
                maxLength={20}
              />
            </View>

            {/* Rounds Selection */}
            <View style={styles.roundsSection}>
              <Text style={styles.roundsLabel}>Number of Rounds</Text>
              <View style={styles.roundsSelector}>
                <TouchableOpacity
                  style={styles.roundButton}
                  onPress={() => setRounds(Math.max(1, rounds - 1))}
                >
                  <Ionicons name="remove" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.roundsDisplay}>
                  <Text style={styles.roundsNumber}>{rounds}</Text>
                </View>
                <TouchableOpacity
                  style={styles.roundButton}
                  onPress={() => setRounds(Math.min(20, rounds + 1))}
                >
                  <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <Text style={styles.roundsHint}>
                Each player gets {rounds} turn{rounds > 1 ? 's' : ''} to argue
              </Text>
            </View>

            {/* Anonymous Mode Toggle */}
            <View style={styles.anonymousSection}>
              <View style={styles.anonymousInfo}>
                <Ionicons name="eye-off" size={24} color="#888" />
                <View style={styles.anonymousText}>
                  <Text style={styles.anonymousTitle}>Anonymous Mode</Text>
                  <Text style={styles.anonymousDesc}>
                    Both write their side without seeing each other
                  </Text>
                </View>
              </View>
              <Switch
                value={isAnonymous}
                onValueChange={setIsAnonymous}
                trackColor={{ false: '#333', true: '#FFD700' }}
                thumbColor={isAnonymous ? '#fff' : '#888'}
              />
            </View>

            {/* Start Button */}
            <TouchableOpacity
              style={[
                styles.startButton,
                (!player1Name.trim() || !player2Name.trim()) && styles.startButtonDisabled,
              ]}
              onPress={handleStartBattle}
              disabled={!player1Name.trim() || !player2Name.trim()}
              activeOpacity={0.8}
            >
              <Text style={styles.startButtonText}>Start Battle</Text>
              <Ionicons name="flash" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  vsIcon: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#331111',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  playerBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  player2Badge: {
    backgroundColor: '#FF4444',
  },
  playerNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0c0c0c',
  },
  nameInput: {
    flex: 1,
    fontSize: 18,
    color: '#fff',
  },
  vsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  vsLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  vsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF4444',
    marginHorizontal: 16,
  },
  roundsSection: {
    marginTop: 30,
    alignItems: 'center',
  },
  roundsLabel: {
    fontSize: 16,
    color: '#888',
    marginBottom: 16,
  },
  roundsSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  roundButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roundsDisplay: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roundsNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFD700',
  },
  roundsHint: {
    fontSize: 12,
    color: '#555',
    marginTop: 12,
  },
  anonymousSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  anonymousInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  anonymousText: {
    flex: 1,
  },
  anonymousTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  anonymousDesc: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  startButton: {
    backgroundColor: '#FF4444',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
  },
  startButtonDisabled: {
    backgroundColor: '#555',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
});
