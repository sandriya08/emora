import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    TextInput,
    Modal,
    ActivityIndicator,
    Alert,
} from "react-native";
import { API_URL } from "@/constants/api";

import { useAuth } from "@/context/AuthContext";

export default function ProfileScreen() {
    const router = useRouter();
    const { user, logout, updateUser } = useAuth();

    // Edit Profile State
    const [isEditModalVisible, setEditModalVisible] = useState(false);
    const [editName, setEditName] = useState(user?.name || "");
    const [editEmail, setEditEmail] = useState(user?.email || "");
    
    // Change Password State
    const [isPassModalVisible, setPassModalVisible] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setEditName(user.name);
            setEditEmail(user.email);
        }
    }, [user]);

    if (!user) return null;

    const handleLogout = () => {
        logout();
        router.replace("/");
    };

    const handleUpdateProfile = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/auth/profile`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.id, name: editName, email: editEmail }),
            });
            const data = await res.json();
            if (res.ok) {
                updateUser({ name: editName, email: editEmail });
                setEditModalVisible(false);
                Alert.alert("Success", "Profile updated successfully");
            } else {
                Alert.alert("Error", data.message || "Failed to update profile");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Server error");
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!user?.id) return;
        if (!currentPassword || !newPassword) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/auth/password`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.id, currentPassword, newPassword }),
            });
            const data = await res.json();
            if (res.ok) {
                setPassModalVisible(false);
                setCurrentPassword("");
                setNewPassword("");
                Alert.alert("Success", "Password changed successfully");
            } else {
                Alert.alert("Error", data.message || "Failed to change password");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Server error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Header / Avatar Section */}
                <View style={styles.header}>
                    <TouchableOpacity 
                        style={[styles.avatarContainer, { backgroundColor: "#FFB088" }]}
                        activeOpacity={0.8}
                        onPress={() => setEditModalVisible(true)}
                    >
                        <Ionicons name="person" size={50} color="#FFF" />
                        <View style={styles.editBadge}>
                            <Ionicons name="camera" size={12} color="#FFF" />
                        </View>
                    </TouchableOpacity>
                    <Text style={[styles.name, { color: "#353A40" }]}>{user?.name || "User"}</Text>
                    <Text style={styles.email}>{user?.email || "email@example.com"}</Text>
                </View>

                {/* Modern Pastel Menu Items */}
                <View style={styles.menu}>
                    <TouchableOpacity style={styles.menuItem} onPress={() => setEditModalVisible(true)}>
                        <View style={[styles.iconBox, { backgroundColor: "#FFF3E0" }]}>
                            <Ionicons name="person-outline" size={20} color="#E65100" />
                        </View>
                        <Text style={styles.menuText}>Edit Profile</Text>
                        <Ionicons name="chevron-forward" size={20} color="#D1D1D1" />
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.menuItem} onPress={() => setPassModalVisible(true)}>
                        <View style={[styles.iconBox, { backgroundColor: "#E3F2FD" }]}>
                            <Ionicons name="lock-closed-outline" size={20} color="#1565C0" />
                        </View>
                        <Text style={styles.menuText}>Change Password</Text>
                        <Ionicons name="chevron-forward" size={20} color="#D1D1D1" />
                    </TouchableOpacity>
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={[styles.logoutButton, { backgroundColor: "#C896DE" }]} onPress={handleLogout}>
                    <Ionicons name="log-out" size={20} color="#FFF" />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

                {/* Edit Profile Modal */}
                <Modal visible={isEditModalVisible} animationType="slide" transparent>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Edit Profile</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Name"
                                value={editName}
                                onChangeText={setEditName}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Email"
                                value={editEmail}
                                onChangeText={setEditEmail}
                                autoCapitalize="none"
                            />
                            <View style={styles.modalButtons}>
                                <TouchableOpacity style={styles.cancelButton} onPress={() => setEditModalVisible(false)}>
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.saveButton} onPress={handleUpdateProfile} disabled={loading}>
                                    {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Save</Text>}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Change Password Modal */}
                <Modal visible={isPassModalVisible} animationType="slide" transparent>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Change Password</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Current Password"
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                secureTextEntry
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="New Password"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry
                            />
                            <View style={styles.modalButtons}>
                                <TouchableOpacity style={styles.cancelButton} onPress={() => setPassModalVisible(false)}>
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.saveButton} onPress={handleChangePassword} disabled={loading}>
                                    {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Update</Text>}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FAF9F6",
    },
    content: {
        flex: 1,
        padding: 24,
        paddingBottom: 100,
        justifyContent: "center",
    },
    header: {
        alignItems: "center",
        marginBottom: 40,
    },
    avatarContainer: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: "#FAD7A0", 
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
        shadowColor: "#FFB088",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
        position: 'relative',
    },
    editBadge: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: '#353A40',
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FAF9F6',
    },
    avatarText: {
        fontSize: 40,
        color: "#FAF9F6",
        fontWeight: "800",
    },
    name: {
        fontSize: 28,
        fontWeight: "900",
        color: "#353A40",
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        color: "#595F69",
        fontWeight: "600",
    },
    menu: {
        backgroundColor: "#FFF",
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 10,
        marginBottom: 40,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    menuText: {
        flex: 1,
        marginLeft: 16,
        fontSize: 16,
        color: "#353A40",
        fontWeight: "700",
    },
    divider: {
        height: 1,
        backgroundColor: "#F0F0F0",
    },
    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#353A40",
        paddingVertical: 16,
        borderRadius: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 2,
    },
    logoutText: {
        marginLeft: 8,
        fontSize: 16,
        fontWeight: "700",
        color: "#FFF",
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "#FFF",
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 30,
        paddingBottom: 50,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: "800",
        color: "#FAD7A0",
        marginBottom: 25,
        textAlign: "center",
    },
    input: {
        backgroundColor: "#F8F9FA",
        borderRadius: 16,
        padding: 16,
        fontSize: 16,
        color: "#353A40",
        marginBottom: 15,
        borderWidth: 1,
        borderColor: "#F0F0F0",
    },
    modalButtons: {
        flexDirection: "row",
        gap: 15,
        marginTop: 10,
    },
    cancelButton: {
        flex: 1,
        padding: 16,
        borderRadius: 20,
        backgroundColor: "#F0F0F0",
        alignItems: "center",
    },
    cancelButtonText: {
        color: "#595F69",
        fontWeight: "700",
        fontSize: 16,
    },
    saveButton: {
        flex: 2,
        padding: 16,
        borderRadius: 20,
        backgroundColor: "#FAD7A0",
        alignItems: "center",
    },
    saveButtonText: {
        color: "#FFF",
        fontWeight: "700",
        fontSize: 16,
    },
});
