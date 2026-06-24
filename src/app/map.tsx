import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useKindnessAgent } from '@/context/AgentContext';
import { dbService } from '@/services/database';
import { useRouter } from 'expo-router';

// Impor React Native Maps hanya jika bukan di Web untuk mencegah crash
let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;
if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
    Polyline = Maps.Polyline;
  } catch (e) {
    console.log('Gagal memuat react-native-maps:', e);
  }
}

export default function MapScreen() {
  const router = useRouter();
  const { currentLocation, activeSuggestion, acceptSuggestion } = useKindnessAgent();
  const [missions, setMissions] = useState<any[]>([]);
  const [selectedMission, setSelectedMission] = useState<any>(null);

  // Ambil data semua misi
  useEffect(() => {
    async function fetchMissions() {
      try {
        const list = await dbService.getMissions();
        setMissions(list);
        
        // Default select ke misi aktif jika ada
        if (activeSuggestion && activeSuggestion.mission) {
          setSelectedMission(activeSuggestion.mission);
        } else if (list.length > 0) {
          setSelectedMission(list[0]);
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchMissions();
  }, [activeSuggestion]);

  // Handler saat pin misi ditekan
  const handleSelectMission = (mission: any) => {
    setSelectedMission(mission);
  };

  // Jadikan misi terpilih sebagai misi aktif
  const handleSetMisiAktif = async (missionId: string) => {
    try {
      // Cari suggestion yang terkait atau buat suggestion baru
      const now = new Date();
      const startStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const endStr = `${(now.getHours() + 1).toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      const newSug = await dbService.addSuggestion(missionId, startStr, endStr);
      await acceptSuggestion(newSug.id);
      
      Alert.alert(
        'Misi Baru Aktif',
        'Misi berhasil dipilih! Sekarang misi ini jadi fokus utama Sobat Peka.',
        [{ text: 'Oke' }]
      );
    } catch (e) {
      console.error(e);
    }
  };

  // Render Peta Radar Cyberpunk Khusus Web / Emulator tanpa Google Maps
  const renderWebRadarMap = () => {
    const centerLat = currentLocation?.latitude || -6.9024;
    const centerLon = currentLocation?.longitude || 107.6186;

    return (
      <View style={styles.radarContainer}>
        {/* Holographic grid lines */}
        <View style={styles.radarGridHoriz1} />
        <View style={styles.radarGridHoriz2} />
        <View style={styles.radarGridVert1} />
        <View style={styles.radarGridVert2} />
        
        {/* Radar concentric scanning circles */}
        <View style={[styles.radarCircle, { width: 100, height: 100, borderRadius: 50 }]} />
        <View style={[styles.radarCircle, { width: 220, height: 220, borderRadius: 110 }]} />
        <View style={[styles.radarCircle, { width: 340, height: 340, borderRadius: 170 }]} />
        
        {/* Radar Scanning Line */}
        <View style={styles.radarSweep} />

        {/* User Marker (Center) */}
        <View style={styles.userMarkerWeb}>
          <View style={styles.userMarkerPulse} />
          <View style={styles.userMarkerDot} />
          <Text style={styles.userMarkerLabel}>Lu (Disini)</Text>
        </View>

        {/* Mission Markers on Radar Grid */}
        {missions.map((m) => {
          // Hitung posisi relatif berdasarkan perbedaan koordinat
          // Skala perbesaran koordinat agar pas di layar
          const diffLat = (m.latitude - centerLat) * 8000;
          const diffLon = (m.longitude - centerLon) * 8000;
          
          const screenWidth = Dimensions.get('window').width;
          const mapCenterY = 220; // Sesuai tinggi tengah area radar
          const mapCenterX = screenWidth / 2;

          const topPos = mapCenterY - diffLat;
          const leftPos = mapCenterX + diffLon;

          const isSelected = selectedMission?.id === m.id;
          const isActive = activeSuggestion?.mission_id === m.id && activeSuggestion?.status === 'accepted';

          return (
            <TouchableOpacity
              key={m.id}
              style={[
                styles.missionMarkerWeb,
                { top: topPos, left: leftPos },
                isSelected && styles.missionMarkerWebSelected,
                isActive && styles.missionMarkerWebActive,
              ]}
              onPress={() => handleSelectMission(m)}
            >
              <Ionicons
                name={isActive ? 'flag' : m.category === 'Hewan' ? 'paw' : 'people'}
                size={16}
                color={isActive ? '#FCA5A5' : isSelected ? '#22D3EE' : '#C084FC'}
              />
              {isActive && <View style={styles.activeMarkerIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // Render Real Native Maps
  const renderNativeMap = () => {
    if (!MapView) return renderWebRadarMap();

    const userLat = currentLocation?.latitude || -6.9024;
    const userLon = currentLocation?.longitude || 107.6186;

    return (
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: userLat,
          longitude: userLon,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }}
        customMapStyle={darkMapStyle}
        showsUserLocation={true}
      >
        {/* User position marker */}
        <Marker
          coordinate={{ latitude: userLat, longitude: userLon }}
          title="Lokasi Lu"
          description="Lagi di sini"
        >
          <View style={styles.userMarkerNative}>
            <View style={styles.userMarkerDot} />
          </View>
        </Marker>

        {/* Missions markers */}
        {missions.map((m) => {
          const isSelected = selectedMission?.id === m.id;
          const isActive = activeSuggestion?.mission_id === m.id && activeSuggestion?.status === 'accepted';

          return (
            <Marker
              key={m.id}
              coordinate={{ latitude: m.latitude, longitude: m.longitude }}
              onPress={() => handleSelectMission(m)}
            >
              <View
                style={[
                  styles.nativeMarker,
                  isSelected && styles.nativeMarkerSelected,
                  isActive && styles.nativeMarkerActive,
                ]}
              >
                <Ionicons
                  name={isActive ? 'flag' : m.category === 'Hewan' ? 'paw' : 'people'}
                  size={18}
                  color={isActive ? '#FFF' : isSelected ? '#0F172A' : '#FFF'}
                />
              </View>
            </Marker>
          );
        })}

        {/* Garis Rute jika ada misi aktif terpilih */}
        {activeSuggestion?.status === 'accepted' && activeSuggestion.mission && Polyline && (
          <Polyline
            coordinates={[
              { latitude: userLat, longitude: userLon },
              {
                latitude: activeSuggestion.mission.latitude,
                longitude: activeSuggestion.mission.longitude,
              },
            ]}
            strokeColor="#06B6D4"
            strokeWidth={3}
            lineDashPattern={[5, 5]}
          />
        )}
      </MapView>
    );
  };

  const isCurrentActive = activeSuggestion?.mission_id === selectedMission?.id && activeSuggestion?.status === 'accepted';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Peta Peka</Text>
          <Text style={styles.headerSubtitle}>Misi kebaikan di sekitar lu rill no cap</Text>
        </View>
      </View>

      {/* Area Map / Radar */}
      <View style={styles.mapArea}>
        {Platform.OS === 'web' ? renderWebRadarMap() : renderNativeMap()}
      </View>

      {/* Bottom Info Panel untuk Misi Terpilih */}
      {selectedMission && (
        <View style={styles.infoPanel}>
          <View style={styles.panelHeader}>
            <View style={styles.categoryContainer}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{selectedMission.category}</Text>
              </View>
              {isCurrentActive && (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeText}>Misi Aktif</Text>
                </View>
              )}
            </View>
            <View style={styles.auraBadge}>
              <Ionicons name="sparkles" size={12} color="#0F172A" />
              <Text style={styles.auraBadgeText}>+{selectedMission.aura_points} Aura</Text>
            </View>
          </View>

          <Text style={styles.missionTitle}>{selectedMission.title}</Text>
          <Text style={styles.missionDesc} numberOfLines={3}>
            {selectedMission.description}
          </Text>

          <View style={styles.locationInfo}>
            <Ionicons name="compass-outline" size={14} color="#94A3B8" />
            <Text style={styles.locationText}>Tempat: {selectedMission.location_name}</Text>
          </View>

          {/* Tombol Aksi */}
          {isCurrentActive ? (
            <TouchableOpacity
              style={styles.actionBtnActive}
              onPress={() => router.push('/profile')}
            >
              <Ionicons name="camera" size={18} color="#0F172A" />
              <Text style={styles.actionBtnTextActive}>Klaim Aura Points (Spill Bukti)</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.actionBtnNormal}
              onPress={() => handleSetMisiAktif(selectedMission.id)}
            >
              <Ionicons name="flag-outline" size={18} color="#FFF" />
              <Text style={styles.actionBtnTextNormal}>Mulai Misi Kebaikan Ini</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

// Styling Peta Gelap untuk Google Maps
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0F172A' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94A3B8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1E293B' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#334155' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#1E293B' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1E293B' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#64748B' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#334155' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1E293B' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#94A3B8' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1E293B' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#090D16' }] },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTextContainer: {
    marginTop: 5,
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
  mapArea: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  
  // Custom Marker Styles (Native)
  userMarkerNative: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(6, 182, 212, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMarkerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#06B6D4',
  },
  nativeMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8B5CF6',
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  nativeMarkerSelected: {
    backgroundColor: '#22D3EE',
    borderColor: '#0F172A',
    transform: [{ scale: 1.15 }],
  },
  nativeMarkerActive: {
    backgroundColor: '#EF4444',
    borderColor: '#F8FAFC',
    transform: [{ scale: 1.2 }],
  },

  // Cyberpunk Radar Screen Styles (Web Fallback)
  radarContainer: {
    flex: 1,
    backgroundColor: '#0A0E17',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarGridHoriz1: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    top: '30%',
  },
  radarGridHoriz2: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    top: '70%',
  },
  radarGridVert1: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    left: '30%',
  },
  radarGridVert2: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    left: '70%',
  },
  radarCircle: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.07)',
  },
  radarSweep: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
    borderRightWidth: 2,
    borderRightColor: 'rgba(6, 182, 212, 0.15)',
    transform: [{ rotate: '45deg' }], // Simulated angle sweep
  },
  userMarkerWeb: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMarkerPulse: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
  },
  userMarkerLabel: {
    color: '#06B6D4',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  missionMarkerWeb: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1.5,
    borderColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowRadius: 6,
    shadowOpacity: 0.5,
  },
  missionMarkerWebSelected: {
    backgroundColor: 'rgba(6, 182, 212, 0.25)',
    borderColor: '#22D3EE',
    shadowColor: '#22D3EE',
    transform: [{ scale: 1.15 }],
  },
  missionMarkerWebActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    borderColor: '#EF4444',
    shadowColor: '#EF4444',
    transform: [{ scale: 1.2 }],
  },
  activeMarkerIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },

  // Bottom Panel
  infoPanel: {
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
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
  },
  activeBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  activeText: {
    color: '#FCA5A5',
    fontSize: 10,
    fontWeight: '700',
  },
  auraBadge: {
    backgroundColor: '#FACC15',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  auraBadgeText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '800',
  },
  missionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 10,
  },
  missionDesc: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 6,
    lineHeight: 18,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  locationText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
  },
  actionBtnNormal: {
    backgroundColor: '#8B5CF6',
    borderRadius: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    gap: 8,
  },
  actionBtnTextNormal: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  actionBtnActive: {
    backgroundColor: '#06B6D4',
    borderRadius: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    gap: 8,
  },
  actionBtnTextActive: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
});
