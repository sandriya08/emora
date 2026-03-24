import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Image,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { ProgressChart, BarChart, LineChart } from 'react-native-chart-kit';
import { API_URL } from '@/constants/api';
import { PlusShape, BlobShape, HeartShape, StarburstShape, MoonShape } from '@/components/DashboardShapes';
import * as Haptics from 'expo-haptics';
import Animated, { 
  FadeInUp, 
  FadeInDown, 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  Easing 
} from 'react-native-reanimated';

const handleHapticPress = (router: any, path: string) => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  router.push(path);
};

const handleHapticReplace = (router: any, path: string) => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  router.replace(path);
};

const SkeletonPulse = ({ style }: { style?: any }) => {
  const opacity = useSharedValue(0.3);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.6, { duration: 800 }), -1, true);
  }, []);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.skeleton, animatedStyle, style]} />;
};

export default function HomeDashboard() {
  const { width: screenWidth } = useWindowDimensions();
  const { user } = useAuth();
  const router = useRouter();

  const containerMaxWidth = 600;
  const contentWidth = Math.min(screenWidth - 40, containerMaxWidth);
  const [overallProgress, setOverallProgress] = useState(0);
  const [diagnosisHistory, setDiagnosisHistory] = useState<any[]>([]);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!user?.id) return;
      
      const [progressRes, diagnosisRes, chatRes] = await Promise.all([
        fetch(`${API_URL}/api/selfcare/history?userId=${user.id}`),
        fetch(`${API_URL}/api/selfcare/diagnosis?userId=${user.id}`),
        fetch(`${API_URL}/api/selfcare/chat-history?userId=${user.id}`)
      ]);

      const progressData = await progressRes.json();
      const diagnosisData = await diagnosisRes.json();
      const chatData = await chatRes.json();

      if (progressData && progressData.length > 0) {
        const moodScoreMap: Record<string, number> = {
          "Happy": 5, "Okay": 4, "Bored": 3, "Sleepy": 2, "Uneasy": 2, "Stressed": 1, "Angry": 1, "Heavy": 1, "Tired": 1,
          "Better": 5, "A bit": 3, "Same": 1
        };

        // 1. Calculate weighted average (70% latest session, 30% historical)
        // This ensures the score responds quickly to new activity
        const sessions = progressData; // progressData is sorted by timestamp desc
        
        const getSessionScore = (s: any) => {
          const mood = s.moodAfter || s.moodBefore;
          const completionRate = s.totalActivities > 0 ? (s.completedActivities?.length || 0) / s.totalActivities : 0;
          let moodVal = (mood && moodScoreMap[mood]) ? moodScoreMap[mood] / 5 : 0.5;
          return (moodVal * 0.5) + (completionRate * 0.5);
        };

        const latestScore = getSessionScore(sessions[0]);
        
        if (sessions.length === 1) {
          setOverallProgress(latestScore);
        } else {
          // Average of the rest for baseline
          let historyTotal = 0;
          for (let i = 1; i < sessions.length; i++) {
            historyTotal += getSessionScore(sessions[i]);
          }
          const historyAvg = historyTotal / (sessions.length - 1);
          
          // Weighted: 70% current, 30% past
          setOverallProgress((latestScore * 0.7) + (historyAvg * 0.3));
        }
      }
      if (Array.isArray(diagnosisData)) setDiagnosisHistory(diagnosisData);
      if (Array.isArray(chatData)) setChatHistory(chatData);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      // Artifical delay for premium feel
      setTimeout(() => setLoading(false), 800);
    }
  };

  // 2. Process historical diagnosis trends
  const diagnosisTrendData = React.useMemo(() => {
    if (!diagnosisHistory || diagnosisHistory.length === 0) return null;

    // We want to show progress over time. diagnosisHistory is newest first.
    const chronHistory = [...diagnosisHistory].reverse();
    
    // Labels: Date of analysis
    const labels = chronHistory.map(d => {
      const date = new Date(d.timestamp);
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    });

    // Data: Average inverse distress (Wellbeing)
    const dataset = chronHistory.map(d => {
      const scores: any[] = Object.values(d.results || {});
      if (scores.length === 0) return 5; 
      const avgDistress = scores.reduce((a, b) => a + (b.score || 0), 0) / scores.length;
      return Math.max(0.1, 10 - avgDistress);
    });

    return {
      labels: labels.length > 5 ? labels.slice(-5) : labels,
      datasets: [{ data: dataset.length > 5 ? dataset.slice(-5) : dataset }]
    };
  }, [diagnosisHistory]);

  useEffect(() => {
    fetchData();
  }, [user]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAF9F6' }}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[
          styles.scrollContent, 
          { maxWidth: containerMaxWidth, alignSelf: 'center', width: '100%' }
        ]}
      >
        
        {/* PREMIUM HEADER SECTION */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.newHeaderContainer}>
          <Text style={styles.topGreeting}>
            {user?.name?.split(' ')[0] || "Friend"}, how are you?
          </Text>
          <View style={[styles.scoreOuterCircle, loading && { borderColor: '#F5F5F5' }]}>
             {loading ? (
               <SkeletonPulse style={{ width: 100, height: 60, borderRadius: 10 }} />
             ) : (
               <>
                 <View style={styles.scoreContainer}>
                    <Text style={styles.massiveScore}>{(overallProgress * 10).toFixed(1)}</Text>
                    <Ionicons name="sparkles" size={24} color="#FAD961" style={styles.scoreSparkle} />
                 </View>
                 <Text style={styles.scoreSubtext}>wellbeing score</Text>
               </>
             )}
          </View>
          
          <View style={styles.pillContainer}>
            <TouchableOpacity style={styles.emergencyPill} onPress={() => handleHapticPress(router, '/chat')}>
              <Text style={styles.emergencyText}>Support</Text>
              <Ionicons name="heart" size={16} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconPill} onPress={() => handleHapticPress(router, '/self-care')}>
              <Ionicons name="flower-outline" size={20} color="#555" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconPill} onPress={() => handleHapticPress(router, '/profile')}>
              <Ionicons name="settings-outline" size={20} color="#555" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* DAILY HIGHLIGHTS SCATTER SHAPES */}
        <Animated.View entering={FadeInUp.delay(400)} style={styles.highlightsHeader}>
          <View>
            <Text style={styles.sectionTitle}>Daily Explorations</Text>
            <Text style={styles.actionDesc}>Floating shapes represent your paths</Text>
          </View>
          <TouchableOpacity onPress={() => handleHapticPress(router, '/self-care')}>
            <Text style={styles.showAllText}>View All</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.shapesContainer}>
          <PlusShape 
            title="saved" 
            subtitle="professionals" 
            onPress={() => router.push('/saved')}
            style={{ top: 20, left: '30%' }} 
          />
          <BlobShape 
            title="self-care" 
            subtitle="daily habits" 
            onPress={() => router.push('/self-care')}
            style={{ top: 10, right: -10 }} 
          />
          <HeartShape 
            title="pulse" 
            subtitle="check-in" 
            onPress={() => router.push('/chat')}
            style={{ top: 140, left: 10 }} 
          />
          <StarburstShape 
            title="result" 
            subtitle="history" 
            onPress={() => router.push('/history')}
            style={{ top: 180, right: 10 }} 
          />
          <MoonShape 
            title="insights" 
            subtitle="learn more" 
            onPress={() => router.replace('/(tabs)/result')}
            style={{ top: 260, left: '20%' }} 
          />
        </View>

        {/* LATEST ANALYSIS & HISTORY SECTION */}
        <Animated.View entering={FadeInUp.delay(600)} style={styles.analysisSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Result Journey</Text>
            <TouchableOpacity onPress={() => handleHapticReplace(router, '/(tabs)/chat')}>
              <Text style={styles.seeAllText}>New Analysis</Text>
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={[styles.insightsContainer, { height: 220, justifyContent: 'center', alignItems: 'center' }]}>
               <SkeletonPulse style={{ width: '100%', height: '100%', borderRadius: 24 }} />
            </View>
          ) : chatHistory.length > 0 ? (
            <View style={styles.insightsContainer}>
              <Text style={styles.historyLabel}>Wellbeing Journey (Over Time)</Text>
              {diagnosisTrendData && (
                <View style={{ marginBottom: 20 }}>
                  <LineChart
                    data={diagnosisTrendData}
                    width={screenWidth - 80}
                    height={180}
                    yAxisLabel=""
                    yAxisSuffix=""
                    chartConfig={{
                      backgroundGradientFrom: "#fff",
                      backgroundGradientTo: "#FAF9F6",
                      color: (opacity = 1) => `rgba(79, 172, 254, ${opacity})`, 
                      labelColor: (opacity = 1) => `rgba(74, 74, 74, ${opacity})`,
                      propsForDots: { r: "4", strokeWidth: "2", stroke: "#4FACFE" },
                      decimalPlaces: 1,
                    }}
                    bezier
                    style={{ borderRadius: 16 }}
                  />
                </View>
              )}
              <Text style={styles.historyLabel}>Recent Result History</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.historyScroll}>
                {chatHistory.map((item, index) => {
                  const date = new Date(item.createdAt);
                  const today = new Date();
                  const diffTime = Math.abs(today.getTime() - date.getTime());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  
                  let dateLabel = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                  if (diffDays === 1) dateLabel = "Today";
                  else if (diffDays === 2) dateLabel = "Yesterday";
                  else if (diffDays <= 7) dateLabel = `${diffDays-1}d ago`;

                  return (
                    <TouchableOpacity key={item._id} style={styles.resultCard} onPress={() => router.push(`/(tabs)/result?id=${item.diagnosisId?._id}`)}>
                      <View style={styles.resultHeader}>
                        <Text style={styles.resultNumber}>{dateLabel}</Text>
                        <Ionicons name="analytics-outline" size={14} color="#4FACFE" />
                      </View>
                      <View style={styles.labelPreview}>
                        <Text style={styles.previewText} numberOfLines={2}>
                          {item.diagnosisId?.labels ? item.diagnosisId.labels.join(", ") : "Check-in complete"}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ) : (
            <View style={styles.emptyResults}>
              <Ionicons name="chatbubbles-outline" size={48} color="#D1D1D1" />
              <Text style={styles.emptyText}>No chat history yet. Start a conversation to see your journey!</Text>
            </View>
          )}
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingBottom: 110,
  },
  skeleton: {
    backgroundColor: '#E1E9EE',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#353A40',
    marginBottom: 4,
  },
  actionDesc: {
    fontSize: 13,
    color: '#8C8381',
    fontWeight: '500',
  },
  showAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4FACFE',
  },
  analysisSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seeAllText: {
    color: '#4FACFE',
    fontSize: 14,
    fontWeight: '700',
  },
  insightsContainer: {
    backgroundColor: '#FFF',
    borderRadius: 32,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
  },
  historyLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#353A40',
    marginTop: 20,
    marginBottom: 12,
  },
  historyScroll: {
    marginTop: 5,
  },
  resultCard: {
    backgroundColor: '#FAF9F6',
    width: 130,
    borderRadius: 20,
    padding: 15,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#353A40',
  },
  labelPreview: {
    marginTop: 4,
  },
  previewText: {
    fontSize: 12,
    color: '#8C8381',
    fontWeight: '600',
  },
  emptyResults: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#D1D1D1',
  },
  emptyText: {
    fontSize: 14,
    color: '#8C8381',
    textAlign: 'center',
    marginTop: 15,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  newHeaderContainer: { alignItems: 'center', marginTop: 20, marginBottom: 30 },
  topGreeting: { fontSize: 18, color: '#353A40', fontWeight: '700', marginBottom: 20 },
  scoreOuterCircle: {
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: '#FFF',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 10,
      borderColor: '#F0F7FF',
      shadowColor: '#4FACFE',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 5,
      marginBottom: 25,
      overflow: 'hidden',
  },
  scoreContainer: { flexDirection: 'row', alignItems: 'flex-start' },
  massiveScore: { fontSize: 72, fontWeight: '900', color: '#353A40', lineHeight: 80 },
  scoreSparkle: { marginTop: 10, marginLeft: -2 },
  scoreSubtext: { fontSize: 13, color: '#353A40', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, opacity: 0.6 },
  pillContainer: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  emergencyPill: { backgroundColor: '#FFDAB9', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: '#FFDAB9', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  emergencyText: { color: '#353A40', fontWeight: '800', fontSize: 14 },
  iconPill: { backgroundColor: '#FFF', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  highlightsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10, marginBottom: 20 },
  shapesContainer: { height: 420, width: '100%', position: 'relative' },
});
