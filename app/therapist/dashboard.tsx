import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  ScrollView,
  Dimensions
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../constants/api";

const { width } = Dimensions.get("window");

export default function TherapistDashboard() {
  const router = useRouter();
  const { logout, user } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.therapistProfile) {
      fetchPatients();
    }
  }, [user]);

  const fetchPatients = async () => {
    try {
      const response = await fetch(`${API_URL}/api/therapist/patients?therapistId=${user?.therapistProfile}`);
      const data = await response.json();
      if (response.ok) {
        setPatients(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const TimelineItem = ({ item, index }: { item: any, index: number }) => {
    const cardColors = ['#FFB347', '#FF7597', '#F59E0B'];
    const bgColor = cardColors[index % cardColors.length];
    
    return (
      <View style={styles.timelineRow}>
        {/* Timeline Indicator Column */}
        <View style={styles.indicatorColumn}>
          <View style={styles.verticalLine} />
          <View style={[styles.rotatedCapsule, { backgroundColor: bgColor }]}>
            <Text style={styles.capsuleText}>{item.lastBooking.split(' ')[0]}</Text>
          </View>
          <View style={styles.timelineDot} />
        </View>

        {/* Content Card Column */}
        <TouchableOpacity 
          style={[styles.timelineCard, { backgroundColor: bgColor }]}
          onPress={() => router.push(`/therapist/patient-progress?userId=${item._id}` as any)}
          activeOpacity={0.9}
        >
          <View style={styles.cardHeaderSmall}>
            <Ionicons name="time-outline" size={16} color="#FFF" />
            <Text style={styles.timeText}>{item.lastBooking.split(' ')[1]} {item.lastBooking.split(' ')[2] || ""}</Text>
          </View>
          
          <Text style={styles.patientNameTimeline}>{item.name}</Text>
          
          <View style={styles.bulletContainer}>
            <View style={styles.bulletPoint} />
            <Text style={styles.bulletText}>{item.email}</Text>
          </View>
          <View style={styles.bulletContainer}>
            <View style={styles.bulletPoint} />
            <Text style={styles.bulletText}>Initial consultation & assessment</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* DECORATIVE BACKGROUND */}
      <View style={styles.bgBlob} />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Hello,</Text>
          <Text style={styles.name}>Dr. {user?.name}</Text>
        </View>
        <TouchableOpacity onPress={() => logout()} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={24} color="#555" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{patients.length}</Text>
          <Text style={styles.statLabel}>Active Patients</Text>
        </View>
        <TouchableOpacity 
          style={[styles.statBox, { backgroundColor: '#FFDAB9' }]}
          onPress={() => fetchPatients()}
        >
          <Ionicons name="refresh" size={24} color="#353A40" />
          <Text style={[styles.statLabel, { marginTop: 5 }]}>Refresh Slots</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.body}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <Text style={styles.sectionTitle}>Agenda & Bookings</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color="#FF7597" style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.timelineContainer}>
            {patients.length > 0 ? (
              patients.map((item, index) => (
                <TimelineItem key={item._id} item={item} index={index} />
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={60} color="#DDD" />
                <Text style={styles.emptyText}>You don't have any booked patients yet.</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={30} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF9F6" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    paddingTop: 20,
  },
  welcome: { fontSize: 16, color: "#8C8381", fontWeight: "600" },
  name: { fontSize: 24, fontWeight: "900", color: "#353A40" },
  logoutBtn: { backgroundColor: "#FFF", padding: 10, borderRadius: 15, elevation: 2 },
  statsContainer: { flexDirection: "row", paddingHorizontal: 24, gap: 15, marginBottom: 20 },
  statBox: {
    flex: 1,
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  statNumber: { fontSize: 32, fontWeight: "900", color: "#353A40" },
  statLabel: { fontSize: 12, fontWeight: "800", color: "#8C8381", textTransform: 'uppercase' },
  body: { flex: 1, paddingHorizontal: 24 },
  sectionTitle: { fontSize: 20, fontWeight: "900", color: "#353A40", marginBottom: 25 },
  timelineContainer: {
    paddingLeft: 10,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 20,
    minHeight: 120,
  },
  indicatorColumn: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalLine: {
    position: 'absolute',
    left: '50%',
    width: 2,
    height: '140%',
    backgroundColor: 'rgba(53, 58, 64, 0.05)',
    zIndex: -1,
  },
  rotatedCapsule: {
    width: 100,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '-90deg' }],
    zIndex: 1,
  },
  capsuleText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(53, 58, 64, 0.1)',
    marginTop: 10,
  },
  timelineCard: {
    flex: 1,
    borderRadius: 25,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  cardHeaderSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
    marginLeft: 6,
    opacity: 0.9,
  },
  patientNameTimeline: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 12,
  },
  bulletContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bulletPoint: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFF',
    marginRight: 8,
    opacity: 0.8,
  },
  bulletText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '600',
    opacity: 0.85,
  },
  bgBlob: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 117, 151, 0.04)',
    zIndex: -1,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFB347',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#FFB347',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { textAlign: 'center', color: '#8C8381', marginTop: 15, fontSize: 15 }
});
