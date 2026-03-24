import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
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
  Alert
} from "react-native";
import { useDiagnosis } from "../../context/DiagnosisContext";
import { API_URL } from "@/constants/api";
import * as Haptics from 'expo-haptics';

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
const getSeverity = (score: number): "Low" | "Moderate" | "High" => {
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
    "To start, could you describe the general emotional atmosphere of your life lately?",
    "How often have you felt overwhelmed by the demands or pressures of your daily routine?",
    "Lately, have you been troubled by persistent worry, nervousness, or a sense of unease?",
    "Have you noticed a significant decline in your mood, or a loss of interest in things you usually enjoy?",
    "Describe your recent energy levels; do you feel a sense of chronic mental or physical depletion?",
    "How has your quality of rest been? Are you finding it difficult to fall asleep or wake up feeling restored?",
    "Lately, how would you describe your internal dialogue or your sense of self-worth?",
    "Have recent life events or shifts made it particularly challenging for you to maintain your balance?",
    "Do you sometimes feel emotionally detached, as if you're running on 'auto-pilot' and finding it hard to connect?",
  ];

  const [currentQuestion, setCurrentQuestion] = useState(-1); // -1 for introductory focus question
  const [inputText, setInputText] = useState("");
  const [completed, setCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [focus, setFocus] = useState<"Individual" | "Couple" | null>(null);

  const initialMessages: Message[] = [
    {
      id: "start-1",
      text: "Hi! I’m here to help you reflect on how you’ve been feeling.",
      sender: "system",
    },
    {
      id: "start-2",
      text: "Before we begin, who is this session for?",
      sender: "system",
    },
  ];

  const [messages, setMessages] = useState<Message[]>(initialMessages);

  const initialScores: Scores = {
    Stress: 0,
    Anxiety: 0,
    Depression: 0,
    Burnout: 0,
    "Sleep Disturbance": 0,
    "Low Self-Esteem": 0,
    "Emotional Exhaustion": 0,
    "Adjustment Issues": 0,
  };

  const [scores, setScores] = useState<Scores>(initialScores);

  /* -------- AUTO SCROLL -------- */
  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  if (!user) {
    return <Redirect href="/" />;
  }

  const handleFocusSelect = (selectedFocus: "Individual" | "Couple") => {
    Haptics.selectionAsync();
    setFocus(selectedFocus);
    
    const userMsg: Message = { 
        id: Date.now().toString(), 
        text: selectedFocus === "Individual" ? "Just for me" : "Our relationship", 
        sender: "user" 
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setCurrentQuestion(0);
    
    setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString() + "-q", text: questions[0], sender: "system" },
        ]);
    }, 600);
  };

  const resetChat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "New Session",
      "Are you sure you want to start a new session?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Start Fresh", 
          onPress: () => {
             setMessages(initialMessages);
             setScores(initialScores);
             setCurrentQuestion(-1);
             setFocus(null);
             setCompleted(false);
             setInputText("");
          }
        }
      ]
    );
  };

  /* -------- ANALYSIS -------- */
  const analyzeAnswer = (text: string) => {
    const t = text.toLowerCase();
    const updated = { ...scores };

    const isNegated =
      t.includes("not ") || t.includes("no ") || t.includes("never ");

    const add = (key: keyof Scores, value = 1) => {
      updated[key] += value;
    };

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
      if (t.includes("stress") || t.includes("pressure") || t.includes("overwhelmed")) add("Stress");
      if (t.includes("anxious") || t.includes("worried") || t.includes("panic")) add("Anxiety");
      if (t.includes("hopeless") || t.includes("empty") || t.includes("worthless")) add("Depression", 2);
      if (t.includes("burnout") || t.includes("emotionally drained")) add("Burnout", 2);
      if (t.includes("can't sleep") || t.includes("insomnia")) add("Sleep Disturbance", 2);
      if (t.includes("not good enough") || t.includes("low confidence")) add("Low Self-Esteem", 2);
      if (t.includes("mentally exhausted") || t.includes("emotionally exhausted")) add("Emotional Exhaustion", 2);
      if (t.includes("hard to adjust") || t.includes("unable to cope")) add("Adjustment Issues");
    }

    setScores(updated);
  };

  /* -------- SEND -------- */
  const handleSend = async () => {
    if (!inputText.trim() || currentQuestion === -1) return;

    const userMsg: Message = { id: Date.now().toString(), text: inputText, sender: "user" };
    analyzeAnswer(inputText);

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");

    if (currentQuestion < questions.length - 1) {
      const nextQ = questions[currentQuestion + 1];
      setCurrentQuestion((q) => q + 1);

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString() + "-q", text: nextQ, sender: "system" },
        ]);
      }, 600);
    } else {
      setIsSaving(true);
      const results: any = {};

      Object.entries(scores).forEach(([key, value]) => {
        if (value > 0) {
          results[key] = {
            score: value,
            severity: getSeverity(value),
            causes: ["Linguistic patterns", "Affirmative responses"],
          };
        }
      });

      try {
        const diagRes = await fetch(`${API_URL}/api/selfcare/diagnosis`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            results: results,
            labels: Object.keys(results),
            focus: focus || "Individual"
          }),
        });
        const diagData = await diagRes.json();
        
        await fetch(`${API_URL}/api/selfcare/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            messages: messages.concat(userMsg).map(m => ({ text: m.text, sender: m.sender })),
            diagnosisId: diagData.diagnosis?._id,
          }),
        });

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (err) {
        console.error("Error saving session:", err);
      } finally {
        setDiagnosisResult(results, Object.keys(results), new Date().toISOString(), focus || "Individual");
        setCompleted(true);
        setIsSaving(false);
        router.replace("/(tabs)/result");
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleGroup}>
          <Ionicons name="leaf-outline" size={28} color="#FF7597" />
          <Text style={styles.headerTitle}>Pulse Check</Text>
        </View>
        <TouchableOpacity style={styles.newSessionBtn} onPress={resetChat}>
           <Text style={styles.newSessionText}>Reset</Text>
           <Ionicons name="refresh-outline" size={16} color="#FF7597" />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.sender === "user" ? styles.userBubble : styles.systemBubble]}>
            <Text style={item.sender === "user" ? styles.userText : styles.systemText}>{item.text}</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={() => (
           currentQuestion === -1 ? (
             <View style={styles.optionsWrapper}>
                <TouchableOpacity activeOpacity={0.9} style={styles.optionBtn} onPress={() => handleFocusSelect("Individual")}>
                   <LinearGradient colors={['#FFF5F7', '#FFFFFF']} style={styles.optionGradient}>
                      <View style={styles.optionIconCircle}>
                        <Ionicons name="person" size={24} color="#FF7597" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.optionCardTitle}>Just for Me</Text>
                        <Text style={styles.optionCardSub}>Personal mental health support</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#FFD1DC" />
                   </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity activeOpacity={0.9} style={styles.optionBtn} onPress={() => handleFocusSelect("Couple")}>
                   <LinearGradient colors={['#F0F9FF', '#FFFFFF']} style={[styles.optionGradient, { borderColor: '#BAE6FD' }]}>
                      <View style={[styles.optionIconCircle, { backgroundColor: '#E0F2FE' }]}>
                        <Ionicons name="people" size={24} color="#0EA5E9" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.optionCardTitle, { color: '#0369A1' }]}>Our Relationship</Text>
                        <Text style={styles.optionCardSub}>Support for couples & marriage</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#BAE6FD" />
                   </LinearGradient>
                </TouchableOpacity>
             </View>
           ) : null
        )}
      />

      {isSaving && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Analyzing pulse...</Text>
        </View>
      )}

      {currentQuestion !== -1 && !completed && (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="How are you feeling?"
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF9F6", paddingBottom: 110 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: 'space-between', padding: 20 },
  headerTitleGroup: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#353A40", marginLeft: 10 },
  newSessionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 5, elevation: 2 },
  newSessionText: { fontSize: 13, fontWeight: '700', color: '#FF7597' },
  listContent: { paddingHorizontal: 20, paddingBottom: 50 },
  bubble: { padding: 16, borderRadius: 24, marginVertical: 8, maxWidth: "85%" },
  userBubble: { alignSelf: "flex-end", backgroundColor: "#FBCFE8" },
  systemBubble: { alignSelf: "flex-start", backgroundColor: "#FFF" },
  userText: { color: "#353A40", fontSize: 16, fontWeight: "600" },
  systemText: { color: "#353A40", fontSize: 16, fontWeight: "500" },
  optionsWrapper: { marginTop: 10, gap: 12 },
  optionBtn: {
    borderRadius: 24,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
    marginBottom: 5,
  },
  optionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#FFD1DC',
    gap: 15,
  },
  optionIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  optionCardTitle: { fontSize: 17, fontWeight: '900', color: '#FF7597' },
  optionCardSub: { fontSize: 13, color: '#8C8381', fontWeight: '500', marginTop: 2 },
  inputWrapper: { padding: 15 },
  inputContainer: { flexDirection: "row", backgroundColor: "#FFF", borderRadius: 30, elevation: 4 },
  input: { flex: 1, paddingHorizontal: 20, fontSize: 16, color: "#353A40" },
  sendButton: { backgroundColor: "#353A40", width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center", margin: 4 },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(250, 249, 246, 0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  loadingText: { fontSize: 18, fontWeight: '700', color: '#FF7597' }
});
