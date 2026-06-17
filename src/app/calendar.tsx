import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { dbService } from '@/services/database';

export default function CalendarScreen() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form States
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Muat jadwal dari database/localstorage
  const loadSchedules = async () => {
    try {
      const data = await dbService.getSchedules();
      setSchedules(data);
    } catch (e) {
      console.error('Gagal memuat jadwal:', e);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  // Simpan jadwal baru
  const handleAddSchedule = async () => {
    // Validasi input sederhana
    if (!title.trim() || !startTime.trim() || !endTime.trim()) {
      Alert.alert('Eits', 'Tolong isi semua bidangnya dulu, cuy!');
      return;
    }

    // Validasi format waktu HH:MM
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      Alert.alert('Format Salah', 'Waktu harus menggunakan format 24 jam (misal: 08:30 atau 14:00)!');
      return;
    }

    if (startTime >= endTime) {
      Alert.alert('Waktu Terbalik', 'Waktu mulai harus lebih awal dibanding waktu selesai!');
      return;
    }

    try {
      await dbService.addSchedule(title, startTime, endTime);
      Alert.alert('Mantap', `Jadwal "${title}" berhasil ditambahkan.`);
      
      // Reset form
      setTitle('');
      setStartTime('');
      setEndTime('');
      setIsAdding(false);
      
      // Reload schedules
      loadSchedules();
    } catch (e) {
      console.error(e);
      Alert.alert('Gagal', 'Jadwal gagal disimpan. Coba lagi, cuy.');
    }
  };

  // Hapus jadwal
  const handleDeleteSchedule = (id: string, eventTitle: string) => {
    Alert.alert(
      'Hapus Jadwal?',
      `Yakin mau hapus kesibukan "${eventTitle}" dari agenda lu?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await dbService.deleteSchedule(id);
              loadSchedules();
            } catch (e) {
              console.error(e);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Glow Effects */}
        <View style={styles.glowGreen} />

        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Agenda & Sibuk Lu</Text>
            <Text style={styles.headerSubtitle}>Tulis jam sibuk lu biar Sobat Peka ga ganggu.</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setIsAdding(!isAdding)}
          >
            <Ionicons name={isAdding ? 'close' : 'add'} size={20} color="#0F172A" />
            <Text style={styles.addButtonText}>{isAdding ? 'Tutup' : 'Tambah'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Form Tambah Jadwal */}
          {isAdding && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Tambah Jam Sibuk Baru</Text>
              
              <Text style={styles.inputLabel}>Nama Aktivitas</Text>
              <TextInput
                style={styles.input}
                placeholder="Misal: Kuliah, Kerja Kelompok, Turu"
                placeholderTextColor="#64748B"
                value={title}
                onChangeText={setTitle}
              />

              <View style={styles.rowInputs}>
                <View style={styles.halfInputContainer}>
                  <Text style={styles.inputLabel}>Mulai (HH:MM)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="08:00"
                    placeholderTextColor="#64748B"
                    value={startTime}
                    onChangeText={setStartTime}
                    maxLength={5}
                  />
                </View>

                <View style={styles.halfInputContainer}>
                  <Text style={styles.inputLabel}>Selesai (HH:MM)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="10:30"
                    placeholderTextColor="#64748B"
                    value={endTime}
                    onChangeText={setEndTime}
                    maxLength={5}
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleAddSchedule}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#0F172A" />
                <Text style={styles.submitBtnText}>Simpan ke Agenda</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* List Jadwal Kesibukan */}
          <Text style={styles.listSectionTitle}>Kesibukan Terjadwal Hari Ini</Text>
          
          {schedules.length > 0 ? (
            schedules.map((item) => (
              <View key={item.id} style={styles.scheduleCard}>
                <View style={styles.scheduleInfo}>
                  <View style={styles.timeIconContainer}>
                    <Ionicons name="time" size={18} color="#34D399" />
                  </View>
                  <View style={styles.scheduleDetails}>
                    <Text style={styles.scheduleTitle}>{item.title}</Text>
                    <Text style={styles.scheduleTime}>
                      {item.start_time} - {item.end_time}
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteSchedule(item.id, item.title)}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={40} color="#475569" style={styles.emptyIcon} />
              <Text style={styles.emptyTitle}>Agenda Lu Kosong Melompong!</Text>
              <Text style={styles.emptyDesc}>
                Artinya lu gabut total hari ini, rill no cap. Sobat Peka bakal sering cari misi kebaikan terdekat buat lu!
              </Text>
            </View>
          )}

          {/* Tips Info Box */}
          <View style={styles.tipsBox}>
            <Ionicons name="bulb-outline" size={20} color="#FACC15" />
            <Text style={styles.tipsText}>
              <Text style={{ fontWeight: '700', color: '#F8FAFC' }}>Tips Peka: </Text>
              Sobat Peka menganalisis celah kosong di antara agenda-agenda di atas. Selalu catat jadwal lu di sini biar dapet notifikasi misi di waktu senggang yang pas!
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  glowGreen: {
    position: 'absolute',
    top: 100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(52, 211, 153, 0.08)', // Emerald
    filter: 'blur(70px)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#34D399',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)', // Green border for form
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 15,
  },
  inputLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 14,
    marginBottom: 15,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  halfInputContainer: {
    flex: 1,
  },
  submitBtn: {
    backgroundColor: '#34D399',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 5,
  },
  submitBtnText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
  listSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  scheduleCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    marginBottom: 12,
  },
  scheduleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  scheduleDetails: {
    justifyContent: 'center',
  },
  scheduleTitle: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '700',
  },
  scheduleTime: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 8,
  },
  emptyCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.02)',
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  emptyIcon: {
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyDesc: {
    color: '#475569',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 15,
  },
  tipsBox: {
    backgroundColor: 'rgba(250, 204, 21, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.15)',
    borderRadius: 16,
    padding: 15,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginTop: 15,
  },
  tipsText: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
});
