import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import Dashboard from './src/screens/Dashboard';
import Home from './src/screens/Home';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('token');
      setLoggedIn(!!token);
    })();
  }, []);

  return (
    <View style={styles.container}>
      {loggedIn ? (
        <Home onLogout={() => setLoggedIn(false)} />
      ) : (
        <LoginScreen onLoginSuccess={() => setLoggedIn(true)} />
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
