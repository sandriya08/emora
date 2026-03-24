import { API_URL } from "@/constants/api";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

const COLORS = {
  cream: "#FAF9F6",
  pink: "#FF7597",
  navy: "#353A40",
  white: "#FFFFFF",
};

interface TherapistMatch {
  _id: string;
  name: string;
  type: string;
  specialization: string[];
  certificates: string[];
  isSpecialist: boolean;
  date?: string; // For booked sessions
  time?: string; // For booked sessions
}

export default function SavedProfessionalsScreen() {
  const { user } = useAuth();
  const [savedTherapists, setSavedTherapists] = useState<TherapistMatch[]>([]);
  const [bookedTherapists, setBookedTherapists] = useState<TherapistMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedTherapist, setSelectedTherapist] = useState<TherapistMatch | null>(null);
  const [selectedDate, setSelectedDate] = useState('Today');
  const [selectedTime, setSelectedTime] = useState('');
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [user])
  );

  const fetchData = async () => {
    if (!user?.id) {
      console.log("[saved.tsx] Aborting fetchData: No user ID");
      return;
    }
    
    setLoading(true);
    console.log(`[saved.tsx] Loading data for user ${user.id}...`);

    // Fetch Saved
    try {
      const res = await fetch(`${API_URL}/api/therapist/saved?userId=${user.id}`);
      const data = await res.json();
      console.log("[saved.tsx] Saved therapists fetched:", data?.length || 0);
      if (Array.isArray(data)) setSavedTherapists(data);
    } catch (err) {
      console.error("[saved.tsx] Error fetching saved:", err);
    }

    // Fetch Booked
    try {
      const res = await fetch(`${API_URL}/api/therapist/booked?userId=${user.id}`);
      const data = await res.json();
      console.log("[saved.tsx] Booked therapists fetched:", data?.length || 0);
      if (Array.isArray(data)) setBookedTherapists(data);
    } catch (err) {
      console.error("[saved.tsx] Error fetching booked:", err);
    }

    setLoading(false);
  };

  const bookTherapist = async () => {
    if (!user?.id || !selectedTherapist || !selectedDate || !selectedTime) {
      alert("Please select a time slot.");
      return;
    }
    try {
      setLoading(true);
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
        alert(`Session booked for ${selectedDate} at ${selectedTime}!`);
        setShowBookingModal(false);
        fetchData();
      } else {
        alert(data.message || "Could not book session.");
      }
    } catch (err: any) {
      console.error("Book Error:", err);
      alert(`Booking failed: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const openBooking = (therapist: TherapistMatch) => {
    setSelectedTherapist(therapist);
    setShowBookingModal(true);
  };

  const toggleSave = async (therapistId: string) => {
    if (!user?.id) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await fetch(`${API_URL}/api/therapist/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, therapistId }),
      });
      fetchData();
    } catch (err) {
      console.error("Save Error:", err);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.pink} />
        <Text style={styles.loadingText}>Loading your care team...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.screenHeader}>
        <View>
          <Text style={styles.screenTitle}>My Care Team</Text>
          <Text style={styles.screenSubtitle}>Manage your professionals</Text>
        </View>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={24} color={COLORS.navy} />
        </TouchableOpacity>
      </View>

      <FlatList
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchData} colors={[COLORS.pink]} />
        }
        ListHeaderComponent={
          <>
            {bookedTherapists.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
                  <Ionicons name="calendar" size={20} color={COLORS.pink} />
                </View>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={bookedTherapists}
                  keyExtractor={(item) => `booked-${item._id}`}
                  contentContainerStyle={styles.bookedCarousel}
                  renderItem={({ item }) => (
                    <LinearGradient
                      colors={[COLORS.pink, '#FF9EAE']}
                      style={styles.bookedCard}
                    >
                      <View style={styles.bookedHeader}>
                        <View style={styles.bookedInfo}>
                          <Text style={styles.bookedName}>{item.name}</Text>
                          <Text style={styles.bookedType}>Professional Therapist</Text>
                        </View>
                        <View style={styles.avatarMini}>
                           <Ionicons name="medical" size={20} color="#FFF" />
                        </View>
                      </View>

                      <View style={styles.bookedFooter}>
                        <View style={styles.sessionBadge}>
                          <Ionicons name="time" size={14} color="#FFF" style={{ marginRight: 6 }} />
                          <Text style={styles.sessionBadgeText}>{item.date}, {item.time}</Text>
                        </View>
                        <TouchableOpacity activeOpacity={0.8} style={styles.joinButton}>
                          <Text style={styles.joinButtonText}>Join</Text>
                          <Ionicons name="videocam" size={16} color={COLORS.pink} />
                        </TouchableOpacity>
                      </View>
                    </LinearGradient>
                  )}
                />
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Favorites</Text>
                <Ionicons name="heart" size={20} color={COLORS.pink} />
              </View>
              {savedTherapists.length === 0 && (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Find your perfect expert and save them here.</Text>
                </View>
              )}
            </View>
          </>
        }
        data={savedTherapists}
        keyExtractor={(item) => `saved-${item._id}`}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <View style={styles.listItemHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.listName}>{item.name}</Text>
                <Text style={styles.listType}>{item.type}</Text>
              </View>
              <TouchableOpacity onPress={() => toggleSave(item._id)}>
                <Ionicons name="bookmark" size={24} color={COLORS.pink} />
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
              <Text style={styles.listActionText}>Schedule Session</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          bookedTherapists.length === 0 ? (
            <View style={styles.center}>
              <Ionicons name="people-outline" size={60} color="#D1D1D1" />
              <Text style={styles.emptyText}>Your care team is empty.</Text>
              <TouchableOpacity 
                  style={styles.findButton}
                  onPress={() => router.push('/therapist')}
              >
                  <Text style={styles.findButtonText}>Find Professionals</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      {showBookingModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Schedule Session</Text>
                <TouchableOpacity onPress={() => setShowBookingModal(false)}>
                  <Ionicons name="close" size={24} color={COLORS.navy} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalLabel}>Day</Text>
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

              <Text style={styles.modalLabel}>Time</Text>
              <View style={styles.chipRow}>
                {['9:00 AM', '11:00 AM', '2:00 PM', '4:30 PM'].map(time => (
                  <TouchableOpacity 
                    key={time} 
                    style={[styles.chip, selectedTime === time && styles.chipActive]}
                    onPress={() => setSelectedTime(time)}
                  >
                    <Text style={[styles.chipText, selectedTime === time && styles.chipTextActive]}>{time}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.confirmButton} onPress={bookTherapist}>
                <Text style={styles.confirmButtonText}>Confirm Session</Text>
              </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
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
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.navy,
    fontWeight: "700",
    marginTop: 15,
  },
  screenHeader: {
    paddingHorizontal: 25,
    paddingTop: height * 0.08,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.navy,
  },
  screenSubtitle: {
    fontSize: 14,
    color: "#8C8381",
    fontWeight: "600",
    marginTop: 2,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.navy,
  },
  bookedCarousel: {
    paddingRight: 40,
    paddingBottom: 10,
  },
  bookedCard: {
    width: width * 0.75,
    borderRadius: 32,
    padding: 24,
    marginRight: 16,
    elevation: 12,
    shadowColor: COLORS.pink,
    shadowOpacity: 0.35,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
    justifyContent: 'space-between',
    minHeight: 190,
  },
  bookedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bookedInfo: {
    flex: 1,
    gap: 2,
  },
  avatarMini: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookedName: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  bookedType: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '700',
  },
  bookedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  sessionBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  sessionBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
  joinButton: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 18,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  joinButtonText: {
    color: COLORS.pink,
    fontWeight: '900',
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 100,
  },
  listItem: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 25,
    marginBottom: 16,
    elevation: 4,
    shadowColor: COLORS.navy,
    shadowOpacity: 0.05,
    shadowRadius: 15,
  },
  listItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  listName: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.navy,
  },
  listType: {
    fontSize: 13,
    color: COLORS.pink,
    fontWeight: "700",
    marginTop: 2,
  },
  listSpecializations: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 15,
  },
  smallTag: {
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  smallTagText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#595F69",
  },
  listActionButton: {
    backgroundColor: COLORS.navy,
    paddingVertical: 12,
    borderRadius: 15,
    alignItems: "center",
  },
  listActionText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "800",
  },
  emptyContainer: {
    padding: 20,
    borderWidth: 2,
    borderColor: '#F0F0F0',
    borderStyle: 'dashed',
    borderRadius: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#8C8381',
    textAlign: "center",
    lineHeight: 20,
  },
  findButton: {
    backgroundColor: COLORS.navy,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 24,
    marginTop: 10,
  },
  findButtonText: {
    color: COLORS.white,
    fontWeight: "700",
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
});
