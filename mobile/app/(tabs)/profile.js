import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { fetchApi } from '../../src/api/client';
import { useAuth } from '../../src/context/AuthContext';
import Skeleton from '../../src/components/Skeleton';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [profileData, badgeData] = await Promise.all([
        fetchApi('/users/profile'),
        fetchApi('/badges').catch(() => [])
      ]);
      setProfile(profileData);
      setBadges(badgeData);
    } catch(e) {
      console.log(e);
    } finally { 
      setLoading(false); 
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  // Skeleton UI
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={[styles.headerBackground, {backgroundColor: '#f1f5f9'}]} />
        <SafeAreaView style={{flex: 1}}>
          <View style={styles.profileHeader}>
             <Skeleton width={90} height={90} borderRadius={45} style={{marginBottom: 16}} />
             <Skeleton width={150} height={20} style={{marginBottom: 16}} />
             <Skeleton width={200} height={40} borderRadius={20} />
          </View>
          <View style={styles.body}>
            <Skeleton width={140} height={24} style={{marginBottom: 20}} />
            <View style={{flexDirection: 'row', gap: 16}}>
               <Skeleton width="47%" height={120} borderRadius={20} />
               <Skeleton width="47%" height={120} borderRadius={20} />
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1e3a8a', '#3b82f6']} style={styles.headerBackground} />
      
      <SafeAreaView style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <LinearGradient colors={['#60a5fa', '#2563eb']} style={styles.avatar}>
                <Text style={styles.avatarText}>{profile?.email ? profile.email.charAt(0).toUpperCase() : 'U'}</Text>
              </LinearGradient>
            </View>
            <Text style={styles.email}>{profile?.email}</Text>
            
            <View style={styles.scorePill}>
              <Feather name="zap" size={16} color="#f59e0b" />
              <Text style={styles.scoreText}>Consistency: {Math.round(profile?.consistencyScore || 0)}</Text>
            </View>
          </View>

          <View style={styles.body}>
            <View style={styles.sectionHeader}>
              <Feather name="award" size={20} color="#0f172a" />
              <Text style={styles.sectionTitle}>Achievements</Text>
            </View>

            <View style={styles.badgeGrid}>
              {badges.length === 0 ? (
                <View style={styles.emptyState}>
                  <Feather name="star" size={30} color="#cbd5e1" style={{marginBottom: 10}} />
                  <Text style={styles.emptyText}>Keep tracking to earn badges!</Text>
                </View>
              ) : (
                badges.map((badge, i) => (
                  <View key={badge._id || i} style={styles.badgeCard}>
                    <LinearGradient colors={['#fef3c7', '#fde68a']} style={styles.badgeIconBg}>
                      <Text style={styles.badgeIcon}>🏆</Text>
                    </LinearGradient>
                    <Text style={styles.badgeTitle}>{badge.title}</Text>
                    <Text style={styles.badgeDesc}>{badge.description}</Text>
                  </View>
                ))
              )}
            </View>

            <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push('/settings')}>
              <Feather name="settings" size={20} color="#475569" />
              <Text style={styles.settingsText}>Settings</Text>
              <Feather name="chevron-right" size={20} color="#cbd5e1" style={{marginLeft: 'auto'}}/>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
              <Feather name="log-out" size={20} color="#ef4444" />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  // Reduced Header height
  headerBackground: { position: 'absolute', top: 0, left: 0, right: 0, height: 210, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  content: { paddingBottom: 110 },
  
  profileHeader: { alignItems: 'center', paddingTop: 10, paddingBottom: 25 },
  avatarContainer: { padding: 3, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 50, marginBottom: 12 },
  avatar: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
  avatarText: { fontSize: 36, color: '#fff', fontWeight: '800' },
  email: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 12 },
  scorePill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 25, shadowColor: '#000', shadowOffset: {width:0, height:4}, shadowOpacity: 0.1, shadowRadius: 10, elevation: 3 },
  scoreText: { color: '#0f172a', fontWeight: '800', fontSize: 14 },
  
  body: { paddingHorizontal: 20, paddingTop: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  badgeCard: { width: '48%', backgroundColor: '#fff', padding: 16, borderRadius: 20, alignItems: 'center', shadowColor: '#94a3b8', shadowOpacity: 0.1, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: '#f1f5f9' },
  badgeIconBg: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  badgeIcon: { fontSize: 26 },
  badgeTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: 6 },
  badgeDesc: { fontSize: 11, color: '#64748b', textAlign: 'center', lineHeight: 16, fontWeight: '500' },
  
  emptyState: { width: '100%', alignItems: 'center', paddingVertical: 40, backgroundColor: '#fff', borderRadius: 20, borderWidth: 2, borderColor: '#f1f5f9', borderStyle: 'dashed' },
  emptyText: { color: '#94a3b8', fontWeight: '700', fontSize: 14 },

  settingsBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', padding: 18, borderRadius: 20, marginBottom: 12, shadowColor: '#94a3b8', shadowOpacity: 0.05, shadowRadius: 10, borderWidth: 1, borderColor: '#f1f5f9' },
  settingsText: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fef2f2', padding: 18, borderRadius: 20, marginBottom: 40, borderWidth: 1, borderColor: '#fee2e2' },
  logoutText: { color: '#ef4444', fontWeight: '800', fontSize: 15 }
});
