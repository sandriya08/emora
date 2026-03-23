import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { BarChart, ProgressChart } from "react-native-chart-kit";
import ConfettiCannon from "react-native-confetti-cannon";
import { useAuth } from "../../context/AuthContext";
import { useDiagnosis } from "../../context/DiagnosisContext";
import { useWindowDimensions } from "react-native";

export default function SelfCareScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const { user } = useAuth();
  const { diagnosisResult } = useDiagnosis();
  const { diagnoses } = useLocalSearchParams();
  const router = useRouter();
  const confettiRef = useRef<any>(null);

  const containerMaxWidth = 600;
  const contentWidth = Math.min(screenWidth - 40, containerMaxWidth);

  const weeks = ["Week 1", "Week 2", "Week 3", "Week 4"];
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [weeklyProgress, setWeeklyProgress] = useState<Record<string, number[]>>({
    "Week 1": [],
    "Week 2": [],
    "Week 3": [],
    "Week 4": [],
  });

  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  const [chartData, setChartData] = useState<number[]>([0, 0, 0, 0]);

  const [weeklyActivities, setWeeklyActivities] = useState<Record<string, { title: string; desc: string }[]>>({
    "Week 1": [],
    "Week 2": [],
    "Week 3": [],
    "Week 4": [],
  });

  const [weeklyMoods, setWeeklyMoods] = useState<Record<string, number | null>>({
    "Week 1": null,
    "Week 2": null,
    "Week 3": null,
    "Week 4": null,
  });
  const [weeklyAfterMoods, setWeeklyAfterMoods] = useState<Record<string, string | null>>({
    "Week 1": null,
    "Week 2": null,
    "Week 3": null,
    "Week 4": null,
  });
  const [loading, setLoading] = useState(false);

  // Animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  const moodData = [
    { face: "😃", color: "#E8F5E9", label: "Happy", iconColor: "#81C784", shape: "circle" },
    { face: "😡", color: "#FFEBEE", label: "Angry", iconColor: "#FF8A65", shape: "square" },
    { face: "😴", color: "#E3F2FD", label: "Sleepy", iconColor: "#64B5F6", shape: "circle" },
    { face: "😑", color: "#FCE4EC", label: "Bored", iconColor: "#F06292", shape: "circle" },
  ];

  // MEMOIZE EMOTIONS TO PREVENT RE-RENDERS
  const emotions = useMemo(() => {
    return diagnoses
      ? JSON.parse(diagnoses as string)
      : diagnosisResult
        ? Object.keys(diagnosisResult)
        : ["Stress", "Anxiety", "Low Self-Esteem"];
  }, [diagnoses, diagnosisResult]);

  // Mood label → numeric score (higher = better mood)
  const moodScoreMap: Record<string, number> = {
    "Happy": 5,
    "Bored": 3,
    "Sleepy": 2,
    "Angry": 1,
    "Not set": 0,
  };

  const fetchHistory = async () => {
    try {
      if (!user?.id) return;
      const res = await fetch(`http://localhost:5000/api/selfcare/history?userId=${user.id}`);
      const data = await res.json();
      setSessionHistory(data);

      // Process chart data: mood score per week (as percentage of max score 5)
      const weeklyRates = weeks.map(weekName => {
        const sessions = data.filter((s: any) => s.week === weekName);
        if (sessions.length === 0) return 0;

        // Get the latest session for this week
        const latestSession = sessions[0]; // Already sorted by timestamp desc
        const moodLabel = latestSession.moodBefore || "Not set";
        const score = moodScoreMap[moodLabel] || 0;

        // Convert to percentage (max score is 5)
        return (score / 5) * 100;
      });
      setChartData(weeklyRates);
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  useEffect(() => {
    const fetchActivities = async () => {
      // Only fetch once for all weeks
      if (weeklyActivities["Week 1"].length > 0) return;

      setLoading(true);
      try {
        const res = await fetch("http://localhost:5000/api/selfcare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ diagnoses: emotions }),
        });
        const data = await res.json();
        const allSuggestions = data.suggestions || [];
        const perWeek = Math.ceil(allSuggestions.length / 4);

        setWeeklyActivities({
          "Week 1": allSuggestions.slice(0, perWeek),
          "Week 2": allSuggestions.slice(perWeek, perWeek * 2),
          "Week 3": allSuggestions.slice(perWeek * 2, perWeek * 3),
          "Week 4": allSuggestions.slice(perWeek * 3, allSuggestions.length),
        });
      } catch (err) {
        console.error("Error fetching suggestions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [emotions]);

  // FLOATING ANIMATION
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = (index: number) => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
    toggleActivity(index);
  };

  const toggleActivity = (index: number) => {
    const week = weeks[selectedWeek];
    const currentWeekProgress = weeklyProgress[week];

    const updated = currentWeekProgress.includes(index)
      ? currentWeekProgress.filter(i => i !== index)
      : [...currentWeekProgress, index];

    setWeeklyProgress({
      ...weeklyProgress,
      [week]: updated,
    });

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (updated.length === activities.length && activities.length > 0) {
      confettiRef.current?.start();
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    const currentWeekProgress = weeklyProgress[weeks[selectedWeek]];
    const completedTitles = currentWeekProgress.map(id => activities[id]?.title).filter(Boolean);
    const moodBeforeLabel = weeklyMoods[weeks[selectedWeek]] !== null ? moodData[weeklyMoods[weeks[selectedWeek]]!]?.label : "Not set";

    await fetch("http://localhost:5000/api/selfcare/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user?.id || null,
        diagnoses: emotions,
        completedActivities: completedTitles,
        totalActivities: activities.length,
        moodBefore: moodBeforeLabel,
        moodAfter: weeklyAfterMoods[weeks[selectedWeek]] || "Not set",
        week: weeks[selectedWeek],
      }),
    });

    await fetchHistory(); // Refresh chart data
    setLoading(false);
    router.replace("/therapist");
  };

  const currentWeekName = weeks[selectedWeek];
  const activities = weeklyActivities[currentWeekName] || [];
  const currentWeekProgress = weeklyProgress[currentWeekName] || [];
  const progress = activities.length > 0 ? (currentWeekProgress.length / activities.length) : 0;
  const progressText = `${currentWeekProgress.length} of ${activities.length} activities completed`;

  // Live Chart Data: Merge historical data with current moods from ALL weeks
  const displayChartData = useMemo(() => {
    const updated = [...chartData];
    weeks.forEach((weekName, idx) => {
      const mood = weeklyMoods[weekName];
      if (mood !== null) {
        const currentMoodLabel = moodData[mood]?.label || "Not set";
        const currentScore = moodScoreMap[currentMoodLabel] || 0;
        const currentRate = (currentScore / 5) * 100;
        updated[idx] = Math.max(updated[idx], currentRate);
      }
    });
    return updated;
  }, [chartData, weeklyMoods]);

  // Monthly Progress: Based on after-mood (Better/A bit/Same)
  const afterMoodScoreMap: Record<string, number> = {
    "Better": 5,
    "A bit": 3,
    "Same": 1,
  };

  const monthlyAverage = useMemo(() => {
    let total = 0;
    let count = 0;
    weeks.forEach((weekName) => {
      const afterMood = weeklyAfterMoods[weekName];
      if (afterMood) {
        total += (afterMoodScoreMap[afterMood] || 0);
        count++;
      }
    });
    return count > 0 ? (total / count) / 5 : 0;
  }, [weeklyAfterMoods]);

  // Custom Circular Progress for Monthly
  const CircularProgress = () => (
    <View style={styles.circularContainer}>
      <LinearGradient
        colors={["#FFFFFF", "rgba(255, 117, 151, 0.05)"]}
        style={styles.circularBg}
      >
        <ProgressChart
          data={{
            labels: ["Monthly Progress"],
            data: [monthlyAverage || 0.01]
          }}
          width={screenWidth - 80}
          height={200}
          strokeWidth={14}
          radius={70}
          chartConfig={{
            backgroundColor: "transparent",
            backgroundGradientFrom: "rgba(255,255,255,0)",
            backgroundGradientTo: "rgba(255,255,255,0)",
            color: (opacity = 1) => `rgba(255, 117, 151, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(74, 63, 61, ${opacity})`,
          }}
          hideLegend={true}
        />
        <View style={styles.circularOverlay}>
          <Text style={styles.circularScore}>{(monthlyAverage * 10).toFixed(1)}</Text>
          <Text style={styles.circularLabel}>Monthly Score</Text>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#FAF9F6" }}>
      {/* DECORATIVE BACKGROUND */}
      <View style={styles.bgBlob} />
      <View style={styles.bgBlobLeft} />

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={{ 
          paddingBottom: 100,
          maxWidth: containerMaxWidth,
          alignSelf: 'center',
          width: '100%'
        }} 
        showsVerticalScrollIndicator={false}
      >


        {/* NEW HEADER */}
        <View style={styles.headerNew}>
          <Text style={styles.dateText}>Mar 20, 2026</Text>
          <Text style={[styles.greetingText, { fontSize: screenWidth < 380 ? 24 : 28 }]}>Hello {user?.name?.split(' ')[0] || "Friend"}! How are</Text>
          <Text style={[styles.greetingText, { fontSize: screenWidth < 380 ? 24 : 28 }]}>you feeling today?</Text>

          {/* DETECTED EMOTIONS */}
          {emotions && emotions.length > 0 && (
            <View style={{ marginTop: 20, marginBottom: 5 }}>
              <Text style={styles.subText}>Detected focus areas</Text>
              <View style={styles.emotionRow}>
                {emotions.map((emotion: string, idx: number) => (
                  <View key={idx} style={styles.emotionChip}>
                    <View style={styles.emotionDot} />
                    <Text style={styles.emotionText} numberOfLines={1}>{emotion}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* MOOD SELECTOR ROW */}
          <View style={[styles.moodSelectorRowNew, { paddingTop: 20, borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.05)" }]}>
            {moodData.map((item, index) => {
              const isSelected = weeklyMoods[weeks[selectedWeek]] === index;
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.moodPillContainer}
                  onPress={() => setWeeklyMoods(prev => ({ ...prev, [weeks[selectedWeek]]: index }))}
                >
                  <View style={[styles.moodPill, isSelected && { backgroundColor: "#E0E0E0" }]}>
                    <Text style={styles.moodPillText}>{item.label}</Text>
                  </View>
                  <View style={[
                    styles.moodIconFloating,
                    { backgroundColor: item.iconColor, borderRadius: item.shape === "circle" ? 14 : 7 }
                  ]}>
                    <Text style={styles.moodIconText}>{item.face}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

          {/* WEEK SELECTOR UI */}
          <View style={styles.weekRow}>
            {weeks.map((week, index) => {
              const isActive = selectedWeek === index;
              return (
                <TouchableOpacity
                  key={week}
                  onPress={() => setSelectedWeek(index)}
                  style={[
                    styles.weekTab,
                    isActive && styles.weekTabActive
                  ]}
                >
                  <Text style={[
                    styles.weekText,
                    isActive && { color: "#fff" }
                  ]}>
                    {week}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* GRID ACTIVITIES */}
        <Text style={styles.sectionHeader}>{weeks[selectedWeek]} Self-Care Plan</Text>
        <View style={styles.grid}>
          {activities.map((item, index) => {
            const isDone = weeklyProgress[weeks[selectedWeek]].includes(index);
            const cardGradients = [
              ["#FFFFFF", "#F1F8E9"], // Subtle Mint hint
              ["#FFFFFF", "#E3F2FD"], // Subtle Blue hint
              ["#FFFFFF", "#F3E5F5"], // Subtle Purple hint
              ["#FFFFFF", "#FFF3E0"], // Subtle Peach hint
              ["#FFFFFF", "#FCE4EC"], // Subtle Pink hint
              ["#FFFFFF", "#E0F7FA"], // Subtle Cyan hint
            ];
            const currentGradient = cardGradients[index % cardGradients.length];

            return (
              <Animated.View
                key={index}
                style={[styles.gridCardWrapper, { transform: [{ scale: isDone ? 1 : scaleAnim }] }]}
              >
                <TouchableOpacity
                  onPressIn={!isDone ? handlePressIn : undefined}
                  onPressOut={!isDone ? () => handlePressOut(index) : () => toggleActivity(index)}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={isDone ? ["#F5F5F5", "#E0E0E0"] : (currentGradient as any)}
                    style={[
                      styles.gridCard,
                      isDone && { opacity: 0.7, transform: [{ scale: 0.98 }] }
                    ]}
                  >
                    <Text style={[styles.gridTitle, isDone && { color: "#999" }]}>{item.title}</Text>
                    <View style={styles.gridFooter}>
                      <Ionicons
                        name={isDone ? "checkmark-circle" : "checkmark-circle-outline"}
                        size={22}
                        color={isDone ? "#FF7597" : "#FF7597"}
                      />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressContent}>
            <Text style={styles.progressTitle}>Current Momentum</Text>
            <View style={styles.barRow}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
              </View>
              <Text style={styles.percentageLabel}>{Math.round(progress * 100)}%</Text>
            </View>
            <Text style={styles.progressSub}>
              {progressText}
            </Text>
          </View>
        </View>


        {/* PROGRESS CHARTS - REORDERED */}
        <View style={styles.chartOuterContainer}>
          <Text style={styles.sectionHeader}>Progress Summary</Text>

          <View style={styles.tabsRow}>
            <Text style={styles.tabTextActive}>Weekly Patterns</Text>
          </View>

          <View style={styles.chartInnerContainer}>
            <BarChart
              data={{
                labels: ["W1", "W2", "W3", "W4"],
                datasets: [{ data: displayChartData }]
              }}
              width={contentWidth - 40}
              height={180}
              yAxisLabel=""
              yAxisSuffix="%"
              chartConfig={{
                backgroundColor: "#fff",
                backgroundGradientFrom: "#fff",
                backgroundGradientTo: "#fff",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(255, 117, 151, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(74, 63, 61, ${opacity})`,
                style: { borderRadius: 16 },
                fillShadowGradient: "#FF7597",
                fillShadowGradientOpacity: 1,
                barPercentage: 0.7,
                useShadowColorFromDataset: false,
              }}
              style={{
                marginVertical: 8,
                borderRadius: 16
              }}
              showValuesOnTopOfBars={true}
              fromZero={true}
            />
          </View>

          <View style={[styles.tabsRow, { marginTop: 20 }]}>
            <Text style={styles.tabTextActive}>Monthly Progress</Text>
          </View>

          <CircularProgress />
        </View>

        {/* MOOD + ACTION CARD */}
        <View style={styles.moodActionCard}>
          <Text style={styles.moodActionTitle}>Where are you now?</Text>
          <Text style={styles.moodActionSubtitle}>Reflecting after your rituals</Text>

          <View style={styles.moodNowRow}>
            {["Better", "A bit", "Same"].map((label, idx) => {
              const icons = ["happy-outline", "sunny-outline", "cloud-outline"];
              const isSelected = weeklyAfterMoods[weeks[selectedWeek]] === label;
              return (
                <TouchableOpacity
                  key={label}
                  style={[
                    styles.moodReflectionCard,
                    isSelected && { backgroundColor: "#F5F5F5" }
                  ]}
                  onPress={() => setWeeklyAfterMoods(prev => ({ ...prev, [weeks[selectedWeek]]: label }))}
                >
                  <Ionicons
                    name={icons[idx] as any}
                    size={28}
                    color={isSelected ? "#353A40" : "#BDBDBD"}
                  />
                  <Text style={[
                    styles.moodReflectionText,
                    isSelected && { color: "#353A40", fontWeight: "700" },
                    { fontSize: screenWidth < 380 ? 11 : 13 }
                  ]} numberOfLines={1}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            style={[
              styles.finishButton,
              progress === 0 && { opacity: 0.5 }
            ]}
            onPress={handleComplete}
            activeOpacity={0.85}
            disabled={loading}
          >
            <LinearGradient
              colors={["#FF7597", "#FF7597"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.finishButtonGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={[styles.buttonContent, { justifyContent: 'space-between', width: '100%', paddingHorizontal: 15 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="people-circle" size={26} color="#fff" style={{ marginRight: 12 }} />
                    <Text style={styles.finishButtonText}>Converse with a Guide</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={22} color="#fff" />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </ScrollView>

      <ConfettiCannon
        ref={confettiRef}
        count={150}
        fadeOut
        origin={{ x: -10, y: 0 }}
        autoStart={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  headerNew: {
    marginTop: 40,
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 25,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  dateText: {
    fontSize: 12,
    color: "#BDBDBD",
    fontWeight: "600",
    marginBottom: 8,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#353A40",
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  moodSelectorRowNew: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 25,
    gap: 10,
  },
  moodPillContainer: {
    flex: 1,
    alignItems: "center",
    position: "relative",
    paddingTop: 10,
  },
  moodPill: {
    backgroundColor: "#F5F5F5",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 20,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  moodPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#353A40",
  },
  moodIconFloating: {
    position: "absolute",
    top: -12,
    right: -2,
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  moodIconText: {
    fontSize: 14,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  subText: {
    marginTop: 4,
    fontSize: 13,
    color: "#595F69",
    fontWeight: "500",
  },
  emotionRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    marginTop: 12,
    gap: 6,
  },
  emotionChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 117, 151, 0.06)",
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 117, 151, 0.15)",
  },
  emotionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF7597",
    marginRight: 6,
  },
  emotionText: {
    fontSize: 11,
    color: "#353A40",
    fontWeight: "600",
    flexShrink: 1,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: "#353A40",
    marginBottom: 15,
    marginTop: 10,
  },
  sessionCheckIn: {
    marginTop: 20,
    backgroundColor: "rgba(255,255,255,0.6)",
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FBCFE8",
  },
  checkInTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#353A40",
    marginBottom: 12,
  },
  moodSelectorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  moodItem: {
    alignItems: "center",
  },
  moodCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    position: "relative",
  },
  selectedMoodCircle: {
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#FF7597",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  moodEmoji: {
    fontSize: 20,
  },
  tick: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#FF7597",
    borderRadius: 8,
    padding: 2,
  },
  moodLabelText: {
    fontSize: 10,
    color: "#595F69",
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    marginBottom: 5,
  },
  weekTab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#FFF5F7",
  },
  weekTabActive: {
    backgroundColor: "#FF7597",
  },
  weekText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF7597",
  },
  gridCardWrapper: {
    width: "48%",
    marginBottom: 15,
  },
  gridCard: {
    height: 110,
    borderRadius: 22,
    padding: 16,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#353A40",
    lineHeight: 18,
  },
  gridFooter: {
    alignItems: "flex-end",
  },
  progressCard: {
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 20,
    marginTop: 10,
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#FBCFE8",
    shadowColor: "#FF7597",
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
    minHeight: 110,
  },
  progressContent: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  progressTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#353A40",
    marginBottom: 10,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  progressBar: {
    flex: 1,
    height: 10,
    backgroundColor: "#E1F5FE",
    borderRadius: 5,
  },
  progressFill: {
    height: 10,
    backgroundColor: "#4FC3F7",
    borderRadius: 5,
  },
  percentageLabel: {
    fontSize: 13,
    color: "#595F69",
    fontWeight: "700",
    width: 35,
  },
  progressSub: {
    fontSize: 12,
    color: "#595F69",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  chartOuterContainer: {
    marginTop: 30,
    marginBottom: 20,
  },
  chartInnerContainer: {
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 24,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FBCFE8",
    shadowColor: "#FF7597",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  bgBlob: {
    position: "absolute",
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(255, 117, 151, 0.08)",
    zIndex: -1,
  },
  bgBlobLeft: {
    position: "absolute",
    bottom: 100,
    left: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(255, 117, 151, 0.05)",
    zIndex: -1,
  },
  circularContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 15,
  },
  circularBg: {
    padding: 10,
    borderRadius: 110,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF7597",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  circularOverlay: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  circularScore: {
    fontSize: 42,
    fontWeight: "900",
    color: "#2E2E2E",
    letterSpacing: -1,
  },
  circularLabel: {
    fontSize: 11,
    color: "#595F69",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  tabsRow: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 8,
    paddingLeft: 5,
  },
  tabTextActive: {
    fontSize: 13,
    fontWeight: "800",
    color: "#353A40",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  moodActionCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 22,
    marginTop: 30,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 4,
  },
  moodActionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#2E2E2E",
    marginBottom: 4,
  },
  moodActionSubtitle: {
    fontSize: 12,
    color: "#ACACAC",
    marginBottom: 18,
  },
  moodNowRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 15,
    gap: 10,
  },
  moodReflectionCard: {
    flex: 1,
    height: 105,
    backgroundColor: "#FDFDFD",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.02)",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  moodReflectionText: {
    fontSize: 14,
    color: "#757575",
    marginTop: 8,
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.05)",
    marginVertical: 20,
  },
  finishButton: {
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#FF7597",
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 6,
  },
  finishButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  finishButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 18,
    letterSpacing: -0.2,
  },
});
