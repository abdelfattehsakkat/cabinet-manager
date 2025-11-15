import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type User = { firstName?: string; lastName?: string; email?: string };

type Props = {
  visible: boolean;
  onClose: () => void;
  onLogout: () => void;
};

export default function ProfileMenu({ visible, onClose, onLogout }: Props) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!visible) return;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('user');
        if (raw) setUser(JSON.parse(raw));
      } catch (e) {
        console.warn('Could not read user from storage', e);
      }
    })();
  }, [visible]);
  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    onClose();
    onLogout();
  };

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.menu}>
          <View style={styles.header}>
            <Text style={styles.name}>{user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Utilisateur'}</Text>
            <Text style={styles.email}>{user?.email || ''}</Text>
          </View>

          <Pressable onPress={() => { onClose(); /* TODO: open settings */ }} style={styles.item}>
            <Text style={styles.itemText}>Paramètres</Text>
          </Pressable>
          <Pressable onPress={handleLogout} style={[styles.item, styles.logout]}>
            <Text style={[styles.itemText, styles.logoutText]}>Se déconnecter</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-start' },
  menu: { backgroundColor: '#fff', marginTop: 60, marginRight: 16, alignSelf: 'flex-end', borderRadius: 8, padding: 8, minWidth: 160, elevation: 4 },
  header: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  name: { fontSize: 16, fontWeight: '700' },
  email: { fontSize: 13, color: '#666', marginTop: 4 },
  item: { paddingVertical: 10, paddingHorizontal: 12 },
  itemText: { fontSize: 16, color: '#222' },
  logout: { borderTopWidth: 1, borderTopColor: '#eee' },
  logoutText: { color: '#d32f2f' }
});
