import { Ionicons } from "@expo/vector-icons";
import { Redirect, useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { 
  FadeInUp, 
  FadeInDown, 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming 
} from "react-native-reanimated";
import { useAuth } from "../context/AuthContext";

import { API_URL } from "../constants/api";

const DecorativeBlob = ({ color, size, top, left, right, bottom }: any) => {
  const scale = useSharedValue(0.8);
  useEffect(() => {
    scale.value = withRepeat(withTiming(1, { duration: 5000 }), -1, true);
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

export default function RegisterScreen() {
  const router = useRouter();
  const { user, login } = useAuth();

  if (user) {
    return <Redirect href="/" />;
  }

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      alert("Please fill all fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.user) {
          login(data.user);
          router.replace("/(tabs)");
        } else {
          router.replace("/login");
        }
      } else {
        alert(data.message || "Registration failed");
      }
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <DecorativeBlob color="rgba(129, 230, 217, 0.2)" size={400} top={-150} right={-150} />
      <DecorativeBlob color="rgba(255, 138, 91, 0.25)" size={300} bottom={-100} left={-100} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="sparkles" size={40} color="#81E6D9" />
            </View>
            <Text style={styles.title}>Begin Journey</Text>
            <Text style={styles.subtitle}>Let Emora support your growth</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.form}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Display Name</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#8C8381" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="How should we call you?"
                  placeholderTextColor="#A0A5B1"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Email Account</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#8C8381" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="yourname@example.com"
                  placeholderTextColor="#A0A5B1"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Create Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#8C8381" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Minimum 8 characters"
                  placeholderTextColor="#A0A5B1"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Verify Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#8C8381" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Repeat your password"
                  placeholderTextColor="#A0A5B1"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.buttonTouch} onPress={handleRegister} activeOpacity={0.9}>
              <LinearGradient
                colors={['#FAD7A0', '#FFB088']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                <Text style={styles.buttonText}>Start Account</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.footer}>
            <Text style={styles.footerText}>Already part of Emora? </Text>
            <TouchableOpacity onPress={() => router.replace("/login")}>
              <Text style={styles.link}>Sign In Here</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
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
  },
  scrollContent: {
    padding: 30,
    flexGrow: 1,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 35,
    marginTop: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF',
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#4A362D",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#8C8381",
    fontWeight: "600",
    textAlign: "center",
  },
  form: {
    marginBottom: 25,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#4A362D",
    marginBottom: 6,
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
    borderColor: "rgba(230, 230, 250, 0.5)",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: "#4A362D",
    fontSize: 15,
    fontWeight: "600",
  },
  buttonTouch: {
    marginTop: 20,
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
    fontSize: 18,
    letterSpacing: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    paddingBottom: 30,
    alignItems: 'center',
  },
  footerText: {
    color: "#8C8381",
    fontSize: 15,
    fontWeight: '600',
  },
  link: {
    color: '#FAD7A0',
    fontWeight: "800",
    fontSize: 15,
  },
});
