import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { dbService } from '@/services/database';

export default function LeaderboardScreen() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [countdown, setCountdown] = useState('');

  const loadData = async () => {
    try {
      const leadData = await dbService.getLeaderboard();
      setLeaderboard(leadData);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" translucent={false} />
      <View style={styles.glowViolet} />
      
      {showRewardsModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🏆 HADIAH BULANAN TOP 10</Text>
              <TouchableOpacity onPress={() => setShowRewardsModal(false)}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.rewardIntro}>
                Jadilah agen kebaikan paling aktif bulan ini dan dapatkan saldo e-wallet!
              </Text>
              <View style={styles.rewardList}>
                <View style={styles.rewardItem}>
                  <Text style={styles.rewardRank}>🥇 Juara 1</Text>
                  <Text style={styles.rewardGift}>ShopeePay / Gopay Rp500.000</Text>
                  <Text style={styles.rewardBadge}>+ Golden Profile Border</Text>
                </View>
                <View style={styles.rewardItem}>
                  <Text style={styles.rewardRank}>🥈 Juara 2</Text>
                  <Text style={styles.rewardGift}>ShopeePay / Gopay Rp300.000</Text>
                  <Text style={styles.rewardBadge}>+ Silver Profile Border</Text>
                </View>
                <View style={styles.rewardItem}>
                  <Text style={styles.rewardRank}>🥉 Juara 3</Text>
                  <Text style={styles.rewardGift}>ShopeePay / Gopay Rp200.000</Text>
                  <Text style={styles.rewardBadge}>+ Bronze Profile Border</Text>
                </View>
                <View style={styles.rewardItem}>
                  <Text style={styles.rewardRank}>⭐ Peringkat 4 - 10</Text>
                  <Text style={styles.rewardGift}>ShopeePay / Gopay Rp50.000</Text>
                  <Text style={styles.rewardBadge}>Apresiasi Kontributor</Text>
                </View>
              </View>
              <Text style={styles.rewardDisclaimer}>
                Pemenang diumumkan setiap tanggal 1 awal bulan berdasarkan perolehan Aura Points. Poin bulanan akan di-reset setelah periode selesai.
              </Text>
            </ScrollView>
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.leaderboardHeaderRow}>
          <Text style={styles.sectionTitle}>Peka-Leaderboard (Top 10 Bulanan)</Text>
          <TouchableOpacity 
            style={styles.rewardsInfoBtn}
            onPress={() => setShowRewardsModal(true)}
          >
            <Ionicons name="gift-outline" size={14} color="#FACC15" />
            <Text style={styles.rewardsInfoBtnText}>Hadiah</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.countdownContainer}>
          <Ionicons name="time-outline" size={14} color="#94A3B8" />
          <Text style={styles.countdownText}>Berakhir dalam: {countdown}</Text>
        </View>

        <View style={styles.leaderboardCard}>
          {leaderboard.map((item, index) => {
            const isUser = item.name.includes('You') || item.name.includes('Lu');
            return (
              <View 
                key={index} 
                style={[
                  styles.leaderboardItem,
                  isUser && styles.leaderboardItemUser,
                  index === leaderboard.length - 1 && { borderBottomWidth: 0 }
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 55,
  },
  glowViolet: {
    position: 'absolute',
    top: 200,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    filter: 'blur(70px)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.5,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  rewardsInfoBtnText: {
    color: '#FACC15',
    fontSize: 12,
    fontWeight: '700',
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 20,
  },
  countdownText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  leaderboardCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  leaderboardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
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
    fontSize: 15,
    fontWeight: '800',
    color: '#64748B',
    width: 24,
  },
  leadName: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '600',
  },
  leadRight: {
    alignItems: 'flex-end',
  },
  leadPoints: {
    color: '#06B6D4',
    fontSize: 14,
    fontWeight: '700',
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
});
