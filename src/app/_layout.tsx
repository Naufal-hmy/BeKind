import { AuthScreen } from '@/components/AuthScreen';
import { AgentProvider } from '@/context/AgentContext';
import { isDemoMode, supabase } from '@/services/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as NavigationBar from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, LogBox, Platform, StatusBar, useColorScheme, View } from 'react-native';

LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  'SafeAreaView has been deprecated',
  'Route "./explore.tsx" is missing',
  'Too many screens defined',
]);

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  StatusBar.setHidden(false);
  StatusBar.setBarStyle('light-content');
  if (Platform.OS === 'android') {
    StatusBar.setBackgroundColor('#1E293B');
    StatusBar.setTranslucent(false);
  }

  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
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

    supabase!.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

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

  if (!session) {
    return <AuthScreen onLoginSuccess={(sess: any) => setSession(sess)} />;
  }

  return (
    <AgentProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="admin" />
      </Stack>
    </AgentProvider>
  );
}
