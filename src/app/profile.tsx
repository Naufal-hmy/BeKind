import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  Alert,
  Platform,
  ActivityIndicator,
  FlatList,
  TextInput,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { dbService, isDemoMode } from '@/services/database';
import { useKindnessAgent } from '@/context/AgentContext';

// Papan Peringkat Mock Gen Z
const LEADERBOARD = [
  { rank: 1, name: 'Anya_Care', points: 720, level: 'Kaisar Empati' },
  { rank: 2, name: 'Lu (You)', points: 150, level: 'Peka-Beginner' }, // Dinamis
  { rank: 3, name: 'Fiki_Gacor', points: 120, level: 'Bestie Peduli' },
  { rank: 4, name: 'Rey_Peka', points: 90, level: 'Peka-Beginner' },
  { rank: 5, name: 'Caca_Kreatif', points: 50, level: 'Peka-Beginner' },
];

// Gambar Aksi Kebaikan Mock untuk Simulasi Bukti Kamera (Jika di Web/Emulator)
const MOCK_ACTION_IMAGES: Record<string, string> = {
  Hewan: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&auto=format&fit=crop&q=60', // Kucing lucu
  Sosial: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&auto=format&fit=crop&q=60', // Pedagang/jalan
  Kemanusiaan: 'https://images.unsplash.com/photo-1527813062060-eed7d21c172a?w=500&auto=format&fit=crop&q=60', // Air mineral dingin
  Lingkungan: 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=500&auto=format&fit=crop&q=60', // Pungut botol sampah
  Umum: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=500&auto=format&fit=crop&q=60',
};

export default function ProfileScreen() {
  const { activeSuggestion, dismissSuggestion } = useKindnessAgent();
  const [profile, setProfile] = useState<any>({
    name: 'Bestie Peka',
    username: 'bestie_peka',
    aura_points: 0,
    level: 'Peka-Beginner',
    avatar_url: 'https://api.dicebear.com/7.x/pixel-art/png?seed=skylar',
  });
  const [history, setHistory] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showCameraView, setShowCameraView] = useState(false);
  const [cameraGridMode, setCameraGridMode] = useState(true);

  // States untuk Admin Panel CRUD
  const [adminMissions, setAdminMissions] = useState<any[]>([]);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [editingMission, setEditingMission] = useState<any | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('Sosial');
  const [formLatitude, setFormLatitude] = useState('-6.9024');
  const [formLongitude, setFormLongitude] = useState('107.6186');
  const [formAuraPoints, setFormAuraPoints] = useState('50');
  const [formLocationName, setFormLocationName] = useState('');

  // Muat data profil & riwayat misi
  const loadData = async () => {
    try {
      const prof = await dbService.getProfile();
      setProfile(prof);
      const list = await dbService.getCompletedMissions();
      setHistory(list);
      
      const missionsList = await dbService.getMissions();
      setAdminMissions(missionsList);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
    // Refresh otomatis setiap 3 detik
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  // Update skor user di leaderboard mockup
  const updatedLeaderboard = LEADERBOARD.map((item) => {
    if (item.rank === 2) {
      return {
        ...item,
        points: profile.aura_points,
        level: profile.level.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '').trim()
      };
    }
    return item;
  }).sort((a, b) => b.points - a.points);

  const handleChangeAvatar = async () => {
    Alert.alert(
      'Ubah Foto Profil',
      'Pilih gambar dari galeri HP atau reset ke default:',
      [
        {
          text: 'Pilih dari Galeri',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Izin Ditolak', 'Aplikasi butuh izin galeri untuk memilih foto profil!');
              return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.7,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
              const selectedUri = result.assets[0].uri;
              try {
                const updatedProf = await dbService.updateProfileAvatar(selectedUri);
                setProfile(updatedProf);
                Alert.alert('Sukses', 'Foto profil berhasil diperbarui!');
              } catch (err: any) {
                console.error(err);
                Alert.alert('Gagal', 'Gagal memperbarui foto profil');
              }
            }
          }
        },
        {
          text: 'Reset ke Default',
          onPress: async () => {
            try {
              const defaultAvatar = `https://api.dicebear.com/7.x/fun-emoji/png?seed=${profile.name}`;
              const updatedProf = await dbService.updateProfileAvatar(defaultAvatar);
              setProfile(updatedProf);
              Alert.alert('Sukses', 'Foto profil di-reset ke default');
            } catch (err) {
              Alert.alert('Gagal', 'Gagal mereset foto profil');
            }
          }
        },
        { text: 'Batal', style: 'cancel' }
      ]
    );
  };

  // Ambil Bukti Kebaikan (Buka Kamera Native / Library)
  const handleOpenNativeCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Ditolak', 'Aplikasi butuh izin kamera untuk memotret bukti kebaikan!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await processCompletion(result.assets[0].uri);
      }
    } catch (e) {
      console.log('Gagal membuka kamera native, menggunakan mock camera simulator:', e);
      // Buka Mock Camera Simulator di app jika native camera error/tidak disupport (seperti di Web)
      setShowCameraView(true);
    }
  };

  // Simulasikan Pemotretan Foto Misi (Untuk Web/Emulator)
  const handleSimulateCapture = async () => {
    if (!activeSuggestion || !activeSuggestion.mission) return;
    setUploading(true);
    
    // Ambil gambar mock yang sesuai dengan kategori misi
    const cat = activeSuggestion.mission.category || 'Umum';
    const mockImage = MOCK_ACTION_IMAGES[cat] || MOCK_ACTION_IMAGES.Umum;

    setTimeout(async () => {
      await processCompletion(mockImage);
      setUploading(false);
      setShowCameraView(false);
    }, 1500); // Simulasi upload 1.5 detik
  };

  // Proses Poin & Log Misi Selesai
  const processCompletion = async (imageUri: string) => {
    if (!activeSuggestion || !activeSuggestion.mission) return;

    try {
      const points = activeSuggestion.mission.aura_points;
      await dbService.completeMission(
        activeSuggestion.id,
        activeSuggestion.mission_id,
        imageUri,
        points
      );

      Alert.alert(
        'MISI BERHASIL',
        `Sheesh! Lu dapet +${points} Aura Points. Aura lu makin bersinar rill no cap!`,
        [{ text: 'Keren', onPress: loadData }]
      );
    } catch (e) {
      console.error(e);
      Alert.alert('Gagal', 'Gagal memproses bukti kebaikan.');
    }
  };

  // Render Panel Admin (CRUD Misi)
  const renderAdminPanel = () => {
    const handleOpenForm = (mission: any | null) => {
      if (mission) {
        setEditingMission(mission);
        setFormTitle(mission.title);
        setFormDescription(mission.description);
        setFormCategory(mission.category);
        setFormLatitude(mission.latitude.toString());
        setFormLongitude(mission.longitude.toString());
        setFormAuraPoints(mission.aura_points.toString());
        setFormLocationName(mission.location_name);
      } else {
        setEditingMission({});
        setFormTitle('');
        setFormDescription('');
        setFormCategory('Sosial');
        setFormLatitude('-6.9024');
        setFormLongitude('107.6186');
        setFormAuraPoints('50');
        setFormLocationName('');
      }
    };

    const handleSave = async () => {
      if (!formTitle || !formDescription || !formLocationName) {
        Alert.alert('Error', 'Harap isi semua kolom wajib!');
        return;
      }
      const lat = parseFloat(formLatitude) || -6.9024;
      const lon = parseFloat(formLongitude) || 107.6186;
      const pts = parseInt(formAuraPoints) || 50;

      try {
        if (editingMission && editingMission.id) {
          // Update
          await dbService.updateMission(editingMission.id, formTitle, formDescription, formCategory, lat, lon, pts, formLocationName);
          Alert.alert('Sukses', 'Misi berhasil diperbarui!');
        } else {
          // Add
          await dbService.addMission(formTitle, formDescription, formCategory, lat, lon, pts, formLocationName);
          Alert.alert('Sukses', 'Misi baru berhasil ditambahkan!');
        }
        setEditingMission(null);
        loadData();
      } catch (err: any) {
        Alert.alert('Gagal', err.message || 'Gagal menyimpan misi');
      }
    };

    const handleDelete = async (id: string) => {
      Alert.alert(
        'Hapus Misi',
        'Apakah kamu yakin ingin menghapus misi ini rill?',
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Hapus',
            style: 'destructive',
            onPress: async () => {
              try {
                await dbService.deleteMission(id);
                Alert.alert('Sukses', 'Misi berhasil dihapus');
                loadData();
              } catch (err: any) {
                Alert.alert('Gagal', err.message || 'Gagal menghapus misi');
              }
            }
          }
        ]
      );
    };

    return (
      <View style={styles.adminOverlay}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.adminHeader}>
            <TouchableOpacity onPress={() => { setEditingMission(null); setShowAdminPanel(false); }}>
              <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
            </TouchableOpacity>
            <Text style={styles.adminTitle}>Panel Admin BeKind</Text>
            {editingMission === null && (
              <TouchableOpacity onPress={() => handleOpenForm(null)} style={styles.adminAddBtn}>
                <Ionicons name="add" size={20} color="#0F172A" />
                <Text style={styles.adminAddText}>Misi</Text>
              </TouchableOpacity>
            )}
          </View>

          {editingMission !== null ? (
            // Edit/Add Form Screen
            <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
              <Text style={styles.formSectionTitle}>
                {editingMission.id ? 'Edit Misi Kebaikan' : 'Tambah Misi Kebaikan Baru'}
              </Text>

              <Text style={styles.formLabel}>Judul Misi</Text>
              <TextInput style={styles.formInput} value={formTitle} onChangeText={setFormTitle} placeholder="Contoh: Sapu Halaman Masjid" placeholderTextColor="#64748B" />

              <Text style={styles.formLabel}>Deskripsi Lengkap</Text>
              <TextInput style={[styles.formInput, { height: 80, textAlignVertical: 'top' }]} multiline value={formDescription} onChangeText={setFormDescription} placeholder="Jelaskan aksi kebaikan yang harus dilakukan..." placeholderTextColor="#64748B" />

              <Text style={styles.formLabel}>Kategori</Text>
              <View style={styles.categorySelector}>
                {['Hewan', 'Sosial', 'Kemanusiaan', 'Lingkungan'].map((cat) => (
                  <TouchableOpacity key={cat} style={[styles.categoryBtn, formCategory === cat && styles.categoryBtnActive]} onPress={() => setFormCategory(cat)}>
                    <Text style={[styles.categoryBtnText, formCategory === cat && styles.categoryBtnTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Nama Lokasi</Text>
              <TextInput style={styles.formInput} value={formLocationName} onChangeText={setFormLocationName} placeholder="Contoh: Jl. Diponegoro (Depan Puskesmas)" placeholderTextColor="#64748B" />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Latitude</Text>
                  <TextInput style={styles.formInput} keyboardType="numeric" value={formLatitude} onChangeText={setFormLatitude} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Longitude</Text>
                  <TextInput style={styles.formInput} keyboardType="numeric" value={formLongitude} onChangeText={setFormLongitude} />
                </View>
              </View>

              <Text style={styles.formLabel}>Aura Points</Text>
              <TextInput style={styles.formInput} keyboardType="numeric" value={formAuraPoints} onChangeText={setFormAuraPoints} />

              <View style={styles.formActionButtons}>
                <TouchableOpacity style={styles.formSaveBtn} onPress={handleSave}>
                  <Text style={styles.formSaveText}>Simpan Misi</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.formCancelBtn} onPress={() => setEditingMission(null)}>
                  <Text style={styles.formCancelText}>Kembali</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            // Missions List Screen
            <FlatList
              data={adminMissions}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 20 }}
              renderItem={({ item }) => (
                <View style={styles.adminMissionCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.adminCardTitle}>{item.title}</Text>
                    <Text style={styles.adminCardCategory}>{item.category} • +{item.aura_points} Aura</Text>
                    <Text style={styles.adminCardLocation}><Ionicons name="pin" size={12} color="#94A3B8" /> {item.location_name}</Text>
                  </View>
                  <View style={styles.adminCardActions}>
                    <TouchableOpacity onPress={() => handleOpenForm(item)} style={styles.adminEditBtn}>
                      <Ionicons name="pencil" size={16} color="#06B6D4" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.adminDeleteBtn}>
                      <Ionicons name="trash" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View style={{ alignItems: 'center', marginTop: 40 }}>
                  <Text style={{ color: '#94A3B8' }}>Belum ada misi terdaftar.</Text>
                </View>
              }
            />
          )}
        </SafeAreaView>
      </View>
    );
  };

  // Render Layar Kamera Simulasi (Cyberpunk Viewfinder)
  const renderMockCameraView = () => {
    if (!activeSuggestion || !activeSuggestion.mission) return null;
    const cat = activeSuggestion.mission.category || 'Umum';
    const previewImg = MOCK_ACTION_IMAGES[cat] || MOCK_ACTION_IMAGES.Umum;

    return (
      <View style={styles.cameraScreen}>
        <View style={styles.cameraHeader}>
          <TouchableOpacity style={styles.camCloseBtn} onPress={() => setShowCameraView(false)}>
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.cameraTitle}>SPILL BUKTI KEBAIKAN</Text>
          <TouchableOpacity 
            style={styles.camGridBtn} 
            onPress={() => setCameraGridMode(!cameraGridMode)}
          >
            <Ionicons name={cameraGridMode ? 'grid' : 'grid-outline'} size={20} color="#06B6D4" />
          </TouchableOpacity>
        </View>

        {/* Viewfinder Area */}
        <View style={styles.viewfinder}>
          {/* Blurred/Semi-transparent image simulation */}
          <Image source={{ uri: previewImg }} style={styles.viewfinderImage} />
          
          {cameraGridMode && (
            <View style={styles.gridOverlay}>
              <View style={styles.gridRow1} />
              <View style={styles.gridRow2} />
              <View style={styles.gridCol1} />
              <View style={styles.gridCol2} />
            </View>
          )}

          {/* Target Scanner Marker */}
          <View style={styles.scannerTargetBox}>
            <View style={styles.scannerCornerTL} />
            <View style={styles.scannerCornerTR} />
            <View style={styles.scannerCornerBL} />
            <View style={styles.scannerCornerBR} />
            <Text style={styles.scannerText}>DETEKSI KATEGORI: {cat.toUpperCase()}</Text>
          </View>

          {uploading && (
            <View style={styles.cameraLoader}>
              <ActivityIndicator size="large" color="#06B6D4" />
              <Text style={styles.cameraLoaderText}>Mengunggah Bukti Kebaikan (Real-time Audit)...</Text>
            </View>
          )}
        </View>

        {/* Control Footer */}
        <View style={styles.cameraFooter}>
          <Text style={styles.cameraInstruction}>
            Arahkan kamera ke objek aksi sosial (foto harus memuat kucing makan/bantuan).
          </Text>
          
          <TouchableOpacity 
            style={styles.shutterBtn} 
            onPress={handleSimulateCapture}
            disabled={uploading}
          >
            <View style={styles.shutterBtnInner} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" translucent={false} />
      {/* Jika view camera aktif, render full overlay */}
      {showCameraView && renderMockCameraView()}

      {/* Jika panel admin aktif, render full overlay */}
      {showAdminPanel && renderAdminPanel()}

      {/* Background neon glow */}
      <View style={styles.glowViolet} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity style={styles.avatarContainer} onPress={handleChangeAvatar}>
            <View style={styles.avatarBorder} />
            <Image 
              source={{ uri: profile.avatar_url || `https://api.dicebear.com/7.x/fun-emoji/png?seed=${profile.name}` }} 
              style={styles.avatar} 
            />
            <View style={styles.avatarEditBadge}>
              <Ionicons name="camera" size={12} color="#0F172A" />
            </View>
          </TouchableOpacity>
          
          <Text style={styles.profileName}>{profile.name}</Text>
          <Text style={styles.profileUsername}>@{profile.username}</Text>

          <View style={styles.rankContainer}>
            <Text style={styles.rankText}>{profile.level}</Text>
          </View>
          
          <View style={styles.auraScoreBox}>
            <Ionicons name="sparkles" size={18} color="#FACC15" />
            <Text style={styles.auraScoreVal}>+{profile.aura_points}</Text>
            <Text style={styles.auraScoreLbl}>Aura Points</Text>
          </View>
        </View>

        {/* Tombol Kelola Misi (Admin Panel) */}
        <TouchableOpacity 
          style={styles.adminPanelBtn} 
          onPress={() => setShowAdminPanel(true)}
        >
          <Ionicons name="settings-outline" size={18} color="#06B6D4" />
          <Text style={styles.adminPanelBtnText}>Panel Kelola Misi (Admin CRUD)</Text>
        </TouchableOpacity>

        {/* Active Mission Action (Klaim Bukti) */}
        {activeSuggestion && activeSuggestion.status === 'accepted' && (
          <View style={styles.claimPanel}>
            <View style={styles.claimHeader}>
              <Ionicons name="camera" size={20} color="#0F172A" />
              <Text style={styles.claimTitle}>Klaim Aura Misi Aktif!</Text>
            </View>
            <Text style={styles.claimDesc}>
              Misi: <Text style={{ fontWeight: '700' }}>{activeSuggestion.mission?.title}</Text>
            </Text>
            
            <View style={styles.claimButtons}>
              <TouchableOpacity style={styles.claimCamBtn} onPress={handleOpenNativeCamera}>
                <Ionicons name="camera" size={16} color="#0F172A" />
                <Text style={styles.claimCamText}>Ambil Bukti Foto</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.claimCancelBtn}
                onPress={() => dismissSuggestion(activeSuggestion.id)}
              >
                <Text style={styles.claimCancelText}>Batalkan Misi</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Gamifikasi: Leaderboard / Papan Peringkat */}
        <Text style={styles.sectionTitle}>Peka-Leaderboard (Bandung Gen Z)</Text>
        <View style={styles.leaderboardCard}>
          {updatedLeaderboard.map((item, index) => {
            const isUser = item.name.includes('Lu');
            return (
              <View 
                key={index} 
                style={[
                  styles.leaderboardItem,
                  isUser && styles.leaderboardItemUser,
                  index === updatedLeaderboard.length - 1 && { borderBottomWidth: 0 }
                ]}
              >
                <View style={styles.leadLeft}>
                  <Text style={[
                    styles.rankNum,
                    item.rank === 1 && { color: '#FACC15' },
                    item.rank === 2 && { color: '#E2E8F0' },
                    item.rank === 3 && { color: '#CD7F32' },
                  ]}>
                    #{item.rank}
                  </Text>
                  <Text style={[styles.leadName, isUser && { fontWeight: '800', color: '#06B6D4' }]}>
                    {item.name}
                  </Text>
                </View>
                
                <View style={styles.leadRight}>
                  <Text style={styles.leadPoints}>+{item.points} Aura</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Histori Kebaikan */}
        <Text style={styles.sectionTitle}>Riwayat Aksi Kebaikan</Text>
        
        {history.length > 0 ? (
          <View style={styles.historyGrid}>
            {history.map((item) => (
              <View key={item.id} style={styles.historyCard}>
                <Image source={{ uri: item.photo_url }} style={styles.historyImg} />
                <View style={styles.historyInfo}>
                  <Text style={styles.historyTitle} numberOfLines={1}>
                    {item.mission?.title || 'Misi Selesai'}
                  </Text>
                  <View style={styles.historySub}>
                    <Text style={styles.historyTime}>
                      {new Date(item.completed_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </Text>
                    <Text style={styles.historyPoints}>+{item.points_gained} Aura</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="images-outline" size={40} color="#475569" style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>Belum Ada Aksi Terekam</Text>
            <Text style={styles.emptyDesc}>
              Ayo selesaikan misi pertamamu, foto buktinya, dan penuhi profil ini dengan foto-foto kebaikan ber-Aura tinggi!
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
    backgroundColor: '#0F172A',
  },
  glowViolet: {
    position: 'absolute',
    top: 400,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    filter: 'blur(70px)',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    marginTop: 35,
    marginBottom: 25,
  },
  avatarContainer: {
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarBorder: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2.5,
    borderColor: '#06B6D4',
  },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#1E293B',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#22D3EE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 12,
  },
  profileUsername: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  rankContainer: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 10,
  },
  rankText: {
    color: '#22D3EE',
    fontSize: 11,
    fontWeight: '700',
  },
  auraScoreBox: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  auraScoreVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  auraScoreLbl: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  
  // Claim active suggestion panel
  claimPanel: {
    backgroundColor: '#FACC15',
    borderRadius: 20,
    padding: 16,
    marginBottom: 25,
    shadowColor: '#FACC15',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  claimHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  claimTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  claimDesc: {
    color: '#1E293B',
    fontSize: 13,
    marginTop: 6,
    fontWeight: '600',
  },
  claimButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  claimCamBtn: {
    flex: 1.5,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  claimCamText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  claimCancelBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  claimCancelText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  // Leaderboard Card
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  leaderboardCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    marginBottom: 25,
  },
  leaderboardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  leaderboardItemUser: {
    backgroundColor: 'rgba(6, 182, 212, 0.06)',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  leadLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankNum: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
    width: 24,
  },
  leadName: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
  },
  leadRight: {
    alignItems: 'flex-end',
  },
  leadPoints: {
    color: '#06B6D4',
    fontSize: 13,
    fontWeight: '700',
  },

  // History Grid
  historyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  historyCard: {
    width: '48%', // 2 Columns
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  historyImg: {
    width: '100%',
    height: 110,
    backgroundColor: '#1E293B',
  },
  historyInfo: {
    padding: 10,
  },
  historyTitle: {
    color: '#F1F5F9',
    fontSize: 12,
    fontWeight: '700',
  },
  historySub: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  historyTime: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
  },
  historyPoints: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '800',
  },

  // Empty Card
  emptyCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.02)',
    borderStyle: 'dashed',
  },
  emptyIcon: {
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyDesc: {
    color: '#475569',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 15,
  },

  // MOCK CAMERA VIEW OVERLAY STYLES
  cameraScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 9999,
  },
  cameraHeader: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: Platform.OS === 'ios' ? 40 : 10,
  },
  camCloseBtn: {
    padding: 8,
  },
  cameraTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  camGridBtn: {
    padding: 8,
  },
  viewfinder: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewfinderImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridRow1: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 0.5,
    backgroundColor: 'rgba(255,255,255,0.25)',
    top: '33.3%',
  },
  gridRow2: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 0.5,
    backgroundColor: 'rgba(255,255,255,0.25)',
    top: '66.6%',
  },
  gridCol1: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 0.5,
    backgroundColor: 'rgba(255,255,255,0.25)',
    left: '33.3%',
  },
  gridCol2: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 0.5,
    backgroundColor: 'rgba(255,255,255,0.25)',
    left: '66.6%',
  },
  scannerTargetBox: {
    width: 200,
    height: 200,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerCornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#06B6D4',
  },
  scannerCornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#06B6D4',
  },
  scannerCornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#06B6D4',
  },
  scannerCornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#06B6D4',
  },
  scannerText: {
    color: '#06B6D4',
    fontSize: 9,
    fontWeight: '800',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(6, 182, 212, 0.4)',
    textAlign: 'center',
  },
  cameraLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cameraLoaderText: {
    color: '#06B6D4',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 15,
    textAlign: 'center',
  },
  cameraFooter: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  cameraInstruction: {
    color: '#64748B',
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 15,
  },
  shutterBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 4,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterBtnInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#06B6D4',
  },
  adminPanelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: 'center',
    marginTop: 5,
    marginBottom: 20,
    gap: 8,
  },
  adminPanelBtnText: {
    color: '#22D3EE',
    fontSize: 13,
    fontWeight: '700',
  },
  adminOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F172A',
    zIndex: 2000,
  },
  adminHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderColor: '#1E293B',
    backgroundColor: '#0F172A',
  },
  adminTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  adminAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22D3EE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 2,
  },
  adminAddText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },
  adminMissionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#334155',
  },
  adminCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  adminCardCategory: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '600',
    marginBottom: 4,
  },
  adminCardLocation: {
    fontSize: 12,
    color: '#94A3B8',
  },
  adminCardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  adminEditBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  adminDeleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  formContainer: {
    padding: 20,
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    color: '#F8FAFC',
    fontSize: 14,
    marginBottom: 16,
  },
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  categoryBtnActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: '#8B5CF6',
  },
  categoryBtnText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  categoryBtnTextActive: {
    color: '#C084FC',
  },
  formActionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 30,
  },
  formSaveBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#06B6D4',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formSaveText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  formCancelBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formCancelText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
});
