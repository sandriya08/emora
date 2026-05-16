import { Ionicons } from "@expo/vector-icons";
import { Redirect, useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
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
} from "react-native";
import Animated, { 
  FadeInUp, 
  FadeInDown, 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming 
} from "react-native-reanimated";

import { API_URL } from "../constants/api";
import { useAuth } from "../context/AuthContext";

const DecorativeBlob = ({ color, size, top, left, right, bottom }: any) => {
  const scale = useSharedValue(0.8);
  useEffect(() => {
    scale.value = withRepeat(withTiming(1, { duration: 4000 }), -1, true);
  }, []);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View 
      style={[
        styles.blob, 
        { 
          backgroundColor: color, 
          width: size, 
          height: size, 
          borderRadius: size / 2,
          top, left, right, bottom 
        },
        animatedStyle
      ]} 
    />
  );
};

export default function LoginScreen() {
  const router = useRouter();
  const { login, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<'user' | 'therapist'>('user');

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please fill all fields");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.user);
        if (data.user.role === "therapist") {
          router.replace("/therapist/dashboard" as any);
        } else if (data.user.role === "admin") {
          router.replace("/admin/dashboard" as any);
        } else {
          router.replace("/(tabs)" as any);
        }
      } else {
        alert(data.message || "Login failed");
      }
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Blobs */}
      <DecorativeBlob color="rgba(129, 230, 217, 0.2)" size={400} top={-150} left={-150} />
      <DecorativeBlob color="rgba(255, 138, 91, 0.15)" size={300} bottom={-100} right={-100} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Resume your wellness journey</Text>
        </Animated.View>

        {/* Premium Pill Toggle */}
        <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.toggleWrapper}>
          <View style={styles.toggleContainer}>
            <TouchableOpacity 
              style={[styles.toggleBtn, selectedRole === 'user' && styles.activeToggle]}
              onPress={() => setSelectedRole('user')}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, selectedRole === 'user' && styles.activeToggleText]}>Patient</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.toggleBtn, selectedRole === 'therapist' && styles.activeToggle]}
              onPress={() => setSelectedRole('therapist')}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, selectedRole === 'therapist' && styles.activeToggleText]}>Specialist</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.form}>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>{selectedRole === 'therapist' ? "Work Email / ID" : "Email Address"}</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#8C8381" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ex: yourname@email.com"
                placeholderTextColor="#A0A5B1"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Security Password</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#8C8381" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#A0A5B1"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.buttonTouch} onPress={handleLogin} activeOpacity={0.9}>
            <LinearGradient
              colors={['#FAD7A0', '#FFB088']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>
                {selectedRole === 'therapist' ? "Connect to Dashboard" : "Sign In to Emora"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.footer}>
          <View style={styles.registerRow}>
            <Text style={styles.footerText}>First time here? </Text>
            <TouchableOpacity onPress={() => router.push("/register")}>
              <Text style={styles.link}>Join Emora</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.adminLink} 
            onPress={() => router.push("/admin/login" as any)}
          >
            <Text style={styles.adminLinkText}>System Administrator Access</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF9F6",
  },
  blob: {
    position: 'absolute',
    opacity: 0.6,
    zIndex: -1,
  },
  content: {
    flex: 1,
    padding: 30,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 45,
  },
  title: {
    fontSize: 34,
    fontWeight: "900",
    color: "#353A40",
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: "#8C8381",
    fontWeight: "600",
  },
  toggleWrapper: {
    alignItems: 'center',
    marginBottom: 40,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 5,
    borderRadius: 30,
    width: '100%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeToggle: {
    backgroundColor: '#FAD7A0', // Gold active toggle (Replaced Lavender)
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#8C8381',
  },
  activeToggleText: {
    color: '#4A362D', // Dark brown for contrast
  },
  form: {
    marginBottom: 30,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#353A40",
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 18,
    height: 60,
    borderWidth: 1,
    borderColor: "rgba(250, 215, 160, 0.3)", // Soft gold border (Replaced Lavender)
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: "#353A40",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonTouch: {
    marginTop: 15,
    borderRadius: 20,
    shadowColor: "#FAD7A0",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  button: {
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#4A362D", // Dark brown for contrast
    fontWeight: "800",
    fontSize: 17,
    letterSpacing: 1,
  },
  footer: {
    alignItems: "center",
    gap: 25,
  },
  registerRow: {
    flexDirection: "row",
    alignItems: 'center',
  },
  footerText: {
    color: "#8C8381",
    fontSize: 15,
    fontWeight: "600",
  },
  link: {
    color: '#FAD7A0',
    fontWeight: "800",
    fontSize: 15,
  },
  adminLink: {
    opacity: 0.8,
  },
  adminLinkText: {
    color: "#8C8381",
    fontWeight: "700",
    fontSize: 12,
    textDecorationLine: 'underline',
  },
});
