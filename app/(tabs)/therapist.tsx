import { API_URL } from "@/constants/api";
import { useDiagnosis } from "@/context/DiagnosisContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  interpolate,
  useAnimatedStyle,
  FadeInUp,
  useSharedValue,
  withRepeat,
  withTiming,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuth } from "@/context/AuthContext";

const { width, height } = Dimensions.get("window");

// Colors: "Love" Theme Refined
const COLORS = {
  cream: "#FAF9F6",
  pink: "#FF7597", // Consistent pink
  navy: "#353A40", // Navy Text/Buttons
  softPink: "#F2E1D9",
  sage: "#A8B6AF",
  white: "#FFFFFF",
};

interface TherapistMatch {
  _id: string;
  name: string;
  type: string;
  specialization: string[];
  certificates: string[];
  isSpecialist: boolean;
}

const SkeletonPulse = ({ style }: { style?: any }) => {
  const opacity = useSharedValue(0.3);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.6, { duration: 800 }), -1, true);
  }, []);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[{ backgroundColor: '#E1E9EE' }, animatedStyle, style]} />;
};

export default function TherapistMatchingScreen() {
  const { user } = useAuth();
  const { diagnosisResult, diagnosisLabels, diagnosisFocus, fetchLatest } = useDiagnosis();
  const [matches, setMatches] = useState<TherapistMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [savedTherapists, setSavedTherapists] = useState<TherapistMatch[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedTherapist, setSelectedTherapist] = useState<TherapistMatch | null>(null);
  const [selectedDate, setSelectedDate] = useState('Today');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedFocus, setSelectedFocus] = useState(diagnosisFocus || 'Individual');
  const router = useRouter();

  const userFeatures = useMemo(() => {
    if (!diagnosisResult)
      return [0.8, 0.2, 0.6, 0.7, 0.5, 0.4, 0.6, 0.5];

    const getScore = (key: string) =>
      Math.min((diagnosisResult[key]?.score || 0) / 5, 1);

    return [
      getScore("Anxiety"),
      getScore("Depression"),
      getScore("Sleep Disturbance"),
      getScore("Low Self-Esteem"),
      getScore("Burnout"),
      getScore("Stress"),
      getScore("Emotional Exhaustion"),
      getScore("Adjustment Issues"),
    ];
  }, [diagnosisResult]);

  useEffect(() => {
    if (!diagnosisResult && user?.id) {
       fetchLatest(user.id, API_URL).then(() => {
         if (diagnosisFocus) setSelectedFocus(diagnosisFocus);
       });
    }
  }, [user]);

  useEffect(() => {
    fetchMatches();
    fetchSaved();
  }, [userFeatures, diagnosisLabels, selectedFocus]);

  const fetchSaved = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_URL}/api/therapist/saved?userId=${user.id}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setSavedIds(data.map(t => t._id));
        setSavedTherapists(data);
      }
    } catch (err) {
      console.error("Fetch Saved Error:", err);
    }
  };

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/therapist/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          features: userFeatures,
          labels: diagnosisLabels,
          focus: selectedFocus
        }),
      });

      if (!res.ok) {
        setMatches([]);
        return;
      }

      const data = await res.json();
      setMatches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch Error:", err);
      setMatches([]);
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  };

  const [viewMode, setViewMode] = useState<'swipe' | 'list'>('swipe');

  const toggleSave = async (therapistId: string) => {
    if (!user?.id) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await fetch(`${API_URL}/api/therapist/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, therapistId }),
      });
      const data = await res.json();
      if (data.saved) {
        setSavedIds(prev => [...prev, therapistId]);
      } else {
        setSavedIds(prev => prev.filter(id => id !== therapistId));
      }
      fetchSaved();
    } catch (err) {
      console.error("Save Error:", err);
    }
  };

  const bookTherapist = async () => {
    if (!user?.id || !selectedTherapist || !selectedDate || !selectedTime) {
      alert("Please select a time slot.");
      return;
    }
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const res = await fetch(`${API_URL}/api/therapist/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: user.id, 
          therapistId: selectedTherapist._id,
          date: selectedDate,
          time: selectedTime
        }),
      });
      const data = await res.json();
      if (data.booked) {
        setShowBookingModal(false);
        setSelectedTime('');
        // Alert first, then redirect
        alert(`Session booked with ${selectedTherapist.name} for ${selectedDate} at ${selectedTime}!`);
        
        // Use replace to avoid going back to the modal
        router.push('/(tabs)/saved');
      } else {
        alert(data.message || "Could not book session.");
      }
    } catch (err: any) {
      console.error("Book Error:", err);
      alert(`Booking failed: ${err.message || 'Unknown error'}`);
    }
  };

  const openBooking = (therapist: TherapistMatch) => {
    setSelectedTherapist(therapist);
    setShowBookingModal(true);
  };

  const nextCard = () => {
    setCurrentIndex(prev => prev + 1);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <SkeletonPulse style={{ width: width * 0.8, height: height * 0.4, borderRadius: 40, marginBottom: 20 }} />
        <SkeletonPulse style={{ width: width * 0.6, height: 40, borderRadius: 10, marginBottom: 20 }} />
        <SkeletonPulse style={{ width: width * 0.8, height: 100, borderRadius: 24 }} />
        <Text style={styles.loadingText}>Finding your perfect guide...</Text>
      </View>
    );
  }

  const renderTherapistList = () => {
    return (
      <FlatList
        data={matches}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isSaved = savedIds.includes(item._id);
          return (
            <TouchableOpacity style={styles.listItem}>
              <View style={styles.listItemHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listName}>{item.name}</Text>
                  <Text style={styles.listType}>{item.type}</Text>
                </View>
                <TouchableOpacity onPress={() => toggleSave(item._id)}>
                  <Ionicons 
                    name={isSaved ? "bookmark" : "bookmark-outline"} 
                    size={24} 
                    color={isSaved ? COLORS.pink : COLORS.navy} 
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.listSpecializations}>
                {item.specialization.slice(0, 3).map((s, i) => (
                  <View key={i} style={styles.smallTag}>
                    <Text style={styles.smallTagText}>{s}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity 
                style={styles.listActionButton}
                onPress={() => openBooking(item)}
              >
                <Text style={styles.listActionText}>Book Session</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="people-outline" size={60} color="#D1D1D1" />
            <Text style={styles.emptyText}>No matches found yet.</Text>
          </View>
        }
      />
    );
  };

  const TinderCard = ({ item, index, isTop }: { item: TherapistMatch; index: number; isTop: boolean }) => {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    const panGesture = Gesture.Pan()
      .onUpdate((event) => {
        translateX.value = event.translationX;
        translateY.value = event.translationY;
      })
      .onEnd((event) => {
        if (Math.abs(event.translationX) > 120) {
          translateX.value = withSpring(event.translationX > 0 ? width * 1.5 : -width * 1.5);
          runOnJS(nextCard)();
        } else {
          translateX.value = withSpring(0);
          translateY.value = withSpring(0);
        }
      });

    const animatedStyle = useAnimatedStyle(() => {
      const rotate = interpolate(translateX.value, [-width / 2, width / 2], [-10, 10]);
      return {
        transform: [
          { translateX: translateX.value },
          { translateY: translateY.value },
          { rotate: `${rotate}deg` },
        ],
        zIndex: isTop ? 100 : -index,
        opacity: isTop ? 1 : 0.9 - index * 0.1,
      };
    });

    const isSaved = savedIds.includes(item._id);

    return (
      <GestureDetector gesture={isTop ? panGesture : Gesture.Native()}>
        <Animated.View style={[styles.slideAbsolute, animatedStyle]}>
          <LinearGradient
            colors={[COLORS.softPink, COLORS.cream]}
            style={styles.heroBackground}
          />
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.headerLeft}>
                {item.isSpecialist && (
                  <View style={styles.specialistBadge}>
                    <Ionicons name="ribbon" size={14} color="#FFF" />
                    <Text style={styles.specialistText}>Specialist</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => toggleSave(item._id)}>
                <Ionicons 
                  name={isSaved ? "bookmark" : "bookmark-outline"} 
                  size={32} 
                  color={isSaved ? COLORS.pink : COLORS.navy} 
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.type}>{item.type}</Text>

            <Text style={styles.description}>
              Expert in helping you navigate {item.specialization.slice(0, 2).join(" & ").toLowerCase()}.
            </Text>

            <View style={styles.tags}>
              {item.specialization.map((t: string, i: number) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{t}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity 
              style={styles.mainActionTouch}
              onPress={() => openBooking(item)}
            >
              <LinearGradient
                colors={['#FF7597', '#FF9EAE']}
                style={styles.mainButton}
              >
                <Text style={styles.mainButtonText}>Book Session</Text>
                <Ionicons name="calendar-outline" size={20} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </GestureDetector>
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.screenHeader}>
        <View>
          <Text style={styles.screenTitle}>Your Matches</Text>
          <Text style={styles.screenSubtitle}>Hand-picked for you</Text>
        </View>
        <TouchableOpacity 
          style={styles.viewToggle} 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setViewMode(prev => prev === 'swipe' ? 'list' : 'swipe');
          }}
        >
          <Ionicons name={viewMode === 'swipe' ? "list" : "layers"} size={24} color={COLORS.navy} />
        </TouchableOpacity>
      </View>

      <View style={styles.focusContainer}>
        <Text style={styles.focusLabel}>Who is this session for?</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.focusChips}>
          {['Individual', 'Couple'].map(focus => (
            <TouchableOpacity 
              key={focus} 
              style={[styles.focusChip, selectedFocus === focus && styles.focusChipActive]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedFocus(focus);
              }}
            >
              <Ionicons 
                name={focus === 'Individual' ? 'person' : 'people'} 
                size={16} 
                color={selectedFocus === focus ? '#FFF' : COLORS.navy} 
              />
              <Text style={[styles.focusChipText, selectedFocus === focus && styles.focusChipTextActive]}>
                {focus}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {viewMode === 'swipe' ? (
        <View style={styles.cardStack}>
          {matches.slice(currentIndex, currentIndex + 3).reverse().map((item, index, arr) => (
            <View key={item._id} style={StyleSheet.absoluteFill}>
              <TinderCard 
                item={item} 
                index={index} 
                isTop={index === arr.length - 1} 
              />
            </View>
          ))}
          {matches.length <= currentIndex && (
            <View style={styles.center}>
              <Ionicons name="sparkles-outline" size={60} color="#D1D1D1" />
              <Text style={styles.emptyText}>You've seen all your matches!</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => setCurrentIndex(0)}>
                <Text style={styles.retryText}>Start Over</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        renderTherapistList()
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <View style={styles.modalOverlay}>
           <Animated.View entering={FadeInUp} style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select a Slot</Text>
                <TouchableOpacity onPress={() => setShowBookingModal(false)}>
                  <Ionicons name="close" size={24} color={COLORS.navy} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalLabel}>Choose Day</Text>
              <View style={styles.chipRow}>
                {['Today', 'Tomorrow', 'Wed 25'].map(day => (
                  <TouchableOpacity 
                    key={day} 
                    style={[styles.chip, selectedDate === day && styles.chipActive]}
                    onPress={() => setSelectedDate(day)}
                  >
                    <Text style={[styles.chipText, selectedDate === day && styles.chipTextActive]}>{day}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalLabel}>Available Times</Text>
              <View style={styles.chipRow}>
                {['9:00 AM', '11:00 AM', '2:00 PM', '4:30 PM'].map(time => (
                  <TouchableOpacity 
                    key={time} 
                    style={[styles.chip, selectedTime === time && styles.chipActive]}
                    onPress={() => {
                        console.log("[therapist.tsx] Selected time:", time);
                        setSelectedTime(time);
                    }}
                  >
                    <Text style={[styles.chipText, selectedTime === time && styles.chipTextActive]}>{time}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity 
                activeOpacity={0.7}
                style={styles.confirmButton} 
                onPress={() => {
                  console.log("[therapist.tsx] Confirm Booking clicked");
                  bookTherapist();
                }}
              >
                <Text style={styles.confirmButtonText}>Confirm Booking</Text>
              </TouchableOpacity>
           </Animated.View>
        </View>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.cream,
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: COLORS.navy,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.navy,
    marginVertical: 20,
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 24,
  },
  retryButton: {
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 24,
    backgroundColor: COLORS.navy,
    elevation: 4,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 15,
  },
  slideAbsolute: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  cardStack: {
    flex: 1,
    paddingTop: height * 0.1,
  },
  heroBackground: {
    position: "absolute",
    top: 0,
    width,
    height: height * 1.0,
  },
  card: {
    height: height * 0.6,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    padding: 30,
    shadowColor: COLORS.navy,
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 20,
    marginHorizontal: 10,
    marginBottom: height * 0.1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  specialistBadge: {
    backgroundColor: COLORS.pink,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  specialistText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.navy,
    marginBottom: 4,
  },
  type: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.pink,
    marginBottom: 15,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: "#595F69",
    marginBottom: 20,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 25,
    gap: 8,
  },
  tag: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  tagText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.navy,
  },
  mainActionTouch: {
    marginTop: 'auto',
    marginBottom: 10,
  },
  mainButton: {
    flexDirection: 'row',
    alignItems: "center",
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 24,
    gap: 10,
    elevation: 8,
    shadowColor: COLORS.pink,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  mainButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "800",
  },
  screenHeader: {
    paddingHorizontal: 25,
    paddingTop: height * 0.08,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.navy,
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 14,
    color: '#8C8381',
    fontWeight: '600',
    marginTop: 2,
  },
  viewToggle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  listContent: {
    padding: 20,
    paddingBottom: 150,
  },
  listItem: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: COLORS.navy,
    shadowOpacity: 0.05,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  listName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.navy,
  },
  listType: {
    fontSize: 13,
    color: COLORS.pink,
    fontWeight: '700',
    marginTop: 2,
  },
  listSpecializations: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 15,
  },
  smallTag: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  smallTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#595F69',
  },
  listActionButton: {
    backgroundColor: COLORS.navy,
    paddingVertical: 12,
    borderRadius: 15,
    alignItems: 'center',
  },
  listActionText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(53, 58, 64, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    width: width * 0.9,
    backgroundColor: COLORS.white,
    borderRadius: 30,
    padding: 25,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.navy,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8C8381',
    marginBottom: 10,
    marginTop: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 15,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 15,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  chipActive: {
    backgroundColor: COLORS.pink,
    borderColor: COLORS.pink,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
  },
  chipTextActive: {
    color: COLORS.white,
  },
  confirmButton: {
    backgroundColor: COLORS.navy,
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
  focusContainer: {
    paddingHorizontal: 25,
    marginBottom: 10,
  },
  focusLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8C8381',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  focusChips: {
    gap: 10,
    paddingRight: 20,
  },
  focusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  focusChipActive: {
    backgroundColor: COLORS.pink,
    borderColor: COLORS.pink,
  },
  focusChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
  },
  focusChipTextActive: {
    color: '#FFF',
  },
});