import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { fetchApi } from '../../src/api/client';
import HabitCard from '../../src/components/HabitCard';
import Skeleton from '../../src/components/Skeleton';
import { Feather } from '@expo/vector-icons';

export default function HabitsScreen() {
  const [habits, setHabits] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHabits = async ({ cursor = null, append = false } = {}) => {
    try {
      const endpoint = cursor
        ? `/habits?limit=20&cursor=${encodeURIComponent(cursor)}`
        : '/habits?limit=20';
      const data = await fetchApi(endpoint);
      const items = Array.isArray(data?.items) ? data.items : [];

      setHabits((current) => append ? [...current, ...items] : items);
      setNextCursor(data?.pageInfo?.nextCursor || null);
      setHasNextPage(Boolean(data?.pageInfo?.hasNextPage));
    } catch(e) {
      console.log(e);
    }
    setLoading(false);
    setRefreshing(false);
    setLoadingMore(false);
  };

  useFocusEffect(useCallback(() => { loadHabits(); }, []));

  const onRefresh = () => { setRefreshing(true); loadHabits(); };
  const loadMore = () => {
    if (!hasNextPage || !nextCursor || loadingMore) return;

    setLoadingMore(true);
    loadHabits({ cursor: nextCursor, append: true });
  };

  const filteredHabits = habits.filter(h => (h.name || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>All Habits</Text>
        <View style={styles.searchContainer}>
          <Feather name="search" size={18} color="#94a3b8" />
          <TextInput 
            style={styles.searchBar} 
            placeholder="Search habits..." 
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.list}>
           <Skeleton width="100%" height={140} borderRadius={24} style={{marginBottom: 16}}/>
           <Skeleton width="100%" height={140} borderRadius={24} style={{marginBottom: 16}}/>
           <Skeleton width="100%" height={140} borderRadius={24} />
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
        >
          {filteredHabits.map((habit, i) => {
             const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981'];
             const habitName = habit.name || '';
             const hasEmoji = habitName.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/u);
             const icon = habit.icon || (hasEmoji ? hasEmoji[0] : '📌');
             const title = hasEmoji ? habitName.substring(hasEmoji[0].length).trim() : habitName;
             
             return (
               <HabitCard 
                 key={habit._id} 
                 habit={habit} 
                 icon={icon} 
                 title={title} 
                 color={colors[i % colors.length]} 
                 onUpdate={loadHabits} 
               />
             );
          })}
          {filteredHabits.length === 0 && (
            <View style={styles.emptyState}>
              <Feather name="inbox" size={40} color="#cbd5e1" style={{marginBottom: 12}} />
              <Text style={styles.emptyText}>No habits found.</Text>
            </View>
          )}
          {hasNextPage && (
            <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMore} disabled={loadingMore}>
              <Text style={styles.loadMoreText}>{loadingMore ? 'Loading...' : 'Load more'}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, paddingTop: 10 },
  title: { fontSize: 30, fontWeight: '800', color: '#0f172a', marginBottom: 16 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#94a3b8', shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
  searchBar: { flex: 1, paddingVertical: 14, paddingHorizontal: 10, fontSize: 16, color: '#0f172a' },
  list: { paddingHorizontal: 20, paddingBottom: 110, gap: 14 },
  loadMoreBtn: { height: 46, borderRadius: 16, backgroundColor: '#e0f2fe', justifyContent: 'center', alignItems: 'center' },
  loadMoreText: { color: '#0369a1', fontSize: 14, fontWeight: '800' },
  emptyState: { alignItems: 'center', padding: 40, marginTop: 20 },
  emptyText: { color: '#64748b', fontSize: 16, fontWeight: '600' }
});
