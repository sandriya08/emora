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
import Animated, { FadeInUp, FadeInDown, FadeInRight } from "react-native-reanimated";
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
    if (!diagnosis || !diagnosis.results) return 0;
    const scores = Object.values(diagnosis.results).map((r: any) => r.score || 0);
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
          color: (opacity = 1) => `rgba(250, 215, 160, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(53, 58, 64, ${opacity})`,
          style: { borderRadius: 16 },
          propsForDots: { r: "4", strokeWidth: "2", stroke: "#FAD7A0" },
          verticalLabelRotation: 30,
        }}
        bezier
        style={{ marginVertical: 8, borderRadius: 16 }}
      />
    </Animated.View>
  );

  const timelineData = [
    ...(data?.activities || []).map((a: any) => ({ ...a, type: 'activity' })),
    ...(data?.diagnoses || []).map((d: any) => ({ ...d, type: 'diagnosis' }))
  ].sort((a, b) => {
    const dateA = new Date(a.timestamp || a.createdAt).getTime();
    const dateB = new Date(b.timestamp || b.createdAt).getTime();
    return dateB - dateA;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High': return '#EF4444';
      case 'Moderate': return '#F59E0B';
      default: return '#10B981';
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'High': return '#FEE2E2';
      case 'Moderate': return '#FEF3C7';
      default: return '#D1FAE5';
    }
  };

  const TimelineItem = ({ item, index }: { item: any, index: number }) => {
    const isDiagnosis = item.type === 'diagnosis';
    
    // Background & Text logic
    const bgColor = isDiagnosis ? '#353A40' : (index % 2 === 0 ? '#FAD7A0' : '#FFF');
    const textColor = isDiagnosis || (index % 2 === 0) ? '#FFF' : '#353A40';
    
    return (
      <View style={styles.timelineRow}>
        <View style={styles.indicatorColumn}>
          <View style={[styles.verticalLine, { backgroundColor: '#EEE', top: index === 0 ? 25 : 0 }]} />
          <View style={[styles.timelineDot, { backgroundColor: isDiagnosis ? '#353A40' : '#FAD7A0', borderColor: '#FFF', borderWidth: 2 }]} />
        </View>
        
        <Animated.View entering={FadeInRight.delay(index * 100)} style={{ flex: 1 }}>
          <LinearGradient 
            colors={[bgColor, bgColor]} 
            style={[styles.timelineCard, { elevation: isDiagnosis ? 8 : 2, borderBottomWidth: isDiagnosis ? 4 : 0, borderBottomColor: '#FAD7A0' }]}
          >
            <View style={styles.timelineCardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name={isDiagnosis ? "analytics" : "sparkles"} size={14} color={textColor} />
                <Text style={[styles.timelineType, { color: textColor }]}>
                  {isDiagnosis ? 'CLINICAL ANALYSIS' : 'SELF-CARE SESSION'}
                </Text>
              </View>
              <Text style={[styles.timelineDate, { color: textColor }]}>
                {new Date(item.timestamp || item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </Text>
            </View>

            {isDiagnosis ? (
              <View>
                <View style={styles.diagnosisTimelineHeader}>
                  <Text style={[styles.timelineTitle, { color: textColor, fontSize: 18 }]}>Pulse Check Result</Text>
                  <View style={[styles.severityPill, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                    <Text style={[styles.severityPillText, { color: '#FAD7A0' }]}>
                      {(getWellbeingScore(item) * 10).toFixed(1)}/10 Index
                    </Text>
                  </View>
                </View>

                <View style={styles.miniScoreGrid}>
                  {item.results && Object.entries(item.results).slice(0, 3).map(([key, val]: [string, any]) => (
                    <View key={key} style={styles.miniScoreItem}>
                       <Text style={[styles.miniScoreLabel, { color: textColor, opacity: 0.7 }]}>{key}</Text>
                       <View style={[styles.severityBadgeSmall, { backgroundColor: getSeverityBg(val.severity) }]}>
                         <Text style={[styles.severityTextSmall, { color: getSeverityColor(val.severity) }]}>{val.severity}</Text>
                       </View>
                    </View>
                  ))}
                </View>
                
                <Text style={[styles.timelineDesc, { color: textColor, marginTop: 10, fontSize: 12, fontStyle: 'italic' }]}>
                  Focus areas: {item.labels?.join(', ')}
                </Text>
              </View>
            ) : (
              <View>
                {item.moodBefore && item.moodBefore !== "Not set" ? (
                  <View style={styles.moodRow}>
                    <Text style={[styles.timelineTitle, { color: textColor }]}>{item.moodBefore}</Text>
                    <Ionicons name="arrow-forward" size={16} color={textColor} style={{ marginHorizontal: 8 }} />
                    <Text style={[styles.timelineTitle, { color: textColor }]}>{item.moodAfter}</Text>
                  </View>
                ) : (
                  <Text style={[styles.timelineTitle, { color: textColor, marginBottom: 8 }]}>Self-Care Activities</Text>
                )}

                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 }}>
                   <View style={{ flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
                      <View 
                        style={{ 
                          height: '100%', 
                          width: `${Math.min(100, Math.round(((item.completedActivities?.length || 0) / (item.totalActivities || 6)) * 100))}%`, 
                          backgroundColor: textColor === '#FFF' ? '#FFF' : '#FAD7A0',
                          borderRadius: 2
                        }} 
                      />
                   </View>
                   <Text style={{ fontSize: 10, fontWeight: '900', color: textColor, opacity: 0.8 }}>
                      {Math.round(((item.completedActivities?.length || 0) / (item.totalActivities || 6)) * 100)}%
                   </Text>
                </View>
                
                <View style={styles.activityList}>
                  <Ionicons name="checkmark-circle" size={14} color={textColor} style={{ marginRight: 6, opacity: 0.8 }} />
                  <Text style={[styles.timelineDesc, { color: textColor, flex: 1 }]}>
                    {item.completedActivities && item.completedActivities.length > 0 
                      ? item.completedActivities.join(', ') 
                      : 'Reflection & mindfulness practices'}
                  </Text>
                </View>
              </View>
            )}
          </LinearGradient>
        </Animated.View>
      </View>
    );
  };

  const exportToPDF = async () => {
    if (!data || !data.diagnoses || data.diagnoses.length === 0) {
      Alert.alert("No Data", "There is no progress data to export.");
      return;
    }

    const patient = data.diagnoses[0].userId;
    const currentScore = (getWellbeingScore(data.diagnoses[0]) * 100).toFixed(1);
    
    const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
            body { 
              font-family: 'Inter', sans-serif; 
              padding: 0; 
              margin: 0;
              color: #353A40; 
              background-color: #FFF;
            }
            .page-container { padding: 40px; }
            .header { 
              background: linear-gradient(135deg, #FAD7A0 0%, #FFB088 100%);
              padding: 40px;
              color: #4A362D;
              border-bottom-right-radius: 40px;
            }
            .header h1 { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
            .header p { margin: 5px 0 0 0; opacity: 0.8; font-weight: 600; }
            
            .stats-strip {
              display: flex;
              justify-content: space-between;
              background: #FAF9F6;
              padding: 20px 40px;
              margin-bottom: 30px;
              border-bottom: 1px solid #EEE;
            }
            .stat-item h3 { margin: 0; font-size: 10px; text-transform: uppercase; color: #8C8381; letter-spacing: 1px; }
            .stat-item p { margin: 5px 0 0 0; font-size: 16px; font-weight: 800; color: #4A362D; }

            .section { margin: 30px 40px; }
            .section-title { 
              font-weight: 800; 
              font-size: 18px; 
              margin-bottom: 15px; 
              color: #4A362D;
              display: flex;
              align-items: center;
            }
            .section-title::after {
              content: '';
              flex: 1;
              height: 2px;
              background: #FAD7A0;
              margin-left: 15px;
              opacity: 0.3;
            }

            .summary-card {
              background: #FFF;
              border: 2px solid #FAD7A0;
              padding: 20px;
              border-radius: 20px;
              margin-bottom: 30px;
            }
            .focus-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
            .tag { 
              background: rgba(250, 215, 160, 0.2); 
              color: #4A362D; 
              padding: 6px 12px; 
              border-radius: 10px; 
              font-size: 12px; 
              font-weight: 600; 
            }

            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { text-align: left; font-size: 12px; color: #8C8381; padding: 10px; border-bottom: 2px solid #EEE; }
            td { padding: 12px 10px; border-bottom: 1px solid #F5F5F5; font-size: 14px; }
            .score-pill { 
              background: #FAD7A0; 
              color: #4A362D; 
              padding: 4px 8px; 
              border-radius: 6px; 
              font-weight: 800; 
              font-size: 12px; 
            }

            .activity-item {
              border-left: 3px solid #FAD7A0;
              padding: 15px;
              margin-bottom: 15px;
              background: #FAF9F6;
              border-top-right-radius: 15px;
              border-bottom-right-radius: 15px;
            }
            .activity-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .activity-date { font-size: 11px; font-weight: 800; color: #8C8381; }
            .activity-percent { font-size: 11px; font-weight: 800; color: #FFA36C; }
            .activity-mood { font-weight: 800; font-size: 14px; margin-bottom: 5px; }
            .activity-list { font-size: 13px; color: #4A362D; opacity: 0.8; }

            .footer {
              margin-top: 50px;
              padding: 40px;
              text-align: center;
              font-size: 12px;
              color: #AAA;
              border-top: 1px solid #EEE;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <p>EMORA CLINICAL INSIGHTS</p>
            <h1>Patient Progress Report</h1>
          </div>

          <div class="stats-strip">
            <div class="stat-item">
              <h3>Patient Name</h3>
              <p>${patient?.name || 'Patient'}</p>
            </div>
            <div class="stat-item">
              <h3>Report Date</h3>
              <p>${new Date().toLocaleDateString()}</p>
            </div>
            <div class="stat-item">
              <h3>Wellbeing Index</h3>
              <p>${currentScore}%</p>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Latest Analysis Summary</div>
            <div class="summary-card">
              <div style="font-weight: 600; margin-bottom: 5px;">Detected Focus Areas:</div>
              <div class="focus-tags">
                ${(data.diagnoses[0].labels || []).map((l: string) => `<span class="tag">${l}</span>`).join('')}
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Assessment History</div>
            <table>
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>FOCUS AREA</th>
                  <th>AVG SCORE</th>
                </tr>
              </thead>
              <tbody>
                ${data.diagnoses.slice(0, 5).map((d: any) => `
                  <tr>
                    <td>${new Date(d.timestamp).toLocaleDateString()}</td>
                    <td>${d.labels.slice(0, 2).join(', ')}</td>
                    <td><span class="score-pill">${(getWellbeingScore(d) * 10).toFixed(1)}/10</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="section" style="page-break-before: always;">
            <div class="section-title">Self-Care Activity Log</div>
            ${data.activities.slice(0, 20).map((a: any) => {
              const items = a.completedActivities || [];
              const totalUsed = a.totalActivities || 6;
              const percent = Math.round((items.length / totalUsed) * 100);
              const showMood = a.moodBefore && a.moodBefore !== "Not set";
              
              return `
                <div class="activity-item">
                  <div class="activity-header">
                    <span class="activity-date">${new Date(a.timestamp || a.createdAt).toLocaleDateString()}</span>
                    <span class="activity-percent">${percent}% COMPLETED</span>
                  </div>
                  <div class="activity-mood">
                    ${showMood ? `${a.moodBefore} &rarr; ${a.moodAfter}` : 'Self-Care Session'}
                  </div>
                  <div class="activity-list">
                    <strong>Tasks:</strong> ${items.length > 0 ? items.join(', ') : 'Reflection & mindfulness'}
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <div class="footer">
            Generated by Emora Therapist Dashboard • Internal Medical Use Only
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
          <Ionicons name="document-text" size={24} color="#FAD7A0" />
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
                  color: (opacity = 1) => `rgba(250, 215, 160, ${opacity})`,
                }}
                hideLegend={true}
              />
              <Text style={styles.indexLabel}>Index</Text>
          </View>
        </Animated.View>

        {trendData.length > 1 && <TrendChart />}

        <View style={styles.timelineContainer}>
          {timelineData.length > 0 ? (
            timelineData.map((a: any, idx: number) => (
              <TimelineItem key={a._id || idx} item={a} index={idx} />
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
  title: { fontSize: 20, fontWeight: "900", color: "#4A362D" },
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
  avatarTextLarge: { fontSize: 28, fontWeight: '900', color: '#4A362D' },
  profileInfo: { flex: 1 },
  patientName: { fontSize: 20, fontWeight: '900', color: '#4A362D' },
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
  chartTitle: { fontSize: 14, fontWeight: '800', color: '#4A362D', marginBottom: 10, marginLeft: 5 },
  sectionTitle: { fontSize: 18, fontWeight: "900", color: "#4A362D", marginBottom: 20 },
  card: { backgroundColor: "#FFF", borderRadius: 24, padding: 20, marginBottom: 15, elevation: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  cardDate: { fontSize: 14, fontWeight: "800", color: "#4A362D", flex: 1 },
  tagContainer: { flexDirection: 'row', gap: 5 },
  tag: { backgroundColor: 'rgba(255, 117, 151, 0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  tagText: { fontSize: 11, fontWeight: '700', color: '#FAD7A0' },
  scoreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  gridItem: { width: '47%' },
  gridLabel: { fontSize: 12, fontWeight: '700', color: '#8C8381', marginBottom: 5 },
  progressBarBg: { height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#FAD7A0' },
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
  timelineType: { fontSize: 10, fontWeight: '900', letterSpacing: 1, opacity: 0.8 },
  diagnosisTimelineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  severityPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  severityPillText: { fontSize: 12, fontWeight: '800' },
  miniScoreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  miniScoreItem: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.05)', padding: 8, borderRadius: 12 },
  miniScoreLabel: { fontSize: 11, fontWeight: '700' },
  severityBadgeSmall: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  severityTextSmall: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF9F6' }
});
