import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, Dimensions, Platform, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Patient } from '../api/patients';

type Props = {
  visible: boolean;
  patient?: Patient | null;
  onClose: () => void;
};

export default function PatientDetailModal({ visible, patient, onClose }: Props) {
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
    return (f + l).toUpperCase() || 'P';
  };

  const formatDate = (date?: string | null) => {
    if (!date) return '-';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('fr-FR');
  };

  const formatDateTime = (date?: string | null) => {
    if (!date) return '-';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const calculateAge = (birthDate?: string | null) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(patient?.dateOfBirth);
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent={isWeb} onRequestClose={onClose}>
      <View style={[styles.backdrop, !isWeb && styles.backdropMobile]}>
        <View style={[styles.modal, isWeb ? styles.modalWeb : styles.modalMobile, !isWeb && { paddingTop: insets.top }]}>
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
            <TouchableOpacity 
              style={styles.headerCloseBtn}
              onPress={onClose}
            >
              <Text style={styles.headerCloseIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Info Cards */}
          <View style={styles.infoCardsContainer}>
            {age !== null && (
              <View style={[styles.infoCard, styles.infoCardAge]}>
                <Text style={styles.infoCardIcon}>🎂</Text>
                <Text style={styles.infoCardLabel}>Âge</Text>
                <Text style={styles.infoCardValue}>{age} ans</Text>
              </View>
            )}
            {patient?.phoneNumber && (
              <View style={[styles.infoCard, styles.infoCardPhone]}>
                <Text style={styles.infoCardIcon}>📞</Text>
                <Text style={styles.infoCardLabel}>Téléphone</Text>
                <Text style={styles.infoCardValue}>{patient.phoneNumber}</Text>
              </View>
            )}
            {patient?.email && (
              <View style={[styles.infoCard, styles.infoCardEmail]}>
                <Text style={styles.infoCardIcon}>📧</Text>
                <Text style={styles.infoCardLabel}>Email</Text>
                <Text style={styles.infoCardValue} numberOfLines={1}>{patient.email}</Text>
              </View>
            )}
          </View>

          {/* Content */}
          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            {!patient ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>👤</Text>
                <Text style={styles.emptyText}>Aucun détail disponible</Text>
              </View>
            ) : (
              <>
                {/* Section Informations personnelles */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>📋 Informations personnelles</Text>
                  
                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <Text style={styles.detailIconText}>🎂</Text>
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Date de naissance</Text>
                      <Text style={styles.detailValue}>
                        {formatDate(patient.dateOfBirth)}
                        {age !== null && ` (${age} ans)`}
                      </Text>
                    </View>
                  </View>

                  {patient.phoneNumber && (
                    <View style={styles.detailRow}>
                      <View style={styles.detailIcon}>
                        <Text style={styles.detailIconText}>📞</Text>
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Téléphone</Text>
                        <Text style={styles.detailValue}>{patient.phoneNumber}</Text>
                      </View>
                    </View>
                  )}

                  {patient.email && (
                    <View style={styles.detailRow}>
                      <View style={styles.detailIcon}>
                        <Text style={styles.detailIconText}>📧</Text>
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Email</Text>
                        <Text style={styles.detailValue}>{patient.email}</Text>
                      </View>
                    </View>
                  )}

                  {patient.address && (
                    <View style={styles.detailRow}>
                      <View style={styles.detailIcon}>
                        <Text style={styles.detailIconText}>📍</Text>
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Adresse</Text>
                        <Text style={styles.detailValue}>{patient.address}</Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Section Documents */}
                {patient.documents && patient.documents.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📎 Documents</Text>
                    <View style={styles.documentsContainer}>
                      {patient.documents.map((doc: any, idx: number) => (
                        <View key={idx} style={styles.documentCard}>
                          <Text style={styles.documentIcon}>📄</Text>
                          <Text style={styles.documentName} numberOfLines={1}>
                            {doc.name || doc.filename || `Document ${idx + 1}`}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Footer metadata */}
                <View style={styles.metadataSection}>
                  <View style={styles.metadataRow}>
                    <Text style={styles.metadataIcon}>📅</Text>
                    <Text style={styles.metadataText}>
                      Créé le {formatDateTime(patient.createdAt)}
                    </Text>
                  </View>
                  {patient.updatedAt && (
                    <View style={styles.metadataRow}>
                      <Text style={styles.metadataIcon}>🔄</Text>
                      <Text style={styles.metadataText}>
                        Mis à jour le {formatDateTime(patient.updatedAt)}
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </ScrollView>
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
    maxWidth: 700,
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
  // === Info Cards ===
  infoCardsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    flexWrap: 'wrap',
  },
  infoCard: {
    flex: 1,
    minWidth: 150,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoCardAge: {
    backgroundColor: '#e3f2fd',
    borderLeftWidth: 4,
    borderLeftColor: '#1976d2',
  },
  infoCardPhone: {
    backgroundColor: '#f3e5f5',
    borderLeftWidth: 4,
    borderLeftColor: '#7b1fa2',
  },
  infoCardEmail: {
    backgroundColor: '#e8f5e9',
    borderLeftWidth: 4,
    borderLeftColor: '#2e7d32',
  },
  infoCardIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  infoCardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoCardValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#212121',
    textAlign: 'center',
  },
  // === Content ===
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
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
  // === Section ===
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 12,
  },
  // === Detail Row ===
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailIconText: {
    fontSize: 20,
  },
  detailContent: {
    flex: 1,
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
  },
  // === Documents ===
  documentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 8,
  },
  documentIcon: {
    fontSize: 18,
  },
  documentName: {
    fontSize: 13,
    color: '#212121',
    fontWeight: '500',
    maxWidth: 150,
  },
  // === Metadata ===
  metadataSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metadataIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  metadataText: {
    fontSize: 12,
    color: '#999',
  },
});
