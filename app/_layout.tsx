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
    const inTabsGroup = segments[0] === '(tabs)';
    
    if (!user && inTabsGroup) {
      // Redirect to login if on protected screen without user
      router.replace('/login');
    } else if (user && !inTabsGroup) {
      // If signed in, keep them away from login/register/index
      router.replace('/(tabs)');
    }
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
                  <Stack.Screen name="result" options={{ headerShown: false }} />
                  <Stack.Screen name="self-care" options={{ headerShown: false }} />
                  <Stack.Screen name="therapist-matching" options={{ headerShown: false }} />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
