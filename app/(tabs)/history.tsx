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

const COLORS = {
  cream: "#FAF9F6",
  pink: "#FF7597",
  navy: "#353A40",
  softPink: "#F2E1D9",
  white: "#FFFFFF",
  glass: "rgba(255, 255, 255, 0.8)",
};

const WiseIndicator = ({ index }: { index: number }) => {
  const icons = ["sparkles", "leaf", "star", "flower", "sunny"];
  const icon = icons[index % icons.length];
  const colors = ["#FAD961", "#A8E063", "#FF7597", "#74EBD5", "#FFCC33"];
  const color = colors[index % colors.length];

  return (
    <View style={[styles.iconCircle, { backgroundColor: color + "20" }]}>
      <Ionicons name={icon as any} size={24} color={color} />
    </View>
  );
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

    return (
      <Animated.View entering={FadeInUp.delay(index * 80)} layout={Layout.springify()}>
        <TouchableOpacity 
          style={styles.card} 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push(`/(tabs)/result?id=${item._id}`);
          }}
        >
          <LinearGradient
            colors={[COLORS.white, COLORS.cream]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <View style={styles.cardLeft}>
              <WiseIndicator index={index} />
              <View style={styles.textContainer}>
                <Text style={styles.dateText}>{dateStr}</Text>
                <Text style={styles.timeText}>{timeStr}</Text>
                <View style={styles.labelsContainer}>
                  {item.labels?.slice(0, 2).map((label: string, i: number) => (
                    <View key={i} style={styles.tag}>
                      <Text style={styles.tagText}>{label}</Text>
                    </View>
                  ))}
                  {item.labels?.length > 2 && (
                    <Text style={styles.moreText}>+{item.labels.length - 2} more</Text>
                  )}
                </View>
              </View>
            </View>
            <View style={styles.chevronContainer}>
              <Ionicons name="chevron-forward" size={20} color={COLORS.navy} />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#FAF9F6", "#F2E1D9"]} style={StyleSheet.absoluteFill} />
      
      <Animated.View entering={FadeInDown} style={styles.header}>
        <View>
          <Text style={styles.preTitle}>Your Journey</Text>
          <Text style={styles.title}>Result History</Text>
        </View>
      </Animated.View>

      {history.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="document-text-outline" size={80} color={COLORS.softPink} />
          </View>
          <Text style={styles.emptyTitle}>Begin your journey</Text>
          <Text style={styles.emptyText}>Start a conversation to see your growth over time.</Text>
          <TouchableOpacity style={styles.ctaButton} onPress={() => router.push('/chat')}>
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
  preTitle: { fontSize: 13, fontWeight: '700', color: COLORS.pink, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 },
  title: { fontSize: 32, fontWeight: '900', color: COLORS.navy, letterSpacing: -0.5 },
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
  listContent: { padding: 20, paddingBottom: 150 },
  card: {
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: COLORS.navy,
    shadowOpacity: 0.1,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
  },
  cardGradient: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  textContainer: { flex: 1 },
  dateText: { fontSize: 18, fontWeight: '800', color: COLORS.navy, marginBottom: 2 },
  timeText: { fontSize: 13, color: '#8C8381', fontWeight: '600', marginBottom: 8 },
  labelsContainer: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  tag: {
    backgroundColor: 'rgba(255, 117, 151, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  tagText: { fontSize: 11, color: COLORS.pink, fontWeight: '700' },
  moreText: { fontSize: 11, color: '#A0AEC0', fontWeight: '600', marginLeft: 4 },
  chevronContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F7F7F7',
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
    shadowColor: COLORS.pink,
    shadowOpacity: 0.1,
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
