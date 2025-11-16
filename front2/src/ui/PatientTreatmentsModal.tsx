import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, Alert, Platform } from 'react-native';
import treatmentsApi, { Treatment } from '../api/treatments';
import { Patient } from '../api/patients';
import TreatmentDialog from './TreatmentDialog';
import ConfirmModal from './ConfirmModal';

// Modern card-based modal for patient treatments

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
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [toDeleteId, setToDeleteId] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [hoveredSummary, setHoveredSummary] = useState<number | null>(null);

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

  const balanceStyle = (v: number | undefined) => {
    return v != null && v < 0 ? { color: '#c00' } : { color: '#111' };
  };

  const onSaved = (created?: any) => {
    setDialogVisible(false);
    // reload
    fetch(1);
  };

  const askDelete = (id: string) => {
    setToDeleteId(id);
    setConfirmVisible(true);
  };

  const doDelete = async (id?: string | null) => {
    const target = id ?? toDeleteId;
    if (!target) return;
    setConfirmVisible(false);
    setToDeleteId(null);
    setLoading(true);
    try {
      await treatmentsApi.deleteTreatment(target);
      fetch(1);
    } catch (err) {
      console.error('Delete failed', err);
      Alert.alert('Erreur', "La suppression a échoué.");
    } finally {
      setLoading(false);
    }
  };

  const isWeb = Platform.OS === 'web';

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, isWeb ? styles.sheetWeb : styles.sheetMobile]}>
          <View style={styles.sheetHeader}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{patient?.lastName?.charAt(0) ?? 'P'}</Text></View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.name}>{(patient?.firstName ?? '') + ' ' + (patient?.lastName ?? '')}</Text>
              <Text style={styles.sub}>{patient?.patientNumber ? `Fiche N° ${patient.patientNumber}` : ''}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Pressable onPress={() => setDialogVisible(true)} style={styles.iconAction}><Text style={{ color: '#2e7d32', fontWeight: '700' }}>＋</Text></Pressable>
              <Pressable onPress={onClose} style={[styles.iconAction, { marginTop: 8 }]}><Text style={{ color: '#666' }}>✕</Text></Pressable>
            </View>
          </View>

          <View style={styles.body}>
            {loading && <ActivityIndicator />}

                {!loading && (
              <>
                {/* Summary cards */}
                <View style={[styles.summaryRow, !isWeb && styles.summaryRowMobile]}>
                  {(() => {
                    const totals = calculateTotals();
                    const cards = [
                      { label: 'Total des soins', value: String(treatments.length) },
                      { label: 'Honoraires totaux', value: `${totals.totalHonoraires}DT` },
                      { label: 'Total reçu', value: `${totals.totalRecu}DT` },
                      { label: 'Balance', value: `${totals.totalBalance}DT`, raw: totals.totalBalance }
                    ];
                    return cards.map((c, idx) => (
                      <Pressable
                        key={c.label}
                        onHoverIn={() => isWeb && setHoveredSummary(idx)}
                        onHoverOut={() => isWeb && setHoveredSummary(null)}
                        onPress={() => { /* no op for now */ }}
                        style={[
                          styles.summaryCard,
                          !isWeb && styles.summaryCardMobile,
                          isWeb && hoveredSummary === idx && styles.summaryCardHover,
                          c.raw != null && c.raw < 0 && styles.summaryNegativeCard
                        ]}
                      >
                        <Text style={styles.summaryLabel}>{c.label}</Text>
                        <Text style={[styles.summaryValue, c.raw != null ? balanceStyle(c.raw) : {}]}>{c.value}</Text>
                      </Pressable>
                    ));
                  })()}
                </View>

                {/* Table header */}
                <View style={[styles.tableHeader, !isWeb && styles.tableHeaderMobile]}>
                  <Text style={[styles.th, { flex: 1, fontSize: 12, color: '#666' }]}>Date</Text>
                  <Text style={[styles.th, { flex: 1 }]}>Dent</Text>
                  <Text style={[styles.th, { flex: 6 }]}>Description</Text>
                  <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Honoraires</Text>
                  <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Reçu</Text>
                  <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Balance</Text>
                </View>

                    <FlatList data={treatments} keyExtractor={t => t._id} renderItem={({ item }) => (
                      <Pressable
                        onHoverIn={() => isWeb && setHovered(item._id)}
                        onHoverOut={() => isWeb && setHovered(null)}
                        style={[styles.tableRow, !isWeb && styles.tableRowMobile, isWeb && hovered === item._id && styles.cardHover]}
                      >
                        <Text style={[styles.td, styles.tdDate, { flex: 1 }]}>{item.treatmentDate ? new Date(item.treatmentDate).toLocaleDateString('fr-FR') : '-'}</Text>
                        <Text style={[styles.td, { flex: 1 }]}>{item.dent ?? '-'}</Text>
                        <Text style={[styles.td, { flex: 6 }]}>{item.description}</Text>
                        <Text style={[styles.td, { flex: 1, textAlign: 'right' }]}>{item.honoraire != null ? String(item.honoraire) : '-'}</Text>
                        <Text style={[styles.td, { flex: 1, textAlign: 'right' }]}>{item.recu != null ? String(item.recu) : '-'}</Text>
                        {
                          (() => {
                            const bal = (item.recu || 0) - (item.honoraire || 0);
                            return <Text style={[styles.td, { flex: 1, textAlign: 'right' }, balanceStyle(bal)]}>{String(bal)}</Text>;
                          })()
                        }
                      </Pressable>
                    )} ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#f6f6f6' }} />} />
              </>
            )}
          </View>

          <TreatmentDialog visible={dialogVisible} patient={patient} onClose={() => setDialogVisible(false)} onSaved={onSaved} />
          <ConfirmModal visible={confirmVisible} title="Supprimer le soin" message="Voulez-vous vraiment supprimer ce soin ?" onConfirm={() => doDelete()} onCancel={() => setConfirmVisible(false)} />
        </View>
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
  ,
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 12 },
  sheet: { backgroundColor: '#fff', borderRadius: 10, maxHeight: '80%', width: '90%', maxWidth: 900, alignSelf: 'center', overflow: 'hidden' },
  sheetWeb: { width: '80%', maxWidth: 1100 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#2e7d32', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 20 },
  name: { fontSize: 16, fontWeight: '800' },
  sub: { color: '#666', fontSize: 12, marginTop: 2 },
  iconAction: { padding: 8 },
  body: { padding: 12 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, borderWidth: 1, borderColor: '#f3f3f3' },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardDate: { color: '#666', fontSize: 12 },
  cardDesc: { fontWeight: '600', marginTop: 6 },
  cardPrice: { fontWeight: '700' },
  cardSmall: { color: '#666', fontSize: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  smallBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: '#f6f6f6' },
  balance: { fontWeight: '700' },
  totalsRow: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee', flexDirection: 'row', justifyContent: 'space-between' },
  totalText: { fontWeight: '700' }
  ,
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap' },
  summaryCard: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#f2f2f2', minWidth: 140, marginRight: 8, marginBottom: 8 },
  summaryLabel: { color: '#666', fontSize: 12 },
  summaryValue: { fontSize: 18, fontWeight: '800', marginTop: 6 },
  tableHeader: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee', marginTop: 8 },
  th: { fontWeight: '700', color: '#444' },
  td: { paddingVertical: 10, color: '#222' },
  tableRow: { flexDirection: 'row', paddingHorizontal: 8, alignItems: 'center' }
  ,
  tdDate: { fontSize: 12, color: '#666' }
  ,
  sheetMobile: { width: '100%', maxWidth: '100%', marginHorizontal: 0, borderRadius: 0 },
  summaryRowMobile: { flexDirection: 'column' },
  tableHeaderMobile: { paddingVertical: 6 },
  tableRowMobile: { paddingVertical: 6 }
  ,
  summaryCardMobile: { width: '48%' }
  ,
  cardHover: { transform: [{ translateY: -4 }], shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, elevation: 6, backgroundColor: '#fff' },
  summaryAccent: { borderColor: '#e6f4ea', backgroundColor: '#fbfff9' }
  ,
  summaryCardHover: { transform: [{ translateY: -6 }], shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 10, elevation: 8, backgroundColor: '#fff' },
  summaryNegativeCard: { borderColor: '#ffdfe0', backgroundColor: '#fff6f6' }
});
