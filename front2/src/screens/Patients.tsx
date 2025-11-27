import React, { useEffect, useState, useRef } from 'react';
import useDebouncedValue from '../hooks/useDebouncedValue';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, ActivityIndicator, Alert, Platform, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import patientsApi, { Patient, PaginatedResponse } from '../api/patients';
import PatientDetailModal from '../ui/PatientDetailModal';
import PatientEditModal from '../ui/PatientEditModal';
import ConfirmModal from '../ui/ConfirmModal';

type Props = {};

export default function Patients(_props: Props) {
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
  const [detailVisible, setDetailVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [toDeleteId, setToDeleteId] = useState<string | null>(null);
  const [createVisible, setCreateVisible] = useState(false);

  const fetchPage = async (p = 1) => {
    setLoading(true);
    try {
      const res = await patientsApi.searchPatients(p, limit, search);
      setData(res.patients || []);
      setPagination(res.pagination || null);
      setPage(p);
    } catch (err) {
      console.error('Failed to fetch patients', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage(1);
  }, []);

  // Defensive: stop third-party content scripts from receiving focus events
  useEffect(() => {
    const handler = (e: any) => {
      try {
        if (!searchRef.current) return;
        if (e.target === searchRef.current || (e.target instanceof Node && searchRef.current.contains && searchRef.current.contains(e.target))) {
          e.stopImmediatePropagation?.();
          e.stopPropagation?.();
        }
      } catch (err) {
        // swallow any errors in our defensive handler
      }
    };

    document.addEventListener('focusin', handler, true);
    return () => document.removeEventListener('focusin', handler, true);
  }, []);

  // Run search when debouncedSearch changes; require min 3 characters unless empty
  useEffect(() => {
    const q = debouncedSearch || '';
    if (q === '' || q.length >= 3) {
      fetchPage(1);
    }
  }, [debouncedSearch]);

  const onView = (p: Patient) => {
    // fetch full patient details and open modal
    (async () => {
      setLoading(true);
      try {
        const full = await patientsApi.getPatient(p._id);
        setSelectedPatient(full);
        setDetailVisible(true);
      } catch (err) {
        console.error('Failed to load patient', err);
        Alert.alert('Erreur', 'Impossible de charger le patient.');
      } finally {
        setLoading(false);
      }
    })();
  };

  const onEdit = (p: Patient) => {
    (async () => {
      setLoading(true);
      try {
        const full = await patientsApi.getPatient(p._id);
        setSelectedPatient(full);
        setEditVisible(true);
      } catch (err) {
        console.error('Failed to load patient for edit', err);
        Alert.alert('Erreur', 'Impossible de charger le patient.');
      } finally {
        setLoading(false);
      }
    })();
  };

  const confirmAndDelete = async (id?: string | null) => {
    const target = id ?? toDeleteId;
    if (!target) return;
    setConfirmVisible(false);
    setToDeleteId(null);
    setLoading(true);
    try {
      await patientsApi.deletePatient(target);
      fetchPage(page);
    } catch (err) {
      console.error('Delete failed', err);
      Alert.alert('Erreur', "La suppression a échoué.");
    } finally {
      setLoading(false);
    }
  };

  const askDelete = (id: string) => {
    setToDeleteId(id);
    setConfirmVisible(true);
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

  // Render pour tableau web
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
        <TouchableOpacity style={styles.tableBtnView} onPress={() => onView(item)}>
          <Text style={styles.tableBtnText}>👁️ Voir</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tableBtnEdit} onPress={() => onEdit(item)}>
          <Text style={styles.tableBtnText}>✏️ Éditer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tableBtnDelete} onPress={() => askDelete(item._id)}>
          <Text style={styles.tableBtnDeleteText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render pour cards mobile (compact - une seule ligne)
  const renderCard = ({ item }: { item: Patient }) => (
    <Pressable 
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onView(item)}
    >
      {/* Avatar compact avec numéro de fiche */}
      <View style={[styles.avatar, { backgroundColor: getAvatarColor(item.lastName) }]}>
        <Text style={styles.avatarText}>{item.patientNumber || '—'}</Text>
      </View>

      {/* Infos patient - une ligne */}
      <View style={styles.cardContent}>
        <Text style={styles.patientName} numberOfLines={1}>
          {item.firstName} {item.lastName}
        </Text>
        <Text style={styles.infoText} numberOfLines={1}>
          {item.phoneNumber ? `📞 ${item.phoneNumber}` : ''}
          {item.phoneNumber && item.email ? '  •  ' : ''}
          {item.email ? `📧 ${item.email}` : ''}
          {!item.phoneNumber && !item.email ? 'Aucun contact' : ''}
        </Text>
      </View>

      {/* Actions compactes */}
      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={(e) => { e.stopPropagation(); onView(item); }}
        >
          <Text style={styles.actionIcon}>👁️</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={(e) => { e.stopPropagation(); onEdit(item); }}
        >
          <Text style={styles.actionIcon}>✏️</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteAction]}
          onPress={(e) => { e.stopPropagation(); askDelete(item._id); }}
        >
          <Text style={styles.actionIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {/* Header avec recherche */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Patients</Text>
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
          <Text style={styles.emptyIcon}>👤</Text>
          <Text style={styles.emptyTitle}>Aucun patient trouvé</Text>
          <Text style={styles.emptyText}>
            {search ? 'Essayez avec d\'autres mots-clés' : 'Commencez par ajouter votre premier patient'}
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

      {/* FAB - Bouton flottant (mobile et web) */}
      <TouchableOpacity 
        style={[styles.fab, isWeb && styles.fabWeb]}
        onPress={() => { setSelectedPatient(null); setEditVisible(true); }}
      >
        <Text style={styles.fabIcon}>＋</Text>
      </TouchableOpacity>

      {/* Modals */}
      <PatientDetailModal 
        visible={detailVisible} 
        patient={selectedPatient} 
        onClose={() => { setDetailVisible(false); setSelectedPatient(null); }} 
      />
      
      <PatientEditModal 
        visible={editVisible} 
        patient={selectedPatient} 
        creating={!selectedPatient} 
        onClose={() => { setEditVisible(false); setSelectedPatient(null); }} 
        onSaved={(updated) => { setEditVisible(false); setSelectedPatient(updated); fetchPage(1); }} 
      />
      
      <ConfirmModal 
        visible={confirmVisible} 
        title="Supprimer le patient" 
        message="Voulez-vous vraiment supprimer ce patient ? Cette action est irréversible." 
        onConfirm={() => confirmAndDelete()} 
        onCancel={() => { setConfirmVisible(false); setToDeleteId(null); }} 
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1976d2',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  addButtonIcon: {
    fontSize: 20,
    color: '#fff',
    marginRight: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // === FAB - Bouton flottant ===
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1976d2',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabIcon: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '300',
    lineHeight: 28,
    textAlign: 'center',
  },
  fabWeb: {
    bottom: 32,
    right: 32,
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
  // === Mobile Cards - Ultra Compact (une ligne) === 
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardPressed: {
    opacity: 0.85,
    backgroundColor: '#fafafa',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  cardContent: {
    flex: 1,
    marginRight: 8,
  },
  patientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
  },
  infoText: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
  },
  deleteAction: {
    backgroundColor: '#ffebee',
  },
  actionIcon: {
    fontSize: 14,
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
  tableBtnView: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
  },
  tableBtnEdit: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
  },
  tableBtnDelete: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#ffebee',
    borderRadius: 6,
  },
  tableBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  tableBtnDeleteText: {
    fontSize: 14,
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
