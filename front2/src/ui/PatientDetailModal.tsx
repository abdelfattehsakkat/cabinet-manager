import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet, ScrollView, Dimensions, Platform } from 'react-native';
import { Patient } from '../api/patients';

function fmtDateYMD(d?: string | null) {
  if (!d) return '-';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}/${m}/${day}`;
}

function fmtDateYMDHM(d?: string | null) {
  if (!d) return '';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  const hh = String(dt.getHours()).padStart(2, '0');
  const mm = String(dt.getMinutes()).padStart(2, '0');
  return `${y}/${m}/${day} ${hh}:${mm}`;
}

type Props = {
  visible: boolean;
  patient?: Patient | null;
  onClose: () => void;
};

export default function PatientDetailModal({ visible, patient, onClose }: Props) {
  const win = Dimensions.get('window');
  const isWeb = Platform.OS === 'web';
  // compute dynamic width: on web keep narrow percentage of window width, on mobile use almost-full width but with comfortable margin
  const sheetWidthStyle = isWeb
    ? { width: Math.min(Math.round(win.width * 0.6), 520) }
    : { width: Math.min(win.width - 40, 560) };
  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.backdrop}>
  <View style={[styles.sheet, sheetWidthStyle]}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>{patient?.patientNumber ? <Text style={{ fontWeight: '800' }}>{String(patient.patientNumber)}</Text> : 'Détails patient'}</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}><Text style={styles.closeText}>✕</Text></Pressable>
          </View>

          <ScrollView style={styles.body}>
            {!patient && <Text style={styles.empty}>Aucun détail disponible</Text>}
            {patient && (
              <View>
                <View style={styles.row}><Text style={styles.label}>Nom</Text><Text style={styles.value}>{patient.lastName}</Text></View>
                <View style={styles.row}><Text style={styles.label}>Prénom</Text><Text style={styles.value}>{patient.firstName}</Text></View>
                <View style={styles.row}><Text style={styles.label}>Date de naissance</Text><Text style={styles.value}>{fmtDateYMD(patient.dateOfBirth)}</Text></View>
                <View style={styles.row}><Text style={styles.label}>E-mail</Text><Text style={styles.value}>{patient.email || '-'}</Text></View>
                <View style={styles.row}><Text style={styles.label}>Téléphone</Text><Text style={styles.value}>{patient.phoneNumber || '-'}</Text></View>
                <View style={styles.row}><Text style={styles.label}>Adresse</Text><Text style={styles.value}>{patient.address || '-'}</Text></View>
                {patient.documents && patient.documents.length > 0 && (
                  <>
                    <View style={{ height: 8 }} />
                    <Text style={styles.sectionTitle}>Documents</Text>
                    <Text style={styles.mono}>{JSON.stringify(patient.documents, null, 2)}</Text>
                  </>
                )}
                <View style={{ height: 6 }} />
                <Text style={{ color: '#888', fontSize: 12 }}>{patient.createdAt ? `Créé: ${fmtDateYMDHM(patient.createdAt)}` : ''}{patient.updatedAt ? ` • Mis à jour: ${fmtDateYMDHM(patient.updatedAt)}` : ''}</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 12 },
  sheet: { backgroundColor: '#fff', borderRadius: 10, maxHeight: '70%', width: '60%', maxWidth: 520, alignSelf: 'center', overflow: 'hidden' },
  headerRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 16, fontWeight: '700', flex: 1 },
  closeBtn: { padding: 6 },
  closeText: { fontSize: 16 },
  body: { padding: 10 },
  empty: { textAlign: 'center', color: '#666' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, alignItems: 'center' },
  label: { color: '#666', marginRight: 8, width: '38%' },
  value: { fontWeight: '600', width: '62%', textAlign: 'right' },
  sectionTitle: { marginTop: 6, fontWeight: '700' },
  mono: { fontFamily: 'monospace', fontSize: 12, color: '#333', marginTop: 6 }
});
