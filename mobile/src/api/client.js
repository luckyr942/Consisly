import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const debuggerHost = Constants.expoConfig?.hostUri;
const localIp = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';
const apiUrl = process.env.EXPO_PUBLIC_API_URL;

const BASE_URL = apiUrl ? `${apiUrl.replace(/\/$/, '')}/api` : `http://${localIp}:5001/api`;
const REQUEST_TIMEOUT_MS = 15000;

const parseResponse = async (response) => {
  const text = await response.text();

  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
};

export const fetchApi = async (endpoint, options = {}) => {
  const token = await AsyncStorage.getItem('userToken');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    
    const data = await parseResponse(response);
    
    if (!response.ok) throw new Error(data.message || 'Something went wrong');
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection.');
    }

    console.error(`API Error (${endpoint}):`, error);
    throw new Error(error.message || 'Network request failed');
  } finally {
    clearTimeout(timeout);
  }
};
