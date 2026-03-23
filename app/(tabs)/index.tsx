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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { ProgressChart, BarChart } from 'react-native-chart-kit';
import { API_URL } from '@/constants/api';
import { PlusShape, BlobShape, HeartShape, StarburstShape, MoonShape } from '@/components/DashboardShapes';

export default function HomeDashboard() {
  const { width: screenWidth } = useWindowDimensions();
  const { user } = useAuth();
  const router = useRouter();

  const containerMaxWidth = 600;
  const contentWidth = Math.min(screenWidth - 40, containerMaxWidth);
  const [overallProgress, setOverallProgress] = useState(0);
  const [diagnosisHistory, setDiagnosisHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProgress = async () => {
    try {
      if (!user?.id) return;
      const res = await fetch(`${API_URL}/api/selfcare/history?userId=${user.id}`);
      const data = await res.json();
      
      if (data && data.length > 0) {
        // Calculate average progress from all sessions
        const moodScoreMap: Record<string, number> = {
          "Better": 5, "A bit": 3, "Same": 1,
          "Okay": 5, "Uneasy": 3, "Heavy": 2, "Stressed": 1, "Tired": 1
        };
        
        let total = 0;
        let count = 0;
        data.forEach((s: any) => {
          const mood = s.moodAfter || s.moodBefore;
          if (mood && moodScoreMap[mood]) {
            total += moodScoreMap[mood];
            count++;
          }
        });
        if (count > 0) setOverallProgress((total / count) / 5);
      }
    } catch (err) {
      console.error("Error fetching progress:", err);
    }
  };

  const fetchDiagnosisHistory = async () => {
    try {
      if (!user?.id) return;
      const res = await fetch(`${API_URL}/api/selfcare/diagnosis?userId=${user.id}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setDiagnosisHistory(data);
      }
    } catch (err) {
      console.error("Error fetching diagnosis history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
    fetchDiagnosisHistory();
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

        
        {/* NEW TOP SECTION: 8.8 Progress */}
        <View style={styles.newHeaderContainer}>
          <Text style={styles.topGreeting}>
            {user?.name?.split(' ')[0] || "Friend"}, how are you feeling today?
          </Text>
          <View style={styles.scoreContainer}>
            <Text style={styles.massiveScore}>{(overallProgress * 10).toFixed(1)}</Text>
            <Ionicons name="sparkles" size={24} color="#FF7597" style={styles.scoreSparkle} />
          </View>
          <Text style={styles.scoreSubtext}>your health score <Ionicons name="information-circle-outline" size={14} /></Text>
          
          <View style={styles.pillContainer}>
            <TouchableOpacity style={styles.emergencyPill} onPress={() => router.push('/chat')}>
              <Text style={styles.emergencyText}>Emergency</Text>
              <Ionicons name="call" size={14} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconPill} onPress={() => router.push('/self-care')}>
              <Ionicons name="medical" size={18} color="#555" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconPill} onPress={() => router.push('/profile')}>
              <Ionicons name="document-text-outline" size={18} color="#555" />
            </TouchableOpacity>
          </View>
        </View>

        {/* DAILY HIGHLIGHTS SCATTER SHAPES */}
        <View style={styles.highlightsHeader}>
          <View>
            <Text style={styles.sectionTitle}>Daily highlights</Text>
            <Text style={styles.actionDesc}>Keep going to complete all activities</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/self-care')}>
            <Text style={styles.showAllText}>Show all ...</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.shapesContainer}>
          <PlusShape 
            title="therapist" 
            subtitle="find help" 
            onPress={() => router.push('/therapist')}
            style={{ top: 20, left: '30%' }} 
          />
          <BlobShape 
            title="self-care" 
            subtitle="activities" 
            onPress={() => router.push('/self-care')}
            style={{ top: 10, right: -10 }} 
          />
          <HeartShape 
            title="pulse" 
            subtitle="check-in chat" 
            onPress={() => router.push('/chat')}
            style={{ top: 140, left: 10 }} 
          />
          <StarburstShape 
            title="insights" 
            subtitle="history" 
            onPress={() => router.push('/profile')}
            style={{ top: 180, right: 10 }} 
          />
          <MoonShape 
            title="mental" 
            subtitle="history" 
            onPress={() => router.push('/result')}
            style={{ top: 260, left: '20%' }} 
          />
        </View>

        {/* LATEST ANALYSIS & HISTORY SECTION */}
        <View style={styles.analysisSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Mental Insights</Text>
            <TouchableOpacity onPress={() => router.push('/result' as any)}>
              <Text style={styles.seeAllText}>See Detailed</Text>
            </TouchableOpacity>
          </View>
          
          {diagnosisHistory.length > 0 ? (
            <View style={styles.insightsContainer}>
               <BarChart
                data={{
                  labels: diagnosisHistory[diagnosisHistory.length - 1].labels,
                  datasets: [{ 
                    data: diagnosisHistory[diagnosisHistory.length - 1].labels.map((l: string) => 
                      diagnosisHistory[diagnosisHistory.length - 1].results[l]?.score || 0
                    ) 
                  }],
                }}
                width={contentWidth - 60}
                height={160}
                yAxisLabel=""
                yAxisSuffix=""
                fromZero
                chartConfig={{
                  backgroundColor: "#fff",
                  backgroundGradientFrom: "#fff",
                  backgroundGradientTo: "#fff",
                  color: (opacity = 1) => `rgba(242, 140, 100, ${opacity})`,
                  labelColor: () => "#8C8381",
                  barPercentage: 0.7,
                  decimalPlaces: 0,
                  fillShadowGradient: "#FF7597",
                  fillShadowGradientOpacity: 1,
                  useShadowColorFromDataset: false,
                }}
                style={{ marginVertical: 10, borderRadius: 16 }}
                showValuesOnTopOfBars
              />
              
              <Text style={styles.historyLabel}>Recent Check-ins</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.historyScroll}>
                {diagnosisHistory.map((item, index) => (
                  <TouchableOpacity key={item._id} style={styles.resultCard} onPress={() => router.push('/result' as any)}>
                    <View style={styles.resultHeader}>
                      <Text style={styles.resultNumber}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : `Day ${index + 1}`}
                      </Text>
                      <Ionicons name="ellipse" size={8} color={index === diagnosisHistory.length - 1 ? "#4CAF50" : "#D1D1D1"} />
                    </View>
                    <View style={styles.labelPreview}>
                      <Text style={styles.previewText} numberOfLines={1}>
                        {item.labels[0]} + {item.labels.length - 1} more
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : (
            <View style={styles.emptyResults}>
              <Ionicons name="analytics-outline" size={48} color="#D1D1D1" />
              <Text style={styles.emptyText}>No insights available yet. Take a Pulse Check to start tracking!</Text>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 25,
  },
  greeting: {
    fontSize: 16,
    color: '#8C8381',
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#353A40',
  },
  profileButton: {
    padding: 5,
  },
  progressCard: {
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    elevation: 4,
    shadowColor: '#F28C64',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  progressTextContainer: {
    flex: 1,
  },
  progressTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  progressSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: 4,
  },
  progressDetailBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  progressDetailText: {
    color: '#F28C64',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 5,
  },
  chartContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercent: {
    position: 'absolute',
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  yogaCard: {
    height: 160,
    borderRadius: 24,
    marginBottom: 30,
    backgroundColor: '#FFF',
    elevation: 3,
    shadowColor: '#F28C64',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    overflow: 'hidden',
  },
  yogaGradient: {
    flex: 1,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  yogaIconWrap: {
    position: 'absolute',
    right: -10,
    top: -10,
  },
  abstractIcon: {
    transform: [{ rotate: '15deg' }],
  },
  yogaContent: {
    flex: 1,
    zIndex: 1,
  },
  yogaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FDF2EE',
  },
  yogaBadgeText: {
    color: '#F28C64',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
  },
  yogaTitle: {
    color: '#4A3F3D',
    fontSize: 22,
    fontWeight: '800',
  },
  yogaSub: {
    color: '#8C8381',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 15,
  },
  startBtnSmall: {
    backgroundColor: '#F28C64',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  startBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  analysisSection: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seeAllText: {
    color: '#F28C64',
    fontSize: 14,
    fontWeight: '600',
  },
  insightsContainer: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  historyLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#353A40',
    marginTop: 15,
    marginBottom: 10,
  },
  labelPreview: {
    marginTop: 5,
  },
  previewText: {
    fontSize: 12,
    color: '#8C8381',
  },
  latestAnalysisCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  fullAnalysisBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#FDF2EE',
  },
  fullAnalysisText: {
    color: '#F28C64',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#353A40',
    marginBottom: 15,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#353A40',
  },
  actionDesc: {
    fontSize: 12,
    color: '#8C8381',
    marginTop: 2,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 20,
    marginTop: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(242,140,100,0.1)',
  },
  tipContent: {
    marginLeft: 15,
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F28C64',
  },
  tipText: {
    fontSize: 12,
    color: '#5C5C5C',
    marginTop: 2,
    lineHeight: 18,
  },
  historyScroll: {
    marginTop: 5,
    marginBottom: 20,
  },
  resultCard: {
    backgroundColor: '#F9F9F9',
    width: 140,
    borderRadius: 16,
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#353A40',
  },
  labelsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    height: 60,
  },
  labelBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 6,
  },
  labelBadgeText: {
    fontSize: 10,
    color: '#E65100',
    fontWeight: '600',
  },
  moreText: {
    fontSize: 10,
    color: '#8C8381',
    marginTop: 4,
  },
  viewResultBtn: {
    marginTop: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    alignItems: 'center',
  },
  viewResultText: {
    fontSize: 12,
    color: '#F28C64',
    fontWeight: '700',
  },
  emptyResults: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
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
    marginTop: 10,
    lineHeight: 20,
  },
  newHeaderContainer: { alignItems: 'center', marginTop: 30, marginBottom: 20 },
  topGreeting: { fontSize: 18, color: '#353A40', fontWeight: '600', marginBottom: 10 },
  scoreContainer: { flexDirection: 'row', alignItems: 'flex-start' },
  massiveScore: { fontSize: 90, fontWeight: '800', color: '#353A40', lineHeight: 100 },
  scoreSparkle: { marginTop: 15, marginLeft: -5 },
  scoreSubtext: { fontSize: 14, color: '#595F69', fontWeight: '500', marginBottom: 25 },
  pillContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emergencyPill: { backgroundColor: '#FF7597', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 8 },
  emergencyText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  iconPill: { backgroundColor: '#FFF', padding: 10, borderRadius: 20, elevation: 1, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3 },
  highlightsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 30, marginBottom: 10 },
  showAllText: { fontSize: 14, fontWeight: '600', color: '#595F69' },
  shapesContainer: { height: 420, width: '100%', position: 'relative', marginTop: 5 },
});
