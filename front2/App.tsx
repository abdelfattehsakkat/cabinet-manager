import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import LoginScreen from './src/screens/LoginScreen';
import Dashboard from './src/screens/Dashboard';
import Home from './src/screens/Home';
import WelcomeOverlay from './src/ui/WelcomeOverlay';
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
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeName, setWelcomeName] = useState('');

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

  const handleLoginSuccess = async () => {
    // Charger les infos user pour l'animation de bienvenue
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setWelcomeName(userData.firstName || userData.email?.split('@')[0] || '');
        setShowWelcome(true);
      } else {
        loadUserInfo();
      }
    } catch (e) {
      loadUserInfo();
    }
  };

  const handleWelcomeFinish = () => {
    setShowWelcome(false);
    loadUserInfo();
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar style={showWelcome ? "light" : "dark"} backgroundColor={showWelcome ? "#1976d2" : "#fff"} />
        {loggedIn ? (
          <Home onLogout={handleLogout} user={user} />
        ) : (
          <LoginScreen onLoginSuccess={handleLoginSuccess} />
        )}
        
        {/* Animation de bienvenue */}
        <WelcomeOverlay 
          visible={showWelcome} 
          userName={welcomeName}
          onFinish={handleWelcomeFinish}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
