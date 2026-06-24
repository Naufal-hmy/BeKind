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
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { dbService } from '@/services/database';

const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const WEEKDAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

// Mapping warna dot berdasarkan tipe kesibukan
const TYPE_COLORS: Record<string, string> = {
  busy: '#34D399',      // Hijau/Cyan (Sibuk Mandiri)
  personal: '#F97316',  // Orange (Misi Personal)
  public: '#8B5CF6',    // Ungu (Misi Publik)
  event: '#FACC15',     // Kuning (Misi Event)
};

const TYPE_NAMES: Record<string, string> = {
  busy: 'Sibuk Mandiri',
  personal: 'Misi Personal',
  public: 'Misi Publik',
  event: 'Misi Event',
};

export default function CalendarScreen() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  
  // Navigation & Date States
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Form States
  const [title, setTitle] = useState('');
  const [startHour, setStartHour] = useState(8);
  const [startMinute, setStartMinute] = useState(0);
  const [startAmPm, setStartAmPm] = useState<'AM' | 'PM'>('AM');
  const [endHour, setEndHour] = useState(10);
  const [endMinute, setEndMinute] = useState(30);
  const [endAmPm, setEndAmPm] = useState<'AM' | 'PM'>('AM');
  const [freq, setFreq] = useState<'once' | 'monthly'>('once');
  const [selectedType, setSelectedType] = useState<'busy' | 'personal' | 'public' | 'event'>('busy');

  // Muat jadwal & data event misi aktif
  const loadSchedules = async () => {
    try {
      const dbSchedules = await dbService.getSchedules();
      
      let activeSuggestions: any[] = [];
      try {
        const sugs = await dbService.getSuggestions();
        activeSuggestions = sugs
          .filter((s: any) => s.status === 'accepted' && s.mission)
          .map((s: any) => {
            const dateStr = s.created_at ? s.created_at.substring(0, 10) : formatDateString(new Date());
            return {
              id: s.id,
              title: `🎯 Misi: ${s.mission.title}`,
              start_time: s.free_start_time,
              end_time: s.free_end_time,
              date: dateStr,
              frequency: 'once',
              type: s.mission.is_event_mission ? 'event' : 'personal',
              isSuggestion: true
            };
          });
      } catch (err) {
        console.warn('Gagal memuat saran aktif untuk kalender:', err);
      }

      // Buat data dummy event dinamis agar kalender demo selalu terisi & menunjukkan deadline hari ini/besok
      const now = new Date();
      const todayStr = formatDateString(now);
      
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      const tomorrowStr = formatDateString(tomorrow);
      
      const expHour = now.getHours() - 2;
      const expStartStr = expHour > 0 ? `${String(expHour).padStart(2, '0')}:00` : '07:00';
      const expEndStr = expHour > 0 ? `${String(expHour + 1).padStart(2, '0')}:00` : '08:00';
      
      const soonEnd = new Date(now.getTime() + 15 * 60 * 1000);
      const soonStart = new Date(now.getTime() - 45 * 60 * 1000);
      const soonStartStr = `${String(soonStart.getHours()).padStart(2, '0')}:${String(soonStart.getMinutes()).padStart(2, '0')}`;
      const soonEndStr = `${String(soonEnd.getHours()).padStart(2, '0')}:${String(soonEnd.getMinutes()).padStart(2, '0')}`;
      
      const actStart = new Date(now.getTime() + 60 * 60 * 1000);
      const actEnd = new Date(now.getTime() + 120 * 60 * 1000);
      const actStartStr = `${String(actStart.getHours()).padStart(2, '0')}:${String(actStart.getMinutes()).padStart(2, '0')}`;
      const actEndStr = `${String(actEnd.getHours()).padStart(2, '0')}:${String(actEnd.getMinutes()).padStart(2, '0')}`;

      const dynamicDemoEvents = [
        {
          id: 'demo_evt_expired',
          title: '🎯 Misi Selesai: Kasih Makan Kucing Monas',
          start_time: expStartStr,
          end_time: expEndStr,
          date: todayStr,
          frequency: 'once',
          type: 'event',
          isDemo: true
        },
        {
          id: 'demo_evt_soon',
          title: '⚠️ Deadline Misi: Pungut Sampah Lapangan Banteng',
          start_time: soonStartStr,
          end_time: soonEndStr,
          date: todayStr,
          frequency: 'once',
          type: 'event',
          isDemo: true
        },
        {
          id: 'demo_evt_active',
          title: '📅 Rencana Misi: Beli Cemilan Pedagang HI',
          start_time: actStartStr,
          end_time: actEndStr,
          date: todayStr,
          frequency: 'once',
          type: 'event',
          isDemo: true
        },
        {
          id: 'demo_evt_tomorrow',
          title: '🌟 Misi Besok: Berbagi Makanan Menteng',
          start_time: '09:00',
          end_time: '10:30',
          date: tomorrowStr,
          frequency: 'once',
          type: 'event',
          isDemo: true
        }
      ];
      let missionEvents: any[] = [];
      try {
        const ms = await dbService.getMissions();
        const acceptedMissionIds = new Set(
          activeSuggestions.map((s: any) => s.mission?.id || s.mission_id)
        );

        missionEvents = ms
          .filter((m: any) => (m.type === 'personal' || m.type === 'public' || m.is_event_mission) && !acceptedMissionIds.has(m.id))
          .map((m: any) => {
            const dateStr = m.created_at ? m.created_at.substring(0, 10) : formatDateString(now);
            let typeLabel = 'Misi';
            let calendarType = 'event';
            if (m.type === 'personal') {
              typeLabel = 'Misi Personal';
              calendarType = 'personal';
            } else if (m.type === 'public') {
              typeLabel = 'Misi Publik';
              calendarType = 'public';
            } else if (m.is_event_mission) {
              typeLabel = 'Event Spesial';
              calendarType = 'event';
            }

            return {
              id: `mission_${m.id}`,
              title: `🎯 [${typeLabel}] ${m.title}`,
              start_time: '08:00', // default waktu mulai misi
              end_time: '21:00',   // default waktu selesai misi
              date: dateStr,
              frequency: 'once',
              type: calendarType,
              isMission: true,
              location: m.location_name
            };
          });
      } catch (err) {
        console.warn('Gagal memuat misi untuk kalender:', err);
      }

      setSchedules([...dbSchedules, ...activeSuggestions, ...dynamicDemoEvents, ...missionEvents]);
    } catch (e) {
      console.error('Gagal memuat jadwal:', e);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  const formatDateString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const checkScheduleStatus = (item: any) => {
    const now = new Date();
    const todayStr = formatDateString(now);
    const itemDateStr = item.date || todayStr;
    
    const [startH, startM] = item.start_time.split(':').map(Number);
    const [endH, endM] = item.end_time.split(':').map(Number);
    
    // Parse tanggal secara lokal berdasarkan komponen tahun, bulan, hari
    const [y, m, d] = itemDateStr.split('-').map(Number);
    
    const itemStart = new Date(y, m - 1, d);
    itemStart.setHours(startH, startM, 0, 0);
    
    const itemEnd = new Date(y, m - 1, d);
    itemEnd.setHours(endH, endM, 0, 0);
    
    if (now.getTime() > itemEnd.getTime()) {
      return 'expired';
    }
    
    const diffMs = itemEnd.getTime() - now.getTime();
    if (diffMs > 0 && diffMs <= 30 * 60 * 1000) {
      return 'expiring_soon';
    }
    
    return 'active';
  };

  // Filter jadwal untuk tanggal terpilih
  const getSchedulesForSelectedDate = () => {
    const selectedStr = formatDateString(selectedDate);
    const selectedDayNum = selectedDate.getDate();
    
    return schedules.filter((s: any) => {
      // Jika tidak ada parameter date, anggap selalu muncul/rutinitas harian
      if (!s.date) return true;
      
      if (s.frequency === 'monthly') {
        const itemDay = new Date(s.date).getDate();
        return itemDay === selectedDayNum;
      }
      return s.date === selectedStr;
    });
  };

  // Ambil jenis tipe unik kesibukan untuk dot indicator
  const getDotsForDate = (date: Date) => {
    const dateStr = formatDateString(date);
    const dayNum = date.getDate();
    
    const daySchedules = schedules.filter((s: any) => {
      if (!s.date) return true;
      if (s.frequency === 'monthly') {
        const itemDay = new Date(s.date).getDate();
        return itemDay === dayNum;
      }
      return s.date === dateStr;
    });

    return Array.from(new Set(daySchedules.map((s: any) => s.type || 'busy')));
  };

  const get24hTime = (hour: number, minute: number, ampm: 'AM' | 'PM') => {
    let h = hour;
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    const hStr = String(h).padStart(2, '0');
    const mStr = String(minute).padStart(2, '0');
    return `${hStr}:${mStr}`;
  };

  // Simpan jadwal
  const handleAddSchedule = async () => {
    if (!title.trim()) {
      Alert.alert('Eits', 'Tolong isi semua bidangnya dulu, cuy!');
      return;
    }

    const calculatedStart = get24hTime(startHour, startMinute, startAmPm);
    const calculatedEnd = get24hTime(endHour, endMinute, endAmPm);

    if (calculatedStart >= calculatedEnd) {
      Alert.alert('Waktu Terbalik', 'Waktu mulai harus lebih awal dibanding waktu selesai!');
      return;
    }

    try {
      const dateStr = formatDateString(selectedDate);
      await dbService.addSchedule(title, calculatedStart, calculatedEnd, dateStr, freq, selectedType);
      
      Alert.alert('Mantap', `Jadwal "${title}" berhasil disimpan di kalender.`);
      
      // Reset form
      setTitle('');
      setStartHour(8);
      setStartMinute(0);
      setStartAmPm('AM');
      setEndHour(10);
      setEndMinute(30);
      setEndAmPm('AM');
      setFreq('once');
      setSelectedType('busy');
      setIsAdding(false);
      
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

  // Perhitungan kalender grid
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  // Menyusun array grid hari
  const gridDays: (Date | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    gridDays.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    gridDays.push(new Date(year, month, d));
  }

  const selectedDateStr = formatDateString(selectedDate);
  const activeDaySchedules = getSchedulesForSelectedDate();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E293B" translucent={false} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Glow Green Background */}
        <View style={styles.glowGreen} />

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Agenda & Kalender</Text>
            <Text style={styles.headerSubtitle}>Atur jadwal senggang & misi harian lu di sini.</Text>
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
          
          {/* Kalender Grid UI */}
          <View style={styles.calendarCard}>
            {/* Header navigasi bulan */}
            <View style={styles.calendarNavRow}>
              <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
                <Ionicons name="chevron-back" size={20} color="#34D399" />
              </TouchableOpacity>
              <Text style={styles.monthLabel}>
                {INDONESIAN_MONTHS[month]} {year}
              </Text>
              <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
                <Ionicons name="chevron-forward" size={20} color="#34D399" />
              </TouchableOpacity>
            </View>

            {/* Nama Hari */}
            <View style={styles.weekdaysRow}>
              {WEEKDAYS.map((day, idx) => (
                <Text key={idx} style={styles.weekdayText}>{day}</Text>
              ))}
            </View>

            {/* Grid Tanggal */}
            <View style={styles.daysGrid}>
              {gridDays.map((dateObj, idx) => {
                if (!dateObj) {
                  return <View key={`empty-${idx}`} style={styles.dayCellEmpty} />;
                }

                const dateStr = formatDateString(dateObj);
                const isSelected = dateStr === selectedDateStr;
                const isToday = dateStr === formatDateString(new Date());
                const dayNum = dateObj.getDate();
                const dots = getDotsForDate(dateObj);

                return (
                  <TouchableOpacity
                    key={`day-${dayNum}`}
                    style={[
                      styles.dayCell,
                      isSelected && styles.dayCellSelected,
                      isToday && !isSelected && styles.dayCellToday
                    ]}
                    onPress={() => setSelectedDate(dateObj)}
                  >
                    <Text
                      style={[
                        styles.dayNumberText,
                        isSelected && styles.dayNumberTextSelected,
                        isToday && !isSelected && styles.dayNumberTextToday
                      ]}
                    >
                      {dayNum}
                    </Text>

                    {/* Indicator dots */}
                    {dots.length > 0 && (
                      <View style={styles.dotsRow}>
                        {dots.map((type, dIdx) => (
                          <View
                            key={dIdx}
                            style={[
                              styles.dotIndicator,
                              { backgroundColor: TYPE_COLORS[type] || '#34D399' }
                            ]}
                          />
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Info warna penanda */}
            <View style={styles.colorLegendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#34D399' }]} />
                <Text style={styles.legendText}>Sibuk</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#F97316' }]} />
                <Text style={styles.legendText}>Personal</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#8B5CF6' }]} />
                <Text style={styles.legendText}>Publik</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#FACC15' }]} />
                <Text style={styles.legendText}>Event</Text>
              </View>
            </View>
          </View>

          {/* Form Tambah Jadwal */}
          {isAdding && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>
                Tambah Agenda untuk: {selectedDate.getDate()} {INDONESIAN_MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </Text>
              
              <Text style={styles.inputLabel}>Nama Aktivitas</Text>
              <TextInput
                style={styles.input}
                placeholder="Misal: Kuliah, Kerja Kelompok, Turu"
                placeholderTextColor="#64748B"
                value={title}
                onChangeText={setTitle}
              />

              {/* Waktu Mulai Picker */}
              <Text style={styles.inputLabel}>Waktu Mulai</Text>
              <View style={styles.timeSelectorRowInline}>
                {/* Hour */}
                <View style={styles.spinBox}>
                  <TouchableOpacity onPress={() => setStartHour(h => h === 1 ? 12 : h - 1)} style={styles.spinBtn}>
                    <Ionicons name="chevron-down" size={16} color="#34D399" />
                  </TouchableOpacity>
                  <Text style={styles.spinVal}>{String(startHour).padStart(2, '0')}</Text>
                  <TouchableOpacity onPress={() => setStartHour(h => h === 12 ? 1 : h + 1)} style={styles.spinBtn}>
                    <Ionicons name="chevron-up" size={16} color="#34D399" />
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.timeDivider}>:</Text>

                {/* Minute */}
                <View style={styles.spinBox}>
                  <TouchableOpacity onPress={() => setStartMinute(m => m === 0 ? 55 : m - 5)} style={styles.spinBtn}>
                    <Ionicons name="chevron-down" size={16} color="#34D399" />
                  </TouchableOpacity>
                  <Text style={styles.spinVal}>{String(startMinute).padStart(2, '0')}</Text>
                  <TouchableOpacity onPress={() => setStartMinute(m => m === 55 ? 0 : m + 5)} style={styles.spinBtn}>
                    <Ionicons name="chevron-up" size={16} color="#34D399" />
                  </TouchableOpacity>
                </View>

                {/* AM/PM */}
                <View style={styles.ampmContainer}>
                  <TouchableOpacity 
                    style={[styles.ampmBtn, startAmPm === 'AM' && styles.ampmBtnActive]}
                    onPress={() => setStartAmPm('AM')}
                  >
                    <Text style={[styles.ampmText, startAmPm === 'AM' && styles.ampmTextActive]}>AM</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.ampmBtn, startAmPm === 'PM' && styles.ampmBtnActive]}
                    onPress={() => setStartAmPm('PM')}
                  >
                    <Text style={[styles.ampmText, startAmPm === 'PM' && styles.ampmTextActive]}>PM</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Waktu Selesai Picker */}
              <Text style={styles.inputLabel}>Waktu Selesai</Text>
              <View style={styles.timeSelectorRowInline}>
                {/* Hour */}
                <View style={styles.spinBox}>
                  <TouchableOpacity onPress={() => setEndHour(h => h === 1 ? 12 : h - 1)} style={styles.spinBtn}>
                    <Ionicons name="chevron-down" size={16} color="#34D399" />
                  </TouchableOpacity>
                  <Text style={styles.spinVal}>{String(endHour).padStart(2, '0')}</Text>
                  <TouchableOpacity onPress={() => setEndHour(h => h === 12 ? 1 : h + 1)} style={styles.spinBtn}>
                    <Ionicons name="chevron-up" size={16} color="#34D399" />
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.timeDivider}>:</Text>

                {/* Minute */}
                <View style={styles.spinBox}>
                  <TouchableOpacity onPress={() => setEndMinute(m => m === 0 ? 55 : m - 5)} style={styles.spinBtn}>
                    <Ionicons name="chevron-down" size={16} color="#34D399" />
                  </TouchableOpacity>
                  <Text style={styles.spinVal}>{String(endMinute).padStart(2, '0')}</Text>
                  <TouchableOpacity onPress={() => setEndMinute(m => m === 55 ? 0 : m + 5)} style={styles.spinBtn}>
                    <Ionicons name="chevron-up" size={16} color="#34D399" />
                  </TouchableOpacity>
                </View>

                {/* AM/PM */}
                <View style={styles.ampmContainer}>
                  <TouchableOpacity 
                    style={[styles.ampmBtn, endAmPm === 'AM' && styles.ampmBtnActive]}
                    onPress={() => setEndAmPm('AM')}
                  >
                    <Text style={[styles.ampmText, endAmPm === 'AM' && styles.ampmTextActive]}>AM</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.ampmBtn, endAmPm === 'PM' && styles.ampmBtnActive]}
                    onPress={() => setEndAmPm('PM')}
                  >
                    <Text style={[styles.ampmText, endAmPm === 'PM' && styles.ampmTextActive]}>PM</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Pilihan Frekuensi */}
              <Text style={styles.inputLabel}>Pengulangan</Text>
              <View style={styles.freqRow}>
                <TouchableOpacity
                  style={[styles.freqBtn, freq === 'once' && styles.freqBtnActive]}
                  onPress={() => setFreq('once')}
                >
                  <Text style={[styles.freqBtnText, freq === 'once' && styles.freqBtnTextActive]}>Sekali Saja</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.freqBtn, freq === 'monthly' && styles.freqBtnActive]}
                  onPress={() => setFreq('monthly')}
                >
                  <Text style={[styles.freqBtnText, freq === 'monthly' && styles.freqBtnTextActive]}>Tiap Bulan</Text>
                </TouchableOpacity>
              </View>

              {/* Pilihan Tipe Kegiatan */}
              <Text style={styles.inputLabel}>Tipe Kegiatan & Penanda</Text>
              <View style={styles.typeSelectorRow}>
                {(['busy', 'personal', 'public', 'event'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.typeSelectorBtn,
                      { borderColor: TYPE_COLORS[t] },
                      selectedType === t && { backgroundColor: TYPE_COLORS[t] }
                    ]}
                    onPress={() => setSelectedType(t)}
                  >
                    <Text
                      style={[
                        styles.typeSelectorText,
                        { color: selectedType === t ? '#0F172A' : TYPE_COLORS[t] }
                      ]}
                    >
                      {TYPE_NAMES[t].split(' ')[1] || TYPE_NAMES[t]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleAddSchedule}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#0F172A" />
                <Text style={styles.submitBtnText}>Simpan ke Agenda</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* List Jadwal Kesibukan */}
          <Text style={styles.listSectionTitle}>
            Agenda Tanggal: {selectedDate.getDate()} {INDONESIAN_MONTHS[selectedDate.getMonth()]}
          </Text>
          
          {activeDaySchedules.length > 0 ? (
            activeDaySchedules.map((item) => {
              const status = checkScheduleStatus(item);
              return (
                <View 
                  key={item.id} 
                  style={[
                    styles.scheduleCard, 
                    { borderLeftColor: TYPE_COLORS[item.type || 'busy'], borderLeftWidth: 4 },
                    status === 'expired' && { opacity: 0.55 }
                  ]}
                >
                  <View style={styles.scheduleInfo}>
                    <View style={[styles.timeIconContainer, { backgroundColor: `${TYPE_COLORS[item.type || 'busy']}1A` }]}>
                      <Ionicons name="time" size={18} color={TYPE_COLORS[item.type || 'busy']} />
                    </View>
                    <View style={styles.scheduleDetails}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={styles.scheduleTitle}>{item.title}</Text>
                        {status === 'expired' && (
                          <View style={styles.expiredBadge}>
                            <Text style={styles.expiredBadgeText}>⏳ Kadaluarsa</Text>
                          </View>
                        )}
                        {status === 'expiring_soon' && (
                          <View style={styles.expiringSoonBadge}>
                            <Text style={styles.expiringSoonBadgeText}>⚠️ Hampir Selesai</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.scheduleTime}>
                        {item.start_time} - {item.end_time} • <Text style={{ color: TYPE_COLORS[item.type || 'busy'], fontWeight: '700' }}>{TYPE_NAMES[item.type || 'busy']}</Text>
                      </Text>
                      {item.isMission && item.location && (
                        <Text style={styles.scheduleLocation}>
                          📍 {item.location}
                        </Text>
                      )}
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteSchedule(item.id, item.title)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={40} color="#475569" style={styles.emptyIcon} />
              <Text style={styles.emptyTitle}>Agenda Lu Kosong Melompong!</Text>
              <Text style={styles.emptyDesc}>
                Artinya lu gabut total hari ini, rill no cap. Sobat Peka bakal cari rekomendasi misi kebaikan terdekat buat lu!
              </Text>
            </View>
          )}

          {/* Tips Info Box */}
          <View style={styles.tipsBox}>
            <Ionicons name="bulb-outline" size={20} color="#FACC15" />
            <Text style={styles.tipsText}>
              <Text style={{ fontWeight: '700', color: '#F8FAFC' }}>Tips Peka: </Text>
              Sobat Peka otomatis menyarankan misi kebaikan pada slot kosong agenda lu. Selalu catat agenda kesibukan lu di sini biar ga bentrok, cuy.
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
    backgroundColor: 'rgba(52, 211, 153, 0.05)',
    filter: 'blur(70px)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 15,
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
  calendarCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 24,
    padding: 16,
    marginBottom: 20,
  },
  calendarNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navBtn: {
    padding: 8,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekdayText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    width: 36,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 4,
  },
  dayCell: {
    width: 42,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginVertical: 2,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  dayCellEmpty: {
    width: 42,
    height: 48,
    marginVertical: 2,
  },
  dayCellSelected: {
    backgroundColor: '#34D399',
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
  },
  dayNumberText: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: '600',
  },
  dayNumberTextSelected: {
    color: '#0F172A',
    fontWeight: '800',
  },
  dayNumberTextToday: {
    color: '#34D399',
    fontWeight: '800',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 4,
    height: 4,
  },
  dotIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  colorLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
  },
  formTitle: {
    fontSize: 14,
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
  freqRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  freqBtn: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  freqBtnActive: {
    borderColor: '#34D399',
    backgroundColor: 'rgba(52, 211, 153, 0.05)',
  },
  freqBtnText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  freqBtnTextActive: {
    color: '#34D399',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  typeSelectorBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 70,
    alignItems: 'center',
  },
  typeSelectorText: {
    fontSize: 10,
    fontWeight: '800',
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
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  scheduleLocation: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 3,
    fontWeight: '500',
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
    backgroundColor: 'rgba(250, 204, 21, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.12)',
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
  expiredBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  expiredBadgeText: {
    color: '#F87171',
    fontSize: 9,
    fontWeight: '700',
  },
  expiringSoonBadge: {
    backgroundColor: 'rgba(250, 204, 21, 0.15)',
    borderColor: 'rgba(250, 204, 21, 0.3)',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  expiringSoonBadgeText: {
    color: '#FACC15',
    fontSize: 9,
    fontWeight: '700',
  },
  timeSelectorRowInline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  spinBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    height: 48,
    width: 90,
    justifyContent: 'space-between',
  },
  spinBtn: {
    padding: 6,
  },
  spinVal: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  timeDivider: {
    color: '#94A3B8',
    fontSize: 20,
    fontWeight: '800',
    paddingHorizontal: 2,
  },
  ampmContainer: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 2,
    height: 48,
    alignItems: 'center',
  },
  ampmBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  ampmBtnActive: {
    backgroundColor: '#34D399',
  },
  ampmText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  ampmTextActive: {
    color: '#0F172A',
  },
});
