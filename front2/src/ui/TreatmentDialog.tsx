import React, { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
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

  const submit = async () => {
    if (!patient) return;
    // Basic client-side validation (matches backend requirements)
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
      // only close after the server confirmed creation
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
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>Ajouter un soin</Text>
          <Text style={styles.patientName}>{patient ? `${patient.firstName} ${patient.lastName}` : ''}</Text>

          <TextInput placeholder="Description" value={description} onChangeText={setDescription} style={styles.input} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TextInput placeholder="Dent" keyboardType="numeric" value={dent} onChangeText={setDent} style={[styles.input, { flex: 1, marginRight: 8 }]} />
            <TextInput placeholder="Honoraire" keyboardType="numeric" value={honoraire} onChangeText={setHonoraire} style={[styles.input, { flex: 1 }]} />
          </View>
          <TextInput placeholder="Reçu" keyboardType="numeric" value={recu} onChangeText={setRecu} style={styles.input} />

          <View style={{ flexDirection: 'row', marginTop: 12, justifyContent: 'flex-end' }}>
            <Pressable onPress={onClose} style={[styles.btn, { marginRight: 8, backgroundColor: '#eee' }]}> 
              <Text>Annuler</Text>
            </Pressable>
            <Pressable onPress={submit} style={[styles.btn, saving ? { opacity: 0.6 } : {}]} disabled={saving}>
              <Text style={styles.btnText}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  box: { width: '100%', maxWidth: 540, backgroundColor: '#fff', borderRadius: 10, padding: 16, elevation: 6 },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  patientName: { color: '#555', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#eee', borderRadius: 6, padding: 8, marginBottom: 8, backgroundColor: '#fafafa' },
  btn: { backgroundColor: '#2e7d32', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  btnText: { color: '#fff', fontWeight: '700' }
});
