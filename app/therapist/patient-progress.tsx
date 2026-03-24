import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator
} from "react-native";
import { API_URL } from "../../constants/api";
import { useAuth } from "../../context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import { LineChart, BarChart, ProgressChart } from "react-native-chart-kit";
import { Dimensions, Alert } from "react-native";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const screenWidth = Dimensions.get("window").width;

export default function PatientProgressScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams();
  const { user: loggedInTherapist } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, [userId]);

  const fetchProgress = async () => {
    try {
      const response = await fetch(`${API_URL}/api/therapist/patient/${userId}/progress?therapistId=${loggedInTherapist?.therapistProfile}`);
      const result = await response.json();
      if (response.ok) {
        setData(result);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getWellbeingScore = (diagnosis: any) => {
    const scores = Object.values(diagnosis.results).map((r: any) => r.score);
    return scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / (scores.length * 10)) : 0;
  };

  const trendData = data?.diagnoses?.slice(0, 6).reverse().map((d: any) => ({
    date: new Date(d.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    score: getWellbeingScore(d) * 100
  })) || [];

  const TrendChart = () => (
    <Animated.View entering={FadeInUp.delay(200)} style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Wellness Trend</Text>
      <LineChart
        data={{
          labels: trendData.map((d: any) => d.date),
          datasets: [{ data: trendData.map((d: any) => d.score) }]
        }}
        width={screenWidth - 40}
        height={180}
        chartConfig={{
          backgroundColor: "#fff",
          backgroundGradientFrom: "#fff",
          backgroundGradientTo: "#fff",
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(255, 117, 151, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(53, 58, 64, ${opacity})`,
          style: { borderRadius: 16 },
          propsForDots: { r: "4", strokeWidth: "2", stroke: "#FF7597" }
        }}
        bezier
        style={{ marginVertical: 8, borderRadius: 16 }}
      />
    </Animated.View>
  );

  const ActivityTimelineItem = ({ item, index }: { item: any, index: number }) => {
    const cardColors = ['#FFB347', '#FF7597', '#F2E1D9'];
    const textColors = ['#FFF', '#FFF', '#353A40'];
    const colorIndex = index % cardColors.length;
    const bgColor = cardColors[colorIndex];
    const textColor = textColors[colorIndex];
    
    // Graceful mood display
    const showMood = item.moodBefore && item.moodBefore !== "Not set";
    
    return (
      <View style={styles.timelineRow}>
        <View style={styles.indicatorColumn}>
          <View style={[styles.verticalLine, { backgroundColor: index === 0 ? 'transparent' : '#EEE', top: index === 0 ? 25 : 0 }]} />
          <View style={[styles.timelineDot, { backgroundColor: bgColor, borderColor: '#FFF', borderWidth: 2 }]} />
        </View>
        
        <LinearGradient 
          colors={[bgColor, bgColor === '#F2E1D9' ? '#F2E1D9' : bgColor + 'CC']} 
          style={[styles.timelineCard, { elevation: bgColor === '#F2E1D9' ? 0 : 4 }]}
        >
          <View style={styles.timelineCardHeader}>
            <Text style={[styles.timelineDate, { color: textColor }]}>
              {new Date(item.timestamp || item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
            <Ionicons name="sparkles" size={14} color={textColor} style={{ opacity: 0.6 }} />
          </View>
          
          {showMood ? (
            <View style={styles.moodRow}>
              <Text style={[styles.timelineTitle, { color: textColor }]}>{item.moodBefore}</Text>
              <Ionicons name="arrow-forward" size={16} color={textColor} style={{ marginHorizontal: 8 }} />
              <Text style={[styles.timelineTitle, { color: textColor }]}>{item.moodAfter}</Text>
            </View>
          ) : (
            <Text style={[styles.timelineTitle, { color: textColor, marginBottom: 8 }]}>Self-Care Session</Text>
          )}
          
          <View style={styles.activityList}>
            <Ionicons name="checkmark-circle-outline" size={14} color={textColor} style={{ marginRight: 6, opacity: 0.8 }} />
            <Text style={[styles.timelineDesc, { color: textColor, flex: 1 }]}>
              {item.completedActivities.length > 0 ? item.completedActivities.join(', ') : 'Reflection & mindfulness'}
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const exportToPDF = async () => {
    if (!data || !data.diagnoses || data.diagnoses.length === 0) {
      Alert.alert("No Data", "There is no progress data to export.");
      return;
    }

    const patient = data.diagnoses[0].userId;
    const html = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #353A40; }
            h1 { color: #FF7597; margin-bottom: 20px; }
            .header { border-bottom: 2px solid #FF7597; padding-bottom: 20px; margin-bottom: 30px; }
            .section { margin-bottom: 30px; }
            .section-title { font-weight: bold; font-size: 18px; margin-bottom: 10px; color: #FF7597; }
            .card { background: #FAF9F6; padding: 15px; border-radius: 10px; margin-bottom: 10px; border-left: 4px solid #FF7597; }
            .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .tag { display: inline-block; background: #FFDAB9; padding: 4px 10px; border-radius: 5px; font-size: 12px; margin-right: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Clinical Progress Report</h1>
            <p><strong>Patient:</strong> ${patient?.name || 'Patient'}</p>
            <p><strong>Email:</strong> ${patient?.email || 'N/A'}</p>
            <p><strong>Report Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>

          <div class="section">
            <div class="section-title">Latest Diagnosis Analysis</div>
            <div class="card">
              <p><strong>Date:</strong> ${new Date(data.diagnoses[0].timestamp).toLocaleDateString()}</p>
              <p><strong>Detected Focus:</strong> ${data.diagnoses[0].labels.join(', ')}</p>
              ${Object.entries(data.diagnoses[0].results).map(([key, val]: [string, any]) => `
                <div class="row">
                  <span>${key}</span>
                  <span>${val.score}/10</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="section">
            <div class="section-title">Self-Care Activity Log</div>
            ${data.activities.slice(0, 10).map((a: any) => `
              <div class="card">
                <p><strong>Date:</strong> ${new Date(a.timestamp || a.createdAt).toLocaleDateString()}</p>
                <p><strong>Mood Change:</strong> ${a.moodBefore} &rarr; ${a.moodAfter}</p>
                <p><strong>Completed:</strong> ${a.completedActivities.join(', ') || 'N/A'}</p>
              </div>
            `).join('')}
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to generate PDF report.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.bgBlob} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#353A40" />
        </TouchableOpacity>
        <Text style={styles.title}>Patient Insights</Text>
        <TouchableOpacity onPress={exportToPDF} style={styles.pdfActionBtn}>
          <Ionicons name="document-text" size={24} color="#FF7597" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <Animated.View entering={FadeInUp} style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarTextLarge}>{data?.diagnoses?.[0]?.userId?.name?.charAt(0) || 'P'}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.patientName}>{data?.diagnoses?.[0]?.userId?.name || 'Patient'}</Text>
            <Text style={styles.patientEmail}>{data?.diagnoses?.[0]?.userId?.email}</Text>
          </View>
          <View style={styles.indexContainer}>
             <ProgressChart
                data={{ data: [getWellbeingScore(data?.diagnoses?.[0] || {results: {}})] }}
                width={80}
                height={80}
                strokeWidth={8}
                radius={32}
                chartConfig={{
                  backgroundColor: "transparent",
                  backgroundGradientFrom: "rgba(255,255,255,0)",
                  backgroundGradientTo: "rgba(255,255,255,0)",
                  color: (opacity = 1) => `rgba(255, 117, 151, ${opacity})`,
                }}
                hideLegend={true}
              />
              <Text style={styles.indexLabel}>Index</Text>
          </View>
        </Animated.View>

        {trendData.length > 1 && <TrendChart />}

        <Text style={styles.sectionTitle}>Diagnosis History</Text>
        {data?.diagnoses?.length > 0 ? (
          data.diagnoses.map((d: any, idx: number) => (
            <Animated.View entering={FadeInUp.delay(idx * 100)} key={d._id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardDate}>{new Date(d.timestamp).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                <View style={styles.tagContainer}>
                  {d.labels.slice(0, 2).map((l: string) => (
                    <View key={l} style={styles.tag}><Text style={styles.tagText}>{l}</Text></View>
                  ))}
                </View>
              </View>
              <View style={styles.scoreGrid}>
                {Object.entries(d.results).slice(0, 4).map(([key, val]: [string, any]) => (
                  <View key={key} style={styles.gridItem}>
                    <Text style={styles.gridLabel}>{key}</Text>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${(val.score / 10) * 100}%` }]} />
                    </View>
                  </View>
                ))}
              </View>
            </Animated.View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="analytics-outline" size={48} color="#DDD" />
            <Text style={styles.emptyText}>No diagnosis data yet.</Text>
          </View>
        )}

        <Text style={[styles.sectionTitle, { marginTop: 30 }]}>Self-Care Activity</Text>
        <View style={styles.timelineContainer}>
          {data?.activities?.length > 0 ? (
            data.activities.map((a: any, idx: number) => (
              <ActivityTimelineItem key={a._id} item={a} index={idx} />
            ))
          ) : (
            <Text style={styles.emptyText}>No activity history found.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF9F6" },
  header: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    paddingHorizontal: 20, 
    paddingTop: 10,
    paddingBottom: 15
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  pdfActionBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  title: { fontSize: 20, fontWeight: "900", color: "#353A40" },
  scrollContent: { padding: 20, paddingBottom: 60 },
  bgBlob: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 117, 151, 0.05)',
    zIndex: -1,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 30,
    padding: 20,
    marginBottom: 25,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 15,
  },
  avatarLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFDAB9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarTextLarge: { fontSize: 28, fontWeight: '900', color: '#353A40' },
  profileInfo: { flex: 1 },
  patientName: { fontSize: 20, fontWeight: '900', color: '#353A40' },
  patientEmail: { fontSize: 13, color: '#8C8381', fontWeight: '600' },
  indexContainer: { alignItems: 'center' },
  indexLabel: { fontSize: 10, fontWeight: '800', color: '#8C8381', marginTop: -15, textTransform: 'uppercase' },
  chartContainer: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 15,
    marginBottom: 25,
    elevation: 3,
  },
  chartTitle: { fontSize: 14, fontWeight: '800', color: '#353A40', marginBottom: 10, marginLeft: 5 },
  sectionTitle: { fontSize: 18, fontWeight: "900", color: "#353A40", marginBottom: 20 },
  card: { backgroundColor: "#FFF", borderRadius: 24, padding: 20, marginBottom: 15, elevation: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  cardDate: { fontSize: 14, fontWeight: "800", color: "#353A40", flex: 1 },
  tagContainer: { flexDirection: 'row', gap: 5 },
  tag: { backgroundColor: 'rgba(255, 117, 151, 0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  tagText: { fontSize: 11, fontWeight: '700', color: '#FF7597' },
  scoreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  gridItem: { width: '47%' },
  gridLabel: { fontSize: 12, fontWeight: '700', color: '#8C8381', marginBottom: 5 },
  progressBarBg: { height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#FF7597' },
  timelineContainer: { paddingLeft: 10 },
  timelineRow: { flexDirection: 'row', marginBottom: 15, minHeight: 100 },
  indicatorColumn: { width: 40, alignItems: 'center' },
  verticalLine: { position: 'absolute', width: 2, height: '100%', backgroundColor: '#F0F0F0' },
  timelineDot: { width: 14, height: 14, borderRadius: 7, marginTop: 15, zIndex: 1 },
  timelineCard: { flex: 1, borderRadius: 24, padding: 18, marginLeft: 10, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10 },
  timelineCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  timelineDate: { fontSize: 11, fontWeight: '800', opacity: 0.8 },
  moodRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  timelineTitle: { fontSize: 16, fontWeight: '900', marginVertical: 2 },
  activityList: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 5 },
  timelineDesc: { fontSize: 13, fontWeight: '600', opacity: 0.9, lineHeight: 18 },
  emptyContainer: { alignItems: 'center', padding: 40 },
  emptyText: { color: "#8C8381", fontStyle: "italic", marginTop: 10, textAlign: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF9F6' }
});
