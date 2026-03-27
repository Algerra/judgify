import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withDelay,
  withTiming,
  FadeIn,
  SlideInUp,
} from 'react-native-reanimated';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { saveVerdict, StoredVerdict } from '../src/utils/storage';
import { playVictory, playReveal } from '../src/utils/sounds';
import { usePremiumStore } from '../src/stores/premiumStore';
import { useAdStore } from '../src/stores/adStore';
import { useStatsStore } from '../src/stores/statsStore';
import { useInterstitialAd } from '../src/utils/ads';
import { MockInterstitialAd } from '../src/components/MockInterstitialAd';
import { PremiumModal } from '../src/components/PremiumModal';

const { width } = Dimensions.get('window');

interface Verdict {
  id: string;
  mode: string;
  winner: string;
  winner_number: number | null;
  player1_name: string;
  player2_name: string;
  player1_percentage: number;
  player2_percentage: number;
  one_word_verdict: string;
  one_line_explanation: string;
  short_reasoning: string;
  spicy_line?: string;
  what_should_winner_do: string;
  what_should_loser_do: string;
  drama_level: string;
  drama_comment: string;
  is_draw: boolean;
}

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const viewShotRef = useRef<ViewShot>(null);
  const shareCardRef = useRef<View>(null);
  const [showFullResult, setShowFullResult] = useState(false);
  const [showRematchModal, setShowRematchModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showInterstitialAd, setShowInterstitialAd] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [rematchContext, setRematchContext] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  const verdict: Verdict = JSON.parse(params.verdict as string);
  const fromReveal = params.fromReveal === 'true';
  const category = params.category as string;

  const { isPremium, loadPremiumStatus } = usePremiumStore();
  const { checkShouldShowAd, markAdShown } = useAdStore();
  const { recordFight, checkAndPromptRating } = useStatsStore();
  const { isLoaded: isRealAdLoaded, showAd: showRealAd, isAvailable: isRealAdAvailable } = useInterstitialAd();

  const titleScale = useSharedValue(0);
  const percentageWidth1 = useSharedValue(0);
  const percentageWidth2 = useSharedValue(0);

  useEffect(() => {
    loadPremiumStatus();
    
    // Record fight stats (Solo mode: "You" wins if player1_percentage > 50)
    const didWin = verdict.mode === 'solo' 
      ? verdict.player1_percentage > verdict.player2_percentage 
      : verdict.winner === verdict.player1_name;
    recordFight(didWin);
    
    // Play sound effects (skip if coming from reveal screen - already played)
    if (!fromReveal) {
      playReveal();
      setTimeout(() => playVictory(), 500);
    }

    // Animate title entrance
    titleScale.value = withSequence(
      withDelay(300, withSpring(1.2)),
      withSpring(1)
    );

    // Animate percentages
    setTimeout(() => {
      percentageWidth1.value = withTiming(verdict.player1_percentage, { duration: 800 });
      percentageWidth2.value = withTiming(verdict.player2_percentage, { duration: 800 });
      setShowFullResult(true);
      
      // Show ad after result is displayed (if not premium)
      setTimeout(async () => {
        if (!isPremium && checkShouldShowAd()) {
          // Try to show real AdMob ad first (only works in production build)
          if (isRealAdAvailable && isRealAdLoaded) {
            const shown = await showRealAd();
            if (shown) {
              markAdShown();
            } else {
              // Fall back to mock ad if real ad fails
              setShowInterstitialAd(true);
            }
          } else {
            // Show mock ad in Expo Go / development
            setShowInterstitialAd(true);
          }
        }
        
        // Check if we should prompt for rating (after ad or if no ad)
        setTimeout(() => {
          checkAndPromptRating();
        }, 2000);
      }, 1500);
    }, 1500);

    // Save verdict to history
    const storedVerdict: StoredVerdict = {
      id: verdict.id,
      mode: verdict.mode,
      winner: verdict.winner,
      player1_name: verdict.player1_name,
      player2_name: verdict.player2_name,
      player1_percentage: verdict.player1_percentage,
      player2_percentage: verdict.player2_percentage,
      one_word_verdict: verdict.one_word_verdict,
      one_line_explanation: verdict.one_line_explanation,
      spicy_line: verdict.spicy_line,
      category: category,
      is_draw: verdict.is_draw,
      timestamp: new Date().toISOString(),
    };
    saveVerdict(storedVerdict);
  }, []);

  const handleAdClose = () => {
    setShowInterstitialAd(false);
    markAdShown();
  };

  const handleAdUpgrade = () => {
    setShowInterstitialAd(false);
    setShowPremiumModal(true);
  };

  const titleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: titleScale.value }],
  }));

  const percentageBar1Style = useAnimatedStyle(() => ({
    width: `${percentageWidth1.value}%`,
  }));

  const percentageBar2Style = useAnimatedStyle(() => ({
    width: `${percentageWidth2.value}%`,
  }));

  const handleShare = async () => {
    setShowShareModal(true);
  };

  const handleShareImage = async () => {
    if (isSharing) return;
    setIsSharing(true);

    try {
      if (viewShotRef.current) {
        const uri = await captureRef(viewShotRef, {
          format: 'png',
          quality: 1,
          result: 'tmpfile',
        });

        if (Platform.OS === 'web') {
          // Fallback to text share on web
          await handleShareText();
        } else {
          const isAvailable = await Sharing.isAvailableAsync();
          if (isAvailable) {
            await Sharing.shareAsync(uri, {
              mimeType: 'image/png',
              dialogTitle: 'Share your Judgify verdict!',
            });
          } else {
            await handleShareText();
          }
        }
      }
    } catch (error) {
      console.error('Error sharing image:', error);
      await handleShareText();
    } finally {
      setIsSharing(false);
      setShowShareModal(false);
    }
  };

  const handleShareText = async () => {
    try {
      const spicyPart = verdict.spicy_line ? `\n\n"${verdict.spicy_line}"` : '';
      const message = verdict.is_draw
        ? `IT'S A DRAW! \n\n"${verdict.one_word_verdict}"\n${verdict.one_line_explanation}${spicyPart}\n\n${verdict.player1_name}: ${verdict.player1_percentage}%\n${verdict.player2_name}: ${verdict.player2_percentage}%\n\nJudgify - Settle it. Who's right?`
        : `${verdict.winner.toUpperCase()} IS RIGHT!! \n\n"${verdict.one_word_verdict}"\n${verdict.one_line_explanation}${spicyPart}\n\n${verdict.player1_name}: ${verdict.player1_percentage}%\n${verdict.player2_name}: ${verdict.player2_percentage}%\n\nJudgify - Settle it. Who's right?`;

      await Share.share({
        message,
      });
      setShowShareModal(false);
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleRematch = () => {
    setShowRematchModal(true);
  };

  const handleRematchSubmit = () => {
    if (rematchContext.trim()) {
      setShowRematchModal(false);
      // Re-navigate to judging with additional context
      router.push({
        pathname: '/judging',
        params: {
          mode: params.mode,
          situation: `${params.situation}\n\nAdditional context: ${rematchContext}`,
          player1Name: verdict.player1_name,
          player2Name: verdict.player2_name,
        },
      });
      setRematchContext('');
    }
  };

  const handleNewFight = () => {
    router.replace('/');
  };

  const getDramaColor = () => {
    switch (verdict.drama_level) {
      case 'low':
        return '#4CAF50';
      case 'medium':
        return '#FFC107';
      case 'high':
        return '#FF4444';
      default:
        return '#888';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Share Card - This will be captured */}
        <ViewShot ref={viewShotRef} style={styles.shareCard}>
          {/* Announcer Line */}
          <Animated.View entering={FadeIn.delay(200)}>
            <Text style={styles.announcerLine}>After reviewing both sides...</Text>
          </Animated.View>

          {/* Main Result */}
          <Animated.View style={[styles.resultContainer, titleStyle]}>
            <Text style={styles.gloves}>"</Text>
            {verdict.is_draw ? (
              <Text style={styles.resultText}>IT'S A DRAW</Text>
            ) : (
              <>
                <Text style={styles.winnerName}>{verdict.winner.toUpperCase()}</Text>
                <Text style={styles.resultText}>IS RIGHT!!</Text>
              </>
            )}
          </Animated.View>

          {/* One Word Verdict */}
          <Animated.View
            entering={SlideInUp.delay(800)}
            style={styles.verdictBadge}
          >
            <Text style={styles.verdictText}>{verdict.one_word_verdict}</Text>
          </Animated.View>

          {/* One Line Explanation */}
          {showFullResult && (
            <Animated.View entering={FadeIn}>
              <Text style={styles.explanation}>{verdict.one_line_explanation}</Text>
            </Animated.View>
          )}

          {/* Percentage Split */}
          {showFullResult && (
            <Animated.View entering={FadeIn} style={styles.percentageSection}>
              <View style={styles.percentageRow}>
                <Text style={styles.percentageLabel}>{verdict.player1_name}</Text>
                <Text style={[styles.percentageValue, { color: '#FFD700' }]}>
                  {verdict.player1_percentage}%
                </Text>
              </View>
              <View style={styles.percentageBarContainer}>
                <Animated.View
                  style={[styles.percentageBar1, percentageBar1Style]}
                />
                <Animated.View
                  style={[styles.percentageBar2, percentageBar2Style]}
                />
              </View>
              <View style={styles.percentageRow}>
                <Text style={styles.percentageLabel}>{verdict.player2_name}</Text>
                <Text style={[styles.percentageValue, { color: '#FF4444' }]}>
                  {verdict.player2_percentage}%
                </Text>
              </View>
            </Animated.View>
          )}
        </ViewShot>

        {/* Analysis Section */}
        {showFullResult && (
          <Animated.View entering={FadeIn.delay(300)} style={styles.analysisSection}>
            {/* Drama Level */}
            <View style={[styles.dramaTag, { borderColor: getDramaColor() }]}>
              <Ionicons
                name={
                  verdict.drama_level === 'high'
                    ? 'flame'
                    : verdict.drama_level === 'medium'
                    ? 'alert-circle'
                    : 'leaf'
                }
                size={16}
                color={getDramaColor()}
              />
              <Text style={[styles.dramaText, { color: getDramaColor() }]}>
                {verdict.drama_level.toUpperCase()} DRAMA
              </Text>
            </View>
            <Text style={styles.dramaComment}>{verdict.drama_comment}</Text>

            {/* Reasoning */}
            <View style={styles.reasoningContainer}>
              <Text style={styles.sectionTitle}>The Breakdown</Text>
              <Text style={styles.reasoningText}>{verdict.short_reasoning}</Text>
            </View>

            {/* Spicy Line */}
            {verdict.spicy_line && (
              <View style={styles.spicyLineContainer}>
                <Text style={styles.spicyLine}>"{verdict.spicy_line}"</Text>
              </View>
            )}

            {/* Advice */}
            <View style={styles.adviceContainer}>
              <View style={styles.adviceCard}>
                <View style={styles.adviceHeader}>
                  <Ionicons name="trophy" size={20} color="#FFD700" />
                  <Text style={styles.adviceTitle}>
                    {verdict.is_draw ? 'For Both' : `If You're ${verdict.winner}`}
                  </Text>
                </View>
                <Text style={styles.adviceText}>{verdict.what_should_winner_do}</Text>
              </View>

              {!verdict.is_draw && (
                <View style={styles.adviceCard}>
                  <View style={styles.adviceHeader}>
                    <Ionicons name="hand-left" size={20} color="#FF4444" />
                    <Text style={styles.adviceTitle}>If You're the Other</Text>
                  </View>
                  <Text style={styles.adviceText}>{verdict.what_should_loser_do}</Text>
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* Action Buttons */}
        {showFullResult && (
          <Animated.View entering={FadeIn.delay(500)} style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleShare}
              activeOpacity={0.8}
            >
              <Ionicons name="share-social" size={20} color="#fff" />
              <Text style={styles.shareButtonText}>Share Result</Text>
            </TouchableOpacity>

            <View style={styles.secondaryButtons}>
              <TouchableOpacity
                style={styles.rematchButton}
                onPress={handleRematch}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={18} color="#FFD700" />
                <Text style={styles.rematchButtonText}>Rematch</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.newFightButton}
                onPress={handleNewFight}
                activeOpacity={0.8}
              >
                <Ionicons name="flash" size={18} color="#fff" />
                <Text style={styles.newFightButtonText}>New Fight</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Rematch Modal */}
      <Modal
        visible={showRematchModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRematchModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add More Context</Text>
            <Text style={styles.modalSubtitle}>But actually this also happened...</Text>
            
            <TextInput
              style={styles.modalInput}
              multiline
              placeholder="What else should the judge know?"
              placeholderTextColor="#555"
              value={rematchContext}
              onChangeText={setRematchContext}
              maxLength={500}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowRematchModal(false);
                  setRematchContext('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalSubmitButton,
                  !rematchContext.trim() && styles.modalSubmitDisabled,
                ]}
                onPress={handleRematchSubmit}
                disabled={!rematchContext.trim()}
              >
                <Text style={styles.modalSubmitText}>Re-judge</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Share Modal */}
      <Modal
        visible={showShareModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.shareModalOverlay}>
          <View style={styles.shareModalContent}>
            <Text style={styles.shareModalTitle}>Share Your Verdict</Text>
            
            {/* Preview Card */}
            <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
              <View style={styles.shareImageCard}>
                <View style={styles.shareCardHeader}>
                  <Text style={styles.shareCardLogo}>JUDGIFY</Text>
                </View>
                
                <View style={styles.shareCardResult}>
                  {verdict.is_draw ? (
                    <Text style={styles.shareCardWinner}>IT'S A DRAW</Text>
                  ) : (
                    <>
                      <Text style={styles.shareCardWinner}>{verdict.winner.toUpperCase()}</Text>
                      <Text style={styles.shareCardIsRight}>IS RIGHT!!</Text>
                    </>
                  )}
                </View>
                
                <View style={styles.shareCardVerdict}>
                  <Text style={styles.shareCardVerdictText}>"{verdict.one_word_verdict}"</Text>
                </View>
                
                {verdict.spicy_line && (
                  <Text style={styles.shareCardSpicy}>"{verdict.spicy_line}"</Text>
                )}
                
                <View style={styles.shareCardScores}>
                  <View style={styles.shareCardScore}>
                    <Text style={styles.shareCardScoreName}>{verdict.player1_name}</Text>
                    <Text style={[styles.shareCardScorePercent, { color: '#FFD700' }]}>
                      {verdict.player1_percentage}%
                    </Text>
                  </View>
                  <Text style={styles.shareCardVs}>vs</Text>
                  <View style={styles.shareCardScore}>
                    <Text style={styles.shareCardScoreName}>{verdict.player2_name}</Text>
                    <Text style={[styles.shareCardScorePercent, { color: '#FF4444' }]}>
                      {verdict.player2_percentage}%
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.shareCardTagline}>Settle it. Who's right?</Text>
              </View>
            </ViewShot>
            
            <View style={styles.shareModalButtons}>
              <TouchableOpacity
                style={styles.shareImageButton}
                onPress={handleShareImage}
                disabled={isSharing}
              >
                <Ionicons name="image" size={20} color="#fff" />
                <Text style={styles.shareImageButtonText}>
                  {isSharing ? 'Sharing...' : 'Share as Image'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.shareTextButton}
                onPress={handleShareText}
              >
                <Ionicons name="chatbubble" size={18} color="#FFD700" />
                <Text style={styles.shareTextButtonText}>Share as Text</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.shareCloseButton}
              onPress={() => setShowShareModal(false)}
            >
              <Text style={styles.shareCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Interstitial Ad */}
      <MockInterstitialAd
        visible={showInterstitialAd}
        onClose={handleAdClose}
        onUpgrade={handleAdUpgrade}
      />

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
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  shareCard: {
    backgroundColor: '#0c0c0c',
    paddingTop: 40,
    paddingBottom: 30,
  },
  announcerLine: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  resultContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  gloves: {
    fontSize: 40,
    color: '#FFD700',
    marginBottom: 8,
  },
  winnerName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFD700',
    textAlign: 'center',
  },
  resultText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
  },
  verdictBadge: {
    alignSelf: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FFD700',
    marginBottom: 20,
  },
  verdictText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFD700',
    textTransform: 'uppercase',
  },
  explanation: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  percentageSection: {
    marginTop: 10,
  },
  percentageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  percentageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  percentageValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  percentageBarContainer: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  percentageBar1: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  percentageBar2: {
    height: '100%',
    backgroundColor: '#FF4444',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  analysisSection: {
    marginTop: 20,
  },
  dramaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  dramaText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dramaComment: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
  },
  reasoningContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: 8,
  },
  reasoningText: {
    fontSize: 15,
    color: '#ccc',
    lineHeight: 22,
  },
  spicyLineContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#FF4444',
  },
  spicyLine: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    fontStyle: 'italic',
    lineHeight: 24,
  },
  adviceContainer: {
    gap: 12,
    marginBottom: 20,
  },
  adviceCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
  },
  adviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  adviceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  adviceText: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  },
  actionButtons: {
    marginTop: 10,
  },
  shareButton: {
    backgroundColor: '#FF4444',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  secondaryButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  rematchButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  rematchButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
  },
  newFightButton: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  newFightButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  modalInput: {
    backgroundColor: '#0c0c0c',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#333',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
  },
  modalSubmitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FFD700',
    alignItems: 'center',
  },
  modalSubmitDisabled: {
    backgroundColor: '#555',
  },
  modalSubmitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0c0c0c',
  },
  // Share Modal Styles
  shareModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  shareModalContent: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  shareModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
  },
  shareImageCard: {
    backgroundColor: '#0c0c0c',
    borderRadius: 20,
    padding: 24,
    width: 300,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  shareCardHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  shareCardLogo: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: 3,
  },
  shareCardResult: {
    alignItems: 'center',
    marginBottom: 12,
  },
  shareCardWinner: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFD700',
    textAlign: 'center',
  },
  shareCardIsRight: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
  },
  shareCardVerdict: {
    alignSelf: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  shareCardVerdictText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFD700',
    textTransform: 'uppercase',
  },
  shareCardSpicy: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  shareCardScores: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  shareCardScore: {
    alignItems: 'center',
  },
  shareCardScoreName: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  shareCardScorePercent: {
    fontSize: 20,
    fontWeight: '700',
  },
  shareCardVs: {
    fontSize: 12,
    color: '#555',
  },
  shareCardTagline: {
    fontSize: 11,
    color: '#555',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  shareModalButtons: {
    width: '100%',
    marginTop: 20,
    gap: 12,
  },
  shareImageButton: {
    backgroundColor: '#FF4444',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  shareImageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  shareTextButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  shareTextButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
  },
  shareCloseButton: {
    marginTop: 16,
    paddingVertical: 12,
  },
  shareCloseText: {
    fontSize: 14,
    color: '#888',
  },
});
