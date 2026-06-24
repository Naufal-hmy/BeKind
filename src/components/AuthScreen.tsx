import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isDemoMode } from '@/services/database';

export function AuthScreen({ onLoginSuccess }: { onLoginSuccess?: (sess: any) => void }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAuth = async () => {
    if (!email || !password) {
      setErrorMsg('Email dan password wajib diisi');
      return;
    }
    if (isSignUp && (!name || !username)) {
      setErrorMsg('Nama dan username wajib diisi untuk daftar');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const checkEmail = email.toLowerCase().trim();
    const isSystemAdmin = (checkEmail === 'admin' || checkEmail === 'admin@gmail.com') && password === 'admin';

    try {
      if (isDemoMode) {
        // --- DEMO / OFFLINE AUTH MODE ---
        if (isSignUp) {
          // Sign Up
          const usersStr = await AsyncStorage.getItem('@registered_users');
          const users = usersStr ? JSON.parse(usersStr) : [];
          
          if (users.some((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
            throw new Error('Email sudah terdaftar rill');
          }
          if (checkEmail === 'admin') {
            throw new Error('Username admin diproteksi sistem');
          }

          const newUser = { email, password, name, username, role: 'user' };
          users.push(newUser);
          await AsyncStorage.setItem('@registered_users', JSON.stringify(users));

          // Inisialisasi Profile baru di local storage
          const profileKey = `@profile_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
          const userProfile = {
            name,
            username,
            role: 'user',
            email,
            aura_points: 150,
            level: 'Peka-Beginner',
            avatar_url: `https://api.dicebear.com/7.x/pixel-art/png?seed=${username}`,
          };
          await AsyncStorage.setItem(profileKey, JSON.stringify(userProfile));

          await AsyncStorage.setItem('@demo_session', email);
          if (onLoginSuccess) {
            onLoginSuccess({ user: { email } });
          }
        } else {
          // Sign In
          if (isSystemAdmin) {
            // Admin default login
            await AsyncStorage.setItem('@demo_session', 'admin');
            
            // Buat profil admin jika belum ada
            const adminProfile = {
              name: 'Admin BeKind',
              username: 'admin',
              role: 'admin',
              email: 'admin@gmail.com',
              aura_points: 999,
              level: 'Kaisar Empati',
              avatar_url: 'https://api.dicebear.com/7.x/pixel-art/png?seed=admin',
            };
            await AsyncStorage.setItem('@profile_admin', JSON.stringify(adminProfile));

            if (onLoginSuccess) {
              onLoginSuccess({ user: { email: 'admin' } });
            }
          } else {
            // User login
            const usersStr = await AsyncStorage.getItem('@registered_users');
            const users = usersStr ? JSON.parse(usersStr) : [];
            const user = users.find(
              (u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
            );

            if (user) {
              await AsyncStorage.setItem('@demo_session', email);
              if (onLoginSuccess) {
                onLoginSuccess({ user: { email } });
              }
            } else {
              throw new Error('Email/password salah atau coba login as admin (admin/admin)');
            }
          }
        }
      } else {
        // --- ONLINE SUPABASE MODE ---
        const targetEmail = isSystemAdmin ? 'admin@gmail.com' : email;
        const targetPassword = isSystemAdmin ? 'admin' : password;

        if (isSignUp) {
          const { data, error } = await supabase!.auth.signUp({
            email: targetEmail,
            password: targetPassword,
            options: {
              data: {
                name: name,
                username: username,
              },
            },
          });
          if (error) throw error;
          
          if (data.session === null) {
            setSuccessMsg('Pendaftaran berhasil! Silakan cek email kamu untuk konfirmasi akun.');
          } else {
            setSuccessMsg('Pendaftaran berhasil! Kamu otomatis masuk.');
            if (onLoginSuccess) onLoginSuccess(data.session);
          }
        } else {
          // Sign In
          let sessionData: any = null;
          try {
            const { data, error } = await supabase!.auth.signInWithPassword({
              email: targetEmail,
              password: targetPassword,
            });
            
            if (error) {
              // Jika login admin gagal karena belum terdaftar, daftarkan otomatis
              if (isSystemAdmin && (
                error.message.includes('Invalid login credentials') || 
                error.message.includes('User not found') ||
                error.status === 400
              )) {
                const signUpRes = await supabase!.auth.signUp({
                  email: 'admin@gmail.com',
                  password: 'admin',
                  options: {
                    data: {
                      name: 'Admin BeKind',
                      username: 'admin',
                    },
                  },
                });
                if (signUpRes.error) throw signUpRes.error;
                
                if (signUpRes.data.session) {
                  sessionData = signUpRes.data.session;
                } else {
                  throw new Error('Admin baru berhasil didaftarkan di Supabase. Silakan coba masuk sekali lagi!');
                }
              } else {
                throw error;
              }
            } else {
              sessionData = data.session;
            }
          } catch (signInErr: any) {
            throw signInErr;
          }

          if (sessionData) {
            // Set role admin di Supabase profiles table jika admin
            if (isSystemAdmin) {
              try {
                await supabase!
                  .from('profiles')
                  .update({ role: 'admin', aura_points: 999, level: 'Kaisar Empati' })
                  .eq('id', sessionData.user.id);
              } catch (updateErr) {
                console.error('Gagal mengupdate role admin:', updateErr);
              }
            }
            if (onLoginSuccess) onLoginSuccess(sessionData);
          }
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.glowCyan} />
      <View style={styles.glowViolet} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="sparkles" size={40} color="#06B6D4" />
            </View>
            <Text style={styles.title}>BeKind</Text>
            <Text style={styles.subtitle}>Asisten Kebaikan Otonom Digital Anda</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{isSignUp ? 'Daftar Akun Baru' : 'Masuk ke Akun Anda'}</Text>

            {errorMsg ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {successMsg ? (
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#10B981" />
                <Text style={styles.successText}>{successMsg}</Text>
              </View>
            ) : null}

            {isSignUp && (
              <>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nama Lengkap"
                    placeholderTextColor="#64748B"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="at-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Username"
                    placeholderTextColor="#64748B"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                  />
                </View>
              </>
            )}

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#64748B"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#64748B"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleAuth} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#0F172A" />
              ) : (
                <Text style={styles.submitBtnText}>{isSignUp ? 'Daftar' : 'Masuk'}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchBtn}
              onPress={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg('');
              }}
              disabled={loading}
            >
              <Text style={styles.switchText}>
                {isSignUp ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar'}
              </Text>
            </TouchableOpacity>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  glowCyan: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#06B6D4',
    opacity: 0.15,
  },
  glowViolet: {
    position: 'absolute',
    bottom: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#8B5CF6',
    opacity: 0.15,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    marginBottom: 16,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    marginBottom: 16,
  },
  successText: {
    color: '#A7F3D0',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 15,
  },
  submitBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#06B6D4',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
  switchBtn: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchText: {
    color: '#94A3B8',
    fontSize: 14,
  },
});
