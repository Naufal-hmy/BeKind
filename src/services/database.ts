import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius bumi (km)
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

// Kredensial Supabase diambil dari environment variables
// Jika belum diset, aplikasi otomatis berjalan dalam "Demo Mode" (Local Mock Storage)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const isDemoMode = !supabaseUrl || !supabaseAnonKey;

// Inisialisasi Supabase client (jika kredensial ada)
export const supabase = !isDemoMode ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Mock Data Awal untuk Demo Mode
const INITIAL_MISSIONS = [
  {
    id: 'm1',
    title: 'Kasih Makan Kucing Jalanan',
    description: 'Ada beberapa kucing liar lucu di dekat taman yang kelihatan lapar. Kasih mereka cat food kering atau basah.',
    category: 'Hewan',
    latitude: -6.9024, // Koordinat Bandung sekitaran Gedung Sate/Taman Kota
    longitude: 107.6186,
    aura_points: 50,
    location_name: 'Taman Balai Kota',
  },
  {
    id: 'm2',
    title: 'Beli Jualan Pedagang Sepi',
    description: 'Beli minuman atau camilan ringan dari pedagang kaki lima tua di pinggir jalan untuk melariskan jualan mereka.',
    category: 'Sosial',
    latitude: -6.9015,
    longitude: 107.6200,
    aura_points: 80,
    location_name: 'Jl. Riau (Depan FO)',
  },
  {
    id: 'm3',
    title: 'Bagi Air Minum ke Abang Ojol/Sapu Jalanan',
    description: 'Cuaca lagi panas banget. Beli es teh atau air mineral dingin, bagikan ke abang ojol atau penyapu jalanan yang sedang bertugas.',
    category: 'Kemanusiaan',
    latitude: -6.9038,
    longitude: 107.6155,
    aura_points: 60,
    location_name: 'Pintu Gerbang Depan Unpad',
  },
  {
    id: 'm4',
    title: 'Pungut Sampah Plastik Liar',
    description: 'Pungut minimal 5 botol atau kantong plastik di sekitar trotoar dan buang ke tempat sampah terdekat biar lingkungan tetap bersih.',
    category: 'Lingkungan',
    latitude: -6.8995,
    longitude: 107.6198,
    aura_points: 40,
    location_name: 'Sekitar Lapangan Saparua',
  },
];

const INITIAL_PROFILE = {
  name: 'Skylar GenZ',
  username: 'skylar_peka',
  aura_points: 150,
  level: 'Peka-Beginner',
  avatar_url: 'https://api.dicebear.com/7.x/pixel-art/png?seed=skylar',
};

const INITIAL_SCHEDULES = [
  {
    id: 's1',
    title: 'Kuliah Pemrograman Mobile',
    start_time: '08:00',
    end_time: '10:30',
  },
  {
    id: 's2',
    title: 'Makan Siang Bareng Bestie',
    start_time: '12:00',
    end_time: '13:00',
  },
  {
    id: 's3',
    title: 'Ngerjain Tugas di Kafe',
    start_time: '15:30',
    end_time: '18:00',
  },
];

// Helper untuk inisialisasi local storage jika kosong
async function initLocalStorage() {
  try {
    const profile = await AsyncStorage.getItem('@profile');
    if (!profile) {
      await AsyncStorage.setItem('@profile', JSON.stringify(INITIAL_PROFILE));
      await AsyncStorage.setItem('@schedules', JSON.stringify(INITIAL_SCHEDULES));
      await AsyncStorage.setItem('@missions', JSON.stringify(INITIAL_MISSIONS));
      await AsyncStorage.setItem('@suggestions', JSON.stringify([]));
      await AsyncStorage.setItem('@completed_missions', JSON.stringify([]));
      console.log('Local Mock Storage berhasil diinisialisasi!');
    }
  } catch (e) {
    console.error('Gagal inisialisasi Local Storage:', e);
  }
}

// Panggil fungsi inisialisasi lokal
initLocalStorage();

// Interface Service Database
export const dbService = {
  // === PROFILE ===
  async getProfile() {
    if (isDemoMode) {
      const sessionEmail = await AsyncStorage.getItem('@demo_session');
      if (sessionEmail === 'admin') {
        const data = await AsyncStorage.getItem('@profile_admin');
        if (data) return JSON.parse(data);
        const adminProfile = {
          name: 'Admin BeKind',
          username: 'admin',
          role: 'admin',
          email: 'admin@gmail.com',
          aura_points: 999,
          level: 'Kaisar Empati',
          avatar_url: 'https://api.dicebear.com/7.x/pixel-art/png?seed=admin',
        };
        await AsyncStorage.setItem('@profile_admin', JSON.stringify(adminProfile));
        return adminProfile;
      } else if (sessionEmail) {
        const key = `@profile_${sessionEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const data = await AsyncStorage.getItem(key);
        if (data) return JSON.parse(data);
        
        const usernamePart = sessionEmail.split('@')[0];
        const userProfile = {
          name: usernamePart.charAt(0).toUpperCase() + usernamePart.slice(1),
          username: usernamePart,
          role: 'user',
          email: sessionEmail,
          aura_points: 150,
          level: 'Peka-Beginner',
          avatar_url: `https://api.dicebear.com/7.x/pixel-art/png?seed=${usernamePart}`,
        };
        await AsyncStorage.setItem(key, JSON.stringify(userProfile));
        return userProfile;
      }
      
      const data = await AsyncStorage.getItem('@profile');
      return data ? JSON.parse(data) : { ...INITIAL_PROFILE, role: 'user', email: 'bestie_peka@gmail.com' };
    } else {
      const { data: userData, error: userError } = await supabase!.auth.getUser();
      if (userError || !userData.user) throw new Error('User tidak terautentikasi');
      
      const { data, error } = await supabase!
        .from('profiles')
        .select('*')
        .eq('id', userData.user.id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          const userId = userData.user.id;
          const isEmailAdmin = userData.user.email === 'admin@gmail.com';
          const fallbackName = isEmailAdmin ? 'Admin BeKind' : (userData.user.user_metadata?.name || 'Bestie Peka');
          const fallbackUsername = isEmailAdmin ? 'admin' : (userData.user.user_metadata?.username || `peka_${userId.substring(0, 6)}`);
          const fallbackRole = isEmailAdmin ? 'admin' : 'user';
          
          const newProfile = {
            id: userId,
            name: fallbackName,
            username: fallbackUsername,
            role: fallbackRole,
            aura_points: fallbackRole === 'admin' ? 999 : 150,
            level: fallbackRole === 'admin' ? 'Kaisar Empati' : 'Peka-Beginner',
            avatar_url: `https://api.dicebear.com/7.x/pixel-art/png?seed=${fallbackUsername}`,
          };
          
          const { data: insertedData, error: insertError } = await supabase!
            .from('profiles')
            .insert(newProfile)
            .select()
            .single();
            
          if (insertError) throw insertError;
          return insertedData;
        }
        throw error;
      }
      
      if (data) {
        if (userData.user.email === 'admin@gmail.com' && data.role !== 'admin') {
          const { data: updatedData } = await supabase!
            .from('profiles')
            .update({ role: 'admin', aura_points: 999, level: 'Kaisar Empati' })
            .eq('id', userData.user.id)
            .select()
            .single();
          if (updatedData) return updatedData;
        }
        return data;
      }
      return data;
    }
  },

  async getAllProfiles() {
    if (isDemoMode) {
      // Return mock users for demo mode
      const sessionEmail = await AsyncStorage.getItem('@demo_session');
      const currentUser = await this.getProfile();
      let users = [currentUser];
      if (sessionEmail === 'admin') {
        users.push({
          id: 'user1',
          name: 'Skylar GenZ',
          username: 'skylar_peka',
          role: 'user',
          email: 'bestie_peka@gmail.com',
          aura_points: 150,
          level: 'Peka-Beginner',
          avatar_url: 'https://api.dicebear.com/7.x/pixel-art/png?seed=skylar',
        });
      }
      return users;
    } else {
      const { data, error } = await supabase!
        .from('profiles')
        .select('*')
        .order('aura_points', { ascending: false });
      if (error) throw error;
      return data;
    }
  },

  async updateAuraPoints(additionalPoints: number) {
    if (isDemoMode) {
      const sessionEmail = await AsyncStorage.getItem('@demo_session') || 'default';
      const key = sessionEmail === 'admin' ? '@profile_admin' : (sessionEmail === 'default' ? '@profile' : `@profile_${sessionEmail.replace(/[^a-zA-Z0-9]/g, '_')}`);
      
      const profileStr = await AsyncStorage.getItem(key);
      const profile = profileStr ? JSON.parse(profileStr) : { ...INITIAL_PROFILE };
      profile.aura_points += additionalPoints;
      
      if (profile.aura_points >= 500) {
        profile.level = 'Kaisar Empati';
      } else if (profile.aura_points >= 300) {
        profile.level = 'Pahlawan Peka';
      } else if (profile.aura_points >= 200) {
        profile.level = 'Bestie Peduli';
      } else {
        profile.level = 'Peka-Beginner';
      }

      await AsyncStorage.setItem(key, JSON.stringify(profile));
      return profile;
    } else {
      const { data: profile, error: fetchErr } = await supabase!
        .from('profiles')
        .select('aura_points')
        .single();
      if (fetchErr) throw fetchErr;

      const newPoints = profile.aura_points + additionalPoints;
      let level = 'Peka-Beginner';
      if (newPoints >= 500) level = 'Kaisar Empati';
      else if (newPoints >= 300) level = 'Pahlawan Peka';
      else if (newPoints >= 200) level = 'Bestie Peduli';

      const { data, error } = await supabase!
        .from('profiles')
        .update({ aura_points: newPoints, level })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  async updateProfileAvatar(avatarUrl: string) {
    if (isDemoMode) {
      const sessionEmail = await AsyncStorage.getItem('@demo_session') || 'default';
      const key = sessionEmail === 'admin' ? '@profile_admin' : (sessionEmail === 'default' ? '@profile' : `@profile_${sessionEmail.replace(/[^a-zA-Z0-9]/g, '_')}`);
      
      const profileStr = await AsyncStorage.getItem(key);
      const profile = profileStr ? JSON.parse(profileStr) : { ...INITIAL_PROFILE };
      profile.avatar_url = avatarUrl;
      await AsyncStorage.setItem(key, JSON.stringify(profile));
      return profile;
    } else {
      const { data: userData, error: userError } = await supabase!.auth.getUser();
      if (userError || !userData.user) throw new Error('User tidak terautentikasi');
      
      const { data, error } = await supabase!
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', userData.user.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  async updateProfileInfo(name: string, username: string) {
    if (isDemoMode) {
      const sessionEmail = await AsyncStorage.getItem('@demo_session') || 'default';
      const key = sessionEmail === 'admin' ? '@profile_admin' : (sessionEmail === 'default' ? '@profile' : `@profile_${sessionEmail.replace(/[^a-zA-Z0-9]/g, '_')}`);
      
      const profileStr = await AsyncStorage.getItem(key);
      const profile = profileStr ? JSON.parse(profileStr) : { ...INITIAL_PROFILE };
      profile.name = name;
      profile.username = username;
      await AsyncStorage.setItem(key, JSON.stringify(profile));
      return profile;
    } else {
      const { data: userData, error: userError } = await supabase!.auth.getUser();
      if (userError || !userData.user) throw new Error('User tidak terautentikasi');
      
      const { data, error } = await supabase!
        .from('profiles')
        .update({ name, username })
        .eq('id', userData.user.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  // === SCHEDULES ===
  async getSchedules() {
    if (isDemoMode) {
      const data = await AsyncStorage.getItem('@schedules');
      return data ? JSON.parse(data) : INITIAL_SCHEDULES;
    } else {
      const { data: userData } = await supabase!.auth.getUser();
      const userId = userData?.user?.id;
      
      const { data, error } = await supabase!
        .from('schedules')
        .select('*')
        .eq('user_id', userId || '')
        .order('start_time', { ascending: true });
      if (error) throw error;
      return data;
    }
  },

  async addSchedule(
    title: string, 
    start_time: string, 
    end_time: string, 
    date: string | null = null, 
    frequency: string = 'once', 
    type: string = 'busy'
  ) {
    const newSchedule = {
      id: Math.random().toString(36).substring(7),
      title,
      start_time,
      end_time,
      date,
      frequency,
      type,
    };

    if (isDemoMode) {
      const dataStr = await AsyncStorage.getItem('@schedules');
      const schedules = dataStr ? JSON.parse(dataStr) : [];
      schedules.push(newSchedule);
      schedules.sort((a: any, b: any) => a.start_time.localeCompare(b.start_time));
      await AsyncStorage.setItem('@schedules', JSON.stringify(schedules));
      return newSchedule;
    } else {
      const { data, error } = await supabase!
        .from('schedules')
        .insert([{ title, start_time, end_time, date, frequency, type }])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  async deleteSchedule(id: string) {
    if (isDemoMode) {
      const dataStr = await AsyncStorage.getItem('@schedules');
      let schedules = dataStr ? JSON.parse(dataStr) : [];
      schedules = schedules.filter((s: any) => s.id !== id);
      await AsyncStorage.setItem('@schedules', JSON.stringify(schedules));
      return true;
    } else {
      const { error } = await supabase!
        .from('schedules')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    }
  },

  // === MISSIONS ===
  async getMissions(userCoords?: { latitude: number; longitude: number }) {
    let missions: any[] = [];
    if (isDemoMode) {
      const data = await AsyncStorage.getItem('@missions');
      missions = data ? JSON.parse(data) : [...INITIAL_MISSIONS];
    } else {
      const { data, error } = await supabase!
        .from('missions')
        .select('*');
      if (error) throw error;
      missions = data || [];
    }

    // Jika userCoords dikirim, lakukan check radius 10km.
    // Jika kosong (tidak ada misi dekat user), kita auto-seeding misi di sekitar lokasi user tersebut
    if (userCoords) {
      const nearby = missions.filter((m: any) => {
        // Hanya hitung misi system/public, personal diabaikan dari seeding peta
        if (m.type === 'personal') return false;
        const d = getDistance(userCoords.latitude, userCoords.longitude, m.latitude, m.longitude);
        return d <= 10.0;
      });

      if (nearby.length === 0) {
        const seededMissions = [
          {
            id: 'seeded_m1_' + Math.random().toString(36).substring(7),
            title: 'Kasih Makan Kucing Gang',
            description: 'Ada gerombolan kucing jalanan lucu di gang ini. Kasih mereka cat food kering atau basah biar kenyang.',
            category: 'Hewan',
            latitude: userCoords.latitude + 0.0035,
            longitude: userCoords.longitude - 0.0041,
            aura_points: 60,
            location_name: 'Gang Sekitar Lokasi Lu',
            type: 'system',
            mode: 'solo',
            is_event_mission: false
          },
          {
            id: 'seeded_m2_' + Math.random().toString(36).substring(7),
            title: 'Melariskan Jualan Warung Sepi',
            description: 'Ada warung kelontong kecil/pedagang gerobak tua di dekat sini. Beli cemilan atau minuman ringan untuk melariskan dagangannya.',
            category: 'Sosial',
            latitude: userCoords.latitude - 0.0052,
            longitude: userCoords.longitude + 0.0038,
            aura_points: 80,
            location_name: 'Warung/Pedagang Kaki Lima Terdekat',
            type: 'system',
            mode: 'group',
            is_event_mission: false
          },
          {
            id: 'seeded_m3_' + Math.random().toString(36).substring(7),
            title: 'Bagi Es Teh Manis buat Abang Ojol & Pemulung',
            description: 'Cuaca panas terik. Beli es teh manis atau air mineral dingin, bagikan ke abang ojol atau pemulung yang berjuang di jalan.',
            category: 'Kemanusiaan',
            latitude: userCoords.latitude + 0.0061,
            longitude: userCoords.longitude + 0.0055,
            aura_points: 70,
            location_name: 'Pangkalan Ojek / Pinggir Jalan Raya',
            type: 'system',
            mode: 'solo',
            is_event_mission: false
          },
          {
            id: 'seeded_m4_' + Math.random().toString(36).substring(7),
            title: 'Operasi Bersih Sampah Plastik',
            description: 'Ajak warga atau teman memungut sampah plastik di sepanjang trotoar/taman terdekat agar lingkungan asri.',
            category: 'Lingkungan',
            latitude: userCoords.latitude - 0.0029,
            longitude: userCoords.longitude - 0.0075,
            aura_points: 90,
            location_name: 'Taman / Trotoar Publik Sekitar',
            type: 'system',
            mode: 'community',
            is_event_mission: false
          }
        ];

        if (isDemoMode) {
          const updatedMissions = [...missions, ...seededMissions];
          await AsyncStorage.setItem('@missions', JSON.stringify(updatedMissions));
          return updatedMissions;
        } else {
          const { error: insertErr } = await supabase!
            .from('missions')
            .insert(seededMissions.map((m: any) => ({
              title: m.title,
              description: m.description,
              category: m.category,
              latitude: m.latitude,
              longitude: m.longitude,
              aura_points: m.aura_points,
              location_name: m.location_name,
              type: m.type,
              mode: m.mode,
              is_event_mission: m.is_event_mission
            })));
          
          if (!insertErr) {
            const { data: refetched } = await supabase!.from('missions').select('*');
            if (refetched) return refetched;
          }
        }
      }
    }

    return missions;
  },

  async addMission(
    title: string, 
    description: string, 
    category: string, 
    latitude: number, 
    longitude: number, 
    auraPoints: number, 
    locationName: string,
    type: 'system' | 'personal' | 'public' = 'system',
    mode: 'solo' | 'group' | 'community' = 'solo',
    paymentMethod: string | null = null,
    paymentStatus: string | null = null,
    isEventMission: boolean = false,
    eventName: string | null = null
  ) {
    const newMission = {
      id: Math.random().toString(36).substring(7),
      title,
      description,
      category,
      latitude,
      longitude,
      aura_points: auraPoints,
      location_name: locationName,
      type,
      mode,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      is_event_mission: isEventMission,
      event_name: eventName,
    };

    // Jika bayar pakai Aura Points, kurangi poin
    if (type === 'public' && paymentMethod === 'points') {
      await this.updateAuraPoints(-100);
    }

    if (isDemoMode) {
      const dataStr = await AsyncStorage.getItem('@missions');
      const missions = dataStr ? JSON.parse(dataStr) : [...INITIAL_MISSIONS];
      missions.push(newMission);
      await AsyncStorage.setItem('@missions', JSON.stringify(missions));
      return newMission;
    } else {
      const { data, error } = await supabase!
        .from('missions')
        .insert([{ 
          title, 
          description, 
          category, 
          latitude, 
          longitude, 
          aura_points: auraPoints, 
          location_name: locationName,
          type,
          mode,
          payment_method: paymentMethod,
          payment_status: paymentStatus,
          is_event_mission: isEventMission,
          event_name: eventName
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  async updateMission(id: string, title: string, description: string, category: string, latitude: number, longitude: number, auraPoints: number, locationName: string) {
    if (isDemoMode) {
      const dataStr = await AsyncStorage.getItem('@missions');
      const missions = dataStr ? JSON.parse(dataStr) : [...INITIAL_MISSIONS];
      const updated = missions.map((m: any) => m.id === id ? { ...m, title, description, category, latitude, longitude, aura_points: auraPoints, location_name: locationName } : m);
      await AsyncStorage.setItem('@missions', JSON.stringify(updated));
      return true;
    } else {
      const { error } = await supabase!
        .from('missions')
        .update({ title, description, category, latitude, longitude, aura_points: auraPoints, location_name: locationName })
        .eq('id', id);
      if (error) throw error;
      return true;
    }
  },

  async deleteMission(id: string) {
    if (isDemoMode) {
      const dataStr = await AsyncStorage.getItem('@missions');
      let missions = dataStr ? JSON.parse(dataStr) : [...INITIAL_MISSIONS];
      missions = missions.filter((m: any) => m.id !== id);
      await AsyncStorage.setItem('@missions', JSON.stringify(missions));
      return true;
    } else {
      const { error } = await supabase!
        .from('missions')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    }
  },

  // === SUGGESTIONS (Generated by Agent) ===
  async getSuggestions() {
    if (isDemoMode) {
      const data = await AsyncStorage.getItem('@suggestions');
      return data ? JSON.parse(data) : [];
    } else {
      const { data, error } = await supabase!
        .from('suggestions')
        .select('*, mission:missions(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  },

  async addSuggestion(missionId: string, freeStartTime: string, freeEndTime: string) {
    const newSuggestion = {
      id: Math.random().toString(36).substring(7),
      mission_id: missionId,
      free_start_time: freeStartTime,
      free_end_time: freeEndTime,
      status: 'pending', // pending, accepted, completed, declined
      created_at: new Date().toISOString(),
    };

    if (isDemoMode) {
      const suggestionsStr = await AsyncStorage.getItem('@suggestions');
      const suggestions = suggestionsStr ? JSON.parse(suggestionsStr) : [];
      
      // Ambil detail misi
      const missionsStr = await AsyncStorage.getItem('@missions');
      const missions = missionsStr ? JSON.parse(missionsStr) : INITIAL_MISSIONS;
      const mission = missions.find((m: any) => m.id === missionId);

      const fullSuggestion = { ...newSuggestion, mission };
      
      // Cegah duplikasi saran pending untuk misi yang sama
      const duplicate = suggestions.find(
        (s: any) => s.mission_id === missionId && s.status === 'pending'
      );
      if (duplicate) return duplicate;

      suggestions.unshift(fullSuggestion);
      await AsyncStorage.setItem('@suggestions', JSON.stringify(suggestions));
      
      // Trigger event listener internal untuk simulasi real-time
      if (onSuggestionAddedCallback) {
        onSuggestionAddedCallback(fullSuggestion);
      }
      
      return fullSuggestion;
    } else {
      const { data, error } = await supabase!
        .from('suggestions')
        .insert([{
          mission_id: missionId,
          free_start_time: freeStartTime,
          free_end_time: freeEndTime,
          status: 'pending'
        }])
        .select('*, mission:missions(*)')
        .single();
      if (error) throw error;
      return data;
    }
  },

  async updateSuggestionStatus(id: string, status: 'accepted' | 'completed' | 'declined') {
    if (isDemoMode) {
      const suggestionsStr = await AsyncStorage.getItem('@suggestions');
      const suggestions = suggestionsStr ? JSON.parse(suggestionsStr) : [];
      const updatedSuggestions = suggestions.map((s: any) => {
        if (s.id === id) {
          return { ...s, status };
        }
        return s;
      });
      await AsyncStorage.setItem('@suggestions', JSON.stringify(updatedSuggestions));
      return true;
    } else {
      const { error } = await supabase!
        .from('suggestions')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
      return true;
    }
  },

  // === COMPLETED MISSIONS ===
  async getCompletedMissions() {
    if (isDemoMode) {
      const data = await AsyncStorage.getItem('@completed_missions');
      return data ? JSON.parse(data) : [];
    } else {
      const { data, error } = await supabase!
        .from('completed_missions')
        .select('*, mission:missions(*)')
        .order('completed_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  },

  async completeMission(suggestionId: string, missionId: string, photoUri: string, auraPoints: number) {
    let missions: any[] = [];
    if (isDemoMode) {
      const data = await AsyncStorage.getItem('@missions');
      missions = data ? JSON.parse(data) : INITIAL_MISSIONS;
    } else {
      const { data } = await supabase!.from('missions').select('*');
      missions = data || [];
    }
    const mission = missions.find((m: any) => m.id === missionId) || { type: 'system', is_event_mission: false };

    const todayStr = new Date().toISOString().split('T')[0];
    let finalPointsGained = 0;
    let targetStatus = 'approved';

    if (isDemoMode) {
      const sessionEmail = await AsyncStorage.getItem('@demo_session') || 'default';
      const key = sessionEmail === 'admin' ? '@profile_admin' : (sessionEmail === 'default' ? '@profile' : `@profile_${sessionEmail.replace(/[^a-zA-Z0-9]/g, '_')}`);
      const profileStr = await AsyncStorage.getItem(key);
      const profile = profileStr ? JSON.parse(profileStr) : { ...INITIAL_PROFILE };

      if (profile.daily_streak === undefined) profile.daily_streak = 0;
      if (profile.personal_streak === undefined) profile.personal_streak = 0;

      if (mission.type === 'personal') {
        const lastDate = profile.last_personal_streak_date;
        if (!lastDate) {
          profile.personal_streak = 1;
        } else {
          const prevDate = new Date(lastDate);
          const diffTime = Math.abs(new Date(todayStr).getTime() - prevDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays === 1) profile.personal_streak += 1;
          else if (diffDays > 1) profile.personal_streak = 1;
        }
        profile.last_personal_streak_date = todayStr;
        finalPointsGained = 0;
      } else {
        const lastDate = profile.last_streak_date;
        let activeStreak = profile.daily_streak || 0;
        if (!lastDate) {
          activeStreak = 1;
        } else {
          const prevDate = new Date(lastDate);
          const diffTime = Math.abs(new Date(todayStr).getTime() - prevDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays === 1) activeStreak += 1;
          else if (diffDays > 1) activeStreak = 1;
        }
        profile.daily_streak = activeStreak;
        profile.last_streak_date = todayStr;

        const multiplier = 1.0 + Math.min(activeStreak * 0.05, 0.50);
        finalPointsGained = Math.round(auraPoints * multiplier);

        if (mission.type === 'public') {
          targetStatus = 'pending';
        } else if (mission.is_event_mission) {
          targetStatus = 'pending';
        }

        if (targetStatus === 'approved') {
          profile.aura_points += finalPointsGained;
          if (profile.aura_points >= 500) profile.level = 'Kaisar Empati';
          else if (profile.aura_points >= 300) profile.level = 'Pahlawan Peka';
          else if (profile.aura_points >= 200) profile.level = 'Bestie Peduli';
          else profile.level = 'Peka-Beginner';
        }
      }

      await AsyncStorage.setItem(key, JSON.stringify(profile));

      const completedStr = await AsyncStorage.getItem('@completed_missions');
      const completed = completedStr ? JSON.parse(completedStr) : [];
      
      const newCompletion = {
        id: Math.random().toString(36).substring(7),
        user_id: sessionEmail,
        mission_id: missionId,
        photo_url: photoUri,
        completed_at: new Date().toISOString(),
        points_gained: finalPointsGained,
        status: targetStatus,
        report_reason: null,
        reported_at: null,
        mission,
      };

      completed.unshift(newCompletion);
      await AsyncStorage.setItem('@completed_missions', JSON.stringify(completed));

      // 3. Update status suggestion
      await this.updateSuggestionStatus(suggestionId, targetStatus === 'approved' ? 'completed' : 'accepted');
      return newCompletion;
    } else {
      const { data: userData, error: userError } = await supabase!.auth.getUser();
      if (userError || !userData.user) throw new Error('User tidak terautentikasi');
      const userId = userData.user.id;

      const { data: profile, error: profileErr } = await supabase!
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (profileErr) throw profileErr;

      const updateData: any = {};

      if (mission.type === 'personal') {
        const lastDate = profile.last_personal_streak_date;
        let personalStreak = profile.personal_streak || 0;
        if (!lastDate) {
          personalStreak = 1;
        } else {
          const prevDate = new Date(lastDate);
          const diffTime = Math.abs(new Date(todayStr).getTime() - prevDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays === 1) personalStreak += 1;
          else if (diffDays > 1) personalStreak = 1;
        }
        updateData.personal_streak = personalStreak;
        updateData.last_personal_streak_date = todayStr;
        finalPointsGained = 0;
      } else {
        const lastDate = profile.last_streak_date;
        let activeStreak = profile.daily_streak || 0;
        if (!lastDate) {
          activeStreak = 1;
        } else {
          const prevDate = new Date(lastDate);
          const diffTime = Math.abs(new Date(todayStr).getTime() - prevDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays === 1) activeStreak += 1;
          else if (diffDays > 1) activeStreak = 1;
        }
        updateData.daily_streak = activeStreak;
        updateData.last_streak_date = todayStr;

        const multiplier = 1.0 + Math.min(activeStreak * 0.05, 0.50);
        finalPointsGained = Math.round(auraPoints * multiplier);

        if (mission.type === 'public') {
          targetStatus = 'pending';
        } else if (mission.is_event_mission) {
          targetStatus = 'pending';
        }

        if (targetStatus === 'approved') {
          updateData.aura_points = profile.aura_points + finalPointsGained;
          let level = 'Peka-Beginner';
          if (updateData.aura_points >= 500) level = 'Kaisar Empati';
          else if (updateData.aura_points >= 300) level = 'Pahlawan Peka';
          else if (updateData.aura_points >= 200) level = 'Bestie Peduli';
          updateData.level = level;
        }
      }

      const { error: profileUpErr } = await supabase!
        .from('profiles')
        .update(updateData)
        .eq('id', userId);
      if (profileUpErr) throw profileUpErr;

      const { data, error } = await supabase!
        .from('completed_missions')
        .insert([{
          user_id: userId,
          mission_id: missionId,
          photo_url: photoUri,
          points_gained: finalPointsGained,
          status: targetStatus
        }])
        .select('*, mission:missions(*)')
        .single();
      if (error) throw error;

      await this.updateSuggestionStatus(suggestionId, targetStatus === 'approved' ? 'completed' : 'accepted');
      return data;
    }
  },

  async approveCompletedMission(completedMissionId: string) {
    if (isDemoMode) {
      const completedStr = await AsyncStorage.getItem('@completed_missions');
      const completed = completedStr ? JSON.parse(completedStr) : [];
      let points = 0;
      
      let workerEmail = 'default';
      const updated = completed.map((c: any) => {
        if (c.id === completedMissionId) {
          points = c.points_gained;
          workerEmail = c.user_id;
          return { ...c, status: 'approved' };
        }
        return c;
      });
      await AsyncStorage.setItem('@completed_missions', JSON.stringify(updated));

      const key = workerEmail === 'admin' ? '@profile_admin' : (workerEmail === 'default' ? '@profile' : `@profile_${workerEmail.replace(/[^a-zA-Z0-9]/g, '_')}`);
      const profileStr = await AsyncStorage.getItem(key);
      const profile = profileStr ? JSON.parse(profileStr) : { ...INITIAL_PROFILE };
      profile.aura_points += points;
      
      if (profile.aura_points >= 500) profile.level = 'Kaisar Empati';
      else if (profile.aura_points >= 300) profile.level = 'Pahlawan Peka';
      else if (profile.aura_points >= 200) profile.level = 'Bestie Peduli';
      else profile.level = 'Peka-Beginner';
      
      await AsyncStorage.setItem(key, JSON.stringify(profile));
      return true;
    } else {
      const { data: comp, error: compErr } = await supabase!
        .from('completed_missions')
        .select('*')
        .eq('id', completedMissionId)
        .single();
      if (compErr) throw compErr;

      const { error: upErr } = await supabase!
        .from('completed_missions')
        .update({ status: 'approved' })
        .eq('id', completedMissionId);
      if (upErr) throw upErr;

      const { data: workerProf, error: profErr } = await supabase!
        .from('profiles')
        .select('aura_points')
        .eq('id', comp.user_id)
        .single();
      if (profErr) throw profErr;

      const newPoints = workerProf.aura_points + comp.points_gained;
      let level = 'Peka-Beginner';
      if (newPoints >= 500) level = 'Kaisar Empati';
      else if (newPoints >= 300) level = 'Pahlawan Peka';
      else if (newPoints >= 200) level = 'Bestie Peduli';

      const { error: workerUpErr } = await supabase!
        .from('profiles')
        .update({ aura_points: newPoints, level })
        .eq('id', comp.user_id);
      if (workerUpErr) throw workerUpErr;
      return true;
    }
  },

  async rejectCompletedMission(completedMissionId: string) {
    if (isDemoMode) {
      const completedStr = await AsyncStorage.getItem('@completed_missions');
      const completed = completedStr ? JSON.parse(completedStr) : [];
      const updated = completed.filter((c: any) => c.id !== completedMissionId);
      await AsyncStorage.setItem('@completed_missions', JSON.stringify(updated));
      return true;
    } else {
      const { error } = await supabase!
        .from('completed_missions')
        .delete()
        .eq('id', completedMissionId);
      if (error) throw error;
      return true;
    }
  },

  async reportDispute(completedMissionId: string, reason: string) {
    if (isDemoMode) {
      const completedStr = await AsyncStorage.getItem('@completed_missions');
      const completed = completedStr ? JSON.parse(completedStr) : [];
      const updated = completed.map((c: any) => {
        if (c.id === completedMissionId) {
          return {
            ...c,
            status: 'disputed',
            report_reason: reason,
            reported_at: new Date().toISOString()
          };
        }
        return c;
      });
      await AsyncStorage.setItem('@completed_missions', JSON.stringify(updated));
      return true;
    } else {
      const { error } = await supabase!
        .from('completed_missions')
        .update({
          status: 'disputed',
          report_reason: reason,
          reported_at: new Date().toISOString()
        })
        .eq('id', completedMissionId);
      if (error) throw error;
      return true;
    }
  },

  async getLeaderboard() {
    if (isDemoMode) {
      const sessionEmail = await AsyncStorage.getItem('@demo_session') || 'default';
      const isCurrentAdmin = sessionEmail === 'admin';
      
      const profileKey = isCurrentAdmin ? '@profile_admin' : (sessionEmail === 'default' ? '@profile' : `@profile_${sessionEmail.replace(/[^a-zA-Z0-9]/g, '_')}`);
      const profileStr = await AsyncStorage.getItem(profileKey);
      const profile = profileStr ? JSON.parse(profileStr) : { ...INITIAL_PROFILE };
      
      const LEADERBOARD = [
        { rank: 1, name: 'Anya_Care', points: 720, level: 'Kaisar Empati' },
        ...(isCurrentAdmin ? [] : [{ rank: 2, name: `${profile.name} (You)`, points: profile.aura_points, level: profile.level }]),
        { rank: 3, name: 'Fiki_Gacor', points: 120, level: 'Bestie Peduli' },
        { rank: 4, name: 'Rey_Peka', points: 90, level: 'Peka-Beginner' },
        { rank: 5, name: 'Caca_Kreatif', points: 50, level: 'Peka-Beginner' },
      ];
      return LEADERBOARD.sort((a, b) => b.points - a.points).map((item, idx) => ({ ...item, rank: idx + 1 }));
    } else {
      const { data, error } = await supabase!
        .from('profiles')
        .select('id, name, username, aura_points, level, role')
        .neq('role', 'admin') // Exclude Admin
        .order('aura_points', { ascending: false })
        .limit(10);
      if (error) throw error;
      
      const { data: userData } = await supabase!.auth.getUser();
      const currentUserId = userData?.user?.id;
      
      return data.map((p: any, index: number) => ({
        rank: index + 1,
        name: p.name + (p.id === currentUserId ? ' (You)' : ''),
        points: p.aura_points,
        level: p.level
      }));
    }
  },

  async getAllProfiles() {
    if (isDemoMode) {
      const usersStr = await AsyncStorage.getItem('@registered_users');
      const users = usersStr ? JSON.parse(usersStr) : [];
      
      const adminProfileStr = await AsyncStorage.getItem('@profile_admin');
      const adminProfile = adminProfileStr ? JSON.parse(adminProfileStr) : null;
      
      const all: any[] = [];
      if (adminProfile) all.push(adminProfile);
      
      for (const u of users) {
        const key = `@profile_${u.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const pStr = await AsyncStorage.getItem(key);
        if (pStr) {
          all.push(JSON.parse(pStr));
        } else {
          all.push({
            name: u.name,
            username: u.username,
            role: u.role || 'user',
            email: u.email,
            aura_points: 150,
            level: 'Peka-Beginner',
            avatar_url: `https://api.dicebear.com/7.x/pixel-art/png?seed=${u.username}`,
          });
        }
      }
      return all;
    } else {
      const { data, error } = await supabase!
        .from('profiles')
        .select('*')
        .order('aura_points', { ascending: false });
      if (error) throw error;
      return data;
    }
  },

  async signOut() {
    if (isDemoMode) {
      await AsyncStorage.removeItem('@demo_session');
    } else {
      await supabase!.auth.signOut();
    }
  },

  // === REAL-TIME SUBSCRIPTION UTILS ===
  subscribeSuggestions(callback: (suggestion: any) => void) {
    if (isDemoMode) {
      onSuggestionAddedCallback = callback;
      return () => {
        onSuggestionAddedCallback = null;
      };
    } else {
      const channel = supabase!
        .channel('suggestions_changes')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'suggestions' },
          async (payload: any) => {
            // Tarik data relasi misinya juga
            const { data, error } = await supabase!
              .from('suggestions')
              .select('*, mission:missions(*)')
              .eq('id', payload.new.id)
              .single();
            if (!error && data) {
              callback(data);
            }
          }
        )
        .subscribe();

      return () => {
        supabase!.removeChannel(channel);
      };
    }
  }
};

// Callback lokal untuk simulasi realtime di demo mode
let onSuggestionAddedCallback: ((suggestion: any) => void) | null = null;
