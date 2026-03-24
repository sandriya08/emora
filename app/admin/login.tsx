import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
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
    try {
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("JSON parse error:", jsonError);
        Alert.alert("Server Error", "The server returned an invalid response.");
        setLoading(false);
        return;
      }

      if (response.ok) {
        console.log("Login successful:", data);
        login(data.user);
        router.replace("/admin/dashboard" as any);
      } else {
        Alert.alert("Login Failed", data.message || "Invalid credentials");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Connection Error", "Unable to connect to admin server");
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
          <Text style={styles.title}>Admin Portal</Text>
          <Text style={styles.subtitle}>Secure access for system administrators</Text>
        </View>

        {/* Role Selection */}
        <View style={styles.roleContainer}>
          <TouchableOpacity 
            style={[styles.roleBox, { borderColor: '#FF7597' }]}
            onPress={() => router.push("/login")}
          >
            <View style={[styles.roleIconCircle, { backgroundColor: '#FF7597' }]}>
              <Ionicons name="heart" size={24} color="#FFF" />
            </View>
            <Text style={styles.roleLabel}>Patient</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.roleBox, { borderColor: '#4A90E2' }]}
            onPress={() => router.push("/login")}
          >
            <View style={[styles.roleIconCircle, { backgroundColor: '#4A90E2' }]}>
              <Ionicons name="medkit" size={24} color="#FFF" />
            </View>
            <Text style={styles.roleLabel}>Therapist</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.roleBox, { borderColor: '#353A40', backgroundColor: '#F0F0F0' }]}
            onPress={() => {}} // Already on admin login
          >
            <View style={[styles.roleIconCircle, { backgroundColor: '#353A40' }]}>
              <Ionicons name="shield-checkmark" size={24} color="#FFF" />
            </View>
            <Text style={styles.roleLabel}>Admin</Text>
          </TouchableOpacity>
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
            style={[styles.button, loading && { opacity: 0.7 }]} 
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? "Authenticating..." : "Login to Dashboard"}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push("/login")} style={styles.backButton}>
          <Text style={styles.backText}>Exit Admin Portal</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF9F6" },
  content: { flex: 1, padding: 24, justifyContent: "center", maxWidth: 450, width: "100%", alignSelf: "center" },
  header: { alignItems: "center", marginBottom: 30 },
  title: { fontSize: 32, fontWeight: "900", color: "#353A40", marginBottom: 4, letterSpacing: -1 },
  subtitle: { fontSize: 15, color: "#8C8381", textAlign: 'center', fontWeight: "600" },
  roleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    gap: 12,
  },
  roleBox: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  roleIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  roleLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#353A40",
  },
  form: { marginBottom: 20 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 20,
    marginBottom: 12,
    height: 60,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: "#353A40", fontSize: 16, fontWeight: "600" },
  button: {
    backgroundColor: "#FF7597", 
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    shadowColor: "#FF7597",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: { color: "#FFF", fontWeight: "800", fontSize: 18 },
  backButton: { marginTop: 24, alignSelf: 'center' },
  backText: { color: "#8C8381", fontWeight: "800", fontSize: 15 }
});
