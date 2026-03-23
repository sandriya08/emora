import React, { useEffect, useState, useMemo } from "react";
import { StyleSheet, Text, View, ActivityIndicator, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { API_URL } from "@/constants/api";
import { useAuth } from "@/context/AuthContext";
import { useDiagnosis } from "@/context/DiagnosisContext";

type TherapistMatch = {
  _id: string;
  name: string;
  type: string;
  specialization: string[];
  matchScoreString: string;
  matchPercentage: number;
};

export default function TherapistMatchingScreen() {
  const { user } = useAuth();
  const { diagnosisResult } = useDiagnosis();
  const [matches, setMatches] = useState<TherapistMatch[]>([]);
  const [loading, setLoading] = useState(true);

  // Dynamically map diagnosisResult to a 5-element numerical array.
  // We represent: [anxiety, depression, sleep, self_esteem, burnout]
  const userFeatures = useMemo(() => {
    if (!diagnosisResult) return [0.8, 0.2, 0.6, 0.7, 0.5]; // Fallback vector if no test taken
    
    // Normalize scores approximately (max score is typically ~4-8 based on chat.tsx, dividing by 5 caps mostly near 1.0)
    const getScore = (key: string) => {
      const score = diagnosisResult[key]?.score || 0;
      return Math.min(score / 5, 1.0); 
    };

    return [
      getScore("Anxiety"),
      getScore("Depression"),
      getScore("Sleep Disturbance"),
      getScore("Low Self-Esteem"),
      getScore("Burnout")
    ];
  }, [diagnosisResult]);

  useEffect(() => {
    fetchMatches();
  }, [userFeatures]);

  const fetchMatches = async () => {
    try {
      const response = await fetch(`${API_URL}/api/therapist/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features: userFeatures })
      });
      const data = await response.json();
      setMatches(data);
    } catch (error) {
      console.error("Match error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#FF7597" />
        <Text style={{ marginTop: 10, color: "#FF7597" }}>Finding your ideal matches...</Text>
      </View>
    );
  }

  const bestMatch = matches[0];
  const alternatives = matches.slice(1);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Recommended for you</Text>

      {/* BEST MATCH */}
      {bestMatch && (
        <View style={[styles.card, styles.bestMatchCard]}>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>⭐ Best Match</Text>
          </View>
          <Text style={styles.therapistName}>{bestMatch.name}</Text>
          <Text style={styles.therapistType}>{bestMatch.type}</Text>
          
          <View style={styles.specialtyContainer}>
            {bestMatch.specialization.map((spec, idx) => (
              <Text key={idx} style={styles.specialtyChip}>{spec}</Text>
            ))}
          </View>
          
          <View style={styles.footerRow}>
               <Text style={styles.matchScore}>{bestMatch.matchScoreString} Match</Text>
               <TouchableOpacity style={styles.bookBtn}>
                  <Text style={styles.bookBtnText}>Book Session</Text>
               </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ALTERNATIVES */}
      {alternatives.length > 0 && (
        <View style={styles.alternativesSection}>
          <Text style={styles.sectionTitle}>Other great options</Text>
          {alternatives.map((alt, idx) => (
            <View key={alt._id} style={styles.card}>
              <View style={styles.altHeaderRow}>
                 <Text style={styles.therapistNameSmall}>{alt.name}</Text>
                 <Text style={styles.matchScoreSmall}>{alt.matchScoreString}</Text>
              </View>
              <Text style={styles.therapistType}>{alt.type}</Text>
              <View style={styles.specialtyContainer}>
              {alt.specialization.map((spec, s_idx) => (
                <Text key={s_idx} style={styles.specialtyChipAlt}>{spec}</Text>
              ))}
              </View>
              <View style={styles.altFooterRow}>
                <TouchableOpacity style={styles.bookBtnSmall}>
                  <Text style={styles.bookBtnTextSmall}>Book Session</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF9F6", // Starbucks Minimal Background
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 110, // Avoid bottom tab bar
  },
  center: {
    justifyContent: "center",
    alignItems: "center"
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FF7597", // Starbucks Green
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  bestMatchCard: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  badgeContainer: {
    backgroundColor: "#FFF5F7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  badgeText: {
    color: "#FF7597",
    fontWeight: "600",
    fontSize: 12,
  },
  therapistName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#353A40",
  },
  therapistNameSmall: {
    fontSize: 18,
    fontWeight: "600",
    color: "#353A40",
  },
  therapistType: {
    fontSize: 14,
    color: "#595F69",
    marginTop: 4,
  },
  specialtyContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    marginBottom: 4,
  },
  specialtyChip: {
    backgroundColor: "#FFF5F7",
    color: "#555",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  specialtyChipAlt: {
    backgroundColor: "#FAF9F6",
    color: "#777",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    fontSize: 11,
    marginRight: 6,
    marginTop: 4
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 16,
  },
  matchScore: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FF7597",
  },
  matchScoreSmall: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FF7597",
  },
  bookBtn: {
    backgroundColor: "#FF7597",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  bookBtnText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },
  alternativesSection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#353A40",
    marginBottom: 12,
  },
  altHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  altFooterRow: {
    alignItems: "flex-end", // Align to the right
    marginTop: 5,
  },
  bookBtnSmall: {
    backgroundColor: "#FF7597",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  bookBtnTextSmall: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 12,
  }
});
