import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { DiagnosisProvider } from '../context/DiagnosisContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // 💡 Small delay ensures Root Layout is fully mounted before navigation
    const timeout = setTimeout(() => {
      const inTabsGroup = segments[0] === '(tabs)';
      const inAdminGroup = segments[0] === 'admin';
      const inTherapistGroup = segments[0] === 'therapist';
      const isAuthPage = segments[0] === 'login' || segments[0] === 'register' || (segments[0] === 'admin' && segments[1] === 'login');

      if (!user) {
        // If not logged in, redirect to login if trying to access protected routes
        if (!isAuthPage && (inTabsGroup || inAdminGroup || inTherapistGroup)) {
          router.replace('/login');
        }
      } else {
        // If logged in, handle role-based redirection from auth pages
        if (isAuthPage) {
          if (user.role === 'admin') {
            router.replace('/admin/dashboard' as any);
          } else if (user.role === 'therapist') {
            router.replace('/therapist/dashboard' as any);
          } else {
            router.replace('/(tabs)');
          }
        }
        
        // Prevent users from accessing areas they don't belong to
        if (user.role === 'admin' && inTabsGroup) {
          // Admin can see tabs if they want, but default should be dashboard
          // For now, let's just allow it, but redirecting to dashboard is usually safer
        }
        if (user.role === 'user' && (inAdminGroup || inTherapistGroup)) {
          router.replace('/(tabs)');
        }
      }
    }, 1);

    return () => clearTimeout(timeout);
  }, [user, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <View style={styles.rootBackground}>
      <View style={styles.appContainer}>
        <DiagnosisProvider>
          <AuthProvider>
            <AuthGuard>
              <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <Stack>
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen name="login" options={{ headerShown: false }} />
                  <Stack.Screen name="register" options={{ headerShown: false }} />

                  <Stack.Screen name="self-care" options={{ headerShown: false }} />
                  <Stack.Screen name="therapist-matching" options={{ headerShown: false }} />
                  <Stack.Screen name="history" options={{ headerShown: false }} />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  
                  {/* Admin & Therapist Routes */}
                  <Stack.Screen name="admin/login" options={{ headerShown: false }} />
                  <Stack.Screen name="admin/dashboard" options={{ headerShown: false }} />
                  <Stack.Screen name="admin/register-therapist" options={{ headerShown: false }} />
                  <Stack.Screen name="therapist/dashboard" options={{ headerShown: false }} />
                  <Stack.Screen name="therapist/patient-progress" options={{ headerShown: false }} />

                  <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
                </Stack>
                <StatusBar style="auto" />
              </ThemeProvider>
            </AuthGuard>
          </AuthProvider>
        </DiagnosisProvider>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rootBackground: {
    flex: 1,
    backgroundColor: '#fff',
  },
  appContainer: {
    flex: 1,
    backgroundColor: '#fff',
  }
});
