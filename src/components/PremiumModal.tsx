import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { usePremiumStore, PREMIUM_PRICE_DISPLAY } from '../stores/premiumStore';

interface PremiumModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PremiumModal: React.FC<PremiumModalProps> = ({
  visible,
  onClose,
}) => {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const { purchasePremium, restorePurchase } = usePremiumStore();

  const handlePurchase = async () => {
    setIsPurchasing(true);
    try {
      const success = await purchasePremium();
      if (success) {
        Alert.alert(
          'Welcome to Premium!',
          'Thank you! All ads have been removed.',
          [{ text: 'Awesome!', onPress: onClose }]
        );
      } else {
        Alert.alert('Purchase Failed', 'Please try again later.');
      }
    } catch (e) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const success = await restorePurchase();
      if (success) {
        Alert.alert(
          'Purchase Restored!',
          'Your premium status has been restored.',
          [{ text: 'Great!', onPress: onClose }]
        );
      } else {
        Alert.alert('No Purchase Found', 'No previous purchase was found.');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not restore purchase.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          entering={SlideInUp.springify()}
          style={styles.container}
        >
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            disabled={isPurchasing || isRestoring}
          >
            <Ionicons name="close" size={24} color="#888" />
          </TouchableOpacity>

          {/* Premium Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="diamond" size={60} color="#FFD700" />
          </View>

          {/* Title */}
          <Text style={styles.title}>Go Premium</Text>
          <Text style={styles.subtitle}>
            Unlock the full Judgify experience
          </Text>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <View style={styles.feature}>
              <Ionicons name="close-circle" size={24} color="#FF4444" />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>No More Ads</Text>
                <Text style={styles.featureDesc}>
                  Enjoy uninterrupted verdicts
                </Text>
              </View>
            </View>

            <View style={styles.feature}>
              <Ionicons name="flash" size={24} color="#FFD700" />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Faster Experience</Text>
                <Text style={styles.featureDesc}>
                  Straight to the drama
                </Text>
              </View>
            </View>

            <View style={styles.feature}>
              <Ionicons name="heart" size={24} color="#FF4444" />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Support Development</Text>
                <Text style={styles.featureDesc}>
                  Help us build more features
                </Text>
              </View>
            </View>
          </View>

          {/* Price */}
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{PREMIUM_PRICE_DISPLAY}</Text>
            <Text style={styles.priceSubtext}>One-time purchase</Text>
          </View>

          {/* Purchase Button */}
          <TouchableOpacity
            style={styles.purchaseButton}
            onPress={handlePurchase}
            disabled={isPurchasing || isRestoring}
            activeOpacity={0.8}
          >
            {isPurchasing ? (
              <ActivityIndicator color="#0c0c0c" />
            ) : (
              <>
                <Ionicons name="diamond" size={20} color="#0c0c0c" />
                <Text style={styles.purchaseButtonText}>Upgrade Now</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Restore */}
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={isPurchasing || isRestoring}
          >
            {isRestoring ? (
              <ActivityIndicator color="#888" size="small" />
            ) : (
              <Text style={styles.restoreText}>Restore Purchase</Text>
            )}
          </TouchableOpacity>

          {/* Note */}
          <Text style={styles.note}>
            This is a mock purchase for testing purposes
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
    textAlign: 'center',
  },
  featuresContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 24,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  featureDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  priceContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  price: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFD700',
  },
  priceSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  purchaseButton: {
    backgroundColor: '#FFD700',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    width: '100%',
    marginBottom: 12,
  },
  purchaseButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0c0c0c',
  },
  restoreButton: {
    paddingVertical: 10,
  },
  restoreText: {
    fontSize: 14,
    color: '#888',
  },
  note: {
    fontSize: 10,
    color: '#444',
    marginTop: 16,
    textAlign: 'center',
  },
});
