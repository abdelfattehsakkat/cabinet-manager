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
          <View style={styles.headerTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{patient?.lastName?.charAt(0) ?? 'P'}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.name}>{(patient?.firstName ?? '') + ' ' + (patient?.lastName ?? '')}</Text>
              <Text style={styles.sub}>{patient?.patientNumber ? `Fiche N° ${patient.patientNumber}` : ''}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}><Text style={styles.closeText}>✕</Text></Pressable>
          </View>

          <ScrollView style={styles.body}>
            {!patient && <Text style={styles.empty}>Aucun détail disponible</Text>}
            {patient && (
              <View>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Date de naissance</Text>
                  <Text style={styles.cardValue}>{fmtDateYMD(patient.dateOfBirth)}</Text>
                </View>

                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>E-mail</Text>
                  <Text style={styles.cardValue}>{patient.email || '-'}</Text>
                </View>

                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Téléphone</Text>
                  <Text style={styles.cardValue}>{patient.phoneNumber || '-'}</Text>
                </View>

                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Adresse</Text>
                  <Text style={styles.cardValue}>{patient.address || '-'}</Text>
                </View>

                {patient.documents && patient.documents.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>Documents</Text>
                    <View style={styles.docBox}><Text style={styles.mono}>{JSON.stringify(patient.documents, null, 2)}</Text></View>
                  </>
                )}

                <View style={{ height: 10 }} />
                <Text style={styles.meta}>{patient.createdAt ? `Créé: ${fmtDateYMDHM(patient.createdAt)}` : ''}{patient.updatedAt ? ` • Mis à jour: ${fmtDateYMDHM(patient.updatedAt)}` : ''}</Text>
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
  headerTop: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#2e7d32', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 20 },
  name: { fontSize: 16, fontWeight: '800' },
  sub: { color: '#666', fontSize: 12, marginTop: 2 },
  closeBtn: { padding: 6 },
  closeText: { fontSize: 16 },
  body: { padding: 10 },
  empty: { textAlign: 'center', color: '#666' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f6f6f6' },
  cardLabel: { color: '#666', width: '50%' },
  cardValue: { fontWeight: '600', width: '50%', textAlign: 'right' },
  sectionTitle: { marginTop: 12, fontWeight: '700' },
  docBox: { backgroundColor: '#fafafa', padding: 10, borderRadius: 6, marginTop: 6 },
  meta: { color: '#888', fontSize: 12, marginTop: 10 },
  mono: { fontFamily: 'monospace', fontSize: 12, color: '#333', marginTop: 6 }
});
