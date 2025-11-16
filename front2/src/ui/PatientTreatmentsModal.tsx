import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, Button, Alert } from 'react-native';
import treatmentsApi, { Treatment } from '../api/treatments';
import { Patient } from '../api/patients';
import TreatmentDialog from './TreatmentDialog';

type Props = {
  visible: boolean;
  patient: Patient | null;
  onClose: () => void;
};

export default function PatientTreatmentsModal({ visible, patient, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [pagination, setPagination] = useState<any>(null);
  const [dialogVisible, setDialogVisible] = useState(false);

  const fetch = async (p = 1) => {
    if (!patient) return;
    setLoading(true);
    try {
      const res = await treatmentsApi.getPatientTreatments(patient._id, p, limit);
      setTreatments(res.treatments || []);
      setPagination(res.pagination || null);
      setPage(p);
    } catch (err) {
      console.error('Failed to load patient treatments', err);
      Alert.alert('Erreur', "Impossible de charger les soins du patient.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) fetch(1);
    else {
      setTreatments([]);
      setPagination(null);
    }
  }, [visible, patient]);

  const calculateTotals = () => {
    const totalHonoraires = treatments.reduce((s, t) => s + (t.honoraire || 0), 0);
    const totalRecu = treatments.reduce((s, t) => s + (t.recu || 0), 0);
    const totalBalance = totalRecu - totalHonoraires;
    return { totalHonoraires, totalRecu, totalBalance };
  };

  const onSaved = (created?: any) => {
    setDialogVisible(false);
    // reload
    fetch(1);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{patient ? `${patient.lastName} ${patient.firstName} — Soins` : 'Soins'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable onPress={() => setDialogVisible(true)} style={styles.addBtn} accessibilityLabel="Ajouter soin">
              <Text style={styles.addText}>＋ Ajouter</Text>
            </Pressable>
            <Pressable onPress={onClose} style={[styles.addBtn, { marginLeft: 8 }]}>
              <Text style={styles.addText}>Fermer</Text>
            </Pressable>
          </View>
        </View>

        {loading && <ActivityIndicator style={{ marginTop: 20 }} />}

        {!loading && (
          <>
            <View style={styles.headerRow}>
              <Text style={[styles.headerCell, { flex: 2 }]}>Date</Text>
              <Text style={[styles.headerCell, { flex: 1 }]}>Dent</Text>
              <Text style={[styles.headerCell, { flex: 4 }]}>Description</Text>
              <Text style={[styles.headerCell, { flex: 1, textAlign: 'right' }]}>Honoraire</Text>
              <Text style={[styles.headerCell, { flex: 1, textAlign: 'right' }]}>Reçu</Text>
              <Text style={[styles.headerCell, { flex: 1, textAlign: 'right' }]}>Balance</Text>
            </View>

            <FlatList data={treatments} keyExtractor={t => t._id} renderItem={({ item }) => (
              <View style={styles.row}>
                <Text style={[styles.cell, { flex: 2 }]}>{item.treatmentDate ? new Date(item.treatmentDate).toLocaleDateString('fr-FR') : '-'}</Text>
                <Text style={[styles.cell, { flex: 1 }]}>{item.dent ?? '-'}</Text>
                <Text style={[styles.cell, { flex: 4 }]}>{item.description}</Text>
                <Text style={[styles.cell, { flex: 1, textAlign: 'right' }]}>{item.honoraire ?? '-'}</Text>
                <Text style={[styles.cell, { flex: 1, textAlign: 'right' }]}>{item.recu ?? '-'}</Text>
                <Text style={[styles.cell, { flex: 1, textAlign: 'right' }]}>{(item.recu || 0) - (item.honoraire || 0)}</Text>
              </View>
            )} ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#eee' }} />} />

            <View style={styles.totals}>
              {(() => {
                const totals = calculateTotals();
                return (
                  <Text>Totaux — Honoraire: {totals.totalHonoraires} · Reçu: {totals.totalRecu} · Balance: {totals.totalBalance}</Text>
                );
              })()}
            </View>
          </>
        )}

        <TreatmentDialog visible={dialogVisible} patient={patient} onClose={() => setDialogVisible(false)} onSaved={onSaved} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '700' },
  addBtn: { backgroundColor: '#edf7ee', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8 },
  addText: { color: '#2e7d32', fontWeight: '700' },
  headerRow: { flexDirection: 'row', paddingVertical: 6, alignItems: 'center', backgroundColor: '#f7f7f7', paddingHorizontal: 8 },
  headerCell: { fontWeight: '700' },
  row: { flexDirection: 'row', paddingVertical: 8, alignItems: 'center', paddingHorizontal: 8 },
  cell: { paddingVertical: 2 },
  totals: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#eee', marginTop: 8 }
});
