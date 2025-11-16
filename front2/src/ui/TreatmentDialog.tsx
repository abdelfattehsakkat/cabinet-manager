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

  const submit = async () => {
    if (!patient) return;
    const payload = {
      patientId: patient._id,
      description,
      honoraire: Number(honoraire) || 0,
      recu: Number(recu) || 0,
      treatmentDate: new Date().toISOString()
    };
    try {
      await treatmentsApi.createTreatment(payload);
      onSaved?.(payload);
    } catch (err) {
      console.error('Failed creating treatment', err);
      Alert.alert('Erreur', 'Impossible de créer le soin');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <Text style={styles.title}>Ajouter un soin</Text>
        <Text style={{ marginBottom: 4 }}>{patient ? `${patient.firstName} ${patient.lastName}` : ''}</Text>
        <TextInput placeholder="Description" value={description} onChangeText={setDescription} style={styles.input} />
        <TextInput placeholder="Honoraire" keyboardType="numeric" value={honoraire} onChangeText={setHonoraire} style={styles.input} />
        <TextInput placeholder="Reçu" keyboardType="numeric" value={recu} onChangeText={setRecu} style={styles.input} />

        <View style={{ flexDirection: 'row', marginTop: 12 }}>
          <Pressable onPress={() => { submit(); onClose(); }} style={styles.btn}>
            <Text style={styles.btnText}>Enregistrer</Text>
          </Pressable>
          <Pressable onPress={onClose} style={[styles.btn, { marginLeft: 8, backgroundColor: '#eee' }]}>
            <Text>Annuler</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 8, marginBottom: 8 },
  btn: { backgroundColor: '#2e7d32', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 6 },
  btnText: { color: '#fff', fontWeight: '700' }
});
