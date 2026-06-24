import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, TextInput, Alert, DevSettings } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { dbService } from '@/services/database';
import { router } from 'expo-router';

interface SharedProfileHeaderProps {
  profile: any;
  onProfileUpdate: (updatedProfile: any) => void;
  // actionButtons allows parent to inject custom action buttons like "Buat Misi", "CRUD Misi"
  actionButtons?: React.ReactNode; 
}

export function SharedProfileHeader({ profile, onProfileUpdate, actionButtons }: SharedProfileHeaderProps) {
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');

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
                onProfileUpdate(updatedProf);
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
              onProfileUpdate(updatedProf);
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
      onProfileUpdate(updated);
      setShowEditProfileModal(false);
      Alert.alert('Mantap', 'Profil berhasil diperbarui.');
    } catch (err: any) {
      Alert.alert('Gagal', err.message || 'Gagal memperbarui profil.');
    }
  };

  return (
    <View style={{ width: '100%' }}>
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
        {actionButtons}

        <TouchableOpacity 
          style={[styles.actionBtnCard, { borderColor: '#EC4899' }]} 
          onPress={handleOpenEditProfile}
        >
          <Ionicons name="create-outline" size={24} color="#EC4899" />
          <Text style={styles.actionBtnText}>Edit Profil</Text>
        </TouchableOpacity>
      </View>

      {/* Modal Edit Profil */}
      <Modal visible={showEditProfileModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✏️ EDIT PROFIL</Text>
              <TouchableOpacity onPress={() => setShowEditProfileModal(false)}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <View style={{ width: '100%' }}>
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
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export function SharedLogoutButton() {
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
              try {
                DevSettings.reload();
              } catch (e) {
                router.replace('/');
              }
            } catch (err) {
              console.error(err);
            }
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
      <Ionicons name="log-out-outline" size={18} color="#EF4444" />
      <Text style={styles.logoutBtnText}>Keluar Akun</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    alignItems: 'center',
    marginTop: 55,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  disputeIntro: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 20,
    lineHeight: 20,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#F8FAFC',
    fontSize: 14,
    marginBottom: 16,
  },
  editProfileSubmitBtn: {
    backgroundColor: '#EC4899',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  editProfileSubmitText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 16,
    paddingVertical: 15,
    marginTop: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutBtnText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '800',
  },
});
