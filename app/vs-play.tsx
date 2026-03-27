import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';

interface Round {
  player_number: number;
  text: string;
}

export default function VSPlayScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const player1Name = params.player1Name as string;
  const player2Name = params.player2Name as string;
  const totalRounds = parseInt(params.totalRounds as string, 10);
  const isAnonymous = params.isAnonymous === 'true';

  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [currentRound, setCurrentRound] = useState(1);
  const [situation, setSituation] = useState('');
  const [player2Situation, setPlayer2Situation] = useState(''); // For anonymous mode
  const [rounds, setRounds] = useState<Round[]>([]);
  const [inputText, setInputText] = useState('');
  const [showPassPhone, setShowPassPhone] = useState(false);
  const [isFirstTurn, setIsFirstTurn] = useState(true);
  const [player2FirstTurn, setPlayer2FirstTurn] = useState(true); // For anonymous mode

  const scaleValue = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  const currentPlayerName = currentPlayer === 1 ? player1Name : player2Name;
  const nextPlayerName = currentPlayer === 1 ? player2Name : player1Name;

  const handleSubmitTurn = () => {
    Keyboard.dismiss();

    if (isAnonymous) {
      // Anonymous mode - both write their version first
      if (isFirstTurn && currentPlayer === 1) {
        setSituation(inputText.trim());
        setIsFirstTurn(false);
      } else if (player2FirstTurn && currentPlayer === 2) {
        setPlayer2Situation(inputText.trim());
        setPlayer2FirstTurn(false);
      } else {
        setRounds([...rounds, { player_number: currentPlayer, text: inputText.trim() }]);
      }
    } else {
      // Normal mode
      if (isFirstTurn) {
        setSituation(inputText.trim());
        setIsFirstTurn(false);
      } else {
        setRounds([...rounds, { player_number: currentPlayer, text: inputText.trim() }]);
      }
    }

    setInputText('');

    // Check if game is over (different logic for anonymous mode)
    if (isAnonymous) {
      // Anonymous mode: P1 writes, P2 writes their version, then alternating rounds
      const totalTurns = rounds.length + 1;
      const expectedTurns = totalRounds * 2;
      
      if (!player2FirstTurn && totalTurns >= expectedTurns) {
        handleGameComplete();
        return;
      }
    } else {
      // Normal mode
      const totalTurns = isFirstTurn ? 0 : rounds.length + 1;
      const expectedTurns = totalRounds * 2;

      if (!isFirstTurn && totalTurns >= expectedTurns) {
        handleGameComplete();
        return;
      }
    }

    // Show pass phone screen
    scaleValue.value = withSequence(
      withSpring(1.1),
      withSpring(1)
    );
    setShowPassPhone(true);
  };

  const handleGameComplete = () => {
    const allRounds = isAnonymous
      ? [...rounds, { player_number: currentPlayer, text: inputText.trim() }]
      : (isFirstTurn ? [] : [...rounds, { player_number: currentPlayer, text: inputText.trim() }]);
    
    // For anonymous mode, combine both situations
    const combinedSituation = isAnonymous
      ? `${player1Name}'s version: ${situation}\n\n${player2Name}'s version: ${player2Situation}`
      : (situation || inputText.trim());

    router.push({
      pathname: '/judging',
      params: {
        mode: 'vs',
        situation: combinedSituation,
        player1Name,
        player2Name,
        rounds: JSON.stringify(allRounds),
      },
    });
  };

  const handlePassPhoneContinue = () => {
    setShowPassPhone(false);
    
    if (isAnonymous) {
      // Anonymous mode: alternate after both have written their initial takes
      if (isFirstTurn) {
        setIsFirstTurn(false);
        setCurrentPlayer(2);
      } else if (player2FirstTurn) {
        setPlayer2FirstTurn(false);
        setCurrentPlayer(1);
        setCurrentRound(1);
      } else {
        setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
        if (currentPlayer === 2) {
          setCurrentRound(currentRound + 1);
        }
      }
    } else {
      // Normal mode
      if (!isFirstTurn) {
        setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
        if (currentPlayer === 2) {
          setCurrentRound(currentRound + 1);
        }
      } else {
        setCurrentPlayer(2);
      }
    }
  };

  // Determine what context to show
  const shouldShowContext = () => {
    if (isAnonymous) {
      // In anonymous mode, don't show opponent's initial take
      // Only show after both have written their initial versions
      return !isFirstTurn && !player2FirstTurn;
    }
    return !isFirstTurn && situation;
  };

  const getContextText = () => {
    if (isAnonymous && !player2FirstTurn) {
      // Show own version only after initial round
      return currentPlayer === 1 ? situation : player2Situation;
    }
    return situation;
  };

  if (showPassPhone) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.passPhoneContainer}>
          <Animated.View style={[styles.passPhoneContent, animatedStyle]}>
            <Ionicons name="phone-portrait-outline" size={80} color="#FFD700" />
            <Text style={styles.passPhoneTitle}>Pass the phone to</Text>
            <Text style={styles.passPhoneName}>{nextPlayerName}</Text>
            <Text style={styles.passPhoneSubtitle}>Don't peek!</Text>
          </Animated.View>

          <TouchableOpacity
            style={styles.readyButton}
            onPress={handlePassPhoneContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.readyButtonText}>I'm {nextPlayerName} - Ready!</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
            <View style={styles.roundIndicator}>
              <Text style={styles.roundText}>
                {isFirstTurn ? 'Start' : `Round ${currentRound}/${totalRounds}`}
              </Text>
            </View>
          </View>

          {/* Player Indicator */}
          <View style={styles.playerIndicator}>
            <View
              style={[
                styles.playerBadge,
                currentPlayer === 2 && styles.player2Badge,
              ]}
            >
              <Text style={styles.playerBadgeText}>{currentPlayer}</Text>
            </View>
            <Text style={styles.playerName}>{currentPlayerName}'s Turn</Text>
          </View>

          {/* Instruction */}
          <View style={styles.instructionContainer}>
            <Text style={styles.instruction}>
              {isFirstTurn
                ? 'Describe the situation'
                : currentPlayer === 1
                ? 'Defend your position'
                : 'Your response'}
            </Text>
            <Text style={styles.subInstruction}>
              {isFirstTurn
                ? `${player2Name} will respond after you`
                : `Make your case, ${currentPlayerName}!`}
            </Text>
          </View>

          {/* Previous Context - only show when appropriate */}
          {shouldShowContext() && (
            <View style={styles.contextContainer}>
              <Text style={styles.contextLabel}>
                {isAnonymous ? 'Your Version:' : 'The Situation:'}
              </Text>
              <Text style={styles.contextText} numberOfLines={3}>
                {getContextText()}
              </Text>
            </View>
          )}

          {/* Anonymous Mode Badge */}
          {isAnonymous && (isFirstTurn || player2FirstTurn) && (
            <View style={styles.anonymousBadge}>
              <Ionicons name="eye-off" size={16} color="#FFD700" />
              <Text style={styles.anonymousBadgeText}>
                Write your version - they can't see it!
              </Text>
            </View>
          )}

          {/* Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              multiline
              placeholder={
                isAnonymous && (isFirstTurn || player2FirstTurn)
                  ? 'Tell your side of the story...'
                  : (isFirstTurn ? 'What happened...' : 'Your argument...')
              }
              placeholderTextColor="#555"
              value={inputText}
              onChangeText={setInputText}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{inputText.length}/500</Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              !inputText.trim() && styles.submitButtonDisabled,
              currentPlayer === 2 && styles.submitButtonPlayer2,
            ]}
            onPress={handleSubmitTurn}
            disabled={!inputText.trim()}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.submitButtonText,
                currentPlayer === 2 && styles.submitButtonTextPlayer2,
              ]}
            >
              {isFirstTurn || rounds.length + 1 >= totalRounds * 2
                ? 'Submit'
                : 'Submit & Pass'}
            </Text>
            <Ionicons
              name="arrow-forward"
              size={20}
              color={currentPlayer === 1 ? '#0c0c0c' : '#fff'}
            />
          </TouchableOpacity>
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
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  roundIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  roundText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  playerIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  playerBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  player2Badge: {
    backgroundColor: '#FF4444',
  },
  playerBadgeText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0c0c0c',
  },
  playerName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  instructionContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  instruction: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  subInstruction: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  contextContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#FFD700',
  },
  contextLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
    marginBottom: 4,
  },
  contextText: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
  inputContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    padding: 16,
    marginBottom: 20,
  },
  textInput: {
    fontSize: 16,
    color: '#fff',
    minHeight: 150,
    maxHeight: 200,
  },
  charCount: {
    fontSize: 12,
    color: '#555',
    textAlign: 'right',
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  submitButtonPlayer2: {
    backgroundColor: '#FF4444',
  },
  submitButtonDisabled: {
    backgroundColor: '#555',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0c0c0c',
  },
  submitButtonTextPlayer2: {
    color: '#fff',
  },
  passPhoneContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  passPhoneContent: {
    alignItems: 'center',
    marginBottom: 60,
  },
  passPhoneTitle: {
    fontSize: 20,
    color: '#888',
    marginTop: 24,
  },
  passPhoneName: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8,
  },
  passPhoneSubtitle: {
    fontSize: 16,
    color: '#FF4444',
    marginTop: 16,
    fontStyle: 'italic',
  },
  readyButton: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  readyButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0c0c0c',
  },
  anonymousBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#332200',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 16,
    alignSelf: 'center',
  },
  anonymousBadgeText: {
    fontSize: 13,
    color: '#FFD700',
    fontWeight: '500',
  },
});
