import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useDiagnosis } from "../../context/DiagnosisContext";
import { API_URL } from "@/constants/api";

/* -------- TYPES -------- */
type Scores = {
  Stress: number;
  Anxiety: number;
  Depression: number;
  Burnout: number;
  "Sleep Disturbance": number;
  "Low Self-Esteem": number;
  "Emotional Exhaustion": number;
  "Adjustment Issues": number;
};

type Message = {
  id: string;
  text: string;
  sender: "user" | "system";
};

/* -------- YES LEXICON -------- */
const isYes = (t: string) =>
  ["yes", "yeah", "yep", "kind of", "sometimes", "i do", "a little"].includes(t);

/* -------- SEVERITY -------- */
const getSeverity = (score: number) => {
  if (score >= 4) return "High";
  if (score >= 2) return "Moderate";
  return "Low";
};

export default function ChatScreen() {
  const { user } = useAuth();
  const { setDiagnosisResult } = useDiagnosis();
  const router = useRouter();

  const flatListRef = useRef<FlatList>(null);

  /* -------- QUESTIONS -------- */
  const questions = [
    "How have you been feeling emotionally over the past few days?",
    "Do you feel stressed or under pressure frequently?",
    "Do you experience excessive worry or nervousness?",
    "Have you been feeling low, empty, or hopeless recently?",
    "Do you feel mentally or physically exhausted most days?",
    "Do you have trouble sleeping or feel tired even after sleep?",
    "Do you often doubt yourself or feel not good enough?",
    "Have recent changes made it difficult for you to adjust or cope?",
    "Do you feel emotionally drained or detached from daily responsibilities?",
  ];

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [inputText, setInputText] = useState("");
  const [completed, setCompleted] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "start-1",
      text:
        "Hi! I’m here to help you reflect on how you’ve been feeling. Please answer honestly — there are no right or wrong answers.",
      sender: "system",
    },
    {
      id: "start-2",
      text: questions[0],
      sender: "system",
    },
  ]);

  const [scores, setScores] = useState<Scores>({
    Stress: 0,
    Anxiety: 0,
    Depression: 0,
    Burnout: 0,
    "Sleep Disturbance": 0,
    "Low Self-Esteem": 0,
    "Emotional Exhaustion": 0,
    "Adjustment Issues": 0,
  });

  /* -------- AUTO SCROLL -------- */
  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  if (!user) {
    return <Redirect href="/" />;
  }

  /* -------- ANALYSIS -------- */
  const analyzeAnswer = (text: string) => {
    const t = text.toLowerCase();
    const updated = { ...scores };

    const isNegated =
      t.includes("not ") || t.includes("no ") || t.includes("never ");

    const add = (key: keyof Scores, value = 1) => {
      updated[key] += value;
    };

    /* YES / NO (QUESTION AWARE) */
    if (isYes(t)) {
      if (currentQuestion === 1) add("Stress");
      if (currentQuestion === 2) add("Anxiety");
      if (currentQuestion === 3) add("Depression");
      if (currentQuestion === 4) add("Emotional Exhaustion", 2);
      if (currentQuestion === 5) add("Sleep Disturbance", 2);
      if (currentQuestion === 6) add("Low Self-Esteem", 2);
      if (currentQuestion === 7) add("Adjustment Issues");
      if (currentQuestion === 8) add("Burnout", 2);
    }

    if (!isNegated) {
      /* STRESS */
      if (
        t.includes("stress") ||
        t.includes("pressure") ||
        t.includes("overwhelmed") ||
        t.includes("deadline") ||
        t.includes("workload")
      )
        add("Stress");

      /* ANXIETY */
      if (
        t.includes("anxious") ||
        t.includes("worried") ||
        t.includes("panic") ||
        t.includes("fear") ||
        t.includes("nervous") ||
        t.includes("overthinking")
      )
        add("Anxiety");

      /* DEPRESSION */
      if (
        t.includes("hopeless") ||
        t.includes("empty") ||
        t.includes("worthless") ||
        t.includes("depressed") ||
        t.includes("nothing matters")
      )
        add("Depression", 2);

      /* BURNOUT */
      if (
        t.includes("burnout") ||
        t.includes("burned out") ||
        t.includes("emotionally drained") ||
        t.includes("fed up")
      )
        add("Burnout", 2);

      /* SLEEP */
      if (
        t.includes("can't sleep") ||
        t.includes("insomnia") ||
        t.includes("sleep deprived")
      )
        add("Sleep Disturbance", 2);

      /* LOW SELF-ESTEEM */
      if (
        t.includes("not good enough") ||
        t.includes("low confidence") ||
        t.includes("feel useless") ||
        t.includes("failure") ||
        t.includes("hate myself")
      )
        add("Low Self-Esteem", 2);

      /* EMOTIONAL EXHAUSTION */
      if (
        t.includes("mentally exhausted") ||
        t.includes("emotionally exhausted")
      )
        add("Emotional Exhaustion", 2);

      /* ADJUSTMENT */
      if (
        t.includes("hard to adjust") ||
        t.includes("unable to cope") ||
        t.includes("life changes")
      )
        add("Adjustment Issues");
    }

    setScores(updated);
  };

  /* -------- MULTI-LABEL RESULT -------- */
  const getDetectedResults = (scores: Scores) => {
    const results: string[] = [];

    Object.entries(scores).forEach(([key, value]) => {
      if (value >= 2) {
        results.push(`${key} (${getSeverity(value)})`);
      }
    });

    return results.length > 0
      ? results
      : ["No strong emotional pattern detected"];
  };


  /* -------- SEVERITY -------- */
  const getSeverity = (score: number): "Low" | "Moderate" | "High" => {
    if (score >= 4) return "High";
    if (score >= 2) return "Moderate";
    return "Low";
  };

  /* -------- SEND -------- */
  const handleSend = async () => {
    if (!inputText.trim()) return;

    analyzeAnswer(inputText);

    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), text: inputText, sender: "user" },
    ]);

    setInputText("");

    if (currentQuestion < questions.length - 1) {
      const nextQ = questions[currentQuestion + 1];
      setCurrentQuestion((q) => q + 1);

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString() + "-q", text: nextQ, sender: "system" },
        ]);
      }, 500);
    } else {
      const results: any = {};

      Object.entries(scores).forEach(([key, value]) => {
        if (value > 0) {
          results[key] = {
            score: value,
            severity: getSeverity(value),
            causes: [
              "Detected through repeated linguistic indicators",
              "Affirmative responses to related questions",
            ],
          };
        }
      });

      // Save diagnosis to backend
      try {
        await fetch(`${API_URL}/api/selfcare/diagnosis`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            results: results,
            labels: Object.keys(results),
          }),
        });
      } catch (err) {
        console.error("Error saving diagnosis:", err);
      }

      setDiagnosisResult(results);
      setCompleted(true);
      router.replace("/result");
    }
  };

  const renderItem = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.bubble,
        item.sender === "user" ? styles.userBubble : styles.systemBubble,
      ]}
    >
      <Text style={item.sender === "user" ? styles.userText : styles.systemText}>
        {item.text}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="leaf-outline" size={28} color="#FF7597" />
        <Text style={styles.headerTitle}>Emotional Reflection</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />

      {!completed && (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.inputWrapper}
        >
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type your answer..."
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              blurOnSubmit={false}
            />
            <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
              <Ionicons name="arrow-up" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

/* -------- STYLES -------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF9F6", paddingBottom: 110 },
  header: { flexDirection: "row", alignItems: "center", padding: 20 },
  headerTitle: { fontSize: 26, fontWeight: "800", color: "#353A40", marginLeft: 10 },
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  bubble: { padding: 16, borderRadius: 24, marginVertical: 8, maxWidth: "85%", shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  userBubble: { alignSelf: "flex-end", backgroundColor: "#FBCFE8" },
  systemBubble: { alignSelf: "flex-start", backgroundColor: "#FFF" },
  userText: { color: "#353A40", fontSize: 16, fontWeight: "500" },
  systemText: { color: "#353A40", fontSize: 16, fontWeight: "500" },
  inputWrapper: { padding: 15 },
  inputContainer: { flexDirection: "row", backgroundColor: "#FFF", borderRadius: 30, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  input: { flex: 1, paddingHorizontal: 20, fontSize: 16, color: "#353A40" },
  sendButton: {
    backgroundColor: "#353A40",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 4,
    marginTop: 4,
    marginBottom: 4
  },
});
