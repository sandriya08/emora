import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import {
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

import { API_URL } from "../../constants/api";
import { useAuth } from "../../context/AuthContext";

export default function AdminLoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    setLoading(true);
    console.log(`[Admin] Starting login flow for: ${email}`);

    // Create a 10-second timeout for the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      console.log(`[Admin] Fetching: ${API_URL}/api/admin/login`);
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log(`[Admin] Response status: ${response.status}`);

      const data = await response.json();
      if (response.ok) {
        console.log("[Admin] Success! Routing to dashboard...");
        login(data.user);
        router.replace("/admin/dashboard" as any);
      } else {
        console.warn("[Admin] Server error:", data.message);
        Alert.alert("Login Failed", data.message || "Invalid credentials");
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.error("[Admin] Request timed out");
        Alert.alert("Timeout", "The server is taking too long to respond. Please check your connection.");
      } else {
        console.error("[Admin] Network/Fetch Error:", error);
        Alert.alert("Error", "Unable to reach the server. Please check your network context.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <View style={styles.header}>
          <View style={styles.adminIconCircle}>
            <Ionicons name="shield-checkmark" size={40} color="#FAD7A0" />
          </View>
          <Text style={styles.title}>Admin Portal</Text>
          <Text style={styles.subtitle}>Secure access for system administrators</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#A0A5B1" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Admin Email"
              placeholderTextColor="#A0A5B1"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#A0A5B1" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#A0A5B1"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && { opacity: 0.7, backgroundColor: '#8C8381' }]} 
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? "Authenticating..." : "Login to Dashboard"}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push("/login")} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={16} color="#8C8381" />
          <Text style={styles.backText}>Exit Admin Portal</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF9F6" },
  content: { flex: 1, padding: 24, justifyContent: "center", maxWidth: 450, width: "100%", alignSelf: "center" },
  header: { alignItems: "center", marginBottom: 40 },
  adminIconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#F0F0F0',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
  },
  title: { fontSize: 32, fontWeight: "900", color: "#4A4A4A", marginBottom: 4, letterSpacing: -1 },
  subtitle: { fontSize: 14, color: "#8C8381", textAlign: 'center', fontWeight: "600", textTransform: 'uppercase', letterSpacing: 1 },
  form: { marginBottom: 30 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 22,
    marginBottom: 16,
    height: 64,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: "#353A40", fontSize: 16, fontWeight: "600" },
  button: {
    height: 64,
    borderRadius: 32,
    marginTop: 12,
    backgroundColor: '#4A4A4A',
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "#FFF", fontWeight: "800", fontSize: 18, letterSpacing: 0.5 },
  backButton: { 
      marginTop: 10, 
      alignSelf: 'center', 
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: 8,
      backgroundColor: '#F0F0F0',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
  },
  backText: { color: "#8C8381", fontWeight: "700", fontSize: 13 }
});
