import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Platform } from 'react-native';

type Props = {
  visible: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({ visible, title = 'Attention', message = '', confirmLabel = 'Supprimer', cancelLabel = 'Annuler', onConfirm, onCancel }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            <Pressable onPress={onCancel} style={[styles.btn, styles.cancel]}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable onPress={onConfirm} style={[styles.btn, styles.confirm]}>
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { width: Platform.OS === 'web' ? 420 : '90%', backgroundColor: '#fff', borderRadius: 10, padding: 18, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, elevation: 6 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  message: { color: '#444', marginBottom: 16, lineHeight: 20 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  btn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, minWidth: 96, alignItems: 'center' },
  cancel: { backgroundColor: '#f0f0f0' },
  confirm: { backgroundColor: '#d32f2f' },
  cancelText: { color: '#111' },
  confirmText: { color: '#fff', fontWeight: '700' }
});
