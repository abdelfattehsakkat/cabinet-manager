import React, { useEffect, useState, useRef } from 'react';
import useDebouncedValue from '../hooks/useDebouncedValue';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, ActivityIndicator, Platform, TouchableOpacity, useWindowDimensions } from 'react-native';
import patientsApi, { Patient, PaginatedResponse } from '../api/patients';
import PatientTreatmentsModal from '../ui/PatientTreatmentsModal';
import TreatmentDialog from '../ui/TreatmentDialog';

type Props = {};

export default function Treatments(_props: Props) {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const searchRef = useRef<any>(null);
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [data, setData] = useState<Patient[]>([]);
  const [pagination, setPagination] = useState<PaginatedResponse['pagination'] | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientModalVisible, setPatientModalVisible] = useState(false);
  const [addDialogVisible, setAddDialogVisible] = useState(false);
  const [addDialogPatient, setAddDialogPatient] = useState<Patient | null>(null);

  const fetchPage = async (p = 1) => {
    setLoading(true);
    try {
      // Use patients API to populate one row per patient (old frontend behavior)
      const res = await patientsApi.searchPatients(p, limit, search);
      setData(res.patients || []);
      setPagination(res.pagination || null);
      setPage(p);
    } catch (err) {
      console.error('Failed to fetch patients for treatments view', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage(1);
  }, []);

  useEffect(() => {
    const q = debouncedSearch || '';
    if (q === '' || q.length >= 3) {
      fetchPage(1);
    }
  }, [debouncedSearch]);

  const onViewTreatments = async (p: Patient) => {
    setSelectedPatient(p);
    setPatientModalVisible(true);
    console.log('[Treatments] onViewTreatments', p?._id, p?.firstName, p?.lastName);
  };

  const onAddTreatment = async (p: Patient) => {
    setAddDialogPatient(p);
    setAddDialogVisible(true);
  };

  // Génère couleur d'avatar basée sur le nom
  const getAvatarColor = (name: string) => {
    const colors = ['#1976d2', '#2e7d32', '#9c27b0', '#d32f2f', '#f57c00', '#0288d1', '#c2185b'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Génère initiales pour l'avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Render tableau web
  const renderTableRow = ({ item }: { item: Patient }) => (
    <View style={styles.tableRow}>
      <View style={styles.tableCell1}>
        <View style={[styles.avatarSmall, { backgroundColor: getAvatarColor(item.lastName) }]}>
          <Text style={styles.avatarSmallText}>{getInitials(item.firstName, item.lastName)}</Text>
        </View>
        <View>
          <Text style={styles.tableName}>{item.firstName} {item.lastName}</Text>
          <Text style={styles.tableSubtext}>#{item.patientNumber || '—'}</Text>
        </View>
      </View>
      <View style={styles.tableCell2}>
        <Text style={styles.tableText}>📞 {item.phoneNumber || 'N/A'}</Text>
      </View>
      <View style={styles.tableCell3}>
        <Text style={styles.tableText} numberOfLines={1}>📧 {item.email || 'N/A'}</Text>
      </View>
      <View style={styles.tableCell4}>
        <TouchableOpacity style={styles.tableBtnAdd} onPress={() => onAddTreatment(item)}>
          <Text style={styles.tableBtnAddText}>➕ Ajouter</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tableBtnView} onPress={() => onViewTreatments(item)}>
          <Text style={styles.tableBtnText}>👁️ Voir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render card mobile - compact
  const renderCard = ({ item }: { item: Patient }) => (
    <Pressable 
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onViewTreatments(item)}
    >
      {/* Avatar avec initiales */}
      <View style={[styles.avatar, { backgroundColor: getAvatarColor(item.lastName) }]}>
        <Text style={styles.avatarText}>{getInitials(item.firstName, item.lastName)}</Text>
      </View>

      {/* Contenu */}
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.patientName}>
            {item.firstName} {item.lastName}
          </Text>
          <Text style={styles.patientNumber}>#{item.patientNumber || '—'}</Text>
        </View>

        {/* Informations - compact */}
        <View style={styles.cardInfo}>
          {item.phoneNumber && <Text style={styles.infoText}>📞 {item.phoneNumber}</Text>}
          {item.email && <Text style={styles.infoText} numberOfLines={1}>📧 {item.email}</Text>}
        </View>

        {/* Actions - compact */}
        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.addAction]}
            onPress={(e) => { e.stopPropagation(); onAddTreatment(item); }}
          >
            <Text style={styles.actionIcon}>➕</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={(e) => { e.stopPropagation(); onViewTreatments(item); }}
          >
            <Text style={styles.actionIcon}>👁️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {/* Header avec recherche */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Soins</Text>
        <Text style={styles.subtitle}>
          {pagination ? `${pagination.totalCount} patient${pagination.totalCount > 1 ? 's' : ''}` : ''}
        </Text>
        
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput 
            ref={searchRef}
            placeholder="Rechercher un patient..." 
            value={search} 
            onChangeText={setSearch} 
            style={styles.searchInput}
            placeholderTextColor="#999"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Loading */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976d2" />
        </View>
      )}

      {/* Empty State */}
      {!loading && data.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>💉</Text>
          <Text style={styles.emptyTitle}>Aucun patient trouvé</Text>
          <Text style={styles.emptyText}>
            {search ? 'Essayez avec d\'autres mots-clés' : 'Les patients s\'afficheront ici'}
          </Text>
        </View>
      )}

      {/* Liste web: tableau moderne */}
      {!loading && data.length > 0 && isWeb && (
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>Patient</Text>
            <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Téléphone</Text>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>Email</Text>
            <Text style={[styles.tableHeaderText, { flex: 1.8 }]}>Actions</Text>
          </View>
          <FlatList 
            data={data} 
            keyExtractor={p => p._id} 
            renderItem={renderTableRow}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {/* Liste mobile: cards compactes */}
      {!loading && data.length > 0 && !isWeb && (
        <FlatList 
          data={data} 
          keyExtractor={p => p._id} 
          renderItem={renderCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Pagination */}
      {!loading && pagination && pagination.totalPages > 1 && (
        <View style={styles.paginationContainer}>
          <TouchableOpacity 
            style={[styles.paginationButton, (!pagination.hasPrevPage) && styles.paginationButtonDisabled]}
            onPress={() => fetchPage(Math.max(1, page - 1))}
            disabled={!pagination.hasPrevPage}
          >
            <Text style={[styles.paginationButtonText, (!pagination.hasPrevPage) && styles.paginationButtonTextDisabled]}>
              ← Préc
            </Text>
          </TouchableOpacity>
          
          <View style={styles.paginationInfo}>
            <Text style={styles.paginationText}>
              Page {pagination.currentPage} / {pagination.totalPages}
            </Text>
            <Text style={styles.paginationSubtext}>
              {data.length} sur {pagination.totalCount}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.paginationButton, (!pagination.hasNextPage) && styles.paginationButtonDisabled]}
            onPress={() => fetchPage(page + 1)}
            disabled={!pagination.hasNextPage}
          >
            <Text style={[styles.paginationButtonText, (!pagination.hasNextPage) && styles.paginationButtonTextDisabled]}>
              Suiv →
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modals */}
      <PatientTreatmentsModal 
        visible={patientModalVisible} 
        patient={selectedPatient} 
        onClose={() => { setPatientModalVisible(false); setSelectedPatient(null); }} 
      />
      
      <TreatmentDialog 
        visible={addDialogVisible} 
        patient={addDialogPatient} 
        onClose={() => { setAddDialogVisible(false); setAddDialogPatient(null); }} 
        onSaved={() => { setAddDialogVisible(false); setAddDialogPatient(null); fetchPage(1); }} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    backgroundColor: '#fff',
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    ...(Platform.OS === 'web' && {
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    }),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
    color: '#212121',
    ...(Platform.OS === 'web' && {
      outlineStyle: 'none' as any,
    }),
  },
  clearBtn: {
    padding: 4,
  },
  clearIcon: {
    fontSize: 18,
    color: '#999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.3,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  // === Mobile Cards - Compact ===
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
  },
  patientNumber: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  cardInfo: {
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  infoIcon: {
    fontSize: 13,
    marginRight: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  treatmentHint: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
  },
  addAction: {
    backgroundColor: '#e8f5e9',
  },
  actionIcon: {
    fontSize: 16,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    marginTop: 2,
  },
  addLabel: {
    color: '#2e7d32',
  },
  // === Web Table - Modern ===
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
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
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    alignItems: 'center',
  },
  tableCell1: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableCell2: {
    flex: 1.5,
  },
  tableCell3: {
    flex: 2,
  },
  tableCell4: {
    flex: 1.8,
    flexDirection: 'row',
    gap: 6,
  },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarSmallText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  tableName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
  },
  tableSubtext: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  tableText: {
    fontSize: 13,
    color: '#666',
  },
  tableBtnAdd: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#e8f5e9',
    borderRadius: 6,
  },
  tableBtnAddText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2e7d32',
  },
  tableBtnView: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
  },
  tableBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  paginationButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#1976d2',
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  paginationButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  paginationButtonTextDisabled: {
    color: '#999',
  },
  paginationInfo: {
    alignItems: 'center',
  },
  paginationText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
  },
  paginationSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
});
