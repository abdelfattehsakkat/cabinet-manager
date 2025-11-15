import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = {
  onLogout: () => void;
};

export default function Dashboard({ onLogout }: Props) {
  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    onLogout();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>Bienvenue — vous êtes connecté.</Text>
      <Pressable style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Se déconnecter</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, marginBottom: 8 },
  subtitle: { fontSize: 16, marginBottom: 20, color: '#444' },
  button: { backgroundColor: '#d32f2f', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 6 },
  buttonText: { color: '#fff', fontSize: 16 }
});
