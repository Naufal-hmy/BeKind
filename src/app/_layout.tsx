import { Tabs } from 'expo-router';
import { useColorScheme, View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AgentProvider } from '@/context/AgentContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Tema Gen Z: Dark Mode dengan gradasi ungu dan cyan neon
  const primaryColor = '#8B5CF6'; // Violet
  const accentColor = '#06B6D4'; // Cyan
  const backgroundColor = '#0F172A'; // Slate 900
  const activeColor = '#06B6D4';
  const inactiveColor = '#94A3B8';

  return (
    <AgentProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: activeColor,
          tabBarInactiveTintColor: inactiveColor,
          tabBarStyle: {
            backgroundColor: '#1E293B', // Slate 800
            borderTopWidth: 1,
            borderTopColor: '#334155', // Slate 700
            height: 65,
            paddingBottom: 10,
            paddingTop: 8,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'sparkles' : 'sparkles-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            title: 'Peta Peka',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'map' : 'map-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: 'Jadwal',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
            ),
          }}
        />
        {/* Sembunyikan layar explore bawaan template */}
        <Tabs.Screen
          name="explore"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </AgentProvider>
  );
}
