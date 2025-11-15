import React, { useEffect, useState, useRef } from 'react';
import useDebouncedValue from '../hooks/useDebouncedValue';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, ActivityIndicator, Alert, Button } from 'react-native';
import patientsApi, { Patient, PaginatedResponse } from '../api/patients';

type Props = {};

export default function Patients(_props: Props) {
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const searchRef = useRef<any>(null);
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [data, setData] = useState<Patient[]>([]);
  const [pagination, setPagination] = useState<PaginatedResponse['pagination'] | null>(null);

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
    Alert.alert('Voir patient', `Id fiche: ${p._id}\nNom: ${p.lastName}\nPrénom: ${p.firstName}`);
  };

  const onEdit = (p: Patient) => {
    Alert.alert('Éditer patient', `Ouvrir le formulaire d'édition pour ${p.firstName} ${p.lastName} (ID ${p._id})`);
  };

  const onDelete = async (id: string) => {
    Alert.alert('Confirmer', 'Voulez-vous supprimer ce patient ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        setLoading(true);
        try {
          await patientsApi.deletePatient(id);
          fetchPage(page);
        } catch (err) {
          console.error('Delete failed', err);
        } finally {
          setLoading(false);
        }
      }}
    ]);
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
        <Pressable onPress={() => onView(item)} style={styles.iconBtn} accessibilityLabel="Voir">
          <Text style={styles.icon}>🔍</Text>
        </Pressable>
        <Pressable onPress={() => onEdit(item)} style={styles.iconBtn} accessibilityLabel="Éditer">
          <Text style={styles.icon}>✏️</Text>
        </Pressable>
        <Pressable onPress={() => onDelete(item._id)} style={styles.deleteBtn} accessibilityLabel="Supprimer">
          <Text style={{ color: '#fff' }}>🗑️</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Patients</Text>
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
  deleteBtn: { backgroundColor: '#d32f2f', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6 },
  pager: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12 }
});
