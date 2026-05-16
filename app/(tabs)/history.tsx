import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/constants/api';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp, FadeInDown, Layout } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const CARD_THEMES = [
  { bg: "#FFECE2", text: "#8A4F2E", tag: "rgba(138, 79, 46, 0.1)", icon: "#FF8A5B", name: "sparkles" },
  { bg: "#E0F9F6", text: "#2E8A7E", tag: "rgba(46, 138, 126, 0.1)", icon: "#81E6D9", name: "leaf" },
  { bg: "#D1FAE5", text: "#065F46", tag: "rgba(6, 95, 70, 0.1)", icon: "#10B981", name: "star" },
  { bg: "#E0F2FE", text: "#075985", tag: "rgba(7, 89, 133, 0.1)", icon: "#0EA5E9", name: "flower" },
  { bg: "#FFF4D2", text: "#856404", tag: "rgba(133, 100, 4, 0.1)", icon: "#F6E05E", name: "leaf" },
];

const WiseIndicator = ({ index }: { index: number }) => {
  const theme = CARD_THEMES[index % CARD_THEMES.length];

  return (
    <View style={[styles.iconCircle, { backgroundColor: '#FFF' }]}>
      <Ionicons name={theme.name as any} size={28} color={theme.icon} />
    </View>
  );
};
  
const COLORS = {
  cream: "#FAF9F6",
  peach: "#FF8A5B",
  navy: "#353A40",
  white: "#FFFFFF",
};

export default function HistoryScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_URL}/api/selfcare/diagnosis?userId=${user.id}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setHistory(data);
      }
    } catch (err) {
      console.error("Error fetching diagnosis history:", err);
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const getRelativeDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    
    return date.toLocaleDateString(undefined, { 
      weekday: 'short', month: 'short', day: 'numeric'
    });
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => {
    const date = new Date(item.timestamp);
    const dateStr = getRelativeDate(date);
    const timeStr = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    const theme = CARD_THEMES[index % CARD_THEMES.length];

    return (
      <Animated.View entering={FadeInUp.delay(index * 100)} layout={Layout.springify()}>
        <TouchableOpacity 
          style={[styles.card, { backgroundColor: theme.bg }]} 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push(`/(tabs)/result?id=${item._id}`);
          }}
          activeOpacity={0.9}
        >
            <View style={styles.cardContent}>
              <WiseIndicator index={index} />
              <View style={styles.textContainer}>
                <View style={styles.cardHeaderRow}>
                    <View>
                        <Text style={[styles.dateText, { color: theme.text }]}>{dateStr}</Text>
                        <Text style={[styles.timeText, { color: theme.text, opacity: 0.7 }]}>{timeStr}</Text>
                    </View>
                    <View style={styles.chevronCircle}>
                        <Ionicons name="chevron-forward" size={18} color={theme.text} />
                    </View>
                </View>
                
                <View style={styles.labelsContainer}>
                  {item.labels?.slice(0, 2).map((label: string, i: number) => (
                    <View key={i} style={[styles.tag, { backgroundColor: theme.tag }]}>
                      <Text style={[styles.tagText, { color: theme.text }]}>{label}</Text>
                    </View>
                  ))}
                  {item.labels?.length > 2 && (
                    <Text style={[styles.moreText, { color: theme.text, opacity: 0.6 }]}>+{item.labels.length - 2} more</Text>
                  )}
                </View>
              </View>
            </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#FAF9F6", "#F2E1D9"]} style={StyleSheet.absoluteFill} />
      
      <Animated.View entering={FadeInDown} style={styles.header}>
        <View>
          <Text style={[styles.preTitle, { color: COLORS.peach }]}>Your Journey</Text>
          <Text style={styles.title}>Result History</Text>
        </View>
      </Animated.View>

      {history.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="document-text-outline" size={80} color="#FFD1DC" />
          </View>
          <Text style={styles.emptyTitle}>Begin your journey</Text>
          <Text style={styles.emptyText}>Start a conversation to see your growth over time.</Text>
          <TouchableOpacity style={[styles.ctaButton, { backgroundColor: COLORS.peach }]} onPress={() => router.push('/chat')}>
            <Text style={styles.ctaText}>Start Analysis</Text>
            <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 25, 
    paddingTop: 30,
    paddingBottom: 20,
  },
  preTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4, opacity: 0.8 },
  title: { fontSize: 32, fontWeight: '900', color: "#4A4A4A", letterSpacing: -0.5 },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  listContent: { paddingHorizontal: 20, paddingBottom: 150 },
  card: {
    marginBottom: 16,
    borderRadius: 32,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  cardContent: {
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 10,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  textContainer: { flex: 1 },
  dateText: { fontSize: 20, fontWeight: '900', marginBottom: 2 },
  timeText: { fontSize: 14, fontWeight: '700', marginBottom: 5 },
  labelsContainer: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 5 },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  tagText: { fontSize: 12, fontWeight: '800' },
  moreText: { fontSize: 12, fontWeight: '700', marginLeft: 4 },
  chevronCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: COLORS.navy,
    shadowOpacity: 0.05,
    shadowRadius: 30,
  },
  emptyTitle: { fontSize: 24, fontWeight: '800', color: COLORS.navy, marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#8C8381', textAlign: 'center', lineHeight: 22, paddingHorizontal: 20, marginBottom: 30 },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.navy,
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 20,
    gap: 10,
  },
  ctaText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
});
