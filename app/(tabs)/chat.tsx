import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  ActivityIndicator,
  Alert
} from "react-native";
import { useDiagnosis } from "../../context/DiagnosisContext";
import { API_URL } from "@/constants/api";
import * as Haptics from 'expo-haptics';
import { confirmAction } from "@/utils/alert";

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
  const { setDiagnosisResult, resetDiagnosis } = useDiagnosis();
  const router = useRouter();

  const flatListRef = useRef<FlatList>(null);
  const systemMessageTimerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (systemMessageTimerRef.current) clearTimeout(systemMessageTimerRef.current);
    };
  }, []);

  /* -------- QUESTIONS -------- */
  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  const [currentQuestion, setCurrentQuestion] = useState(-1); 
  const [inputText, setInputText] = useState("");
  const [completed, setCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [focus, setFocus] = useState<"Individual" | "Couple">("Individual");
  const [messages, setMessages] = useState<Message[]>([]);

  // 0. Fetch questions from DB
  useEffect(() => {
    const fetchQs = async () => {
      try {
        const res = await fetch(`${API_URL}/api/selfcare/questions`);
        const data = await res.json();
        if (res.ok) setQuestions(data);
      } catch (err) {
        console.error("Fetch questions error:", err);
      } finally {
        setLoadingQuestions(false);
      }
    };
    fetchQs();
  }, []);

  // 1. Load persisted chat or start fresh
  useEffect(() => {
    if (loadingQuestions || questions.length === 0) return;

    const loadChat = async () => {
      if (!user?.id) return;
      try {
        const savedMessages = await AsyncStorage.getItem(`chat_msg_${user.id}`);
        const savedIdx = await AsyncStorage.getItem(`chat_idx_${user.id}`);
        const savedComp = await AsyncStorage.getItem(`chat_comp_${user.id}`);

        if (savedMessages) {
          setMessages(JSON.parse(savedMessages));
          const idx = savedIdx ? parseInt(savedIdx) : 0;
          setCurrentQuestion(idx === -1 ? 0 : idx); // Never stay at -1 if there are messages
          if (savedComp) setCompleted(savedComp === 'true');
        } else {
          // Fresh start
          setMessages([
            { id: "start-1", text: "Hi! I’m here to help you reflect on how you’ve been feeling.", sender: "system" },
            { id: "start-q", text: questions[0].text, sender: "system" },
          ]);
          setCurrentQuestion(0);
        }
      } catch (e) {
        console.error("Load chat error:", e);
      }
    };
    loadChat();
  }, [user, loadingQuestions, questions]);

  // 2. Persist chat whenever it changes
  useEffect(() => {
    const persist = async () => {
      if (!user?.id || messages.length === 0) return;
      try {
        await AsyncStorage.setItem(`chat_msg_${user.id}`, JSON.stringify(messages));
        await AsyncStorage.setItem(`chat_idx_${user.id}`, currentQuestion.toString());
        await AsyncStorage.setItem(`chat_comp_${user.id}`, completed.toString());
      } catch (e) {
        console.error("Persist error:", e);
      }
    };
    persist();
  }, [messages, currentQuestion, completed]);

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
    
    if (systemMessageTimerRef.current) clearTimeout(systemMessageTimerRef.current);
    systemMessageTimerRef.current = setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString() + "-q", text: questions[0].text, sender: "system" },
        ]);
    }, 600);
  };

  const resetChat = () => {
    if (systemMessageTimerRef.current) clearTimeout(systemMessageTimerRef.current);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    confirmAction(
      "New Session",
      "Are you sure you want to start a new session?",
      async () => {
        if (user?.id) {
          await AsyncStorage.removeItem(`chat_msg_${user.id}`);
          await AsyncStorage.removeItem(`chat_idx_${user.id}`);
          await AsyncStorage.removeItem(`chat_comp_${user.id}`);
        }

        setMessages([
          { id: "start-1", text: "Hi! I’m here to help you reflect on how you’ve been feeling.", sender: "system" },
          { id: "start-q", text: questions[0].text, sender: "system" },
        ]);
        setScores(initialScores);
        setCurrentQuestion(0);
        setFocus("Individual");
        setCompleted(false);
        setInputText("");
        resetDiagnosis(); // Clear global diagnosis result
      },
      "Start Fresh"
    );
  };

  /* -------- ANALYSIS -------- */
  const analyzeAnswer = (text: string, currentScores: Scores) => {
    const t = text.toLowerCase();
    const updated = { ...currentScores };

    const isNegated =
      t.includes("not ") || t.includes("no ") || t.includes("never ");

    const add = (key: keyof Scores, value = 1) => {
      updated[key] += value;
    };

    if (isYes(t)) {
      const q = questions[currentQuestion];
      if (q && q.category) {
        const cat = q.category as keyof Scores;
        const weight = q.weight || 1;
        add(cat, weight);
      }
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
    return updated;
  };

  /* -------- SEND -------- */
  const handleSend = async () => {
    if (!inputText.trim() || currentQuestion === -1 || isSaving) return;

    const userMsg: Message = { id: Date.now().toString(), text: inputText, sender: "user" };
    const latestScores = analyzeAnswer(inputText, scores);

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");

    if (currentQuestion < questions.length - 1) {
      const nextQ = questions[currentQuestion + 1].text;
      setCurrentQuestion((q) => q + 1);

      if (systemMessageTimerRef.current) clearTimeout(systemMessageTimerRef.current);
      systemMessageTimerRef.current = setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString() + "-q", text: nextQ, sender: "system" },
        ]);
      }, 600);
    } else {
      setIsSaving(true);
      const results: any = {};

      Object.entries(latestScores).forEach(([key, value]) => {
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
          <Ionicons name="leaf-outline" size={28} color="#FAD7A0" />
          <Text style={styles.headerTitle}>Pulse Check</Text>
        </View>
        <TouchableOpacity style={styles.newSessionBtn} onPress={resetChat}>
           <Text style={styles.newSessionText}>Reset</Text>
           <Ionicons name="refresh-outline" size={16} color="#FAD7A0" />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.sender === "user" ? styles.userBubble : styles.systemBubble]}>
            {item.sender === "user" ? (
              <LinearGradient
                colors={['#FAD7A0', '#FFB088']} // Gold to Peach Gradient
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.userGradient}
              >
                <Text style={styles.userText}>{item.text}</Text>
              </LinearGradient>
            ) : (
              <Text style={styles.systemText}>{item.text}</Text>
            )}
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={() => null}
      />

      {loadingQuestions && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FAD7A0" />
          <Text style={styles.loadingText}>Opening book...</Text>
        </View>
      )}

      {isSaving && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FAD7A0" />
          <Text style={styles.loadingText}>Analyzing pulse...</Text>
        </View>
      )}

      {currentQuestion !== -1 && !completed && (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Reflect here..."
              placeholderTextColor="#A0A5B1"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              blurOnSubmit={false}
            />
            <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
              <LinearGradient
                colors={['#FAD7A0', '#FFB088']}
                style={styles.sendGradient}
              >
                <Ionicons name="arrow-up" size={24} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF9F6", paddingBottom: 110 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  headerTitleGroup: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 26, fontWeight: "900", color: "#1A1A1A", marginLeft: 10, letterSpacing: -0.5 },
  newSessionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, gap: 5, elevation: 6, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10 },
  newSessionText: { fontSize: 13, fontWeight: '800', color: '#FFF' },
  listContent: { paddingHorizontal: 20, paddingBottom: 50 },
  bubble: { marginVertical: 6, maxWidth: "88%" },
  userBubble: { alignSelf: "flex-end", overflow: 'hidden', borderRadius: 24, borderBottomRightRadius: 4 },
  userGradient: { padding: 18, paddingHorizontal: 24 },
  systemBubble: { alignSelf: "flex-start", backgroundColor: "#FFF", padding: 18, paddingHorizontal: 24, borderRadius: 24, borderTopLeftRadius: 4, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10 },
  userText: { color: "#FFF", fontSize: 16, fontWeight: "700", lineHeight: 22 },
  systemText: { color: "#353A40", fontSize: 16, fontWeight: "600", lineHeight: 22 },
  optionsWrapper: { marginTop: 10, gap: 12 },
  inputWrapper: { paddingHorizontal: 20, paddingBottom: 25 },
  inputContainer: { 
    flexDirection: "row", 
    backgroundColor: "#F8F9FA", // Light gray glass effect
    borderRadius: 35, 
    padding: 6,
    paddingLeft: 20,
    elevation: 4, 
    shadowColor: "#000", 
    shadowOpacity: 0.1, 
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1,
    borderColor: '#E2E8F0', // Very subtle border
  },
  input: { flex: 1, fontSize: 16, fontWeight: '600', color: "#353A40" },
  sendButton: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  sendGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(250, 249, 246, 0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  loadingText: { fontSize: 18, fontWeight: '800', color: '#FAD7A0' }
});
