import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { fetchApi } from '../api/client';
import { Feather } from '@expo/vector-icons';

export default function HabitCard({ habit, icon, title, color, onUpdate }) {
  const [saving, setSaving] = useState(false);
  const accentColor = color || '#3b82f6';
  
  const initialCompletedDates = useMemo(() => (
    Array.isArray(habit?.completedDates) ? habit.completedDates : []
  ), [habit?.completedDates]);

  const [localCompletedDates, setLocalCompletedDates] = useState(initialCompletedDates);

  React.useEffect(() => {
    setLocalCompletedDates(initialCompletedDates);
  }, [initialCompletedDates]);

  const isSameUtcDay = (d1, d2) => {
    return d1.getUTCFullYear() === d2.getUTCFullYear() &&
           d1.getUTCMonth() === d2.getUTCMonth() &&
           d1.getUTCDate() === d2.getUTCDate();
  };
  
  const today = new Date();
  const completedToday = localCompletedDates.some(d => isSameUtcDay(new Date(d), today));

  const last7Days = Array.from({length: 7}).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const isCompleted = localCompletedDates.some(cd => isSameUtcDay(new Date(cd), d));
    const dayStr = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][d.getDay()];
    return { dayStr, isCompleted };
  });

  const cells = Array.from({ length: 35 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (34 - i));
    return localCompletedDates.some(cd => isSameUtcDay(new Date(cd), d));
  });

  const handleCheckIn = async () => {
    if (!habit?._id) return;
    
    const wasCompleted = completedToday;
    
    // Optimistic UI Update: Instantly change the UI
    if (wasCompleted) {
      setLocalCompletedDates(prev => prev.filter(d => !isSameUtcDay(new Date(d), today)));
    } else {
      setLocalCompletedDates(prev => [...prev, today.toISOString()]);
    }

    try {
      await fetchApi(`/habits/${habit._id}/checkin`, {
        method: wasCompleted ? 'DELETE' : 'POST'
      });
      // Silent update for dashboard stats
      if(onUpdate) onUpdate(); 
    } catch (_error) {
      // Revert optimistic update if API fails
      setLocalCompletedDates(initialCompletedDates);
      Alert.alert("Network Error", "Could not save your check-in. Please try again.");
    }
  };

  const handleDelete = () => {
    if (saving || !habit?._id) return;

    Alert.alert("Delete Habit", "Are you sure you want to delete this habit?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          try {
            setSaving(true);
            await fetchApi(`/habits/${habit._id}`, { method: 'DELETE' });
            if(onUpdate) onUpdate();
          } catch (e) {
            Alert.alert("Error", e.message);
          } finally {
            setSaving(false);
          }
        } 
      }
    ]);
  };

  return (
    <View style={styles.card}>
      <View style={styles.heatmapContainer}>
        {cells.map((isActive, i) => (
          <View key={i} style={[styles.cell, isActive && { backgroundColor: accentColor }]} />
        ))}
      </View>
      <View style={styles.details}>
        <View style={styles.titleRow}>
          <View style={[styles.iconWrapper, { backgroundColor: `${accentColor}15` }]}>
            <Text style={styles.icon}>{icon || '🎯'}</Text>
          </View>
          <Text style={styles.title} numberOfLines={1}>{title || habit?.name || 'Untitled habit'}</Text>
          
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={saving}>
            <Feather name="trash-2" size={18} color="#cbd5e1" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.weekdays}>
          {last7Days.map((day, i) => (
            <View key={i} style={[styles.dayCircle, day.isCompleted ? { backgroundColor: accentColor } : {}]}>
              <Text style={[styles.dayText, day.isCompleted ? { color: '#fff' } : {}]}>{day.dayStr}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.checkInBtn, completedToday ? styles.btnCompleted : { backgroundColor: accentColor }]} 
          activeOpacity={0.7}
          onPress={handleCheckIn}
        >
          {completedToday ? (
            <Feather name="check" size={18} color="#10b981" style={{marginRight: 6}} />
          ) : (
            <Feather name="check-circle" size={18} color="#fff" style={{marginRight: 6}} />
          )}
          <Text style={[styles.checkInText, completedToday && { color: '#10b981' }]}>
            {completedToday ? 'Completed' : 'Check in'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff', borderRadius: 20, padding: 16, flexDirection: 'row', gap: 14, minHeight: 158,
    shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 5,
    borderWidth: 1, borderColor: '#f1f5f9'
  },
  heatmapContainer: { flexDirection: 'row', flexWrap: 'wrap', width: 108, gap: 4, alignContent: 'flex-start', paddingTop: 8 },
  cell: { width: 12, height: 12, borderRadius: 4, backgroundColor: '#f1f5f9' },
  details: { flex: 1, flexDirection: 'column', minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrapper: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 20 },
  title: { fontSize: 17, fontWeight: '700', color: '#0f172a', flex: 1 },
  deleteBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  weekdays: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 20 },
  dayCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  dayText: { fontSize: 10, fontWeight: '700', color: '#94a3b8' },
  checkInBtn: { flexDirection: 'row', width: '100%', height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: {width:0, height:4}, shadowOpacity: 0.1, shadowRadius: 8 },
  btnCompleted: { backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#d1fae5', shadowOpacity: 0 },
  btnDisabled: { opacity: 0.65 },
  checkInText: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 }
});
