import { Tabs } from 'expo-router';
import { useColorScheme, View, StyleSheet, Platform, ActivityIndicator, LogBox, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as NavigationBar from 'expo-navigation-bar';
import { AgentProvider } from '@/context/AgentContext';
import { supabase, isDemoMode } from '@/services/database';
import { AuthScreen } from '@/components/AuthScreen';

// Sembunyikan peringatan/notifikasi yang mengganggu di layar perangkat
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  'SafeAreaView has been deprecated',
  'Route "./explore.tsx" is missing',
  'Too many screens defined',
]);

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  // Pastikan status bar terlihat agar tidak menutupi notch atau konten di Android/iOS
  StatusBar.setHidden(false);
  StatusBar.setBarStyle('light-content');
  if (Platform.OS === 'android') {
    StatusBar.setBackgroundColor('#1E293B'); // Slate 800 (cocok dengan tema header app)
    StatusBar.setTranslucent(false);
  }

  // Tema Gen Z: Dark Mode dengan gradasi ungu dan cyan neon
  const primaryColor = '#8B5CF6'; // Violet
  const accentColor = '#06B6D4'; // Cyan
  const backgroundColor = '#0F172A'; // Slate 900
  const activeColor = '#06B6D4';
  const inactiveColor = '#94A3B8';

  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Sesuaikan tinggi tab bar secara dinamis sesuai insets bottom (Android nav bar / iOS home bar)
  const tabBarHeight = Platform.OS === 'web' ? 65 : 65 + insets.bottom;
  const tabBarPaddingBottom = Platform.OS === 'web' ? 10 : 10 + insets.bottom;

  useEffect(() => {
    // Set Android Bottom Navigation Bar Color
    if (Platform.OS === 'android') {
      const navBar = NavigationBar as any;
      if (typeof navBar.setBackgroundColorAsync === 'function') {
        navBar.setBackgroundColorAsync('#0F172A').catch((err: any) => console.log('NavBar error:', err));
      }
      if (typeof navBar.setButtonStyleAsync === 'function') {
        navBar.setButtonStyleAsync('light').catch((err: any) => console.log('NavBar button error:', err));
      }
    }

    if (isDemoMode) {
      AsyncStorage.getItem('@demo_session').then((demoSess) => {
        if (demoSess) {
          setSession({ user: { email: demoSess } });
        } else {
          setSession(null);
        }
        setAuthLoading(false);
      });
      return;
    }

    // Ambil session saat ini
    supabase!.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    // Dengarkan perubahan auth
    const { data: { subscription } } = supabase!.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#06B6D4" />
      </View>
    );
  }

  // Jika tidak terautentikasi (baik Supabase maupun Demo Mode), tampilkan halaman Login/Register
  if (!session) {
    return <AuthScreen onLoginSuccess={(sess: any) => setSession(sess)} />;
  }

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
            height: tabBarHeight,
            paddingBottom: tabBarPaddingBottom,
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
          name="leaderboard"
          options={{
            title: 'Papan Peringkat',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'trophy' : 'trophy-outline'} size={24} color={color} />
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
