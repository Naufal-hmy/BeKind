<<<<<<< HEAD
import { dbService } from '@/services/database';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
=======
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { dbService } from '@/services/database';
>>>>>>> 30fc53d1095abe0e6781ec7cdf9bbf2e8c2afaf6

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
<<<<<<< HEAD
      <View style={{ flex: 1, backgroundColor: '#2f4476', justifyContent: 'center', alignItems: 'center' }}>
=======
      <View style={{ flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' }}>
>>>>>>> 30fc53d1095abe0e6781ec7cdf9bbf2e8c2afaf6
        <ActivityIndicator size="large" color="#06B6D4" />
      </View>
    );
  }

  if (role === 'admin') {
    return <Redirect href="/admin" />;
  }

  return <Redirect href="/(tabs)" />;
}
