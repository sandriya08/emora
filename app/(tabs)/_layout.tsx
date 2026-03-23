import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF7597',
        tabBarInactiveTintColor: '#B9B4AB',
        tabBarStyle: { 
          backgroundColor: '#FFFFFF', 
          borderTopWidth: 0,
          position: 'absolute',
          bottom: 25,
          left: 20,
          right: 20,
          elevation: 5,
          borderRadius: 40,
          height: 65,
          paddingBottom: 0,
        },
        tabBarShowLabel: false,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Ionicons size={24} name="home-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }) => (
            <Ionicons size={24} name="chatbubbles-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="self-care" // This is the middle tab
        options={{
          title: 'Self-Care',
          tabBarIcon: ({ color }) => (
            <Ionicons size={24} name="heart-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="therapist"
        options={{
          title: 'Therapist',
          tabBarIcon: ({ color }) => (
            <Ionicons size={24} name="people-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <Ionicons size={24} name="person-outline" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
