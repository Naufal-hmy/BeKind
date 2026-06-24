import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useKindnessAgent } from '@/context/AgentContext';
import { dbService, isDemoMode } from '@/services/database';

export default function DashboardScreen() {
  const router = useRouter();
  const {
    currentLocation,
    activeSuggestion,
    isScanning,
    scanForMissions,
    simulateAgentMatch,
    dismissSuggestion,
    acceptSuggestion,
  } = useKindnessAgent();

  const [profile, setProfile] = useState<any>({
    name: 'Bestie Peka',
    level: 'Peka-Beginner',
    aura_points: 0,
  });

  // Muat profil setiap kali layar ini difokuskan/dibuka
  useEffect(() => {
    async function loadProfile() {
      try {
        const prof = await dbService.getProfile();
        setProfile(prof);
      } catch (err) {
        console.log('Gagal memuat profil di dashboard:', err);
      }
    }
    loadProfile();
    
    // Perbarui profil secara berkala
    const interval = setInterval(loadProfile, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSikatKuy = async () => {
    if (activeSuggestion) {
      await acceptSuggestion(activeSuggestion.id);
      Alert.alert(
        'Misi Diterima',
        'Gaskeuun! Misi sekarang aktif. Silakan buka tab Peta untuk melihat rute navigasi atau langsung lakukan kebaikan!',
        [{ text: 'Meluncur', onPress: () => router.push('/map') }]
      );
    }
  };

  const handleKlaimAura = () => {
    // Arahkan ke tab profil untuk membuka kamera/bukti
    Alert.alert(
      'Spill Bukti Kebaikan',
      'Silakan ambil foto selfie/bukti bahwa kamu sudah melakukan aksi kebaikan ini untuk klaim Aura Points!',
      [
        {
          text: 'Buka Kamera',
          onPress: () => router.push('/profile'),
        },
        { text: 'Batal', style: 'cancel' }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" translucent={false} />

      {/* Glow Background Elements */}
      <View style={styles.glowCyan} />
      <View style={styles.glowViolet} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header App */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>BeKind</Text>
            <Text style={styles.headerSubtitle}>Biar gabut lu ga sia-sia, cuy</Text>
          </View>
          {isDemoMode && (
            <View style={styles.demoBadge}>
              <Text style={styles.demoText}>Demo Mode</Text>
            </View>
          )}
        </View>

        {/* Card Aura Points */}
        <View style={styles.auraCard}>
          <View style={styles.auraHeader}>
            <View style={styles.auraUserContainer}>
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={20} color="#06B6D4" />
              </View>
              <Text style={styles.userName}>{profile.name}</Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>{profile.level}</Text>
            </View>
          </View>

          <View style={styles.auraBody}>
            <Text style={styles.auraPointsLabel}>Aura Points Lu</Text>
            <View style={styles.auraValueContainer}>
              <Text style={styles.auraValue}>+{profile.aura_points}</Text>
              <Text style={styles.auraUnit}>Aura</Text>
            </View>
          </View>

          {/* Progress Bar ke Level Berikutnya */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min((profile.aura_points / 500) * 100, 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.progressLabel}>
              {profile.aura_points < 200
                ? `${200 - profile.aura_points} Aura lagi untuk rank Bestie Peduli`
                : profile.aura_points < 300
                ? `${300 - profile.aura_points} Aura lagi untuk rank Pahlawan Peka`
                : profile.aura_points < 500
                ? `${500 - profile.aura_points} Aura lagi untuk rank Kaisar Empati`
                : 'Maksimal Rank Tercapai! Sheesh!'}
            </Text>
          </View>
        </View>

        {/* Kindness Streak & Habit Streak Row */}
        <View style={styles.streakRow}>
          <View style={styles.streakCard}>
            <View style={styles.streakHeader}>
              <Ionicons name="flame" size={20} color="#F59E0B" />
              <Text style={styles.streakTitle}>Streak Peka</Text>
            </View>
            <Text style={styles.streakVal}>{profile.daily_streak || 0} Hari</Text>
            <Text style={styles.streakDesc}>
              Mul: x{(1 + Math.min((profile.daily_streak || 0) * 0.05, 0.50)).toFixed(2)} (+{Math.round(Math.min((profile.daily_streak || 0) * 0.05, 0.50) * 100)}% Bonus)
            </Text>
          </View>
          
          <View style={styles.streakCard}>
            <View style={styles.streakHeader}>
              <Ionicons name="heart" size={20} color="#EC4899" />
              <Text style={styles.streakTitle}>Streak Kebiasaan</Text>
            </View>
            <Text style={styles.streakVal}>{profile.personal_streak || 0} Hari</Text>
            <Text style={styles.streakDesc}>Pengingat Kebaikan Mandiri</Text>
          </View>
        </View>

        {/* Section Agent Status */}
        <View style={styles.sectionTitleContainer}>
          <Ionicons name="hardware-chip" size={18} color="#A7F3D0" />
          <Text style={styles.sectionTitle}>Sobat Peka (Digital Assistant)</Text>
        </View>

        <View style={styles.agentCard}>
          <View style={styles.agentInfo}>
            <View style={styles.agentAvatarContainer}>
              <View style={styles.agentPulseRing} />
              <View style={styles.agentAvatar}>
                {isScanning ? (
                  <ActivityIndicator size="small" color="#06B6D4" />
                ) : (
                  <Ionicons name="pulse" size={24} color="#06B6D4" />
                )}
              </View>
            </View>
            <View style={styles.agentStatusTextContainer}>
              <Text style={styles.agentStatusTitle}>
                {isScanning ? 'Menganalisis Celah Waktu...' : 'Sobat Peka: Standby'}
              </Text>
              <Text style={styles.agentStatusDesc}>
                {isScanning
                  ? 'Gue lagi scanning kalender & lokasi GPS lu biar pas gabut ada faedahnya.'
                  : 'Siap mendeteksi waktu luang & lokasi terdekat buat saran aksi sosial.'}
              </Text>
            </View>
          </View>

          <View style={styles.agentActions}>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={scanForMissions}
              disabled={isScanning}
            >
              <Ionicons name="scan-outline" size={16} color="#0F172A" />
              <Text style={styles.scanButtonText}>Pindai Kesibukan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.simulateButton}
              onPress={simulateAgentMatch}
              disabled={isScanning}
            >
              <Ionicons name="flash" size={16} color="#06B6D4" />
              <Text style={styles.simulateButtonText}>Simulasikan Gabut</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section Saran Misi */}
        <View style={styles.sectionTitleContainer}>
          <Ionicons name="navigate-circle" size={18} color="#C084FC" />
          <Text style={styles.sectionTitle}>Rekomendasi Aksi Sosial</Text>
        </View>

        {activeSuggestion ? (
          <View style={styles.suggestionCard}>
            <View style={styles.suggestionHeader}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{activeSuggestion.mission?.category || 'Umum'}</Text>
                </View>
                <View style={styles.modeBadge}>
                  <Text style={styles.modeText}>
                    {activeSuggestion.mission?.mode === 'group' ? '👥 Group' : activeSuggestion.mission?.mode === 'community' ? '🏢 Komunitas' : '👤 Solo'}
                  </Text>
                </View>
              </View>
              <View style={styles.pointsBadge}>
                <Ionicons name="sparkles" size={12} color="#0F172A" />
                <Text style={styles.pointsBadgeText}>+{activeSuggestion.mission?.aura_points || 50} Aura</Text>
              </View>
            </View>

            <Text style={styles.missionTitle}>{activeSuggestion.mission?.title}</Text>
            <Text style={styles.missionDesc}>{activeSuggestion.mission?.description}</Text>

            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={14} color="#94A3B8" />
              <Text style={styles.locationText}>
                {activeSuggestion.mission?.location_name || 'Lokasi terdekat'}
              </Text>
            </View>

            <View style={styles.timeGapContainer}>
              <Ionicons name="time-outline" size={14} color="#8B5CF6" />
              <Text style={styles.timeGapText}>
                Waktu Luang: {activeSuggestion.free_start_time} - {activeSuggestion.free_end_time}
              </Text>
            </View>

            {activeSuggestion.mission?.is_event_mission && (
              <View style={styles.eventInfoContainer}>
                <Ionicons name="ribbon-outline" size={14} color="#FACC15" />
                <Text style={styles.eventInfoText}>
                  Event: <Text style={{ fontWeight: '700' }}>{activeSuggestion.mission?.event_name}</Text> (Verifikasi EO)
                </Text>
              </View>
            )}

            {activeSuggestion.mission?.type === 'public' && (
              <View style={styles.eventInfoContainer}>
                <Ionicons name="person-circle-outline" size={14} color="#06B6D4" />
                <Text style={styles.eventInfoText}>
                  Penerbit: Misi Publik (Verifikasi Pembuat)
                </Text>
              </View>
            )}

            {/* Tombol Aksi Misi berdasarkan Status */}
            {activeSuggestion.status === 'pending' ? (
              <View style={styles.suggestionButtons}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.declineBtn]}
                  onPress={() => dismissSuggestion(activeSuggestion.id)}
                >
                  <Text style={styles.declineBtnText}>Skip Dulu</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.acceptBtn]}
                  onPress={handleSikatKuy}
                >
                  <Text style={styles.acceptBtnText}>Sikat Kuy</Text>
                </TouchableOpacity>
              </View>
            ) : activeSuggestion.status === 'accepted' ? (
              <View style={styles.activeMissionContainer}>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>MISI LAGI AKTIF!</Text>
                </View>
                <View style={styles.suggestionButtons}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.mapBtn]}
                    onPress={() => router.push('/map')}
                  >
                    <Ionicons name="map" size={16} color="#FFF" />
                    <Text style={styles.mapBtnText}>Cek Peta</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.claimBtn]}
                    onPress={handleKlaimAura}
                  >
                    <Ionicons name="camera" size={16} color="#0F172A" />
                    <Text style={styles.claimBtnText}>Klaim Aura</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="bed-outline" size={48} color="#475569" style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>Jadwal Lu Lagi Padet Rill</Text>
            <Text style={styles.emptyDesc}>
              Sobat Peka ga mau ganggu fokus lu. Nanti kalau ada celah waktu senggang di kalender, lu bakal langsung dapet notifikasi misi di sini, cuy.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Slate 900
  },
  glowCyan: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(6, 182, 212, 0.15)', // Cyan
    filter: 'blur(60px)',
  },
  glowViolet: {
    position: 'absolute',
    bottom: 50,
    left: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(139, 92, 246, 0.15)', // Violet
    filter: 'blur(60px)',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 35,
    marginBottom: 25,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 2,
  },
  demoBadge: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  demoText: {
    color: '#22D3EE',
    fontSize: 11,
    fontWeight: '700',
  },
  auraCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)', // Slate 800 semi-transparan
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    marginBottom: 25,
  },
  auraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  auraUserContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  userName: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '600',
  },
  levelBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  levelText: {
    color: '#C084FC',
    fontSize: 11,
    fontWeight: '700',
  },
  auraBody: {
    marginTop: 15,
    marginBottom: 15,
  },
  auraPointsLabel: {
    color: '#94A3B8',
    fontSize: 13,
  },
  auraValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  auraValue: {
    fontSize: 38,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  auraUnit: {
    fontSize: 16,
    color: '#06B6D4',
    fontWeight: '700',
    marginLeft: 6,
  },
  progressContainer: {
    marginTop: 5,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#06B6D4', // Progress fill cyan
    borderRadius: 4,
  },
  progressLabel: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 6,
    fontWeight: '500',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E2E8F0',
    marginLeft: 8,
    letterSpacing: 0.2,
  },
  agentCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 25,
  },
  agentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agentAvatarContainer: {
    width: 46,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  agentPulseRing: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    backgroundColor: 'transparent',
  },
  agentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#06B6D4',
  },
  agentStatusTextContainer: {
    flex: 1,
    marginLeft: 14,
  },
  agentStatusTitle: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '700',
  },
  agentStatusDesc: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 14,
  },
  agentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    gap: 10,
  },
  scanButton: {
    flex: 1,
    backgroundColor: '#34D399', // Emerald 400
    borderRadius: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  scanButtonText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },
  simulateButton: {
    flex: 1,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    borderRadius: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  simulateButtonText: {
    color: '#22D3EE',
    fontSize: 12,
    fontWeight: '700',
  },
  suggestionCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#8B5CF6', // Glowing Violet border for suggestions
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    marginBottom: 20,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  categoryText: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  pointsBadge: {
    backgroundColor: '#FACC15', // Yellow 400
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsBadgeText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '800',
  },
  missionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    lineHeight: 22,
  },
  missionDesc: {
    fontSize: 13,
    color: '#CBD5E1',
    marginTop: 8,
    lineHeight: 18,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  locationText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  timeGapContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  timeGapText: {
    color: '#C084FC',
    fontSize: 12,
    fontWeight: '600',
  },
  suggestionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#475569',
  },
  declineBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  acceptBtn: {
    backgroundColor: '#8B5CF6',
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  activeMissionContainer: {
    marginTop: 15,
  },
  activeBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 10,
  },
  activeBadgeText: {
    color: '#FCA5A5',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  mapBtn: {
    backgroundColor: '#475569',
    flexDirection: 'row',
    gap: 6,
  },
  mapBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  claimBtn: {
    backgroundColor: '#06B6D4',
    flexDirection: 'row',
    gap: 6,
  },
  claimBtnText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
    borderStyle: 'dashed',
  },
  emptyIcon: {
    marginBottom: 15,
  },
  emptyTitle: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyDesc: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
  modeBadge: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(6, 182, 212, 0.2)',
  },
  modeText: {
    color: '#22D3EE',
    fontSize: 10,
    fontWeight: '700',
  },
  eventInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    padding: 10,
    borderRadius: 12,
  },
  eventInfoText: {
    color: '#CBD5E1',
    fontSize: 12,
    flex: 1,
  },
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
    marginBottom: 25,
  },
  streakCard: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  streakTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  streakVal: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '800',
  },
  streakDesc: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 4,
    fontWeight: '500',
  },
});
