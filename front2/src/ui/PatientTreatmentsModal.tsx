import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, Alert, Platform, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import treatmentsApi, { Treatment } from '../api/treatments';
import { Patient } from '../api/patients';
import TreatmentDialog from './TreatmentDialog';
import ConfirmModal from './ConfirmModal';

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
  const [editTreatment, setEditTreatment] = useState<Treatment | null>(null);

  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);
  const isWeb = windowWidth >= 768;

  useEffect(() => {
    const onChange = ({ window }: { window: { width: number } }) => setWindowWidth(window.width);
    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, []);

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
      setEditTreatment(null);
    }
  }, [visible, patient]);

  const calculateTotals = () => {
    const totalHonoraires = treatments.reduce((s, t) => s + (t.honoraire || 0), 0);
    const totalRecu = treatments.reduce((s, t) => s + (t.recu || 0), 0);
    const totalBalance = totalRecu - totalHonoraires;
    return { totalHonoraires, totalRecu, totalBalance };
  };

  const onSaved = () => {
    setDialogVisible(false);
    setEditTreatment(null);
    fetch(1);
  };

  const askDelete = (id: string) => {
    setToDeleteId(id);
    setConfirmVisible(true);
  };

  const doDelete = async () => {
    if (!toDeleteId) return;
    setConfirmVisible(false);
    setLoading(true);
    try {
      await treatmentsApi.deleteTreatment(toDeleteId);
      setToDeleteId(null);
      fetch(1);
    } catch (err) {
      console.error('Delete failed', err);
      Alert.alert('Erreur', "La suppression a échoué.");
    } finally {
      setLoading(false);
    }
  };

  const getAvatarColor = (name?: string) => {
    if (!name) return '#2e7d32';
    const colors = ['#1976d2', '#2e7d32', '#9c27b0', '#d32f2f', '#f57c00', '#0288d1', '#c2185b'];
    return colors[name.charCodeAt(0) % colors.length];
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const f = firstName?.charAt(0) || '';
    const l = lastName?.charAt(0) || '';
    return (f + l).toUpperCase() || 'P';
  };

  const totals = calculateTotals();

  // Render for Web: Modern Table
  const renderWebTable = () => (
    <View style={styles.tableContainer}>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, { flex: 1.2 }]}>Date</Text>
        <Text style={[styles.tableHeaderText, { flex: 0.8 }]}>Dent</Text>
        <Text style={[styles.tableHeaderText, { flex: 3 }]}>Description</Text>
        <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Honoraires</Text>
        <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Reçu</Text>
        <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Balance</Text>
        <View style={{ width: 100 }} />
      </View>
      <ScrollView style={{ maxHeight: 400 }}>
        {treatments.map((item) => {
          const balance = (item.recu || 0) - (item.honoraire || 0);
          return (
            <View key={item._id} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1.2 }]}>
                {item.treatmentDate ? new Date(item.treatmentDate).toLocaleDateString('fr-FR') : '-'}
              </Text>
              <Text style={[styles.tableCell, { flex: 0.8, fontWeight: '600' }]}>
                {item.dent ?? '-'}
              </Text>
              <Text style={[styles.tableCell, { flex: 3 }]} numberOfLines={2}>
                {item.description}
              </Text>
              <Text style={[styles.tableCell, styles.tableCellNumber, { flex: 1 }]}>
                {item.honoraire ?? '-'}
              </Text>
              <Text style={[styles.tableCell, styles.tableCellNumber, { flex: 1 }]}>
                {item.recu ?? '-'}
              </Text>
              <Text style={[styles.tableCell, styles.tableCellNumber, { flex: 1, color: balance < 0 ? '#d32f2f' : balance > 0 ? '#2e7d32' : '#666' }]}>
                {balance}
              </Text>
              <View style={styles.tableActions}>
                <TouchableOpacity 
                  style={styles.actionBtnEdit}
                  onPress={() => { setEditTreatment(item); setDialogVisible(true); }}
                >
                  <Text style={styles.actionBtnText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionBtnDelete}
                  onPress={() => askDelete(item._id)}
                >
                  <Text style={styles.actionBtnText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );

  // Render for Mobile: Cards
  const renderMobileCards = () => (
    <FlatList 
      data={treatments}
      keyExtractor={t => t._id}
      contentContainerStyle={{ padding: 12 }}
      renderItem={({ item }) => {
        const balance = (item.recu || 0) - (item.honoraire || 0);
        return (
          <View style={styles.treatmentCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.dentBadge}>
                  <Text style={styles.dentBadgeText}>{item.dent ?? '-'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardDate}>
                    {item.treatmentDate ? new Date(item.treatmentDate).toLocaleDateString('fr-FR') : '-'}
                  </Text>
                  <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                </View>
              </View>
            </View>

            <View style={styles.cardAmounts}>
              <View style={styles.amountItem}>
                <Text style={styles.amountLabel}>Honoraires</Text>
                <Text style={styles.amountValue}>{item.honoraire ?? 0} DT</Text>
              </View>
              <View style={styles.amountItem}>
                <Text style={styles.amountLabel}>Reçu</Text>
                <Text style={styles.amountValue}>{item.recu ?? 0} DT</Text>
              </View>
              <View style={[styles.amountItem, styles.amountItemBalance]}>
                <Text style={styles.amountLabel}>Balance</Text>
                <Text style={[styles.amountValue, { color: balance < 0 ? '#d32f2f' : balance > 0 ? '#2e7d32' : '#666' }]}>
                  {balance} DT
                </Text>
              </View>
            </View>

            <View style={styles.cardActions}>
              <TouchableOpacity 
                style={styles.cardActionBtn}
                onPress={() => { setEditTreatment(item); setDialogVisible(true); }}
              >
                <Text style={styles.cardActionIcon}>✏️</Text>
                <Text style={styles.cardActionLabel}>Modifier</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.cardActionBtn, styles.cardActionBtnDelete]}
                onPress={() => askDelete(item._id)}
              >
                <Text style={styles.cardActionIcon}>🗑️</Text>
                <Text style={[styles.cardActionLabel, styles.cardActionLabelDelete]}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }}
    />
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={isWeb} onRequestClose={onClose}>
      <View style={[styles.backdrop, !isWeb && styles.backdropMobile]}>
        <View style={[styles.modal, isWeb ? styles.modalWeb : styles.modalMobile]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.avatar, { backgroundColor: getAvatarColor(patient?.lastName) }]}>
              <Text style={styles.avatarText}>
                {getInitials(patient?.firstName, patient?.lastName)}
              </Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.patientName}>
                {patient?.firstName} {patient?.lastName}
              </Text>
              <Text style={styles.patientNumber}>
                Fiche N° {patient?.patientNumber || '—'}
              </Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.headerAddBtn}
                onPress={() => { setEditTreatment(null); setDialogVisible(true); }}
              >
                <Text style={styles.headerAddIcon}>＋</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.headerCloseBtn}
                onPress={onClose}
              >
                <Text style={styles.headerCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Summary Cards */}
          <View style={styles.summaryContainer}>
            <View style={[styles.summaryCard, styles.summaryCardHonoraires]}>
              <Text style={styles.summaryLabel}>Honoraires</Text>
              <Text style={styles.summaryValue}>{totals.totalHonoraires}DT</Text>
            </View>
            <View style={[styles.summaryCard, styles.summaryCardRecu]}>
              <Text style={styles.summaryLabel}>Reçu</Text>
              <Text style={styles.summaryValue}>{totals.totalRecu}DT</Text>
            </View>
            <View style={[
              styles.summaryCard, 
              totals.totalBalance < 0 ? styles.summaryCardNegative : 
              totals.totalBalance > 0 ? styles.summaryCardPositive : 
              styles.summaryCardNeutral
            ]}>
              <Text style={styles.summaryLabel}>Balance</Text>
              <Text style={[
                styles.summaryValue,
                { color: totals.totalBalance < 0 ? '#d32f2f' : totals.totalBalance > 0 ? '#2e7d32' : '#666' }
              ]}>
                {totals.totalBalance}DT
              </Text>
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1976d2" />
              </View>
            ) : treatments.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>💉</Text>
                <Text style={styles.emptyText}>Aucun soin enregistré</Text>
              </View>
            ) : (
              isWeb ? renderWebTable() : renderMobileCards()
            )}
          </View>

          {/* Modals */}
          <TreatmentDialog 
            visible={dialogVisible} 
            patient={patient} 
            onClose={() => { setDialogVisible(false); setEditTreatment(null); }} 
            onSaved={onSaved} 
          />
          
          <ConfirmModal 
            visible={confirmVisible} 
            title="Supprimer le soin" 
            message="Voulez-vous vraiment supprimer ce soin ?" 
            onConfirm={doDelete} 
            onCancel={() => { setConfirmVisible(false); setToDeleteId(null); }} 
          />
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
    maxWidth: 1100,
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
  patientName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
  },
  patientNumber: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerAddBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4caf50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  headerAddIcon: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '700',
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
  // === Summary Cards ===
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryCardHonoraires: {
    backgroundColor: '#e3f2fd',
    borderLeftWidth: 4,
    borderLeftColor: '#1976d2',
  },
  summaryCardRecu: {
    backgroundColor: '#f3e5f5',
    borderLeftWidth: 4,
    borderLeftColor: '#7b1fa2',
  },
  summaryCardNegative: {
    backgroundColor: '#ffebee',
    borderLeftWidth: 4,
    borderLeftColor: '#d32f2f',
  },
  summaryCardPositive: {
    backgroundColor: '#e8f5e9',
    borderLeftWidth: 4,
    borderLeftColor: '#2e7d32',
  },
  summaryCardNeutral: {
    backgroundColor: '#f5f5f5',
    borderLeftWidth: 4,
    borderLeftColor: '#9e9e9e',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
    marginTop: 8,
  },
  // === Content ===
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    opacity: 0.3,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  // === Web Table ===
  tableContainer: {
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 14,
    color: '#212121',
    paddingRight: 8,
  },
  tableCellNumber: {
    textAlign: 'right',
    fontWeight: '600',
  },
  tableActions: {
    flexDirection: 'row',
    gap: 8,
    width: 100,
    justifyContent: 'flex-end',
  },
  actionBtnEdit: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
  },
  actionBtnDelete: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ffebee',
    borderRadius: 6,
  },
  actionBtnText: {
    fontSize: 16,
  },
  // === Mobile Cards ===
  treatmentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  dentBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1976d2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dentBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  cardDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
  },
  cardAmounts: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  amountItem: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
  },
  amountItemBalance: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  amountLabel: {
    fontSize: 10,
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  cardActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    gap: 6,
  },
  cardActionBtnDelete: {
    backgroundColor: '#ffebee',
  },
  cardActionIcon: {
    fontSize: 16,
  },
  cardActionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  cardActionLabelDelete: {
    color: '#d32f2f',
  },
});
