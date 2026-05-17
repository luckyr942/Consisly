import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { fetchApi } from '../../src/api/client';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function CreateHabitScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('💧');
  const [frequency, setFrequency] = useState('Daily');
  const [saving, setSaving] = useState(false);
  
  // Reminders
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [reminderMode, setReminderMode] = useState('daily'); // 'daily' or 'interval'
  
  // Daily Time
  const [time, setTime] = useState(new Date(new Date().setHours(8, 0, 0, 0)));
  const [showPicker, setShowPicker] = useState(false);
  
  // Interval
  const [intervalValue, setIntervalValue] = useState('2');
  const [intervalUnit, setIntervalUnit] = useState('hours'); // 'hours' or 'minutes'

  const icons = ['💧', '🧘', '📖', '🏃', '🏋️', '🍎', '📚', '💤', '📝', '✏️', '🚶', '❤️', '🧠', '🍒', '🎵', '💵'];
  const frequencies = ['Daily', 'Weekly'];

  const iconPlaceholders = {
    '💧': 'e.g. Drink 2L of water...',
    '🧘': 'e.g. Meditate for 10 minutes...',
    '📖': 'e.g. Read 15 pages of a book...',
    '🏃': 'e.g. Go for a 3k run...',
    '🏋️': 'e.g. Workout at the gym...',
    '🍎': 'e.g. Eat a healthy salad...',
    '📚': 'e.g. Study for 1 hour...',
    '💤': 'e.g. Sleep for 8 hours...',
    '📝': 'e.g. Journal my thoughts...',
    '✏️': 'e.g. Practice drawing...',
    '🚶': 'e.g. Take a 20 min walk...',
    '❤️': 'e.g. Call my parents...',
    '🧠': 'e.g. Learn a new language...',
    '🍒': 'e.g. Eat some fruit...',
    '🎵': 'e.g. Practice an instrument...',
    '💵': 'e.g. Track daily expenses...',
  };

  const handleTimeChange = (event, selectedDate) => {
    const currentDate = selectedDate || time;
    setShowPicker(Platform.OS === 'ios');
    setTime(currentDate);
  };

  const handleSave = async () => {
    const habitName = name.trim();
    if (!habitName) return Alert.alert("Required", "Please enter a habit name.");
    if (saving) return;
    
    // Construct payload based on reminder settings
    const payload = {
      name: habitName,
      icon: selectedIcon,
      description: "New Habit", 
      frequency: frequency.toLowerCase(),
      reminderType: remindersEnabled ? reminderMode : 'none'
    };

    if (remindersEnabled) {
      if (reminderMode === 'daily') {
        payload.reminderTime = time.toISOString();
      } else {
        const val = parseInt(intervalValue, 10);
        if (isNaN(val) || val <= 0) return Alert.alert("Invalid Interval", "Please enter a valid number for the interval.");
        payload.intervalValue = val;
        payload.intervalUnit = intervalUnit;
      }
    }
    
    try {
      setSaving(true);
      await fetchApi('/habits', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      Keyboard.dismiss();
      router.back();
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
            <Feather name="chevron-left" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Habit</Text>
          <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
            <Feather name="x" size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          
          <View style={styles.selectedIconContainer}>
             <LinearGradient colors={['#dbeafe', '#bfdbfe']} style={styles.selectedIconGradient}>
               <Text style={styles.selectedIconText}>{selectedIcon}</Text>
             </LinearGradient>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name your habit</Text>
            <TextInput 
              style={styles.input} 
              placeholder={iconPlaceholders[selectedIcon] || "Name your habit..."}
              placeholderTextColor="#94a3b8"
              value={name}
              onChangeText={setName}
              autoFocus={true}
              returnKeyType="done"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Choose an icon</Text>
            <View style={styles.iconGrid}>
              {icons.map((icon, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.iconBox, selectedIcon === icon && styles.iconBoxSelected]}
                  onPress={() => setSelectedIcon(icon)}
                >
                  <Text style={styles.iconText}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Frequency</Text>
            <View style={styles.freqRow}>
              {frequencies.map((freq) => (
                <TouchableOpacity 
                  key={freq} 
                  style={[styles.freqBtn, frequency === freq && styles.freqBtnSelected]}
                  onPress={() => setFrequency(freq)}
                >
                  <Text style={[styles.freqText, frequency === freq && styles.freqTextSelected]}>{freq}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.reminderCard}>
            <View style={styles.reminderHeader}>
              <View>
                <Text style={styles.reminderTitle}>Smart Reminders</Text>
                <Text style={styles.reminderSubtitle}>We&apos;ll notify you when it&apos;s time</Text>
              </View>
              <Switch 
                value={remindersEnabled} 
                onValueChange={setRemindersEnabled} 
                trackColor={{ true: '#3b82f6', false: '#e2e8f0' }} 
              />
            </View>
            
            {remindersEnabled && (
              <>
                <View style={styles.divider} />
                
                {/* Mode Selector */}
                <View style={styles.modeTabs}>
                  <TouchableOpacity 
                    style={[styles.modeTab, reminderMode === 'daily' && styles.modeTabActive]}
                    onPress={() => setReminderMode('daily')}
                  >
                    <Feather name="clock" size={16} color={reminderMode === 'daily' ? '#2563eb' : '#64748b'} />
                    <Text style={[styles.modeTabText, reminderMode === 'daily' && styles.modeTabTextActive]}>Exact Time</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.modeTab, reminderMode === 'interval' && styles.modeTabActive]}
                    onPress={() => setReminderMode('interval')}
                  >
                    <Feather name="rotate-cw" size={16} color={reminderMode === 'interval' ? '#2563eb' : '#64748b'} />
                    <Text style={[styles.modeTabText, reminderMode === 'interval' && styles.modeTabTextActive]}>Repeating</Text>
                  </TouchableOpacity>
                </View>

                {reminderMode === 'daily' ? (
                  // Daily Time Picker UI
                  <View style={styles.timeSelectRow}>
                    <Text style={styles.timeSelectText}>Notify me at</Text>
                    {Platform.OS === 'ios' ? (
                      <DateTimePicker
                        value={time}
                        mode="time"
                        display="default"
                        onChange={handleTimeChange}
                      />
                    ) : (
                      <>
                        <TouchableOpacity style={styles.timeBadge} onPress={() => setShowPicker(true)}>
                          <Text style={styles.timeBadgeText}>{formatTime(time)}</Text>
                        </TouchableOpacity>
                        {showPicker && (
                          <DateTimePicker
                            value={time}
                            mode="time"
                            display="default"
                            onChange={handleTimeChange}
                          />
                        )}
                      </>
                    )}
                  </View>
                ) : (
                  // Interval / Repeating UI
                  <View style={styles.intervalRow}>
                    <Text style={styles.timeSelectText}>Every</Text>
                    
                    <TextInput 
                      style={styles.intervalInput}
                      keyboardType="numeric"
                      value={intervalValue}
                      onChangeText={setIntervalValue}
                      maxLength={3}
                    />

                    <View style={styles.unitToggle}>
                      <TouchableOpacity 
                        style={[styles.unitBtn, intervalUnit === 'hours' && styles.unitBtnActive]}
                        onPress={() => setIntervalUnit('hours')}
                      >
                        <Text style={[styles.unitText, intervalUnit === 'hours' && styles.unitTextActive]}>Hrs</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.unitBtn, intervalUnit === 'minutes' && styles.unitBtnActive]}
                        onPress={() => setIntervalUnit('minutes')}
                      >
                        <Text style={[styles.unitText, intervalUnit === 'minutes' && styles.unitTextActive]}>Mins</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </>
            )}
          </View>

          <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
            <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.saveBtnGradient}>
              <Text style={styles.saveBtnText}>{saving ? 'Creating...' : 'Create Habit'}</Text>
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  navBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#94a3b8', shadowOpacity: 0.15, shadowRadius: 5, elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  
  content: { padding: 24, paddingBottom: 60 },
  
  selectedIconContainer: { alignSelf: 'center', marginBottom: 32 },
  selectedIconGradient: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', shadowColor: '#3b82f6', shadowOffset: {width:0, height:8}, shadowOpacity: 0.2, shadowRadius: 15 },
  selectedIconText: { fontSize: 40 },
  
  inputGroup: { marginBottom: 28 },
  label: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, padding: 18, fontSize: 16, color: '#0f172a', shadowColor: '#94a3b8', shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
  
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, backgroundColor: '#fff', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  iconBoxSelected: { backgroundColor: '#dbeafe', borderWidth: 2, borderColor: '#3b82f6' },
  iconText: { fontSize: 20 },
  
  freqRow: { flexDirection: 'row', gap: 12 },
  freqBtn: { flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  freqBtnSelected: { backgroundColor: '#eff6ff', borderColor: '#3b82f6', borderWidth: 2 },
  freqText: { fontSize: 15, color: '#64748b', fontWeight: '600' },
  freqTextSelected: { color: '#3b82f6', fontWeight: '800' },
  
  reminderCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 32, shadowColor: '#94a3b8', shadowOpacity: 0.05, shadowRadius: 5 },
  reminderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reminderTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  reminderSubtitle: { fontSize: 13, color: '#64748b', marginTop: 4, fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 16 },
  
  modeTabs: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4, marginBottom: 20 },
  modeTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 8 },
  modeTabActive: { backgroundColor: '#fff', shadowColor: '#94a3b8', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  modeTabText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  modeTabTextActive: { color: '#2563eb', fontWeight: '700' },

  timeSelectRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  timeSelectText: { fontSize: 16, fontWeight: '600', color: '#475569' },
  timeBadge: { backgroundColor: '#f1f5f9', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10 },
  timeBadgeText: { fontSize: 15, fontWeight: '700', color: '#0f172a' },

  intervalRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 4 },
  intervalInput: { backgroundColor: '#f1f5f9', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, fontSize: 16, fontWeight: '700', color: '#0f172a', textAlign: 'center', width: 60 },
  unitToggle: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 10, padding: 4, flex: 1 },
  unitBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  unitBtnActive: { backgroundColor: '#fff', shadowColor: '#94a3b8', shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  unitText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  unitTextActive: { color: '#0f172a', fontWeight: '700' },
  
  saveBtn: { borderRadius: 20, shadowColor: '#2563eb', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.3, shadowRadius: 15, elevation: 5 },
  saveBtnGradient: { padding: 18, borderRadius: 20, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' }
});
