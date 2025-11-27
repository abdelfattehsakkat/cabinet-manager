import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import Dashboard from './src/screens/Dashboard';
import Home from './src/screens/Home';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserInfo = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'ADMIN' | 'DOCTOR' | 'SECRETARY';
};

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);

  const loadUserInfo = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      if (token && userStr) {
        setUser(JSON.parse(userStr));
        setLoggedIn(true);
      } else {
        setLoggedIn(false);
        setUser(null);
      }
    } catch (e) {
      console.warn('Error loading user info', e);
      setLoggedIn(false);
      setUser(null);
    }
  };

  useEffect(() => {
    loadUserInfo();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setLoggedIn(false);
    setUser(null);
  };

  const handleLoginSuccess = () => {
    loadUserInfo();
  };

  return (
    <View style={styles.container}>
      {loggedIn ? (
        <Home onLogout={handleLogout} user={user} />
      ) : (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      )}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
