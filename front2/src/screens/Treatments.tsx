import React, { useEffect, useState, useRef } from 'react';
import useDebouncedValue from '../hooks/useDebouncedValue';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, ActivityIndicator, Alert, Button } from 'react-native';
import patientsApi, { Patient, PaginatedResponse } from '../api/patients';
import PatientTreatmentsModal from '../ui/PatientTreatmentsModal';
import TreatmentDialog from '../ui/TreatmentDialog';

type Props = {};

export default function Treatments(_props: Props) {
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const searchRef = useRef<any>(null);
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
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

  const renderHeader = () => (
    <View style={styles.headerRow}>
      <Text style={[styles.headerCell, { flex: 2 }]}>Fiche</Text>
      <Text style={[styles.headerCell, { flex: 3 }]}>Nom</Text>
      <Text style={[styles.headerCell, { flex: 3 }]}>Prénom</Text>
      <Text style={[styles.headerCell, { flex: 2, textAlign: 'center' }]}>Actions</Text>
    </View>
  );

  const renderItem = ({ item }: { item: Patient }) => (
    <View style={styles.row}>
      <Text style={[styles.cell, { flex: 2 }]}>{item.patientNumber ?? '-'}</Text>
      <Text style={[styles.cell, { flex: 3 }]}>{item.lastName}</Text>
      <Text style={[styles.cell, { flex: 3 }]}>{item.firstName}</Text>
      <View style={[styles.cell, { flex: 2, flexDirection: 'row', justifyContent: 'center' }]}>
        <Pressable onPress={() => onAddTreatment(item)} style={styles.iconBtn} accessibilityLabel="Ajouter soin" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.icon}>＋</Text>
        </Pressable>
        <Pressable onPress={() => onViewTreatments(item)} style={styles.iconBtn} accessibilityLabel="Voir soins" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.icon}>🔍</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Soins</Text>
        <View style={styles.searchRow}>
          <TextInput ref={searchRef} placeholder="Rechercher..." value={search} onChangeText={setSearch} style={styles.searchInput} />
        </View>
      </View>

      {loading && <ActivityIndicator style={{ marginTop: 20 }} />}

      {!loading && (
        <>
          {renderHeader()}
          <FlatList data={data} keyExtractor={p => p._id} renderItem={renderItem} ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#eee' }} />} />
        </>
      )}

      <View style={styles.pager}>
        <Button title="Préc" onPress={() => fetchPage(Math.max(1, page - 1))} disabled={!pagination || !pagination.hasPrevPage} />
        <Text style={{ marginHorizontal: 12 }}>{pagination ? `${pagination.currentPage} / ${pagination.totalPages}` : page}</Text>
        <Button title="Suiv" onPress={() => fetchPage(page + 1)} disabled={!pagination || !pagination.hasNextPage} />
      </View>
  <PatientTreatmentsModal visible={patientModalVisible} patient={selectedPatient} onClose={() => { setPatientModalVisible(false); setSelectedPatient(null); }} />
  <TreatmentDialog visible={addDialogVisible} patient={addDialogPatient} onClose={() => { setAddDialogVisible(false); setAddDialogPatient(null); }} onSaved={() => { setAddDialogVisible(false); setAddDialogPatient(null); fetchPage(1); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700' },
  searchRow: { flexDirection: 'row', marginTop: 8, alignItems: 'center' },
  searchInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 8, height: 40, marginRight: 8 },
  headerRow: { flexDirection: 'row', paddingVertical: 6, alignItems: 'center', backgroundColor: '#f7f7f7', paddingHorizontal: 8 },
  headerCell: { fontWeight: '700' },
  row: { flexDirection: 'row', paddingVertical: 4, alignItems: 'center', paddingHorizontal: 8 },
  cell: { paddingVertical: 2 },
  iconBtn: { paddingHorizontal: 6, paddingVertical: 4, marginRight: 4 },
  icon: { fontSize: 16 },
  deleteBtn: { backgroundColor: 'transparent', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#eee', marginLeft: 4 },
  deleteIcon: { color: '#6c757d', fontSize: 16 },
  addBtn: { marginLeft: 8, backgroundColor: '#edf7ee', borderRadius: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: '#e0f0df', height: 40, minWidth: 56, justifyContent: 'center', alignItems: 'center' },
  addIcon: { color: '#2e7d32', fontSize: 16, fontWeight: '700' },
  addBtnPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  pager: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12 }
});
