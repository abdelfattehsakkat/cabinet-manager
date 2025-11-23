import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform, Dimensions, ActivityIndicator } from 'react-native';
import treatmentsApi from '../api/treatments';
import { Patient } from '../api/patients';

type Props = {
  visible: boolean;
  patient: Patient | null;
  onClose: () => void;
  onSaved?: (created?: any) => void;
};

export default function TreatmentDialog({ visible, patient, onClose, onSaved }: Props) {
  const [description, setDescription] = useState('');
  const [honoraire, setHonoraire] = useState('');
  const [recu, setRecu] = useState('');
  const [dent, setDent] = useState('');
  const [saving, setSaving] = useState(false);

  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);
  const isWeb = windowWidth >= 768;

  useEffect(() => {
    const onChange = ({ window }: { window: { width: number } }) => setWindowWidth(window.width);
    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, []);

  const getAvatarColor = (name?: string) => {
    if (!name) return '#2e7d32';
    const colors = ['#1976d2', '#2e7d32', '#9c27b0', '#d32f2f', '#f57c00', '#0288d1', '#c2185b'];
    return colors[name.charCodeAt(0) % colors.length];
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const f = firstName?.charAt(0) || '';
    const l = lastName?.charAt(0) || '';
    return (f + l).toUpperCase() || '💉';
  };

  const submit = async () => {
    if (!patient) return;
    // Basic client-side validation
    if (!description.trim()) {
      Alert.alert('Validation', 'La description est requise');
      return;
    }
    const dentNumber = Number(dent);
    if (!dent || isNaN(dentNumber) || dentNumber < 1 || dentNumber > 48) {
      Alert.alert('Validation', 'Le numéro de dent doit être un nombre entre 1 et 48');
      return;
    }

    const payload = {
      patientId: patient._id,
      description: description.trim(),
      dent: dentNumber,
      honoraire: Number(honoraire) || 0,
      recu: Number(recu) || 0,
      treatmentDate: new Date().toISOString()
    };

    setSaving(true);
    try {
      const created = await treatmentsApi.createTreatment(payload);
      onSaved?.(created);
      // Reset form
      setDescription('');
      setDent('');
      setHonoraire('');
      setRecu('');
      onClose();
    } catch (err: any) {
      console.error('Failed creating treatment', err);
      const msg = err?.message || 'Impossible de créer le soin';
      Alert.alert('Erreur', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={isWeb} onRequestClose={onClose}>
      <View style={[styles.backdrop, !isWeb && styles.backdropMobile]}>
        <View style={[styles.modal, isWeb ? styles.modalWeb : styles.modalMobile]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.avatar, { backgroundColor: getAvatarColor(patient?.lastName) }]}>
              <Text style={styles.avatarText}>
                {patient ? getInitials(patient.firstName, patient.lastName) : '💉'}
              </Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.modalTitle}>Nouveau soin</Text>
              {patient && (
                <Text style={styles.modalSubtitle}>
                  {patient.firstName} {patient.lastName}
                </Text>
              )}
            </View>
            <TouchableOpacity style={styles.headerCloseBtn} onPress={onClose}>
              <Text style={styles.headerCloseIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            {/* Info Cards */}
            <View style={styles.cardsRow}>
              <View style={[styles.infoCard, { backgroundColor: '#e3f2fd' }]}>
                <Text style={styles.infoCardIcon}>💰</Text>
                <Text style={styles.infoCardLabel}>Honoraire</Text>
              </View>
              <View style={[styles.infoCard, { backgroundColor: '#f3e5f5' }]}>
                <Text style={styles.infoCardIcon}>💵</Text>
                <Text style={styles.infoCardLabel}>Reçu</Text>
              </View>
              <View style={[styles.infoCard, { backgroundColor: '#e8f5e9' }]}>
                <Text style={styles.infoCardIcon}>🦷</Text>
                <Text style={styles.infoCardLabel}>Dent</Text>
              </View>
            </View>

            {/* Form Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💉 Détails du soin</Text>

              {/* Description */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Description *</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  style={[styles.input, styles.inputTextarea]}
                  placeholder="Ex: Détartrage, extraction, traitement canalaire..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Dent */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>🦷 Numéro de dent *</Text>
                <TextInput
                  value={dent}
                  onChangeText={setDent}
                  keyboardType="number-pad"
                  style={styles.input}
                  placeholder="Entrer un numéro entre 1 et 48"
                  placeholderTextColor="#999"
                />
                <Text style={styles.inputHint}>Valeur entre 1 et 48</Text>
              </View>

              {/* Honoraire */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>💰 Honoraire (DH)</Text>
                <TextInput
                  value={honoraire}
                  onChangeText={setHonoraire}
                  keyboardType="numeric"
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Reçu */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>💵 Reçu (DH)</Text>
                <TextInput
                  value={recu}
                  onChangeText={setRecu}
                  keyboardType="numeric"
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.btnCancel} 
              onPress={onClose}
              disabled={saving}
            >
              <Text style={styles.btnCancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.btnCreate, saving && styles.btnCreateDisabled]} 
              onPress={submit}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.btnCreateIcon}>💾</Text>
                  <Text style={styles.btnCreateText}>Créer le soin</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdropMobile: {
    backgroundColor: '#fff',
    padding: 0,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalWeb: {
    maxWidth: 600,
  },
  modalMobile: {
    width: '100%',
    height: '100%',
    maxHeight: '100%',
    borderRadius: 0,
  },
  // === Header ===
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fafafa',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  headerCloseBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCloseIcon: {
    fontSize: 20,
    color: '#666',
  },
  // === Content ===
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  infoCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
  },
  infoCardIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  infoCardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#424242',
    textAlign: 'center',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#212121',
    ...(Platform.OS === 'web' && {
      outlineStyle: 'none' as any,
    }),
  },
  inputTextarea: {
    minHeight: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
    marginLeft: 4,
  },
  // === Footer ===
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  btnCreate: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#4caf50',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#4caf50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  btnCreateDisabled: {
    opacity: 0.6,
  },
  btnCreateIcon: {
    fontSize: 18,
  },
  btnCreateText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
