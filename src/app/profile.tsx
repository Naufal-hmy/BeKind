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
  DevSettings,
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

  // States Perluasan Fitur Baru (Streaks, Creator, Verifikasi, Dispute, QRIS)
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [showCreateMissionModal, setShowCreateMissionModal] = useState(false);
  const [countdown, setCountdown] = useState('');
  
  // States Form Misi Baru
  const [newMissionType, setNewMissionType] = useState<'personal' | 'public'>('personal');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Sosial');
  const [newLocation, setNewLocation] = useState('');
  const [newMode, setNewMode] = useState<'solo' | 'group' | 'community'>('solo');
  const [newPoints, setNewPoints] = useState('50');
  const [paymentMethod, setPaymentMethod] = useState<'points' | 'qris'>('points');
  const [showQRISPaymentModal, setShowQRISPaymentModal] = useState(false);
  const [qrisUrl, setQrisUrl] = useState('');
  const [isCreatingMissionLoading, setIsCreatingMissionLoading] = useState(false);

  // States Verifikasi & Sengketa CS
  const [pendingVerifications, setPendingVerifications] = useState<any[]>([]);
  const [showEOAdminPanel, setShowEOAdminPanel] = useState(false);
  const [verificationTab, setVerificationTab] = useState<'public' | 'event'>('public');
  const [disputingCompletion, setDisputingCompletion] = useState<any | null>(null);
  const [disputeReason, setDisputeReason] = useState('');

  // States Edit Profil
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');

  const handleOpenEditProfile = () => {
    setEditName(profile.name || '');
    setEditUsername(profile.username || '');
    setShowEditProfileModal(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim() || !editUsername.trim()) {
      Alert.alert('Eits', 'Nama dan username wajib diisi, cuy!');
      return;
    }
    try {
      const updated = await dbService.updateProfileInfo(editName, editUsername);
      setProfile(updated);
      setShowEditProfileModal(false);
      Alert.alert('Mantap', 'Profil berhasil diperbarui.');
    } catch (err: any) {
      Alert.alert('Gagal', err.message || 'Gagal memperbarui profil.');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Keluar Akun?',
      'Yakin mau keluar dari BeKind, cuy?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            try {
              await dbService.signOut();
              DevSettings.reload();
            } catch (err) {
              console.error(err);
            }
          },
        },
      ]
    );
  };

  // Muat data profil & riwayat misi
  const loadData = async () => {
    try {
      const prof = await dbService.getProfile();
      setProfile(prof);
      const list = await dbService.getCompletedMissions();
      setHistory(list);
      
      const missionsList = await dbService.getMissions();
      setAdminMissions(missionsList);

      const leadData = await dbService.getLeaderboard();
      setLeaderboard(leadData);

      // Filter pending verifications
      const pendingList = list.filter((c: any) => c.status === 'pending');
      setPendingVerifications(pendingList);
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

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      const diff = endOfMonth.getTime() - now.getTime();
      if (diff <= 0) {
        setCountdown('Periode Berakhir');
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

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

  const handlePublishMission = async () => {
    if (!newTitle || !newDesc || !newLocation) {
      Alert.alert('Error', 'Harap isi semua kolom wajib!');
      return;
    }
    const pts = parseInt(newPoints) || 50;

    if (newMissionType === 'personal') {
      try {
        setIsCreatingMissionLoading(true);
        await dbService.addMission(
          newTitle,
          newDesc,
          newCategory,
          -6.9024,
          107.6186,
          0,
          newLocation,
          'personal',
          newMode
        );
        Alert.alert('Sukses', 'Pengingat misi personal berhasil disimpan!');
        setShowCreateMissionModal(false);
        resetForm();
        loadData();
      } catch (err: any) {
        Alert.alert('Gagal', err.message || 'Gagal menyimpan misi');
      } finally {
        setIsCreatingMissionLoading(false);
      }
    } else {
      if (paymentMethod === 'points') {
        if (profile.aura_points < 100) {
          Alert.alert('Gagal', 'Aura Points kamu kurang dari 100! Kumpulkan poin atau bayar menggunakan QRIS.');
          return;
        }
        try {
          setIsCreatingMissionLoading(true);
          await dbService.addMission(
            newTitle,
            newDesc,
            newCategory,
            -6.9024,
            107.6186,
            pts,
            newLocation,
            'public',
            newMode,
            'points',
            'paid'
          );
          Alert.alert('Sukses', 'Misi publik berhasil dipublikasikan! Terpotong 100 Aura Points.');
          setShowCreateMissionModal(false);
          resetForm();
          loadData();
        } catch (err: any) {
          Alert.alert('Gagal', err.message || 'Gagal menerbitkan misi');
        } finally {
          setIsCreatingMissionLoading(false);
        }
      } else {
        const qrData = `bekind_pay_${newTitle.replace(/\s+/g, '_')}_${Date.now()}`;
        setQrisUrl(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}`);
        setShowQRISPaymentModal(true);
      }
    }
  };

  const handleQRISPaymentSuccess = async () => {
    const pts = parseInt(newPoints) || 50;
    try {
      setIsCreatingMissionLoading(true);
      await dbService.addMission(
        newTitle,
        newDesc,
        newCategory,
        -6.9024,
        107.6186,
        pts,
        newLocation,
        'public',
        newMode,
        'qris',
        'paid'
      );
      Alert.alert('Sukses', 'Simulasi pembayaran QRIS berhasil! Misi publik telah diterbitkan.');
      setShowQRISPaymentModal(false);
      setShowCreateMissionModal(false);
      resetForm();
      loadData();
    } catch (err: any) {
      Alert.alert('Gagal', err.message || 'Gagal menerbitkan misi');
    } finally {
      setIsCreatingMissionLoading(false);
    }
  };

  const resetForm = () => {
    setNewTitle('');
    setNewDesc('');
    setNewLocation('');
    setNewPoints('50');
    setNewCategory('Sosial');
    setNewMode('solo');
    setPaymentMethod('points');
  };

  const handleApproveCompletion = async (completedId: string) => {
    try {
      await dbService.approveCompletedMission(completedId);
      Alert.alert('Sukses', 'Penyelesaian misi berhasil disetujui!');
      loadData();
    } catch (err: any) {
      Alert.alert('Gagal', err.message || 'Gagal menyetujui penyelesaian');
    }
  };

  const handleRejectCompletion = async (completedId: string) => {
    Alert.alert(
      'Tolak Pekerjaan',
      'Apakah kamu yakin ingin menolak penyelesaian misi ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Tolak',
          style: 'destructive',
          onPress: async () => {
            try {
              await dbService.rejectCompletedMission(completedId);
              Alert.alert('Sukses', 'Penyelesaian misi berhasil ditolak & dihapus.');
              loadData();
            } catch (err: any) {
              Alert.alert('Gagal', err.message || 'Gagal menolak penyelesaian');
            }
          }
        }
      ]
    );
  };

  const handleDisputeReport = async () => {
    if (!disputeReason.trim()) {
      Alert.alert('Error', 'Harap isi alasan laporan sengketa!');
      return;
    }
    try {
      await dbService.reportDispute(disputingCompletion.id, disputeReason);
      Alert.alert('Sukses', 'Laporan sengketa berhasil diajukan ke CS. Tim kami akan segera meninjau bukti.');
      setDisputingCompletion(null);
      setDisputeReason('');
      loadData();
    } catch (err: any) {
      Alert.alert('Gagal', err.message || 'Gagal mengajukan sengketa');
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

      {/* Modal Edit Profil */}
      {showEditProfileModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✏️ EDIT PROFIL</Text>
              <TouchableOpacity onPress={() => setShowEditProfileModal(false)}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.disputeIntro}>
                Sesuaikan nama lengkap dan username unik kamu di sini. Alamat email tidak dapat diubah karena terikat akun otentikasi.
              </Text>

              <Text style={styles.formLabel}>Nama Lengkap</Text>
              <TextInput
                style={styles.formInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Nama Lengkap"
                placeholderTextColor="#64748B"
              />

              <Text style={styles.formLabel}>Username</Text>
              <TextInput
                style={styles.formInput}
                value={editUsername}
                onChangeText={setEditUsername}
                placeholder="Username"
                placeholderTextColor="#64748B"
                autoCapitalize="none"
              />

              <Text style={styles.formLabel}>Email (Terkunci)</Text>
              <TextInput
                style={[styles.formInput, { opacity: 0.5, backgroundColor: 'rgba(0,0,0,0.2)' }]}
                value={profile.email}
                editable={false}
                placeholderTextColor="#64748B"
              />

              <TouchableOpacity 
                style={styles.editProfileSubmitBtn} 
                onPress={handleSaveProfile}
              >
                <Text style={styles.editProfileSubmitText}>Simpan Perubahan</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      )}

      {/* Modal Buat Misi Baru */}
      {showCreateMissionModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✨ BUAT MISI BARU</Text>
              <TouchableOpacity onPress={() => setShowCreateMissionModal(false)}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.formLabel}>Tipe Misi</Text>
              <View style={styles.typeSelectorRow}>
                <TouchableOpacity 
                  style={[styles.typeBtn, newMissionType === 'personal' && styles.typeBtnActive]} 
                  onPress={() => setNewMissionType('personal')}
                >
                  <Ionicons name="bookmark-outline" size={16} color={newMissionType === 'personal' ? '#22D3EE' : '#94A3B8'} />
                  <Text style={[styles.typeBtnText, newMissionType === 'personal' && styles.typeBtnTextActive]}>Personal (Gratis)</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.typeBtn, newMissionType === 'public' && styles.typeBtnActive]} 
                  onPress={() => setNewMissionType('public')}
                >
                  <Ionicons name="globe-outline" size={16} color={newMissionType === 'public' ? '#22D3EE' : '#94A3B8'} />
                  <Text style={[styles.typeBtnText, newMissionType === 'public' && styles.typeBtnTextActive]}>Publik (Paid)</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.formLabel}>Judul Misi</Text>
              <TextInput 
                style={styles.formInput} 
                value={newTitle} 
                onChangeText={setNewTitle} 
                placeholder="Contoh: Belajar UTBK Bareng Temen" 
                placeholderTextColor="#64748B" 
              />

              <Text style={styles.formLabel}>Deskripsi Aksi</Text>
              <TextInput 
                style={[styles.formInput, { height: 70, textAlignVertical: 'top' }]} 
                multiline 
                value={newDesc} 
                onChangeText={setNewDesc} 
                placeholder="Jelaskan apa yang harus dilakukan..." 
                placeholderTextColor="#64748B" 
              />

              <Text style={styles.formLabel}>Nama Lokasi</Text>
              <TextInput 
                style={styles.formInput} 
                value={newLocation} 
                onChangeText={setNewLocation} 
                placeholder="Contoh: Perpusda / Rumah Belajar" 
                placeholderTextColor="#64748B" 
              />

              <Text style={styles.formLabel}>Kategori</Text>
              <View style={styles.categorySelector}>
                {['Hewan', 'Sosial', 'Kemanusiaan', 'Lingkungan'].map((cat) => (
                  <TouchableOpacity 
                    key={cat} 
                    style={[styles.categoryBtn, newCategory === cat && styles.categoryBtnActive]} 
                    onPress={() => setNewCategory(cat)}
                  >
                    <Text style={[styles.categoryBtnText, newCategory === cat && styles.categoryBtnTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Mode Kolaborasi</Text>
              <View style={styles.categorySelector}>
                {[
                  { id: 'solo', name: '👤 Solo' },
                  { id: 'group', name: '👥 Group' },
                  { id: 'community', name: '🏢 Komunitas' }
                ].map((m) => (
                  <TouchableOpacity 
                    key={m.id} 
                    style={[styles.categoryBtn, newMode === m.id && styles.categoryBtnActive]} 
                    onPress={() => setNewMode(m.id as any)}
                  >
                    <Text style={[styles.categoryBtnText, newMode === m.id && styles.categoryBtnTextActive]}>{m.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {newMissionType === 'public' ? (
                <>
                  <Text style={styles.formLabel}>Aura Points untuk Pekerja</Text>
                  <TextInput 
                    style={styles.formInput} 
                    keyboardType="numeric" 
                    value={newPoints} 
                    onChangeText={setNewPoints} 
                  />

                  <Text style={styles.formLabel}>Metode Pembayaran Misi</Text>
                  <View style={styles.paymentMethodRow}>
                    <TouchableOpacity 
                      style={[styles.paymentBtn, paymentMethod === 'points' && styles.paymentBtnActive]}
                      onPress={() => setPaymentMethod('points')}
                    >
                      <Ionicons name="sparkles-outline" size={16} color={paymentMethod === 'points' ? '#FACC15' : '#94A3B8'} />
                      <Text style={[styles.paymentBtnText, paymentMethod === 'points' && styles.paymentBtnTextActive]}>
                        100 Aura
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.paymentBtn, paymentMethod === 'qris' && styles.paymentBtnActive]}
                      onPress={() => setPaymentMethod('qris')}
                    >
                      <Ionicons name="qr-code-outline" size={16} color={paymentMethod === 'qris' ? '#22D3EE' : '#94A3B8'} />
                      <Text style={[styles.paymentBtnText, paymentMethod === 'qris' && styles.paymentBtnTextActive]}>
                        QRIS (Rp15.000)
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <Text style={styles.infoText}>
                  * Misi personal bersifat gratis, tidak memberikan poin, dan berfungsi sebagai alarm kebaikan harian Anda (anti-cheat).
                </Text>
              )}

              <TouchableOpacity 
                style={styles.formSaveBtn} 
                onPress={handlePublishMission}
                disabled={isCreatingMissionLoading}
              >
                {isCreatingMissionLoading ? (
                  <ActivityIndicator color="#0F172A" size="small" />
                ) : (
                  <Text style={styles.formSaveText}>
                    {newMissionType === 'personal' ? 'Simpan Pengingat' : 'Terbitkan Misi Publik'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      )}

      {/* Modal QRIS BeKind */}
      {showQRISPaymentModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📱 SCAN QRIS BEKIND</Text>
              <TouchableOpacity onPress={() => setShowQRISPaymentModal(false)}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.qrisContainer}>
              <Text style={styles.qrisPrice}>Total Pembayaran: Rp15.000</Text>
              <Text style={styles.qrisInstruction}>
                Scan QRIS di bawah dengan aplikasi e-wallet Anda:
              </Text>
              
              {qrisUrl ? (
                <Image source={{ uri: qrisUrl }} style={styles.qrisImage} />
              ) : (
                <ActivityIndicator color="#06B6D4" size="large" />
              )}

              <Text style={styles.qrisMerchant}>Merchant: BeKind Social Network</Text>
              
              <TouchableOpacity 
                style={styles.qrisPayBtn} 
                onPress={handleQRISPaymentSuccess}
                disabled={isCreatingMissionLoading}
              >
                {isCreatingMissionLoading ? (
                  <ActivityIndicator color="#0F172A" size="small" />
                ) : (
                  <Text style={styles.qrisPayBtnText}>Simulasikan Sukses Pembayaran</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Modal Panel Verifikasi Pekerjaan */}
      {showEOAdminPanel && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📋 PANEL VERIFIKASI PEKERJAAN</Text>
              <TouchableOpacity onPress={() => setShowEOAdminPanel(false)}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* Tab Selector */}
            <View style={styles.tabHeader}>
              <TouchableOpacity 
                style={[styles.tabBtn, verificationTab === 'public' && styles.tabBtnActive]} 
                onPress={() => setVerificationTab('public')}
              >
                <Text style={[styles.tabBtnText, verificationTab === 'public' && styles.tabBtnTextActive]}>Misi Publik</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tabBtn, verificationTab === 'event' && styles.tabBtnActive]} 
                onPress={() => setVerificationTab('event')}
              >
                <Text style={[styles.tabBtnText, verificationTab === 'event' && styles.tabBtnTextActive]}>Misi Event (EO/Admin)</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {pendingVerifications.filter((item) => {
                if (verificationTab === 'public') {
                  return item.mission?.type === 'public';
                } else {
                  return item.mission?.is_event_mission === true;
                }
              }).length > 0 ? (
                pendingVerifications.filter((item) => {
                  if (verificationTab === 'public') {
                    return item.mission?.type === 'public';
                  } else {
                    return item.mission?.is_event_mission === true;
                  }
                }).map((item) => (
                  <View key={item.id} style={styles.verificationCard}>
                    <View style={styles.verifHeaderRow}>
                      <Text style={styles.verifWorker}>Pekerja: @{item.user_id === 'm_current_user' ? 'Budi_Peka (Anda)' : 'user_bekind'}</Text>
                      <Text style={styles.verifPoints}>+{item.points_gained} Aura</Text>
                    </View>
                    
                    <Text style={styles.verifMissionTitle}>{item.mission?.title}</Text>
                    <Text style={styles.verifLocation}><Ionicons name="pin" size={11} color="#64748B" /> {item.mission?.location_name}</Text>
                    
                    {item.photo_url && (
                      <Image source={{ uri: item.photo_url }} style={styles.verifPhoto} />
                    )}

                    <View style={styles.verifActionRow}>
                      <TouchableOpacity 
                        style={styles.verifApproveBtn}
                        onPress={() => handleApproveCompletion(item.id)}
                      >
                        <Ionicons name="checkmark-circle-outline" size={16} color="#0F172A" />
                        <Text style={styles.verifApproveText}>Setujui</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.verifRejectBtn}
                        onPress={() => handleRejectCompletion(item.id)}
                      >
                        <Ionicons name="close-circle-outline" size={16} color="#EF4444" />
                        <Text style={styles.verifRejectText}>Tolak</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.verifEmptyState}>
                  <Ionicons name="shield-checkmark-outline" size={40} color="#475569" />
                  <Text style={styles.verifEmptyText}>Tidak ada verifikasi pending untuk kategori ini.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Modal CS Dispute Laporan */}
      {disputingCompletion && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🚨 LAPORKAN KECURANGAN / DISPUTE</Text>
              <TouchableOpacity onPress={() => setDisputingCompletion(null)}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.disputeIntro}>
                Gunakan menu ini jika penerbit misi sengaja menolak bukti Anda atau tidak mengkonfirmasinya dalam batas waktu wajar. CS BeKind akan meninjau bukti foto Anda secara manual.
              </Text>
              
              <Text style={styles.disputeDetails}>
                Misi: {disputingCompletion.mission?.title} {'\n'}
                Poin: +{disputingCompletion.points_gained} Aura Points
              </Text>

              <Text style={styles.formLabel}>Alasan Laporan / Kronologi</Text>
              <TextInput
                style={[styles.formInput, { height: 100, textAlignVertical: 'top' }]}
                multiline
                value={disputeReason}
                onChangeText={setDisputeReason}
                placeholder="Tulis alasan kronologis secara singkat. Contoh: Bukti foto sudah valid menampilkan pakan kucing namun penerbit menolak sepihak."
                placeholderTextColor="#64748B"
              />

              <TouchableOpacity 
                style={styles.disputeSubmitBtn} 
                onPress={handleDisputeReport}
              >
                <Text style={styles.disputeSubmitText}>Kirim Laporan Sengketa</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      )}

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

        {/* Action Panel Group */}
        <View style={styles.actionPanelRow}>
          {profile.role !== 'admin' && (
            <TouchableOpacity 
              style={[styles.actionBtnCard, { borderColor: '#06B6D4' }]} 
              onPress={() => setShowCreateMissionModal(true)}
            >
              <Ionicons name="add-circle-outline" size={24} color="#06B6D4" />
              <Text style={styles.actionBtnText}>Buat Misi</Text>
            </TouchableOpacity>
          )}

          {profile.role === 'admin' && (
            <>
              <TouchableOpacity 
                style={[styles.actionBtnCard, { borderColor: '#8B5CF6' }]} 
                onPress={() => setShowAdminPanel(true)}
              >
                <Ionicons name="settings-outline" size={24} color="#8B5CF6" />
                <Text style={styles.actionBtnText}>CRUD Misi</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionBtnCard, { borderColor: '#FACC15' }]} 
                onPress={() => setShowEOAdminPanel(true)}
              >
                <Ionicons name="checkbox-outline" size={24} color="#FACC15" />
                {pendingVerifications.length > 0 && (
                  <View style={styles.badgeCount}>
                    <Text style={styles.badgeText}>{pendingVerifications.length}</Text>
                  </View>
                )}
                <Text style={styles.actionBtnText}>Verifikasi</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity 
            style={[styles.actionBtnCard, { borderColor: '#EC4899' }]} 
            onPress={handleOpenEditProfile}
          >
            <Ionicons name="create-outline" size={24} color="#EC4899" />
            <Text style={styles.actionBtnText}>Edit Profil</Text>
          </TouchableOpacity>
        </View>

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

                  {/* Status Badge & Dispute Button */}
                  <View style={styles.historyStatusRow}>
                    {item.status === 'approved' && (
                      <View style={[styles.statusBadge, { backgroundColor: 'rgba(52, 211, 153, 0.15)', borderColor: '#34D399' }]}>
                        <Text style={[styles.statusBadgeText, { color: '#34D399' }]}>Disetujui</Text>
                      </View>
                    )}
                    {item.status === 'pending' && (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flex: 1, marginTop: 6 }}>
                        <View style={[styles.statusBadge, { backgroundColor: 'rgba(250, 204, 21, 0.15)', borderColor: '#FACC15' }]}>
                          <Text style={[styles.statusBadgeText, { color: '#FACC15' }]}>Pending</Text>
                        </View>
                        <TouchableOpacity 
                          style={styles.disputeReportBtn} 
                          onPress={() => setDisputingCompletion(item)}
                        >
                          <Text style={styles.disputeReportText}>Laporkan CS</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    {item.status === 'disputed' && (
                      <View style={{ flex: 1, marginTop: 6 }}>
                        <View style={[styles.statusBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: '#EF4444' }]}>
                          <Text style={[styles.statusBadgeText, { color: '#EF4444' }]}>Sengketa</Text>
                        </View>
                        {item.report_reason && (
                          <Text style={styles.disputeReasonText} numberOfLines={1}>
                            Ket: {item.report_reason}
                          </Text>
                        )}
                      </View>
                    )}
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

        {/* Keluar Akun */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          <Text style={styles.logoutBtnText}>Keluar Akun</Text>
        </TouchableOpacity>
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
  actionPanelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 25,
  },
  actionBtnCard: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    gap: 6,
    position: 'relative',
  },
  actionBtnText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  badgeCount: {
    position: 'absolute',
    top: 6,
    right: 18,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
  leaderboardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  rewardsInfoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(250, 204, 21, 0.12)',
    borderWidth: 0.5,
    borderColor: 'rgba(250, 204, 21, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  rewardsInfoBtnText: {
    color: '#FACC15',
    fontSize: 10,
    fontWeight: '700',
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 12,
  },
  countdownText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3000,
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#334155',
    width: '100%',
    maxHeight: '85%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  rewardIntro: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 16,
  },
  rewardList: {
    gap: 10,
    marginBottom: 16,
  },
  rewardItem: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  rewardRank: {
    color: '#FACC15',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  rewardGift: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  rewardBadge: {
    color: '#06B6D4',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  rewardDisclaimer: {
    color: '#64748B',
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingVertical: 10,
  },
  typeBtnActive: {
    borderColor: '#22D3EE',
    backgroundColor: 'rgba(34, 211, 238, 0.08)',
  },
  typeBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  typeBtnTextActive: {
    color: '#22D3EE',
  },
  paymentMethodRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  paymentBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingVertical: 10,
  },
  paymentBtnActive: {
    borderColor: '#FACC15',
    backgroundColor: 'rgba(250, 204, 21, 0.08)',
  },
  paymentBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  paymentBtnTextActive: {
    color: '#FACC15',
  },
  infoText: {
    color: '#94A3B8',
    fontSize: 10,
    lineHeight: 14,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  qrisContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  qrisPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FACC15',
    marginBottom: 4,
  },
  qrisInstruction: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 15,
  },
  qrisImage: {
    width: 200,
    height: 200,
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 15,
  },
  qrisMerchant: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 20,
  },
  qrisPayBtn: {
    backgroundColor: '#34D399',
    width: '100%',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrisPayBtnText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
  tabHeader: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 10,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: '#22D3EE',
  },
  tabBtnText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: '#22D3EE',
  },
  verificationCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 12,
  },
  verifHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  verifWorker: {
    color: '#06B6D4',
    fontSize: 11,
    fontWeight: '700',
  },
  verifPoints: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '800',
  },
  verifMissionTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  verifLocation: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 8,
  },
  verifPhoto: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    marginBottom: 10,
  },
  verifActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  verifApproveBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 36,
    backgroundColor: '#34D399',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  verifApproveText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '800',
  },
  verifRejectBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 36,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  verifRejectText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '800',
  },
  verifEmptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  verifEmptyText: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
  },
  disputeIntro: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 12,
  },
  disputeDetails: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 10,
    padding: 10,
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
    marginBottom: 14,
  },
  disputeSubmitBtn: {
    backgroundColor: '#FACC15',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  disputeSubmitText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
  historyStatusRow: {
    marginTop: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderWidth: 0.5,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusBadgeText: {
    fontSize: 8,
    fontWeight: '800',
  },
  disputeReportBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 0.5,
    borderColor: '#EF4444',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  disputeReportText: {
    color: '#EF4444',
    fontSize: 9,
    fontWeight: '800',
  },
  disputeReasonText: {
    color: '#94A3B8',
    fontSize: 9,
    fontStyle: 'italic',
    marginTop: 4,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 16,
    paddingVertical: 14,
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  logoutBtnText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
  },
  editProfileSubmitBtn: {
    backgroundColor: '#EC4899',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  editProfileSubmitText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
