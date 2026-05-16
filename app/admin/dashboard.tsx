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
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  TextInput,
  Dimensions
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../constants/api";
import * as Haptics from "expo-haptics";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";
import { BarChart, ProgressChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

const COLORS = {
  cream: "#FAF9F6",
  gold: "#FAD7A0",
  pink: "#FF7597",
  navy: "#4A362D",
  white: "#FFFFFF",
  softPeach: "#FFF5F2",
};

export default function AdminDashboard() {
  const router = useRouter();
  const { logout, user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [therapists, setTherapists] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'insights' | 'users' | 'therapists' | 'assessment' | 'bookings'>('insights');
  const [questions, setQuestions] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [questionModalVisible, setQuestionModalVisible] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [selectedTherapist, setSelectedTherapist] = useState<any>(null);

  const [newQuestionForm, setNewQuestionForm] = useState({
    text: "",
    category: "Stress",
    weight: 1,
    orderIndex: 0
  });

  useFocusEffect(
    useCallback(() => {
      if (activeTab === 'insights') fetchAnalytics();
      else fetchData();
    }, [activeTab])
  );

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/analytics`);
      const data = await response.json();
      if (response.ok) setAnalytics(data);
    } catch (error) {
      console.error("[AdminAnalytics] Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      if (activeTab === 'users') endpoint = '/api/admin/users';
      else if (activeTab === 'therapists') endpoint = '/api/admin/therapists';
      else if (activeTab === 'assessment') endpoint = '/api/admin/questions';
      else if (activeTab === 'bookings') endpoint = '/api/admin/bookings';

      const response = await fetch(`${API_URL}${endpoint}`);
      const data = await response.json();
      if (response.ok) {
        if (activeTab === 'users') setUsers(data);
        else if (activeTab === 'therapists') setTherapists(data);
        else if (activeTab === 'assessment') setQuestions(data);
        else if (activeTab === 'bookings') setBookings(data);
      }
    } catch (error) {
      console.error("[AdminData] Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = (target: any) => {
    Alert.alert(
      "Reset Password",
      `Would you like to reset password for ${target.email} to "emora123"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Reset", 
          onPress: async () => {
             try {
               const res = await fetch(`${API_URL}/api/admin/reset-password`, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ userId: target._id, newPassword: "emora123" })
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

  const handleDeleteUser = (target: any) => {
    Alert.alert(
      "Delete Patient",
      `Are you sure you want to delete ${target.name}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            try {
              const res = await fetch(`${API_URL}/api/admin/users/${target._id}`, {
                method: 'DELETE',
                headers: { 'Accept': 'application/json' }
              });
               if (res.ok) {
                 Alert.alert("Success", "Patient deleted successfully");
                 fetchData();
               }
             } catch (err) {
               console.error(err);
             }
          }
        }
      ]
    );
  };

  const InsightsView = () => {
    if (!analytics) return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>No analytics data available.</Text>
      </View>
    );

    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Wellbeing Score Overview */}
        <Animated.View entering={FadeInUp.delay(100)} style={styles.analyticsCard}>
          <View style={styles.cardHeaderSmall}>
            <Ionicons name="pulse" size={20} color={COLORS.gold} />
            <Text style={[styles.chartTitle, { marginLeft: 8 }]}>Platform Wellbeing</Text>
          </View>
          <View style={styles.centeredChart}>
            <ProgressChart
              data={{ data: [analytics.summary.avgWellbeing / 100 || 0.01] }}
              width={screenWidth - 80}
              height={180}
              strokeWidth={16}
              radius={65}
              chartConfig={{
                backgroundColor: "transparent",
                backgroundGradientFrom: "#FFF",
                backgroundGradientTo: "#FFF",
                color: (opacity = 1) => `rgba(250, 215, 160, ${opacity})`,
              }}
              hideLegend={true}
            />
            <View style={styles.chartOverlay}>
              <Text style={styles.chartScore}>{analytics.summary.avgWellbeing}%</Text>
              <Text style={styles.chartLabel}>Global Index</Text>
            </View>
          </View>
        </Animated.View>

        {/* Condition Distribution */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.analyticsCard}>
          <View style={styles.cardHeaderSmall}>
            <Ionicons name="bar-chart" size={18} color={COLORS.pink} />
            <Text style={[styles.chartTitle, { marginLeft: 8 }]}>Diagnosis Trends</Text>
          </View>
          {analytics.labelDistribution?.length > 0 ? (
            <BarChart
              data={{
                labels: analytics.labelDistribution.map((l: any) => l.name.substring(0, 6)),
                datasets: [{ data: analytics.labelDistribution.map((l: any) => l.count) }]
              }}
              width={screenWidth - 80}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: "#FFF",
                backgroundGradientFrom: "#FFF",
                backgroundGradientTo: "#FFF",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(74, 54, 45, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(53, 58, 64, ${opacity})`,
                barPercentage: 0.6,
                propsForLabels: { fontSize: 10, fontWeight: '700' }
              }}
              style={{ marginTop: 15, borderRadius: 16 }}
              fromZero
            />
          ) : (
            <Text style={styles.emptyText}>No diagnosis data yet.</Text>
          )}
        </Animated.View>

        {/* Recent Events */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {analytics.recentEvents?.map((event: any, idx: number) => (
          <Animated.View key={event.id || idx} entering={FadeInDown.delay(300 + idx * 100)} style={styles.eventCard}>
            <View style={[styles.eventIcon, { backgroundColor: event.type === 'REGISTRATION' ? '#FFF5F2' : '#F0F9FF' }]}>
              <Ionicons name={event.type === 'REGISTRATION' ? "person-add" : "notifications"} size={18} color={COLORS.pink} />
            </View>
            <View style={styles.eventContent}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventTime}>{new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
              <Text style={styles.eventMessage}>{event.message}</Text>
            </View>
          </Animated.View>
        ))}
      </ScrollView>
    );
  };

  const AssessmentView = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Therapist's Book</Text>
        <TouchableOpacity 
          style={styles.addInline} 
          onPress={() => {
            setEditingQuestion(null);
            setNewQuestionForm({ text: "", category: "Stress", weight: 1, orderIndex: questions.length });
            setQuestionModalVisible(true);
          }}
        >
          <Ionicons name="add-circle" size={20} color={COLORS.gold} />
          <Text style={styles.addInlineText}>Add Question</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={questions}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <View style={[styles.categoryBadge, { backgroundColor: '#F0F9FF' }]}>
                <Text style={[styles.categoryBadgeText, { color: '#0369A1' }]}>{item.category}</Text>
              </View>
              <Text style={styles.weightText}>Weight: {item.weight}</Text>
            </View>
            <Text style={styles.questionText}>{item.text}</Text>
            <View style={styles.questionActions}>
              <TouchableOpacity 
                style={styles.questionActionBtn}
                onPress={() => {
                  setEditingQuestion(item);
                  setNewQuestionForm({ text: item.text, category: item.category, weight: item.weight, orderIndex: item.orderIndex });
                  setQuestionModalVisible(true);
                }}
              >
                <Ionicons name="create-outline" size={18} color={COLORS.navy} />
                <Text style={styles.questionActionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.questionActionBtn, { marginLeft: 15 }]}
                onPress={() => handleDeleteQuestion(item._id)}
              >
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                <Text style={[styles.questionActionText, { color: '#EF4444' }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 150 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No assessment questions found.</Text>
          </View>
        }
      />
    </View>
  );

  const handleDeleteQuestion = (id: string) => {
    Alert.alert("Delete Question", "Are you sure? This will affect the Pulse Check assessment.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          const res = await fetch(`${API_URL}/api/admin/questions/${id}`, { method: 'DELETE' });
          if (res.ok) fetchData();
        } catch (err) { console.error(err); }
      }}
    ]);
  };

  const handleSaveQuestion = async () => {
    try {
      const method = editingQuestion ? 'PUT' : 'POST';
      const url = editingQuestion ? `${API_URL}/api/admin/questions/${editingQuestion._id}` : `${API_URL}/api/admin/questions`;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuestionForm)
      });

      if (res.ok) {
        setQuestionModalVisible(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const renderUserItem = ({ item }: { item: any }) => (
    <View style={styles.userCard}>
      <View style={styles.cardHeaderSmall}>
        <View style={styles.userIcon}>
          <Ionicons 
            name={activeTab === 'users' ? "person" : "medical"} 
            size={22} 
            color={activeTab === 'users' ? COLORS.pink : COLORS.gold} 
          />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
        
        <View style={styles.actionRow}>
          {activeTab === 'users' ? (
            <>
              <TouchableOpacity 
                style={[styles.miniAction, { backgroundColor: '#FFF5F7' }]} 
                onPress={() => handleResetPassword(item)}
              >
                <Ionicons name="key-outline" size={18} color={COLORS.pink} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.miniAction, { backgroundColor: '#FEF2F2' }]} 
                onPress={() => handleDeleteUser(item)}
              >
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.viewButton} onPress={() => openProfile(item)}>
              <Text style={styles.viewButtonText}>Profile</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {item.therapistProfile && (
        <View style={styles.tagRow}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{item.therapistProfile.category}</Text>
          </View>
          <View style={[styles.tag, { backgroundColor: '#F0FDF4' }]}>
            <Text style={[styles.tagText, { color: '#166534' }]}>{item.therapistProfile.type}</Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Admin Panel</Text>
          <Text style={styles.subtitle}>System Management Hub</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <View style={styles.logoutIconBg}>
            <Ionicons name="log-out" size={20} color="#FFF" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <Animated.View entering={FadeInDown.delay(100)} style={styles.statCard}>
          <View style={[styles.statIconCircle, { backgroundColor: '#E0F2FE' }]}>
            <Ionicons name="people" size={20} color="#38BDF8" />
          </View>
          <View>
            <Text style={styles.statValue}>{activeTab === 'insights' ? analytics?.summary?.userCount || 0 : users.length}</Text>
            <Text style={styles.statLabel}>Patients</Text>
          </View>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(200)} style={styles.statCard}>
          <View style={[styles.statIconCircle, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="medical" size={20} color="#FBBF24" />
          </View>
          <View>
            <Text style={styles.statValue}>{activeTab === 'insights' ? analytics?.summary?.therapistCount || 0 : therapists.length}</Text>
            <Text style={styles.statLabel}>Therapists</Text>
          </View>
        </Animated.View>
      </View>

      <View style={styles.tabContainerScroll}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.tabContainer}
        >
          {['insights', 'users', 'therapists', 'bookings', 'assessment'].map((tab: any, index) => (
            <TouchableOpacity 
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab(tab);
              }}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab === 'assessment' ? 'Book' : tab === 'bookings' ? 'Sessions' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
              {activeTab === tab && <Animated.View entering={FadeInUp} style={styles.activeIndicator} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Animated.View entering={FadeInUp.delay(200)} style={styles.content}>
        {activeTab === 'insights' ? (
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.gold} />
            </View>
          ) : (
            <InsightsView />
          )
        ) : activeTab === 'assessment' ? (
           <AssessmentView />
        ) : activeTab === 'bookings' ? (
          <View style={{ flex: 1 }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Global Bookings</Text>
              <View style={styles.statChip}>
                <Text style={styles.statChipText}>{bookings.length} Total</Text>
              </View>
            </View>
            <FlatList
              data={bookings}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 150 }}
              renderItem={({ item }) => (
                <View style={[styles.userCard, { padding: 20 }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.userName}>{item.patientName}</Text>
                      <Text style={styles.userEmail}>{item.patientEmail}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 14, fontWeight: '900', color: COLORS.pink }}>{item.date}</Text>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#8C8381' }}>{item.time}</Text>
                    </View>
                  </View>
                  <View style={{ height: 1, backgroundColor: '#F1F5F9', marginVertical: 15 }} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: COLORS.softPeach, alignItems: 'center', justifyContent: 'center' }}>
                         <Ionicons name="medical" size={14} color={COLORS.gold} />
                      </View>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: COLORS.navy }}>{item.therapistName}</Text>
                    </View>
                    <TouchableOpacity style={{ padding: 4 }}>
                      <Text style={{ fontSize: 12, fontWeight: '900', color: COLORS.gold }}>DETAILS</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyText}>No sessions booked yet.</Text>
                </View>
              }
            />
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <View style={styles.sectionHeader}>
               <Text style={styles.sectionTitle}>
                 {activeTab === 'users' ? 'Registered Patients' : 'Professional Staff'}
               </Text>
               {activeTab === 'therapists' && (
                <TouchableOpacity 
                  style={styles.addInline} 
                  onPress={() => router.push("/admin/register-therapist" as any)}
                >
                   <Ionicons name="add-circle" size={20} color={COLORS.gold} />
                   <Text style={styles.addInlineText}>Register New</Text>
                 </TouchableOpacity>
               )}
            </View>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.gold} />
                <Text style={styles.loadingText}>Syncing records...</Text>
              </View>
            ) : (
              <FlatList
                data={activeTab === 'users' ? users : therapists}
                keyExtractor={(item) => item._id}
                renderItem={renderUserItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 150 }}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="file-tray-outline" size={48} color="#D1D5DB" />
                    <Text style={styles.emptyText}>No matching records found.</Text>
                  </View>
                }
              />
            )}
          </View>
        )}
      </Animated.View>

      <Modal
        visible={questionModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingQuestion ? "Edit Question" : "Add to Book"}</Text>
              <TouchableOpacity onPress={() => setQuestionModalVisible(false)} style={styles.closeIcon}>
                <Ionicons name="close" size={24} color={COLORS.navy} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Question Text</Text>
              <TextInput
                style={[styles.adminInput, { height: 100, textAlignVertical: 'top' }]}
                multiline
                numberOfLines={4}
                value={newQuestionForm.text}
                onChangeText={(t) => setNewQuestionForm({...newQuestionForm, text: t})}
                placeholder="Type assessment question..."
              />

              <Text style={styles.inputLabel}>Clinical Category</Text>
              <View style={styles.categoryPicker}>
                {['Stress', 'Anxiety', 'Depression', 'Burnout', 'Sleep Disturbance', 'Low Self-Esteem', 'Emotional Exhaustion', 'Adjustment Issues'].map(cat => (
                  <TouchableOpacity 
                    key={cat}
                    style={[styles.catPick, newQuestionForm.category === cat && styles.catPickActive]}
                    onPress={() => setNewQuestionForm({...newQuestionForm, category: cat})}
                  >
                    <Text style={[styles.catPickText, newQuestionForm.category === cat && styles.catPickTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ flexDirection: 'row', gap: 20, marginTop: 15 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Impact Weight (1-5)</Text>
                  <TextInput
                    style={styles.adminInput}
                    keyboardType="numeric"
                    value={newQuestionForm.weight.toString()}
                    onChangeText={(v) => setNewQuestionForm({...newQuestionForm, weight: parseInt(v) || 1})}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Sort Index</Text>
                  <TextInput
                    style={styles.adminInput}
                    keyboardType="numeric"
                    value={newQuestionForm.orderIndex.toString()}
                    onChangeText={(v) => setNewQuestionForm({...newQuestionForm, orderIndex: parseInt(v) || 0})}
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveQuestion}>
                <Text style={styles.saveBtnText}>Save to System</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={profileModalVisible}
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInUp} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Professional Profile</Text>
                <Text style={styles.modalSubtitle}>Academic & Career History</Text>
              </View>
              <TouchableOpacity onPress={() => setProfileModalVisible(false)} style={styles.closeIcon}>
                <Ionicons name="close" size={24} color={COLORS.navy} />
              </TouchableOpacity>
            </View>

            {selectedTherapist && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                <View style={styles.profileSection}>
                  <Text style={styles.profileLabel}>Biography</Text>
                  <Text style={styles.profileValue}>{selectedTherapist.bio}</Text>
                </View>

                <View style={styles.profileGrid}>
                  <View style={styles.gridItem}>
                    <Text style={styles.profileLabel}>Experience</Text>
                    <Text style={[styles.profileValue, { color: COLORS.pink }]}>
                      {selectedTherapist.experienceYears} Years
                    </Text>
                  </View>
                  <View style={styles.gridItem}>
                    <Text style={styles.profileLabel}>Gender</Text>
                    <Text style={styles.profileValue}>{selectedTherapist.gender}</Text>
                  </View>
                </View>

                <View style={styles.profileSection}>
                  <Text style={styles.profileLabel}>Specializations</Text>
                  <View style={styles.specChips}>
                    {selectedTherapist.specialization?.map((s: string, i: number) => (
                      <View key={i} style={styles.specChip}>
                        <Text style={styles.specChipText}>{s}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <TouchableOpacity 
                   style={styles.closeModalBtn}
                   onPress={() => setProfileModalVisible(false)}
                >
                   <Text style={styles.closeModalBtnText}>Close Profile</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    paddingTop: 60,
  },
  title: { fontSize: 32, fontWeight: "900", color: COLORS.navy, letterSpacing: -1 },
  subtitle: { fontSize: 14, color: "#8C8381", fontWeight: "700", marginTop: 2 },
  logoutBtn: { padding: 4 },
  logoutIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  tabContainerScroll: { 
    maxHeight: 70,
    marginBottom: 20,
    marginHorizontal: 15
  },
  tabContainer: { 
    flexDirection: 'row', 
    backgroundColor: '#2D3436', 
    borderRadius: 25, 
    padding: 6,
    alignItems: 'center'
  },
  tab: { paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  activeTab: { 
    backgroundColor: COLORS.white,
    elevation: 8,
    shadowColor: COLORS.navy,
    shadowOpacity: 0.2,
    shadowRadius: 10
  },
  tabText: { fontSize: 13, fontWeight: "800", color: "#A0AEC0" },
  activeTabText: { color: COLORS.pink },
  activeIndicator: { 
    display: 'none'
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 4,
    shadowColor: COLORS.navy,
    shadowOpacity: 0.05,
    shadowRadius: 15,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  statIconCircle: { 
    width: 44, 
    height: 44, 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  statValue: { fontSize: 24, fontWeight: "900", color: COLORS.navy },
  statLabel: { fontSize: 12, fontWeight: "700", color: "#94A3B8", textTransform: 'uppercase' },
  content: { flex: 1, paddingHorizontal: 24 },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 22, fontWeight: "900", color: COLORS.navy },
  addInline: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  addInlineText: { fontSize: 13, fontWeight: '800', color: COLORS.navy, marginLeft: 6 },
  userCard: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 28,
    marginBottom: 16,
    elevation: 3,
    shadowColor: COLORS.navy,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#F8FAFC'
  },
  cardHeaderSmall: { flexDirection: 'row', alignItems: 'center' },
  userIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.softPeach,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 18, fontWeight: "900", color: COLORS.navy },
  userEmail: { fontSize: 14, color: "#8C8381", marginTop: 2, fontWeight: "500" },
  actionRow: { flexDirection: 'row', gap: 10 },
  miniAction: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewButton: { 
    backgroundColor: COLORS.navy, 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 14 
  },
  viewButtonText: { fontSize: 12, fontWeight: '800', color: COLORS.white },
  tagRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  tag: { 
    backgroundColor: 'rgba(250, 215, 160, 0.1)', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 12 
  },
  tagText: { fontSize: 11, fontWeight: '800', color: COLORS.gold },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
  loadingText: { marginTop: 15, fontSize: 14, fontWeight: '700', color: '#8C8381' },
  emptyText: { textAlign: 'center', color: '#8C8381', marginTop: 20 },
  emptyContainer: { alignItems: 'center', marginTop: 80, opacity: 0.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(74, 54, 45, 0.4)', justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: COLORS.white, 
    borderTopLeftRadius: 40, 
    borderTopRightRadius: 40, 
    padding: 30, 
    maxHeight: '90%',
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 30 
  },
  modalTitle: { fontSize: 26, fontWeight: '900', color: COLORS.navy },
  modalSubtitle: { fontSize: 14, color: '#8C8381', fontWeight: '700', marginTop: 2 },
  closeIcon: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: COLORS.cream, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  profileSection: { marginBottom: 25 },
  profileGrid: { flexDirection: 'row', gap: 20, marginBottom: 25 },
  gridItem: { flex: 1, backgroundColor: COLORS.softPeach, padding: 16, borderRadius: 20 },
  profileLabel: { fontSize: 11, fontWeight: '800', color: '#8F939F', textTransform: 'uppercase', marginBottom: 6 },
  profileValue: { fontSize: 16, fontWeight: '700', color: COLORS.navy },
  specChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  specChip: { 
    backgroundColor: COLORS.white, 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(250, 215, 160, 0.2)'
  },
  specChipText: { fontSize: 13, color: COLORS.navy, fontWeight: '700' },
  closeModalBtn: { 
    backgroundColor: COLORS.navy, 
    paddingVertical: 18, 
    borderRadius: 24, 
    alignItems: 'center', 
    marginTop: 20 
  },
  closeModalBtnText: { color: COLORS.white, fontWeight: '900', fontSize: 16 },
  
  eventTime: { fontSize: 10, color: COLORS.gold, fontWeight: '800' },

  // Question Management Styles
  questionCard: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
    elevation: 3,
    shadowColor: COLORS.navy,
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  categoryBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  categoryBadgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  weightText: { fontSize: 11, fontWeight: '700', color: '#8C8381' },
  questionText: { fontSize: 15, color: COLORS.navy, fontWeight: '600', lineHeight: 22 },
  questionActions: { flexDirection: 'row', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  questionActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  questionActionText: { fontSize: 12, fontWeight: '800', color: COLORS.navy },

  // Modal Input Styles
  inputLabel: { fontSize: 12, fontWeight: '800', color: '#8C8381', marginBottom: 8, marginTop: 15, textTransform: 'uppercase' },
  adminInput: { backgroundColor: '#F8FAFC', padding: 15, borderRadius: 15, borderWidth: 1, borderColor: '#E2E8F0', fontSize: 14, color: COLORS.navy, fontWeight: '600' },
  categoryPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catPick: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#F1F5F9' },
  catPickActive: { backgroundColor: COLORS.gold },
  catPickText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  catPickTextActive: { color: COLORS.white },
  saveBtn: { backgroundColor: COLORS.navy, paddingVertical: 18, borderRadius: 20, alignItems: 'center', marginTop: 30, marginBottom: 20 },
  saveBtnText: { color: COLORS.white, fontWeight: '900', fontSize: 16 },

  // Analytics Styles
  analyticsCard: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 32,
    marginBottom: 20,
    elevation: 8,
    shadowColor: COLORS.navy,
    shadowOpacity: 0.05,
    shadowRadius: 15,
  },
  chartTitle: { fontSize: 16, fontWeight: "900", color: COLORS.navy },
  centeredChart: { alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  chartOverlay: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  chartScore: { fontSize: 32, fontWeight: '900', color: COLORS.gold },
  chartLabel: { fontSize: 10, fontWeight: '700', color: '#8C8381', textTransform: 'uppercase' },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.navy,
    shadowOpacity: 0.03,
    shadowRadius: 10,
  },
  eventIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  eventContent: { flex: 1 },
  eventTitle: { fontSize: 14, fontWeight: '900', color: COLORS.navy },
  eventMessage: { fontSize: 12, color: '#8C8381', marginTop: 2, fontWeight: '500' },
  statChip: {
    backgroundColor: 'rgba(250, 215, 160, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.gold,
  },
});

