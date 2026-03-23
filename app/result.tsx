import { useRouter } from "expo-router";
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BarChart } from "react-native-chart-kit";
import { useDiagnosis } from "../context/DiagnosisContext";

const screenWidth = Dimensions.get("window").width;

export default function ResultScreen() {
    const { diagnosisResult } = useDiagnosis();
    const router = useRouter();

    if (!diagnosisResult) {
        return (
            <View style={styles.center}>
                <Text>No results available.</Text>
            </View>
        );
    }

    const labels = Object.keys(diagnosisResult);
    if (labels.length === 0) {
        return (
            <View style={styles.center}>
                <Text>No diagnosis data found.</Text>
            </View>
        );
    }
    const scores = labels.map((k) => diagnosisResult[k].score);
    
    // Find the diagnosis with the highest score
    const dominantKey = labels.reduce((a, b) => 
        diagnosisResult[a].score > diagnosisResult[b].score ? a : b
    );

    const getExplanation = (diagnosis: string, severity: string) => {
        let explanation = "";

        switch (diagnosis) {

            case "Stress":
                explanation = "Stress often arises when the demands placed on you begin to exceed your perceived ability to manage them. This can create ongoing mental tension, pressure, and difficulty relaxing. You may notice irritability, fatigue, or feeling overwhelmed by responsibilities. If prolonged, stress can affect concentration, sleep quality, and emotional balance.";
                break;

            case "Anxiety":
                explanation = "Anxiety is typically linked to persistent worry, overthinking, or anticipating negative outcomes. Your mind may remain in a heightened state of alertness, making it difficult to feel calm or present. This can lead to restlessness, nervous energy, muscle tension, or difficulty focusing.";
                break;

            case "Depression":
                explanation = "Depression may appear as persistent sadness, emotional heaviness, reduced motivation, or a loss of interest in activities you once enjoyed. You may feel drained, disconnected, or less hopeful about the future. Over time, these feelings can affect productivity, relationships, and overall wellbeing.";
                break;

            case "Burnout":
                explanation = "Burnout develops after prolonged exposure to stress, particularly in work or academic environments. It often involves emotional exhaustion, reduced motivation, and a sense of detachment from responsibilities. You may feel drained despite effort and struggle to maintain previous levels of performance.";
                break;

            case "Sleep Disturbance":
                explanation = "Sleep disturbances often occur when emotional strain or mental overactivity interferes with rest. You may experience difficulty falling asleep, staying asleep, or waking up feeling refreshed. Since sleep plays a critical role in emotional regulation, disruption can intensify other emotional symptoms.";
                break;

            case "Low Self-Esteem":
                explanation = "Low self-esteem involves persistent self-doubt or negative self-evaluation. You may compare yourself unfavorably to others, fear disappointing people, or struggle to recognize your strengths. Over time, this pattern can reduce confidence and contribute to stress or anxiety.";
                break;

            case "Emotional Exhaustion":
                explanation = "Emotional exhaustion occurs when your emotional resources feel depleted due to sustained stress or emotional demands. You may feel numb, detached, or too drained to engage fully in daily activities. This state often signals the need for rest, recovery, and emotional support.";
                break;

            case "Adjustment Issues":
                explanation = "Adjustment difficulties can arise during significant life transitions such as moving, academic changes, relationship shifts, or new responsibilities. You may feel unsettled, uncertain, or overwhelmed while adapting to change. These responses are common during transition periods but benefit from structured coping strategies.";
                break;

            default:
                explanation = "Reflecting on your emotional state is an important step toward maintaining your overall wellbeing.";
        }

        // Severity-based conclusion
        if (severity === "High") {
            explanation += "\n\nThe intensity of these experiences suggests that structured support or professional guidance may be beneficial at this time.";
        } else if (severity === "Moderate") {
            explanation += "\n\nThese experiences are present enough that intentional coping strategies and self-care practices could be helpful.";
        } else {
            explanation += "\n\nAt this stage, these feelings appear manageable, but continued awareness and proactive self-care remain important.";
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
            default: return `Understanding ${diagnosis}`;
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Detailed Emotional Analysis</Text>

            {labels.map((key) => {
                const d = diagnosisResult[key];
                return (
                    <View key={key} style={styles.card}>
                        <Text style={styles.name}>{key}</Text>
                        <Text style={styles.severity}>Severity: {d.severity}</Text>
                        <Text style={styles.sub}>{getFeelingTitle(key)}</Text>
                        <Text style={styles.cause}>{getExplanation(key, d.severity)}</Text>
                    </View>
                );
            })}

            <Text style={styles.subTitle}>Severity Distribution</Text>

            <BarChart
                data={{
                    labels,
                    datasets: [{ data: scores }],
                }}
                width={screenWidth - 30}
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                fromZero
                chartConfig={{
                    backgroundGradientFrom: "#fff",
                    backgroundGradientTo: "#fff",
                    color: () => "#FF7597",
                    labelColor: () => "#4A4A4A",
                    barPercentage: 0.6,
                }}
                style={{ borderRadius: 12 }}
            />

            <TouchableOpacity style={styles.button} onPress={() => router.push({ pathname: "/self-care" as any, params: { diagnoses: JSON.stringify(labels) } })}>
                <Text style={styles.buttonText}>View Self Care Activities</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.secondary}
                onPress={() => router.replace("/")}
            >
                <Text style={styles.secondaryText}>Back to Home</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

/* -------- STYLES -------- */
const styles = StyleSheet.create({
    container: { padding: 20, backgroundColor: "#FAF9F6" },
    title: { fontSize: 26, fontWeight: "800", color: "#353A40", marginBottom: 20, marginTop: 10 },
    subTitle: { fontSize: 20, fontWeight: "800", color: "#353A40", marginVertical: 15 },
    card: {
        backgroundColor: "#fff",
        padding: 18,
        borderRadius: 24,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
    },
    name: { fontSize: 18, fontWeight: "800", color: "#353A40" },
    severity: { marginTop: 4, color: "#FF7597", fontWeight: "700", fontSize: 12 },
    sub: { marginTop: 12, fontSize: 16, fontWeight: "700", color: "#353A40" },
    cause: { marginTop: 6, fontSize: 14, color: "#595F69", lineHeight: 22 },
    button: {
        backgroundColor: "#353A40",
        padding: 16,
        borderRadius: 30,
        alignItems: "center",
        marginVertical: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
    secondary: { alignItems: "center", marginBottom: 40 },
    secondaryText: { color: "#595F69", fontWeight: "600" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
