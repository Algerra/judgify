import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getHistory, StoredVerdict, clearHistory } from '../src/utils/storage';
import { getCategoryById } from '../src/utils/categories';

export default function HistoryScreen() {
  const router = useRouter();
  const [history, setHistory] = useState<StoredVerdict[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = async () => {
    const data = await getHistory();
    setHistory(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const handleClearHistory = async () => {
    await clearHistory();
    setHistory([]);
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderItem = ({ item }: { item: StoredVerdict }) => {
    const category = item.category ? getCategoryById(item.category) : null;
    
    return (
      <TouchableOpacity style={styles.historyCard} activeOpacity={0.7}>
        <View style={styles.cardHeader}>
          <View style={styles.verdictBadge}>
            <Text style={styles.verdictText}>{item.one_word_verdict}</Text>
          </View>
          {category && (
            <View style={[styles.categoryBadge, { backgroundColor: category.color + '30' }]}>
              <Text style={styles.categoryEmoji}>{category.emoji}</Text>
            </View>
          )}
          <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
        </View>
        
        <View style={styles.playersRow}>
          <Text style={[
            styles.playerName,
            item.winner === item.player1_name && styles.winnerName
          ]}>
            {item.player1_name}
          </Text>
          <Text style={styles.vsText}>vs</Text>
          <Text style={[
            styles.playerName,
            item.winner === item.player2_name && styles.winnerName
          ]}>
            {item.player2_name}
          </Text>
        </View>
        
        <View style={styles.resultRow}>
          {item.is_draw ? (
            <Text style={styles.drawText}>DRAW</Text>
          ) : (
            <Text style={styles.winnerText}>{item.winner} won</Text>
          )}
          <Text style={styles.percentText}>
            {item.player1_percentage}% - {item.player2_percentage}%
          </Text>
        </View>
        
        {item.spicy_line && (
          <Text style={styles.spicyLine} numberOfLines={2}>
            "{item.spicy_line}"
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fight History</Text>
        {history.length > 0 ? (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearHistory}
          >
            <Ionicons name="trash-outline" size={20} color="#FF4444" />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={60} color="#333" />
          <Text style={styles.emptyTitle}>No fights yet</Text>
          <Text style={styles.emptySubtitle}>Your verdict history will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFD700"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0c',
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
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  historyCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  verdictBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verdictText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0c0c0c',
    textTransform: 'uppercase',
  },
  categoryBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryEmoji: {
    fontSize: 14,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 'auto',
  },
  playersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
  },
  winnerName: {
    color: '#FFD700',
  },
  vsText: {
    fontSize: 12,
    color: '#555',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  winnerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  drawText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFC107',
  },
  percentText: {
    fontSize: 14,
    color: '#666',
  },
  spicyLine: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#888',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
});
