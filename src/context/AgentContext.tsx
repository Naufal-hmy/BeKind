import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { dbService } from '@/services/database';

// Konfigurasi handler notifikasi ketika app sedang terbuka
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  } as any),
});

interface AgentContextType {
  currentLocation: { latitude: number; longitude: number } | null;
  activeSuggestion: any | null;
  isScanning: boolean;
  scanForMissions: () => Promise<void>;
  simulateAgentMatch: () => Promise<void>;
  dismissSuggestion: (id: string) => Promise<void>;
  acceptSuggestion: (id: string) => Promise<void>;
  locationPermission: boolean;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

// Koordinat Default (Gedung Sate Bandung) jika GPS mati/emulator
const MOCK_COORDS = { latitude: -6.9024, longitude: 107.6186 };

export const AgentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [activeSuggestion, setActiveSuggestion] = useState<any | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);

  // 1. Inisialisasi Perangkat (Izin GPS & Notifikasi)
  useEffect(() => {
    async function setupPermissions() {
      try {
        // Izin Lokasi
        const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
        if (locStatus === 'granted') {
          setLocationPermission(true);
          try {
            const loc = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            setCurrentLocation({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
          } catch (locErr) {
            console.log('getCurrentPositionAsync gagal (mungkin GPS mati), mencoba getLastKnownPositionAsync...');
            const lastLoc = await Location.getLastKnownPositionAsync();
            if (lastLoc) {
              setCurrentLocation({
                latitude: lastLoc.coords.latitude,
                longitude: lastLoc.coords.longitude,
              });
            } else {
              console.log('Tidak ada lokasi terakhir yang diketahui, menggunakan koordinat default (Bandung)');
              setCurrentLocation(MOCK_COORDS);
            }
          }
        } else {
          // Fallback ke Gedung Sate jika tidak diberi izin
          setCurrentLocation(MOCK_COORDS);
        }

        // Izin Notifikasi
        const { status: notifStatus } = await Notifications.requestPermissionsAsync();
        if (notifStatus !== 'granted' && Platform.OS !== 'web') {
          console.log('Izin notifikasi ditolak');
        }
      } catch (error) {
        console.log('Gagal mengatur perizinan perangkat, menggunakan mock:', error);
        setCurrentLocation(MOCK_COORDS);
      }
    }

    setupPermissions();
  }, []);

  // 2. Real-time Subscription ke Tabel Suggestions Supabase/Mock
  useEffect(() => {
    // Muat saran pending yang aktif saat pertama kali dibuka
    async function loadActiveSuggestion() {
      try {
        const suggestions = await dbService.getSuggestions();
        const pending = suggestions.find((s: any) => s.status === 'pending' || s.status === 'accepted');
        if (pending) {
          setActiveSuggestion(pending);
        }
      } catch (err) {
        console.error('Gagal mengambil saran aktif:', err);
      }
    }
    loadActiveSuggestion();

    // Subscribe ke saran baru
    const unsubscribe = dbService.subscribeSuggestions((newSug) => {
      setActiveSuggestion(newSug);
      triggerLocalNotification(newSug);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Fungsi untuk memicu notifikasi lokal di HP
  async function triggerLocalNotification(sug: any) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Ada Misi Kebaikan Baru!',
          body: `Waktu luang kamu terdeteksi cocok dengan misi "${sug.mission?.title || 'Kebaikan Sosial'}". Cek sekarang cuy!`,
          data: { suggestionId: sug.id },
        },
        trigger: null, // Kirim secepatnya
      });
    } catch (e) {
      console.log('Notifikasi lokal gagal terkirim:', e);
    }
  }

  // Helper untuk menghitung jarak antara dua koordinat (dalam km)
  function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius bumi
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // 3. Logika Agen Otonom Utama: Pindai Celah Jadwal & Lokasi
  const scanForMissions = async () => {
    if (isScanning) return;
    setIsScanning(true);

    try {
      // a. Ambil lokasi terkini
      let loc = currentLocation;
      try {
        const freshLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        loc = { latitude: freshLoc.coords.latitude, longitude: freshLoc.coords.longitude };
        setCurrentLocation(loc);
      } catch (e) {
        // Gunakan lokasi terakhir jika GPS gagal
        if (!loc) loc = MOCK_COORDS;
      }

      // b. Analisis Kalender (Cari celah waktu kosong)
      const schedules = await dbService.getSchedules();
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTimeStr = `${currentHours.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;

      // Deteksi apakah saat ini user sedang bebas berdasarkan jadwal
      // (Bebas = tidak berada di dalam rentang waktu start_time s/d end_time dari jadwal apapun)
      let isBusy = false;
      let nextSchedule: any = null;

      for (const event of schedules) {
        if (currentTimeStr >= event.start_time && currentTimeStr <= event.end_time) {
          isBusy = true;
          break;
        }
        if (event.start_time > currentTimeStr) {
          if (!nextSchedule || event.start_time < nextSchedule.start_time) {
            nextSchedule = event;
          }
        }
      }

      // Jika user sedang sibuk kuliah/kerja, Agen tidak akan menyarankan misi demi menghormati fokus user!
      if (isBusy) {
        Alert.alert('Asisten BeKind', 'Kamu dideteksi lagi sibuk saat ini sesuai jadwal. Fokus dulu ya, nanti kita cari kebaikan pas luang! (No Cap)');
        setIsScanning(false);
        return;
      }

      // Hitung durasi waktu luang sampai jadwal berikutnya
      let freeStartTime = currentTimeStr;
      let freeEndTime = '23:59';
      if (nextSchedule) {
        freeEndTime = nextSchedule.start_time;
      }

      // Cek apakah waktu luang setidaknya 30 menit
      const [h1, m1] = freeStartTime.split(':').map(Number);
      const [h2, m2] = freeEndTime.split(':').map(Number);
      const diffMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);

      if (diffMinutes < 30) {
        Alert.alert('Asisten BeKind', 'Waktu senggang kamu terlalu sempit (< 30 menit). Simpan energimu buat nanti, bestie!');
        setIsScanning(false);
        return;
      }

      // c. Cari Misi Terdekat (Radius < 5km)
      const missions = await dbService.getMissions();
      const nearbyMissions = missions.filter((mission: any) => {
        const dist = getDistance(loc!.latitude, loc!.longitude, mission.latitude, mission.longitude);
        return dist <= 5.0; // 5 km
      });

      if (nearbyMissions.length === 0) {
        Alert.alert('Asisten BeKind', 'Waktu luang ada, tapi ga ada misi kebaikan terdekat dalam radius 5km. Aman cuy!');
        setIsScanning(false);
        return;
      }

      // Pilih satu misi terdekat secara acak atau yang paling dekat
      // Cari yang paling dekat
      let closestMission = nearbyMissions[0];
      let minDistance = getDistance(loc!.latitude, loc!.longitude, closestMission.latitude, closestMission.longitude);

      for (const m of nearbyMissions) {
        const d = getDistance(loc!.latitude, loc!.longitude, m.latitude, m.longitude);
        if (d < minDistance) {
          minDistance = d;
          closestMission = m;
        }
      }

      // d. Buat Saran Baru (Ini akan memicu Real-time Subscription)
      await dbService.addSuggestion(closestMission.id, freeStartTime, freeEndTime);
      
    } catch (error) {
      console.error('Proses scan agen gagal:', error);
    } finally {
      setIsScanning(false);
    }
  };

  // 4. Simulasi Force-Match (Sangat berguna untuk DEMO)
  // Fungsi ini mengabaikan kesibukan jadwal dan langsung meluncurkan misi terdekat untuk simulasi real-time
  const simulateAgentMatch = async () => {
    setIsScanning(true);
    try {
      let loc = currentLocation || MOCK_COORDS;
      const missions = await dbService.getMissions();
      
      // Ambil acak satu misi
      const randomMission = missions[Math.floor(Math.random() * missions.length)];
      
      // Ambil celah simulasi
      const now = new Date();
      const startStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const endStr = `${(now.getHours() + 1).toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      // Buat saran (Ini akan langsung masuk database / localstorage dan mentrigger subscription)
      const sug = await dbService.addSuggestion(randomMission.id, startStr, endStr);
      if (sug) {
        setActiveSuggestion(sug);
        triggerLocalNotification(sug);
      }
    } catch (e) {
      console.error('Simulasi gagal:', e);
    } finally {
      setIsScanning(false);
    }
  };

  const dismissSuggestion = async (id: string) => {
    try {
      await dbService.updateSuggestionStatus(id, 'declined');
      setActiveSuggestion(null);
    } catch (e) {
      console.error(e);
    }
  };

  const acceptSuggestion = async (id: string) => {
    try {
      await dbService.updateSuggestionStatus(id, 'accepted');
      // Update state saran aktif saat ini
      setActiveSuggestion((prev: any) => prev ? { ...prev, status: 'accepted' } : null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AgentContext.Provider
      value={{
        currentLocation,
        activeSuggestion,
        isScanning,
        scanForMissions,
        simulateAgentMatch,
        dismissSuggestion,
        acceptSuggestion,
        locationPermission,
      }}>
      {children}
    </AgentContext.Provider>
  );
};

export const useKindnessAgent = () => {
  const context = useContext(AgentContext);
  if (context === undefined) {
    throw new Error('useKindnessAgent must be used within an AgentProvider');
  }
  return context;
};
