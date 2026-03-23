import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { useAuth } from "@/context/AuthContext";

export default function ProfileScreen() {
    const router = useRouter();
    const { user, logout } = useAuth();

    useEffect(() => {
        if (!user) {
            router.replace("/");
        }
    }, [user]);

    if (!user) return null;

    const handleLogout = () => {
        logout();
        router.replace("/");
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Header / Avatar Section */}
                <View style={styles.header}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>
                            {user?.name?.charAt(0).toUpperCase() || "U"}
                        </Text>
                    </View>
                    <Text style={styles.name}>{user?.name || "User"}</Text>
                    <Text style={styles.email}>{user?.email || "email@example.com"}</Text>
                </View>

                {/* Modern Pastel Menu Items */}
                <View style={styles.menu}>
                    <TouchableOpacity style={styles.menuItem}>
                        <View style={[styles.iconBox, { backgroundColor: "#FFF3E0" }]}>
                            <Ionicons name="settings" size={20} color="#E65100" />
                        </View>
                        <Text style={styles.menuText}>Preferences & Peace</Text>
                        <Ionicons name="chevron-forward" size={20} color="#D1D1D1" />
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.menuItem}>
                        <View style={[styles.iconBox, { backgroundColor: "#E3F2FD" }]}>
                            <Ionicons name="notifications" size={20} color="#1565C0" />
                        </View>
                        <Text style={styles.menuText}>Reminders & Rituals</Text>
                        <Ionicons name="chevron-forward" size={20} color="#D1D1D1" />
                    </TouchableOpacity>
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out" size={20} color="#FFF" />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

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
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#FBCFE8", 
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
        shadowColor: "#FBCFE8",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    avatarText: {
        fontSize: 40,
        color: "#353A40",
        fontWeight: "800",
    },
    name: {
        fontSize: 26,
        fontWeight: "800",
        color: "#353A40",
        marginBottom: 6,
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
});
