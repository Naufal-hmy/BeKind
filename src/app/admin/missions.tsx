import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { dbService } from '@/services/database';
import { Ionicons } from '@expo/vector-icons';

export default function AdminMissions() {
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [auraPoints, setAuraPoints] = useState('');
  const [locationName, setLocationName] = useState('');

  useEffect(() => {
    fetchMissions();
  }, []);

  const fetchMissions = async () => {
    try {
      const data = await dbService.getMissions();
      setMissions(data);
    } catch (error) {
      console.error('Error fetching missions', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete Mission', 'Are you sure you want to delete this mission?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await dbService.deleteMission(id);
          fetchMissions();
        } catch (error) {
          console.error(error);
          Alert.alert('Error', 'Failed to delete mission');
        }
      }}
    ]);
  };

  const handleEdit = (mission: any) => {
    setEditingId(mission.id);
    setTitle(mission.title);
    setDescription(mission.description);
    setCategory(mission.category);
    setLatitude(String(mission.latitude));
    setLongitude(String(mission.longitude));
    setAuraPoints(String(mission.aura_points));
    setLocationName(mission.location_name);
    setModalVisible(true);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setCategory('');
    setLatitude('');
    setLongitude('');
    setAuraPoints('');
    setLocationName('');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!title || !description || !category || !latitude || !longitude || !auraPoints || !locationName) {
      Alert.alert('Validation', 'Please fill all fields');
      return;
    }

    try {
      if (editingId) {
        await dbService.updateMission(
          editingId,
          title,
          description,
          category,
          parseFloat(latitude),
          parseFloat(longitude),
          parseInt(auraPoints),
          locationName
        );
      } else {
        await dbService.addMission(
          title,
          description,
          category,
          parseFloat(latitude),
          parseFloat(longitude),
          parseInt(auraPoints),
          locationName,
          'system',
          'solo'
        );
      }
      setModalVisible(false);
      fetchMissions();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to save mission');
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.missionCard}>
      <View style={styles.missionInfo}>
        <Text style={styles.missionTitle}>{item.title}</Text>
        <Text style={styles.missionCategory}>{item.category} • {item.location_name}</Text>
        <Text style={styles.missionPoints}>+{item.aura_points} Aura Points</Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.iconButton} onPress={() => handleEdit(item)}>
          <Ionicons name="pencil" size={20} color="#06B6D4" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => handleDelete(item.id)}>
          <Ionicons name="trash" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Mission</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={missions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
      />

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingId ? 'Edit Mission' : 'New Mission'}</Text>
            
            <TextInput style={styles.input} placeholder="Title" placeholderTextColor="#64748B" value={title} onChangeText={setTitle} />
            <TextInput style={styles.input} placeholder="Description" placeholderTextColor="#64748B" value={description} onChangeText={setDescription} multiline />
            <TextInput style={styles.input} placeholder="Category" placeholderTextColor="#64748B" value={category} onChangeText={setCategory} />
            <TextInput style={styles.input} placeholder="Location Name" placeholderTextColor="#64748B" value={locationName} onChangeText={setLocationName} />
            <View style={styles.row}>
              <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} placeholder="Latitude" placeholderTextColor="#64748B" value={latitude} onChangeText={setLatitude} keyboardType="numeric" />
              <TextInput style={[styles.input, { flex: 1, marginLeft: 8 }]} placeholder="Longitude" placeholderTextColor="#64748B" value={longitude} onChangeText={setLongitude} keyboardType="numeric" />
            </View>
            <TextInput style={styles.input} placeholder="Aura Points" placeholderTextColor="#64748B" value={auraPoints} onChangeText={setAuraPoints} keyboardType="numeric" />

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
    gap: 12,
  },
  missionCard: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  missionInfo: {
    flex: 1,
    marginRight: 12,
  },
  missionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  missionCategory: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  missionPoints: {
    fontSize: 14,
    color: '#06B6D4',
    marginTop: 6,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 8,
    backgroundColor: '#0F172A',
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    color: '#94A3B8',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#8B5CF6',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
