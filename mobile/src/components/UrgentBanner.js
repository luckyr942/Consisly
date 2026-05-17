import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function UrgentBanner({ pendingHabits, onSnoozeHabit }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      const diffMs = endOfDay - now;
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${hours}h ${mins}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // update every minute
    return () => clearInterval(interval);
  }, []);

  if (!pendingHabits || pendingHabits.length === 0) return null;

  // Personalize the notification based on the first uncompleted habit!
  const targetHabit = pendingHabits[0];
  const habitName = targetHabit?.name || '';
  const hasEmoji = habitName.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/u);
  const icon = targetHabit?.icon || (hasEmoji ? hasEmoji[0] : '🔔');
  const name = hasEmoji ? habitName.substring(hasEmoji[0].length).trim() : habitName;

  const handlePress = () => {
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity activeOpacity={0.8} onPress={handlePress}>
        <LinearGradient colors={['#fff1f2', '#ffe4e6']} style={styles.banner}>
          <View style={styles.iconContainer}>
            <Text style={styles.emojiIcon}>{icon}</Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Keep your streak alive!</Text>
            <Text style={styles.subtitle}>
              You have <Text style={styles.highlight}>{timeLeft}</Text> left to complete <Text style={styles.highlight}>{name || 'this habit'}</Text>
              {pendingHabits.length > 1 ? ` and ${pendingHabits.length - 1} others.` : '.'}
            </Text>
          </View>
          <View style={styles.rightAction}>
             <Feather name="clock" size={24} color="#f43f5e" style={{opacity: 0.8}} />
          </View>
        </LinearGradient>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pending Reminders</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Feather name="x" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>Select a habit to snooze its reminders for the rest of the day.</Text>

            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {pendingHabits.map(habit => {
                const hName = habit.name || '';
                const hEmojiMatch = hName.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/u);
                const hIcon = habit.icon || (hEmojiMatch ? hEmojiMatch[0] : '🎯');
                const cleanName = hEmojiMatch ? hName.substring(hEmojiMatch[0].length).trim() : hName;

                return (
                  <View key={habit._id} style={styles.modalRow}>
                    <View style={styles.modalHabitInfo}>
                      <Text style={styles.modalHabitIcon}>{hIcon}</Text>
                      <Text style={styles.modalHabitName} numberOfLines={1}>{cleanName}</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.snoozeBtn} 
                      onPress={() => {
                        onSnoozeHabit(habit._id);
                        if (pendingHabits.length <= 1) setModalVisible(false);
                      }}
                    >
                      <Text style={styles.snoozeBtnText}>Snooze</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: -25, // Overlap the bottom of the blue header for a premium 3D layering effect!
    zIndex: 10,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#fecdd3',
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  emojiIcon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
    marginLeft: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#9f1239', // Rose 900
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#be123c', // Rose 700
    lineHeight: 18,
  },
  highlight: {
    fontWeight: '800',
    color: '#e11d48',
  },
  rightAction: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 40, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  modalSubtitle: { fontSize: 14, color: '#64748b', marginBottom: 20, lineHeight: 20 },
  modalList: { flexGrow: 0 },
  modalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalHabitInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 },
  modalHabitIcon: { fontSize: 24, marginRight: 12 },
  modalHabitName: { fontSize: 16, fontWeight: '600', color: '#0f172a', flex: 1 },
  snoozeBtn: { backgroundColor: '#fff1f2', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: '#ffe4e6' },
  snoozeBtnText: { color: '#e11d48', fontWeight: '700', fontSize: 13 }
});
