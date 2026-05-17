import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { isDark, toggleTheme, theme } = useTheme();
  const [notifications, setNotifications] = useState(true);

  const SettingRow = ({ icon, title, subtitle, rightElement, onPress }) => (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} disabled={!onPress}>
      <View style={[styles.iconBg, { backgroundColor: isDark ? '#1e3a8a' : '#eff6ff' }]}>
        <Feather name={icon} size={20} color={theme.primary} />
      </View>
      <View style={styles.settingText}>
        <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingSubtitle, { color: theme.textMuted }]}>{subtitle}</Text>}
      </View>
      {rightElement ? rightElement : <Feather name="chevron-right" size={20} color={theme.textMuted} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={[styles.navBtn, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => router.back()}>
          <Feather name="chevron-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
        <View style={{ width: 40 }} /> {/* Spacer to center title */}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <SettingRow icon="user" title="Personal Information" subtitle="Update email and profile" onPress={() => {}} />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingRow icon="lock" title="Security & Password" subtitle="Change your password" onPress={() => {}} />
        </View>

        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <SettingRow 
            icon="bell" 
            title="Push Notifications" 
            subtitle="Daily reminders and streaks" 
            rightElement={<Switch value={notifications} onValueChange={setNotifications} trackColor={{ true: theme.primary }}/>} 
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingRow 
            icon="moon" 
            title="Dark Mode" 
            subtitle="Switch theme appearance"
            rightElement={<Switch value={isDark} onValueChange={toggleTheme} trackColor={{ true: theme.primary }}/>} 
          />
        </View>

        <Text style={styles.sectionTitle}>Support</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <SettingRow icon="help-circle" title="Help & FAQ" onPress={() => {}} />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingRow icon="shield" title="Privacy Policy" onPress={() => {}} />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingRow icon="star" title="Rate the App" onPress={() => {}} />
        </View>

        <Text style={styles.versionText}>HabitFlow v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  navBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#94a3b8', shadowOpacity: 0.15, shadowRadius: 5, elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  
  content: { padding: 20, paddingBottom: 60 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginLeft: 10, marginTop: 10 },
  
  card: { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 16, marginBottom: 20, shadowColor: '#94a3b8', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: '#f1f5f9' },
  
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  iconBg: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  settingText: { flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  settingSubtitle: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  
  divider: { height: 1, backgroundColor: '#f1f5f9', marginLeft: 54 },
  
  versionText: { textAlign: 'center', color: '#94a3b8', fontSize: 12, fontWeight: '600', marginTop: 20 }
});
