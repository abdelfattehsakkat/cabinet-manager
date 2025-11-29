import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, TextStyle, ViewStyle, StyleSheet, Alert, Platform } from 'react-native';
import { login } from '../api/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = {
  onLoginSuccess?: () => void;
};

export default function LoginScreen({ onLoginSuccess }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const data = await login(email, password);
      // store token and user info
      if (data?.token) {
        await AsyncStorage.setItem('token', data.token);
      }
      // Save the user object if present (firstName, lastName, email, _id, role...)
      if (data) {
        const { token, ...user } = data;
        try {
          await AsyncStorage.setItem('user', JSON.stringify(user));
        } catch (e) {
          console.warn('Could not store user info', e);
        }
      }
      if (onLoginSuccess) onLoginSuccess();
    } catch (err: any) {
      console.error('Login error', err);
      Alert.alert('Erreur', err.message || 'Impossible de se connecter');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connexion</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={[styles.input, styles.inputText]}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Mot de passe"
        value={password}
        onChangeText={setPassword}
        style={[styles.input, styles.inputText]}
        secureTextEntry
      />

      <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText as TextStyle}>{loading ? 'Connexion...' : 'Se connecter'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: Platform.select({ web: 24, default: 16 }),
    alignItems: 'center'
  } as ViewStyle,
  title: { fontSize: 22, marginBottom: 12, textAlign: 'center' } as TextStyle,
  input: {
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderRadius: 6,
    backgroundColor: '#fff'
  } as ViewStyle,
  inputText: { fontSize: 14, color: '#333' } as TextStyle,
  button: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#1976d2',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center'
  } as ViewStyle,
  buttonPressed: { opacity: 0.85 } as ViewStyle,
  buttonText: { color: '#fff', fontSize: 16 } as TextStyle
});
