import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
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
  Alert,
  Modal,
  FlatList
} from "react-native";
import { API_URL } from "../../constants/api";

type PickerType = "type" | "language" | "style" | "gender" | "specialization";

export default function RegisterTherapistScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [activePicker, setActivePicker] = useState<PickerType | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    location: "",
    gender: "Female",
    experienceYears: "5",
    bio: "",
    type: "Clinical Psychologist",
    category: "Individual",
    specialization: [] as string[],
    language: "English",
    style: "Structured",
    features: [5, 5, 5, 5, 5, 5, 5, 5],
    certificates: ""
  });

  const options = {
    type: [
      "Clinical Psychologist",
      "CBT Therapist",
      "Counseling Psychologist",
      "Psychiatrist",
      "Psychiatric Nurse",
      "Marriage & Family Therapist",
      "Mental Health Counselor",
      "Social Worker"
    ],
    category: ["Individual", "Couple"],
    gender: ["Female", "Male", "Non-binary", "Prefer not to say"],
    language: ["English", "Spanish", "French", "German", "Hindi", "Malayalam", "Tamil", "Mandarin", "Arabic"],
    style: ["Structured (CBT)", "Supportive (Person-Centered)", "Directive", "Exploratory (Psychodynamic)", "Action-Oriented"],
    specialization: [
      "Stress & Pressure",
      "Anxiety & Worry",
      "Depression & Low Mood",
      "Burnout & Fatigue",
      "Sleep & Rest Issues",
      "Confidence & Self-Esteem",
      "Emotional Exhaustion",
      "Life Transitions",
      "Relationship & Marriage",
      "CBT Specialist",
      "Mindfulness & Coping",
      "Grief & Loss Support"
    ]
  };

  const categories = [
    "Stress Relief",
    "Anxiety Management",
    "Depression Support",
    "Burnout Recovery",
    "Sleep Improvement",
    "Self-Esteem Building",
    "Emotional Exhaustion",
    "Adjustment Support"
  ];

  const updateFeature = (index: number, value: string) => {
    if (value === "") {
      const newFeatures = [...form.features];
      newFeatures[index] = "" as any;
      setForm({ ...form, features: newFeatures });
      return;
    }
    const num = parseInt(value);
    if (isNaN(num)) return;
    const clamped = Math.max(0, Math.min(10, num));
    const newFeatures = [...form.features];
    newFeatures[index] = clamped;
    setForm({ ...form, features: newFeatures });
  };

  const handleRegister = async () => {
    const { name, email, password } = form;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!name || !email || !password) {
      Alert.alert("Error", "Please fill required fields (Name, Email, Password)");
      return;
    }
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address (e.g., name@emora.com)");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        experienceYears: parseInt(form.experienceYears) || 0,
        features: form.features.map(f => Number(f) || 5),
        certificates: form.certificates ? form.certificates.split(",").map(c => c.trim()) : []
      };

      const response = await fetch(`${API_URL}/api/admin/register-therapist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert("Success", "Therapist registered successfully");
        router.back();
      } else {
        Alert.alert("Error", data.message || "Registration failed");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const openPicker = (type: PickerType) => {
    setActivePicker(type);
    setPickerVisible(true);
  };

  const toggleSpecialization = (item: string) => {
    const current = [...form.specialization];
    if (current.includes(item)) {
      setForm({ ...form, specialization: current.filter(i => i !== item) });
    } else {
      setForm({ ...form, specialization: [...current, item] });
    }
  };

  const selectOption = (item: string) => {
    if (activePicker === "specialization") {
      toggleSpecialization(item);
    } else if (activePicker) {
      setForm({ ...form, [activePicker]: item });
      setPickerVisible(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#353A40" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Therapist Registration</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Section 1: Authentication */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconCircle}>
                <Ionicons name="key" size={16} color="#FFF" />
              </View>
              <Text style={styles.sectionTitle}>Account Access</Text>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address *</Text>
              <TextInput
                style={styles.input}
                placeholder="email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.email}
                onChangeText={(v) => setForm({ ...form, email: v })}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Access Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                secureTextEntry
                value={form.password}
                onChangeText={(v) => setForm({ ...form, password: v })}
              />
            </View>
          </View>

          {/* Section 2: Professional Details */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.iconCircle, { backgroundColor: '#4A90E2' }]}>
                <Ionicons name="person" size={16} color="#FFF" />
              </View>
              <Text style={[styles.sectionTitle, { color: '#4A90E2' }]}>Professional Identity</Text>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Dr. John Doe"
                value={form.name}
                onChangeText={(v) => setForm({ ...form, name: v })}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Gender</Text>
                <TouchableOpacity style={styles.pickerBtn} onPress={() => openPicker("gender")}>
                  <Text style={styles.pickerBtnText}>{form.gender}</Text>
                  <Ionicons name="chevron-down" size={18} color="#8C8381" />
                </TouchableOpacity>
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Experience (Years)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 10"
                  keyboardType="numeric"
                  value={form.experienceYears}
                  onChangeText={(v) => setForm({ ...form, experienceYears: v })}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Therapist Type</Text>
              <TouchableOpacity style={styles.pickerBtn} onPress={() => openPicker("type")}>
                <Text style={styles.pickerBtnText}>{form.type}</Text>
                <Ionicons name="chevron-down" size={20} color="#8C8381" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Target Audience / Category</Text>
              <TouchableOpacity style={styles.pickerBtn} onPress={() => openPicker("category" as any)}>
                <Text style={styles.pickerBtnText}>{form.category}</Text>
                <Ionicons name="people" size={20} color="#8C8381" />
              </TouchableOpacity>
            </View>

            <View style={[styles.inputGroup, { marginBottom: 5 }]}>
              <Text style={styles.label}>Specializations (Select Multiple)</Text>
              <TouchableOpacity style={[styles.pickerBtn, { minHeight: 50, height: 'auto', paddingVertical: 10 }]} onPress={() => openPicker("specialization")}>
                <View style={styles.tagContainer}>
                  {form.specialization.length > 0 ? (
                    form.specialization.map(s => (
                      <View key={s} style={styles.tag}>
                        <Text style={styles.tagText}>{s}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={[styles.pickerBtnText, { color: '#B0B0B0' }]}>Select specialization tags...</Text>
                  )}
                </View>
                <Ionicons name="add-circle-outline" size={22} color="#FF6F61" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Section 3: Contact & Location */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.iconCircle, { backgroundColor: '#34C759' }]}>
                <Ionicons name="location" size={16} color="#FFF" />
              </View>
              <Text style={[styles.sectionTitle, { color: '#34C759' }]}>Contact & Location</Text>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="+1 (555) 000-0000"
                keyboardType="phone-pad"
                value={form.phone}
                onChangeText={(v) => setForm({ ...form, phone: v })}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Hospital / Area of Work</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. City General Hospital or Downtown Clinic"
                value={form.location}
                onChangeText={(v) => setForm({ ...form, location: v })}
              />
            </View>
          </View>

          {/* Section 4: Clinical Matching */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.iconCircle, { backgroundColor: '#F5A623' }]}>
                <Ionicons name="flask" size={16} color="#FFF" />
              </View>
              <Text style={[styles.sectionTitle, { color: '#F5A623' }]}>Matching Profile</Text>
            </View>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Language</Text>
                <TouchableOpacity style={styles.pickerBtn} onPress={() => openPicker("language")}>
                  <Text style={styles.pickerBtnText}>{form.language}</Text>
                  <Ionicons name="chevron-down" size={20} color="#8C8381" />
                </TouchableOpacity>
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Therapy Style</Text>
                <TouchableOpacity style={styles.pickerBtn} onPress={() => openPicker("style")}>
                  <Text style={styles.pickerBtnText}>{form.style}</Text>
                  <Ionicons name="chevron-down" size={20} color="#8C8381" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Expert Biography</Text>
              <TextInput
                style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                placeholder="Write a brief about the therapist's expertise and approach..."
                multiline
                numberOfLines={4}
                value={form.bio}
                onChangeText={(v) => setForm({ ...form, bio: v })}
              />
            </View>

            <Text style={styles.label}>Expertise Radar Scores (1-10)</Text>
            <Text style={styles.hint}>Used for high-accuracy patient matching.</Text>
            <View style={styles.featuresGrid}>
              {categories.map((cat, index) => (
                <View key={cat} style={styles.featureBox}>
                  <Text style={styles.featureLabel} numberOfLines={1}>{cat}</Text>
                  <TextInput
                    style={styles.featureInput}
                    keyboardType="numeric"
                    maxLength={2}
                    value={form.features[index].toString()}
                    onChangeText={(v) => updateFeature(index, v)}
                  />
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.submitBtn, loading && { opacity: 0.7 }]} 
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.submitBtnText}>{loading ? "Saving Profile..." : "Publish Therapist Profile"}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Dropdown Modal */}
      <Modal visible={pickerVisible} transparent animationType="slide">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setPickerVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose {activePicker?.replace('_', ' ')}</Text>
              {activePicker === "specialization" && (
                <TouchableOpacity onPress={() => setPickerVisible(false)}>
                  <Text style={{ color: '#FF6F61', fontWeight: '800' }}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              data={activePicker ? options[activePicker as keyof typeof options] : []}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const isSelected = activePicker === "specialization" 
                  ? form.specialization.includes(item)
                  : form[activePicker as keyof typeof form] === item;
                
                return (
                  <TouchableOpacity style={styles.optionItem} onPress={() => selectOption(item)}>
                    <Text style={[styles.optionText, isSelected && { color: '#FF6F61' }]}>{item}</Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color="#FF6F61" />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF9F6" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: { fontSize: 18, fontWeight: "900", color: "#353A40" },
  backBtn: { padding: 4 },
  scrollContent: { padding: 15 },
  section: {
    backgroundColor: "#FFF",
    borderRadius: 30,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 15, gap: 10 },
  iconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#FF6F61", justifyContent: "center", alignItems: "center" },
  sectionTitle: { fontSize: 14, fontWeight: "900", color: "#FF6F61", textTransform: "uppercase", letterSpacing: 1 },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: "800", color: "#595F69", marginBottom: 6, paddingLeft: 2 },
  input: {
    backgroundColor: "#F9FAFB",
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    fontSize: 15,
    color: "#353A40",
    fontWeight: "600",
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  pickerBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  pickerBtnText: { fontSize: 15, color: "#353A40", fontWeight: "700" },
  tagContainer: { flexDirection: "row", flexWrap: "wrap", gap: 5, flex: 1 },
  tag: { backgroundColor: "#FFF1F0", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: "#FFD8D4" },
  tagText: { fontSize: 12, color: "#FF6F61", fontWeight: "700" },
  hint: { fontSize: 12, color: "#8C8381", marginBottom: 10 },
  featuresGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  featureBox: { width: "48%", marginBottom: 10 },
  featureLabel: { fontSize: 10, fontWeight: "800", color: "#8C8381", marginBottom: 4, textTransform: "uppercase" },
  featureInput: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    textAlign: "center",
    fontSize: 14,
    fontWeight: "900",
    color: "#353A40",
  },
  submitBtn: {
    backgroundColor: "#353A40",
    padding: 20,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 60,
  },
  submitBtnText: { color: "#FFF", fontWeight: "900", fontSize: 16, letterSpacing: 1 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 30,
    maxHeight: "80%",
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: "900", color: "#353A40", textTransform: 'capitalize' },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#F8F8F8",
  },
  optionText: { fontSize: 16, fontWeight: "700", color: "#595F69" },
});
