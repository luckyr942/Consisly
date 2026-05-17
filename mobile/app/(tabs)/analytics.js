import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { fetchApi } from '../../src/api/client';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Skeleton from '../../src/components/Skeleton';

export default function AnalyticsScreen() {
  const [stats, setStats] = useState({ totalHabits: 0, completedToday: 0 });
  const [analytics, setAnalytics] = useState({ days: [], summary: { averageCompletionRate: 0 } });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [statsData, analyticsData] = await Promise.all([
        fetchApi('/habits/stats'),
        fetchApi('/habits/analytics?days=7')
      ]);
      setStats(statsData && typeof statsData === 'object' ? statsData : { totalHabits: 0, completedToday: 0 });
      setAnalytics(analyticsData && Array.isArray(analyticsData.days)
        ? analyticsData
        : { days: [], summary: { averageCompletionRate: 0 } });
    } catch (_e) {}
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const weeklyData = analytics.days.length > 0
    ? analytics.days
    : Array.from({ length: 7 }).map(() => ({ label: '-', completionRate: 0 }));

  if(loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Skeleton width={150} height={36} style={{marginBottom: 8}} />
          <Skeleton width={180} height={18} style={{marginBottom: 24}} />
          <Skeleton width="100%" height={260} borderRadius={24} style={{marginBottom: 20}} />
          <Skeleton width="100%" height={220} borderRadius={24} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Analytics</Text>
          <Text style={styles.subtitle}>Track your performance</Text>
        </View>
        
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBg, {backgroundColor: '#dbeafe'}]}><Feather name="activity" size={18} color="#3b82f6" /></View>
            <Text style={styles.cardTitle}>Today&apos;s Progress</Text>
          </View>
          
          <View style={styles.progressWrapper}>
            <View style={styles.progressContainer}>
              <View style={styles.progressCircle}>
                 <Text style={styles.progressText}>{stats.completedToday}/{stats.totalHabits || 0}</Text>
                 <Text style={styles.progressSub}>Habits Done</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBg, {backgroundColor: '#f3e8ff'}]}><Feather name="bar-chart-2" size={18} color="#8b5cf6" /></View>
            <Text style={styles.cardTitle}>Weekly Consistency</Text>
          </View>
          
          <View style={styles.chart}>
            {weeklyData.map((day, i) => (
              <View key={i} style={styles.barContainer}>
                <View style={styles.barBackground}>
                  <LinearGradient 
                    colors={day.completionRate === 100 ? ['#34d399', '#10b981'] : ['#60a5fa', '#3b82f6']} 
                    style={[styles.bar, { height: `${Math.max(day.completionRate, 4)}%` }]} 
                  />
                </View>
                <Text style={styles.dayText}>{day.label.slice(0, 1)}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingBottom: 110 }, // compact
  header: { marginBottom: 24, marginTop: 5 },
  title: { fontSize: 30, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 15, color: '#64748b', marginTop: 4, fontWeight: '600' },
  
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 20, shadowColor: '#94a3b8', shadowOpacity: 0.1, shadowRadius: 15, elevation: 3, borderWidth: 1, borderColor: '#f1f5f9' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
  iconBg: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  
  progressWrapper: { alignItems: 'center', paddingBottom: 6 },
  progressContainer: { width: 180, height: 180, borderRadius: 90, borderWidth: 14, borderColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', borderTopColor: '#3b82f6', borderRightColor: '#3b82f6', transform: [{ rotate: '45deg' }] },
  progressCircle: { transform: [{ rotate: '-45deg' }], alignItems: 'center' },
  progressText: { fontSize: 40, fontWeight: '800', color: '#0f172a' },
  progressSub: { fontSize: 13, color: '#64748b', marginTop: 4, fontWeight: '700' },
  
  chart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 160, paddingTop: 10 },
  barContainer: { alignItems: 'center', flex: 1 },
  barBackground: { width: 14, height: 110, backgroundColor: '#f1f5f9', borderRadius: 7, justifyContent: 'flex-end', marginBottom: 10 },
  bar: { width: '100%', borderRadius: 7 },
  dayText: { fontSize: 12, color: '#94a3b8', fontWeight: '700' }
});
