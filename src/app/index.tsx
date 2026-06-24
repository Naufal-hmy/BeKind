import { dbService } from '@/services/database';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    dbService.getProfile()
      .then(profile => {
        setRole(profile.role || 'user');
      })
      .catch(e => {
        console.error('Error fetching profile:', e);
        setRole('user');
      });
  }, []);

  if (!role) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#06B6D4" />
      </View>
    );
  }

  if (role === 'admin') {
    return <Redirect href={"/admin" as any} />;
  }

  return <Redirect href={"/(tabs)" as any} />;
}
