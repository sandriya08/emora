import React, { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BarChart, ProgressChart } from "react-native-chart-kit";
import { useDiagnosis } from "../../context/DiagnosisContext";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../constants/api";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { confirmAction } from "@/utils/alert";
import Animated, { 
  FadeInUp, 
  FadeInDown,
  useSharedValue, 
  withRepeat, 
  withTiming, 
  useAnimatedStyle 
} from "react-native-reanimated";

const screenWidth = Dimensions.get("window").width;

const handleHapticPress = (router: any, path: any) => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  router.push(path);
};

const handleHapticReplace = (router: any, path: any) => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  router.replace(path);
};

const SkeletonPulse = ({ style }: { style?: any }) => {
  const opacity = useSharedValue(0.3);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.6, { duration: 800 }), -1, true);
  }, []);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[{ backgroundColor: '#E1E9EE' }, animatedStyle, style]} />;
};

export default function ResultScreen() {
    const { diagnosisResult, setDiagnosisResult, fetchLatest, resetDiagnosis } = useDiagnosis();
    const { user } = useAuth();
    const { id } = useLocalSearchParams<{ id?: string }>();
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    const fetchLatestDiagnosis = async () => {
        if (!user?.id) return;
        try {
            if (id) {
                const url = `${API_URL}/api/selfcare/diagnosis/${id}?userId=${user.id}`;
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.results) {
                        setDiagnosisResult(data.results, data.timestamp);
                    }
                }
            } else {
                await fetchLatest(user.id, API_URL);
            }
        } catch (err) {
            console.error("[Result] Error fetching diagnosis:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchLatestDiagnosis();
    }, [user, id]);

    if (loading) {
        return (
            <View style={styles.container}>
                <SkeletonPulse style={{ width: 200, height: 40, borderRadius: 10, marginVertical: 20 }} />
                {[1, 2].map((i) => (
                    <SkeletonPulse key={i} style={{ width: '100%', height: 180, borderRadius: 28, marginBottom: 20 }} />
                ))}
            </View>
        );
    }

    if (!diagnosisResult) {
        return (
            <View style={styles.center}>
                <Ionicons name="analytics-outline" size={60} color="#D1D1D1" />
                <Text style={styles.emptyText}>No results available yet.</Text>
                <TouchableOpacity style={[styles.button, { marginBottom: 10, width: '100%' }]} onPress={fetchLatestDiagnosis}>
                    <Text style={[styles.buttonText, { color: '#FFF' }]}>Retry Loading</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondary} onPress={() => handleHapticPress(router, "/chat")}>
                    <Text style={styles.buttonText}>Take a Pulse Check</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const labels = Object.keys(diagnosisResult || {});
    if (labels.length === 0) {
        return (
            <View style={styles.center}>
                <Text style={styles.emptyText}>No diagnosis data found.</Text>
                <TouchableOpacity style={styles.button} onPress={() => handleHapticPress(router, "/chat")}>
                    <Text style={styles.buttonText}>Start a Check-in</Text>
                </TouchableOpacity>
            </View>
        );
    }
    const scores = labels.map((k) => diagnosisResult[k]?.score || 0);

    const getExplanation = (diagnosis: string, severity: string) => {
        let explanation = "";
        switch (diagnosis) {
            case "Stress": explanation = "Stress often arises when demands exceed your ability to manage them. You may notice irritability, fatigue, or feeling overwhelmed."; break;
            case "Anxiety": explanation = "Anxiety is typically linked to persistent worry or overthinking. Your mind may remain in a heightened state of alertness."; break;
            case "Depression": explanation = "Depression may appear as persistent sadness or emotional heaviness. You may feel drained or disconnected."; break;
            case "Burnout": explanation = "Burnout develops after prolonged exposure to stress. It often involves emotional exhaustion and detachment."; break;
            case "Sleep Disturbance": explanation = "Sleep disturbances often occur when mental overactivity interferes with rest, intensifying other emotional symptoms."; break;
            case "Low Self-Esteem": explanation = "Low self-esteem involves persistent self-doubt or negative self-evaluation, which can reduce overall confidence."; break;
            case "Emotional Exhaustion": explanation = "Emotional exhaustion occurs when your resources feel depleted, leading to feeling numb or detached."; break;
            case "Adjustment Issues": explanation = "Adjustment difficulties can arise during life transitions. These responses are common during periods of change."; break;
            default: explanation = "Reflecting on your emotional state is a vital step toward maintaining your overall wellbeing.";
        }
        if (severity === "High") {
            explanation += "\n\nProfessional guidance may be beneficial given the intensity of these experiences.";
        } else if (severity === "Moderate") {
            explanation += "\n\nIntentional coping strategies and self-care practices could be very helpful.";
        } else {
            explanation += "\n\nAt this stage, these feelings appear manageable, but continued awareness remains important.";
        }
        return explanation;
    };

    const getFeelingTitle = (diagnosis: string) => {
        switch (diagnosis) {
            case "Depression": return "Understanding Your Low Mood";
            case "Stress": return "Understanding Your Stress Response";
            case "Anxiety": return "Understanding Your Anxiety";
            case "Burnout": return "Understanding Burnout";
            case "Sleep Disturbance": return "Understanding Sleep Disruption";
            case "Low Self-Esteem": return "Understanding Self-Doubt";
            case "Emotional Exhaustion": return "Understanding Emotional Fatigue";
            case "Adjustment Issues": return "Understanding Life Transitions";
        }
    };

    const averageScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / (scores.length * 10)) : 0;

    const CircularProgress = () => (
      <Animated.View entering={FadeInDown.delay(100)} style={styles.circularContainer}>
        <LinearGradient
          colors={["#FFFFFF", "rgba(250, 215, 160, 0.05)"]}
          style={styles.circularBg}
        >
          <ProgressChart
            data={{
              labels: ["Overall Progress"],
              data: [averageScore || 0.01]
            }}
            width={screenWidth - 80}
            height={200}
            strokeWidth={14}
            radius={70}
            chartConfig={{
              backgroundColor: "transparent",
              backgroundGradientFrom: "#FFFFFF",
              backgroundGradientTo: "#FFFFFF",
              color: (opacity = 1) => `rgba(250, 215, 160, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(74, 63, 61, ${opacity})`,
            }}
            hideLegend={true}
          />
          <View style={styles.circularOverlay}>
            <Text style={styles.circularScore}>{(averageScore * 10).toFixed(1)}</Text>
            <Text style={styles.circularLabel}>Wellbeing Index</Text>
          </View>
        </LinearGradient>
      </Animated.View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: "#FAF9F6" }}>
            {/* DECORATIVE BACKGROUND */}
            <View style={styles.bgBlob} />
            <View style={styles.bgBlobLeft} />

            <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, marginTop: 10 }}>
                    <View style={{ flex: 1 }}>
                        <Animated.Text entering={FadeInUp.delay(200)} style={[styles.title, { marginBottom: 0 }]}>
                            Detailed Analysis
                        </Animated.Text>
                        {useDiagnosis().diagnosisDate && (
                            <Animated.Text entering={FadeInUp.delay(250)} style={styles.dateHeader}>
                                {new Date(useDiagnosis().diagnosisDate!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </Animated.Text>
                        )}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <TouchableOpacity 
                            style={styles.resetBtn} 
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                confirmAction(
                                    "Reset Assessment",
                                    "Are you sure you want to clear your current progress and start fresh?",
                                    async () => {
                                        if (user?.id) {
                                            await AsyncStorage.removeItem(`chat_msg_${user.id}`);
                                            await AsyncStorage.removeItem(`chat_idx_${user.id}`);
                                            await AsyncStorage.removeItem(`chat_comp_${user.id}`);
                                        }
                                        resetDiagnosis();
                                        router.replace("/(tabs)/chat");
                                    },
                                    "Start Fresh"
                                );
                            }}
                        >
                             <Text style={styles.resetText}>Reset Pulse</Text>
                             <Ionicons name="refresh-outline" size={16} color="#FAD7A0" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.closeButton} 
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push('/history');
                            }}
                        >
                            <Ionicons name="close" size={28} color="#FAD7A0" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Wellbeing Score Chart */}
                <CircularProgress />

                {labels.map((key, index) => {
                const d = diagnosisResult[key];
                if (!d) return null;
                return (
                    <Animated.View key={key} entering={FadeInUp.delay(300 + index * 100)} style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.name}>{key}</Text>
                            <View style={[styles.severityBadge, { backgroundColor: d.severity === 'High' ? '#FEE2E2' : '#FEF3C7' }]}>
                                <Text style={[styles.severityText, { color: d.severity === 'High' ? '#EF4444' : '#F59E0B' }]}>
                                    {d.severity || "Unknown"}
                                </Text>
                            </View>
                        </View>
                        <Text style={styles.sub}>{getFeelingTitle(key)}</Text>
                        <Text style={styles.cause}>{getExplanation(key, d.severity || "Low")}</Text>
                    </Animated.View>
                );
            })}

            <Animated.View entering={FadeInUp.delay(800)} style={styles.chartSection}>
                <Text style={styles.subTitle}>Severity Distribution</Text>
                <View style={styles.chartWrapper}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <BarChart
                            data={{
                                labels: labels.map(l => l.length > 8 ? l.substring(0, 8) + '..' : l),
                                datasets: [{ data: scores }],
                            }}
                            width={Math.max(screenWidth - 40, labels.length * 100)}
                            height={300}
                            yAxisLabel=""
                            yAxisSuffix=""
                            fromZero={true}
                            chartConfig={{
                                backgroundGradientFrom: "#fff",
                                backgroundGradientTo: "#fff",
                                color: (opacity = 1) => `rgba(74, 54, 45, ${opacity})`, // Solid Dark Brown for bars & values
                                labelColor: () => "#000000", // Pitch black for axis labels
                                barPercentage: 0.7,
                                decimalPlaces: 0,
                                fillShadowGradient: "#4A362D", // Dark brown bars
                                fillShadowGradientOpacity: 1,
                                propsForLabels: {
                                    fontSize: 15,
                                    fontWeight: '900', // Extra bold
                                },
                                propsForBackgroundLines: {
                                    strokeDasharray: "", 
                                    stroke: "#D1D1D1",
                                    strokeWidth: 1.5,
                                },
                            }}
                            style={{ 
                                borderRadius: 28, 
                                paddingRight: 40, 
                                marginTop: 20,
                                paddingLeft: 10 
                            }}
                            showValuesOnTopOfBars={true}
                            verticalLabelRotation={0}
                            segments={Math.max(...scores) < 3 ? Math.max(...scores) : 4}
                        />
                    </ScrollView>
                </View>
            </Animated.View>

                <TouchableOpacity 
                  style={styles.mainActionButton} 
                  onPress={() => handleHapticPress(router, { pathname: "/self-care" as any, params: { diagnoses: JSON.stringify(labels) } })}
                >
                    <LinearGradient
                      colors={['#FAD7A0', '#FFB088']} // Gold Gradient
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.gradientButton}
                    >
                      <Text style={styles.navyActionButtonText}>Personalized Self-Care</Text>
                      <Ionicons name="arrow-forward" size={20} color="#4A362D" />
                    </LinearGradient>
                </TouchableOpacity>

            <TouchableOpacity style={styles.secondary} onPress={() => handleHapticReplace(router, "/(tabs)")}>
                <Text style={styles.secondaryText}>Back to Dashboard</Text>
            </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#FAF9F6", padding: 20 },
    title: { fontSize: 28, fontWeight: "800", color: "#353A40", marginBottom: 25, marginTop: 10 },
    subTitle: { fontSize: 20, fontWeight: "800", color: "#353A40", marginBottom: 15 },
    card: { backgroundColor: "#fff", padding: 20, borderRadius: 28, marginBottom: 20, elevation: 5, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 20 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    name: { fontSize: 20, fontWeight: "800", color: "#353A40" },
    severityBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    severityText: { fontSize: 12, fontWeight: "700" },
    sub: { fontSize: 16, fontWeight: "700", color: "#353A40", marginBottom: 8 },
    cause: { fontSize: 14, color: "#595F69", lineHeight: 22 },
    chartSection: { marginTop: 20 },
    chartWrapper: { backgroundColor: '#FFF', borderRadius: 28, padding: 15, elevation: 2 },
    mainAction: { marginTop: 30, marginBottom: 20 },
    mainActionButton: {
        marginTop: 30,
        marginBottom: 15,
        borderRadius: 24,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: "#FAD7A0",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    navyActionButtonText: {
        color: "#4A362D", // Dark brown for contrast
        fontWeight: "900",
        fontSize: 17,
        letterSpacing: 0.5,
    },
    gradientButton: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        paddingVertical: 20, 
        gap: 12 
    },
    button: { backgroundColor: "#353A40", padding: 16, borderRadius: 30, alignItems: "center", marginVertical: 20 },
    buttonText: { color: "#353A40", fontWeight: "700", fontSize: 16 },
    secondary: { alignItems: "center", marginBottom: 40 },
    secondaryText: { color: "#595F69", fontWeight: "600" },
    center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
    emptyText: { fontSize: 16, color: "#8C8381", textAlign: "center", marginTop: 20, marginBottom: 20 },
    dateHeader: { fontSize: 13, fontWeight: "700", color: "#8C8381", marginTop: 4 },
    closeButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#fff",
        justifyContent: "center",
        alignItems: "center",
        elevation: 4,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    resetBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: "#fff",
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 5,
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    resetText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#FAD7A0',
    },
    bgBlob: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(53, 58, 64, 0.03)',
        zIndex: -1,
    },
    bgBlobLeft: {
        position: 'absolute',
        bottom: 100,
        left: -150,
        width: 350,
        height: 350,
        borderRadius: 175,
        backgroundColor: 'rgba(255, 218, 185, 0.08)',
        zIndex: -1,
    },
    circularContainer: {
        backgroundColor: '#fff',
        borderRadius: 30,
        padding: 10,
        marginBottom: 30,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 20,
    },
    circularBg: {
        width: '100%',
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
    },
    circularOverlay: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    circularScore: {
        fontSize: 36,
        fontWeight: '900',
        color: '#FAD7A0', // Gold
        letterSpacing: -1,
    },
    circularLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#8C8381',
        marginTop: -4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});
