import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../constants/api";

export default function AdminDashboard() {
  const router = useRouter();
  const { logout, user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [therapists, setTherapists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'therapists'>('users');
  const [targetUser, setTargetUser] = useState<any>(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [selectedTherapist, setSelectedTherapist] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [activeTab])
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'users' ? '/api/admin/users' : '/api/admin/therapists';
      const response = await fetch(`${API_URL}${endpoint}`);
      const data = await response.json();
      if (response.ok) {
        if (activeTab === 'users') setUsers(data);
        else setTherapists(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = (user: any) => {
    Alert.alert(
      "Reset Password",
      `Would you like to reset password for ${user.email} to "emora123"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Reset", 
          onPress: async () => {
             try {
               const res = await fetch(`${API_URL}/api/admin/reset-password`, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ userId: user._id, newPassword: "emora123" })
               });
               if (res.ok) Alert.alert("Success", "Password reset to emora123");
             } catch (err) {
               console.error(err);
             }
          }
        }
      ]
    );
  };

  const openProfile = (therapistUser: any) => {
    setSelectedTherapist(therapistUser.therapistProfile);
    setProfileModalVisible(true);
  };

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const renderUserItem = ({ item }: { item: any }) => (
    <View style={styles.userCard}>
      <TouchableOpacity 
        style={styles.userIcon} 
        onPress={() => handleResetPassword(item)}
      >
        <Ionicons name={activeTab === 'users' ? "person" : "medical"} size={24} color={activeTab === 'users' ? "#FF7597" : "#0EA5E9"} />
      </TouchableOpacity>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        {item.therapistProfile && (
           <View style={styles.tagRow}>
             <Text style={styles.tag}>{item.therapistProfile.category}</Text>
             <Text style={[styles.tag, { backgroundColor: '#F0FDF4', color: '#166534' }]}>{item.therapistProfile.type}</Text>
           </View>
        )}
      </View>
      {activeTab === 'therapists' && (
        <TouchableOpacity style={styles.viewButton} onPress={() => openProfile(item)}>
          <Text style={styles.viewButtonText}>Profile</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Admin Panel</Text>
          <Text style={styles.subtitle}>Welcome, {user?.name}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={24} color="#FF7597" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'users' && styles.activeTab]} 
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>Patients</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'therapists' && styles.activeTab]} 
          onPress={() => setActiveTab('therapists')}
        >
          <Text style={[styles.tabText, activeTab === 'therapists' && styles.activeTabText]}>Therapists</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.sectionHeader}>
           <Text style={styles.sectionTitle}>{activeTab === 'users' ? 'Registered Patients' : 'Professional Staff'}</Text>
           {activeTab === 'therapists' && (
             <TouchableOpacity style={styles.addInline} onPress={() => router.push("/admin/register-therapist" as any)}>
               <Ionicons name="person-add" size={18} color="#FF7597" />
               <Text style={styles.addInlineText}>New</Text>
             </TouchableOpacity>
           )}
        </View>
        {loading ? (
          <ActivityIndicator size="large" color="#FF7597" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={activeTab === 'users' ? users : therapists}
            keyExtractor={(item) => item._id}
            renderItem={renderUserItem}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No entries found.</Text>
            }
          />
        )}
      </View>

      {/* Profile Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={profileModalVisible}
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Professional Profile</Text>
              <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                <Ionicons name="close-circle" size={30} color="#DDD" />
              </TouchableOpacity>
            </View>

            {selectedTherapist && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.profileSection}>
                  <Text style={styles.profileLabel}>Biography</Text>
                  <Text style={styles.profileValue}>{selectedTherapist.bio}</Text>
                </View>

                <View style={styles.profileGrid}>
                  <View style={styles.gridItem}>
                    <Text style={styles.profileLabel}>Experience</Text>
                    <Text style={styles.profileValue}>{selectedTherapist.experienceYears} Years</Text>
                  </View>
                  <View style={styles.gridItem}>
                    <Text style={styles.profileLabel}>Gender</Text>
                    <Text style={styles.profileValue}>{selectedTherapist.gender}</Text>
                  </View>
                </View>

                <View style={styles.profileSection}>
                  <Text style={styles.profileLabel}>Professional Specializations</Text>
                  <View style={styles.specChips}>
                    {selectedTherapist.specialization?.map((s: string, i: number) => (
                      <View key={i} style={styles.specChip}>
                        <Text style={styles.specChipText}>{s}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.profileSection}>
                  <Text style={styles.profileLabel}>Focus Areas</Text>
                  <View style={styles.tagRow}>
                     <View style={[styles.tag, { paddingHorizontal: 15, paddingVertical: 8 }]}>
                        <Text style={styles.tagText}>{selectedTherapist.category}</Text>
                     </View>
                  </View>
                </View>

                <TouchableOpacity 
                   style={styles.closeModalBtn}
                   onPress={() => setProfileModalVisible(false)}
                >
                   <Text style={styles.closeModalBtnText}>Got it</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
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
    padding: 24,
    paddingTop: 40,
  },
  title: { fontSize: 24, fontWeight: "800", color: "#353A40" },
  subtitle: { fontSize: 14, color: "#8C8381", fontWeight: "600" },
  logoutBtn: { padding: 8 },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 15,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#FF7597",
    shadowOpacity: 0.1,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
  },
  statValue: { fontSize: 28, fontWeight: "800", color: "#353A40" },
  statLabel: { fontSize: 12, fontWeight: "700", color: "#8C8381", textTransform: 'uppercase', letterSpacing: 0.5 },
  content: { flex: 1, paddingHorizontal: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#353A40", marginBottom: 15 },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 18,
    borderRadius: 20,
    marginBottom: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.02)",
  },
  userIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F8F9FA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: "800", color: "#353A40" },
  userEmail: { fontSize: 13, color: "#8C8381", marginTop: 2 },
  tagRow: { flexDirection: 'row', gap: 5, marginTop: 5 },
  tag: { fontSize: 10, fontWeight: '800', backgroundColor: '#F0F9FF', color: '#0369A1', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, textTransform: 'uppercase' },
  tagText: { fontSize: 12, fontWeight: '800', color: '#0369A1' },
  viewButton: { backgroundColor: '#F0F0F0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  viewButtonText: { fontSize: 12, fontWeight: '700', color: '#555' },
  resetBadge: { padding: 8, backgroundColor: '#FAF9F6', borderRadius: 10 },
  tabContainer: { flexDirection: 'row', marginHorizontal: 24, marginBottom: 20, backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 20, padding: 5 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 16 },
  activeTab: { backgroundColor: '#FFF', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  tabText: { fontSize: 14, fontWeight: '800', color: '#8C8381' },
  activeTabText: { color: "#FF7597" },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  addInline: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,117,151,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  addInlineText: { fontSize: 13, fontWeight: '800', color: '#FF7597' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#8C8381' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 24, fontWeight: '800', color: '#353A40' },
  profileSection: { marginBottom: 20 },
  profileGrid: { flexDirection: 'row', gap: 20, marginBottom: 20 },
  gridItem: { flex: 1 },
  profileLabel: { fontSize: 12, fontWeight: '700', color: '#A0A5B1', textTransform: 'uppercase', marginBottom: 5, letterSpacing: 0.5 },
  profileValue: { fontSize: 16, fontWeight: '600', color: '#353A40', lineHeight: 24 },
  specChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  specChip: { backgroundColor: '#F5F7FA', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  specChipText: { fontSize: 13, color: '#595F69', fontWeight: '600' },
  closeModalBtn: { backgroundColor: '#FF7597', paddingVertical: 16, borderRadius: 20, alignItems: 'center', marginTop: 30, marginBottom: 20 },
  closeModalBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 }
});
