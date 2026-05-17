import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HabitCard from '../../src/components/HabitCard';
import Skeleton from '../../src/components/Skeleton';
import { useRouter } from 'expo-router';
import { fetchApi } from '../../src/api/client';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import UrgentBanner from '../../src/components/UrgentBanner';
import { useTheme } from '../../src/context/ThemeContext';

export default function Dashboard() {
  const router = useRouter();
  const { theme } = useTheme();
  const [snoozedHabitIds, setSnoozedHabitIds] = useState([]);
  const [habits, setHabits] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [stats, setStats] = useState({ totalHabits: 0, completedToday: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async ({ cursor = null, append = false } = {}) => {
    try {
      const habitsEndpoint = cursor
        ? `/habits?limit=10&cursor=${encodeURIComponent(cursor)}`
        : '/habits?limit=10';
      const habitsRequest = fetchApi(habitsEndpoint);
      const statsRequest = append ? Promise.resolve(null) : fetchApi('/habits/stats');
      const [habitsData, statsData] = await Promise.all([habitsRequest, statsRequest]);
      const items = Array.isArray(habitsData?.items) ? habitsData.items : [];

      setHabits((current) => append ? [...current, ...items] : items);
      setNextCursor(habitsData?.pageInfo?.nextCursor || null);
      setHasNextPage(Boolean(habitsData?.pageInfo?.hasNextPage));
      if (statsData && typeof statsData === 'object') {
        setStats(statsData);
      } else if (!append) {
        setStats({ totalHabits: 0, completedToday: 0 });
      }
    } catch (e) {
      console.log('Failed to fetch dashboard data', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));
  const onRefresh = () => { setRefreshing(true); loadData(); };
  const loadMore = () => {
    if (!hasNextPage || !nextCursor || loadingMore) return;

    setLoadingMore(true);
    loadData({ cursor: nextCursor, append: true });
  };
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Calculate uncompleted habits for the urgent banner notification
  const todayDate = new Date();
  const pendingHabits = habits.filter(h => {
    // If it's explicitly snoozed by the user today, don't show it in the urgent banner
    if (snoozedHabitIds.includes(h._id)) return false;

    const completedDates = Array.isArray(h.completedDates) ? h.completedDates : [];
    return !completedDates.some(d => {
      const d1 = new Date(d);
      return d1.getUTCFullYear() === todayDate.getUTCFullYear() &&
             d1.getUTCMonth() === todayDate.getUTCMonth() &&
             d1.getUTCDate() === todayDate.getUTCDate();
    });
  });

  // Skeleton UI for slow internet
  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { backgroundColor: '#f1f5f9', paddingBottom: 25 }]}>
          <SafeAreaView>
            <View style={styles.headerTop}>
              <View>
                <Skeleton width={120} height={14} style={{ marginBottom: 6 }} />
                <Skeleton width={200} height={32} />
              </View>
              <Skeleton width={44} height={44} borderRadius={22} />
            </View>
            <Skeleton width="100%" height={90} borderRadius={20} />
          </SafeAreaView>
        </View>
        <View style={styles.body}>
          <Skeleton width={160} height={24} style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height={150} borderRadius={24} style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height={150} borderRadius={24} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
        bounces={true}
      >
        {/* Compact Premium Gradient Header */}
        <LinearGradient colors={['#1e3a8a', '#3b82f6']} style={styles.header}>
          <SafeAreaView>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.dateText}>{today}</Text>
                <Text style={styles.greetingText}>Good Morning!</Text>
              </View>
              <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/(tabs)/profile')}>
                <Feather name="user" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.statsCard}>
              <View style={styles.statColumn}>
                <Text style={styles.statValue}>{stats.totalHabits || 0}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statColumn}>
                <Text style={styles.statValue}>{stats.completedToday || 0}</Text>
                <Text style={styles.statLabel}>Done</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statColumn}>
                <Text style={styles.statValue}>{stats.totalHabits ? Math.round(((stats.completedToday||0) / stats.totalHabits) * 100) : 0}%</Text>
                <Text style={styles.statLabel}>Success</Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* Dynamic Urgent Notification Layer */}
        <UrgentBanner 
          pendingHabits={pendingHabits} 
          onSnoozeHabit={(id) => setSnoozedHabitIds([...snoozedHabitIds, id])} 
        />

        <View style={styles.body}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Routines</Text>
          
          <View style={styles.habitList}>
            {habits.map((habit, index) => {
              const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];
              const habitName = habit.name || '';
              const hasEmoji = habitName.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/u);
              const icon = habit.icon || (hasEmoji ? hasEmoji[0] : '🎯');
              const title = hasEmoji ? habitName.substring(hasEmoji[0].length).trim() : habitName;
              
              return (
                <HabitCard 
                  key={habit._id} 
                  habit={habit}
                  icon={icon} 
                  title={title} 
                  color={colors[index % colors.length]}
                  onUpdate={loadData}
                />
              )
            })}
            {habits.length === 0 && (
              <View style={[styles.emptyState, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Feather name="target" size={40} color="#cbd5e1" />
                <Text style={styles.emptyText}>No habits yet.</Text>
                <Text style={styles.emptySubText}>Tap the + button to create one!</Text>
              </View>
            )}
            {hasNextPage && (
              <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMore} disabled={loadingMore}>
                <Text style={styles.loadMoreText}>{loadingMore ? 'Loading...' : 'Load more'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.9} onPress={() => router.push('/habit/new')}>
        <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.fabGradient}>
          <Feather name="plus" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { paddingBottom: 110 },
  
  // Compact Header
  header: { paddingHorizontal: 20, paddingBottom: 25, paddingTop: 10, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 5 },
  dateText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  greetingText: { color: '#ffffff', fontSize: 26, fontWeight: '800' },
  profileBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  
  statsCard: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  statColumn: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 2 },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  divider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' },

  // Compact Body
  body: { paddingHorizontal: 20, paddingTop: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 16 },
  habitList: { gap: 14 },
  loadMoreBtn: { height: 46, borderRadius: 16, backgroundColor: '#e0f2fe', justifyContent: 'center', alignItems: 'center' },
  loadMoreText: { color: '#0369a1', fontSize: 14, fontWeight: '800' },
  
  emptyState: { alignItems: 'center', marginTop: 30, padding: 30, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed' },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#64748b', marginTop: 12 },
  emptySubText: { fontSize: 13, color: '#94a3b8', marginTop: 6 },

  fab: { position: 'absolute', bottom: 95, right: 20, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  fabGradient: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' }
});
