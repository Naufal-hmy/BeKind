import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  avatar_url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=skylar',
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
      const data = await AsyncStorage.getItem('@profile');
      return data ? JSON.parse(data) : INITIAL_PROFILE;
    } else {
      const { data, error } = await supabase!
        .from('profiles')
        .select('*')
        .single();
      if (error) throw error;
      return data;
    }
  },

  async updateAuraPoints(additionalPoints: number) {
    if (isDemoMode) {
      const profileStr = await AsyncStorage.getItem('@profile');
      const profile = profileStr ? JSON.parse(profileStr) : { ...INITIAL_PROFILE };
      profile.aura_points += additionalPoints;
      
      // Hitung Level Berdasarkan Aura Points
      if (profile.aura_points >= 500) {
        profile.level = 'Kaisar Empati';
      } else if (profile.aura_points >= 300) {
        profile.level = 'Pahlawan Peka';
      } else if (profile.aura_points >= 200) {
        profile.level = 'Bestie Peduli';
      } else {
        profile.level = 'Peka-Beginner';
      }

      await AsyncStorage.setItem('@profile', JSON.stringify(profile));
      return profile;
    } else {
      // Dapatkan dulu profile saat ini
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

  // === SCHEDULES ===
  async getSchedules() {
    if (isDemoMode) {
      const data = await AsyncStorage.getItem('@schedules');
      return data ? JSON.parse(data) : INITIAL_SCHEDULES;
    } else {
      const { data, error } = await supabase!
        .from('schedules')
        .select('*')
        .order('start_time', { ascending: true });
      if (error) throw error;
      return data;
    }
  },

  async addSchedule(title: string, start_time: string, end_time: string) {
    const newSchedule = {
      id: Math.random().toString(36).substring(7),
      title,
      start_time,
      end_time,
    };

    if (isDemoMode) {
      const dataStr = await AsyncStorage.getItem('@schedules');
      const schedules = dataStr ? JSON.parse(dataStr) : [];
      schedules.push(newSchedule);
      // Urutkan berdasarkan start_time
      schedules.sort((a: any, b: any) => a.start_time.localeCompare(b.start_time));
      await AsyncStorage.setItem('@schedules', JSON.stringify(schedules));
      return newSchedule;
    } else {
      const { data, error } = await supabase!
        .from('schedules')
        .insert([{ title, start_time, end_time }])
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
  async getMissions() {
    if (isDemoMode) {
      const data = await AsyncStorage.getItem('@missions');
      return data ? JSON.parse(data) : INITIAL_MISSIONS;
    } else {
      const { data, error } = await supabase!
        .from('missions')
        .select('*');
      if (error) throw error;
      return data;
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
        .select('*, mission:mission_id(*)')
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
        .select('*, mission:mission_id(*)')
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
        .select('*, mission:mission_id(*)')
        .order('completed_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  },

  async completeMission(suggestionId: string, missionId: string, photoUri: string, auraPoints: number) {
    const newCompletion = {
      id: Math.random().toString(36).substring(7),
      mission_id: missionId,
      photo_url: photoUri,
      completed_at: new Date().toISOString(),
      points_gained: auraPoints,
    };

    if (isDemoMode) {
      // 1. Tambah ke completed missions
      const completedStr = await AsyncStorage.getItem('@completed_missions');
      const completed = completedStr ? JSON.parse(completedStr) : [];
      
      const missionsStr = await AsyncStorage.getItem('@missions');
      const missions = missionsStr ? JSON.parse(missionsStr) : INITIAL_MISSIONS;
      const mission = missions.find((m: any) => m.id === missionId);

      const fullCompletion = { ...newCompletion, mission };
      completed.unshift(fullCompletion);
      await AsyncStorage.setItem('@completed_missions', JSON.stringify(completed));

      // 2. Update status suggestion
      await this.updateSuggestionStatus(suggestionId, 'completed');

      // 3. Tambah Aura Points ke Profile
      await this.updateAuraPoints(auraPoints);

      return fullCompletion;
    } else {
      // Insert ke tabel completed_missions
      const { data, error } = await supabase!
        .from('completed_missions')
        .insert([{
          mission_id: missionId,
          photo_url: photoUri,
          points_gained: auraPoints
        }])
        .select('*, mission:mission_id(*)')
        .single();
      if (error) throw error;

      // Update suggestion
      await this.updateSuggestionStatus(suggestionId, 'completed');

      // Tambah Aura Points
      await this.updateAuraPoints(auraPoints);

      return data;
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
              .select('*, mission:mission_id(*)')
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
