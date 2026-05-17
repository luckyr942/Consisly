import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { fetchApi } from '../../src/api/client';
import { useAuth } from '../../src/context/AuthContext';

export default function SignupScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async () => {
    if(!email || !password) return Alert.alert("Error", "Please fill all fields");
    
    try {
      const data = await fetchApi('/users/register', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      await login(data.token);
    } catch (error) {
      Alert.alert("Signup Failed", error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          
          <View style={styles.header}>
            <Text style={styles.logoText}>🌱 HabitFlow</Text>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start your journey to better habits today.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput 
              style={styles.input} 
              placeholder="yourname@email.com" 
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus={true}
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput 
              style={styles.input} 
              placeholder="••••••••" 
              placeholderTextColor="#9ca3af"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity style={styles.loginBtn} onPress={handleSignup}>
              <Text style={styles.loginText}>Sign Up</Text>
            </TouchableOpacity>

            <View style={styles.signupRow}>
              <Text style={styles.signupText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.signupLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  header: { alignItems: 'center', marginBottom: 40 },
  logoText: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '700', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#6b7280', textAlign: 'center' },
  
  card: {
    backgroundColor: '#ffffff', borderRadius: 24, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 5
  },
  label: { fontSize: 14, fontWeight: '500', color: '#6b7280', marginBottom: 8 },
  input: {
    backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 12, padding: 16, fontSize: 16, color: '#111827', marginBottom: 20
  },
  
  loginBtn: { backgroundColor: '#3b82f6', borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 20 },
  loginText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  
  signupRow: { flexDirection: 'row', justifyContent: 'center' },
  signupText: { color: '#6b7280', fontSize: 14 },
  signupLink: { color: '#3b82f6', fontSize: 14, fontWeight: '600' }
});
