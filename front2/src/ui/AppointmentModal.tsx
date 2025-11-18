import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet, Platform, FlatList } from 'react-native';
import api from '../api/client';
import { searchPatients, createPatient, Patient } from '../api/patients';

type Props = {
  visible: boolean;
  initial?: string | null; // ISO date string
  initialDuration?: number;
  onClose: () => void;
  onCreated?: () => void;
};

export default function AppointmentModal({ visible, initial, initialDuration = 30, onClose, onCreated }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateStr, setDateStr] = useState(initial || '');
  const [duration, setDuration] = useState(String(initialDuration));
  const [type, setType] = useState('Consultation');
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const debounceRef = useRef<number | null>(null as any);

  useEffect(() => {
    setDateStr(initial || '');
    setDuration(String(initialDuration));
  }, [initial, initialDuration, visible]);

  // Reset internal state when modal closes to keep UX predictable
  useEffect(() => {
    if (!visible) {
      setQuery('');
      setSuggestions([]);
      setSelectedPatient(null);
      setFirstName('');
      setLastName('');
      setType('Consultation');
      setLoading(false);
    }
  }, [visible]);

  useEffect(() => {
    // when a patient is selected, reflect into name fields
    if (selectedPatient) {
      setFirstName(selectedPatient.firstName || '');
      setLastName(selectedPatient.lastName || '');
    }
  }, [selectedPatient]);

  useEffect(() => {
    // debounce search
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current as any);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const res = await searchPatients(1, 10, query.trim());
        setSuggestions(res.patients || []);
      } catch (err) {
        console.error('patient search error', err);
      }
    }, 300);
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current as any); };
  }, [query]);

  async function handleCreate() {
    if (!firstName || !lastName || !dateStr) return;
    setLoading(true);
    try {
      let patient = selectedPatient;
      if (!patient) {
        // create patient first
        const created = await createPatient({ firstName, lastName });
        patient = created;
      }

      const payload: any = {
        patientId: patient._id,
        patientFirstName: patient.firstName,
        patientLastName: patient.lastName,
        date: new Date(dateStr).toISOString(),
        duration: Number(duration) || 30,
        type,
        status: 'scheduled'
      };
      await api.post('/appointments', payload);
      onCreated && onCreated();
      onClose();
    } catch (err) {
      console.error('create appointment error', err);
      // could show an error toast
    } finally {
      setLoading(false);
    }
  }

  // For web, show datetime-local input for convenience
  const DateInput = Platform.OS === 'web' ? (
    <TextInput style={styles.input} value={dateStr} onChangeText={setDateStr} placeholder="YYYY-MM-DDTHH:MM" />
  ) : (
    <TextInput style={styles.input} value={dateStr} onChangeText={setDateStr} placeholder="YYYY-MM-DDTHH:MM" />
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}><Text style={styles.title}>Nouveau rendez-vous</Text><Pressable onPress={onClose}><Text style={styles.close}>✕</Text></Pressable></View>
          <View style={styles.body}>
            <View style={{ marginBottom: 16, zIndex: 100 }}>
              <Text style={styles.label}>Patient (recherche)</Text>
              <View style={{ position: 'relative' }}>
                <TextInput 
                  style={styles.input} 
                  value={query} 
                  onChangeText={(v) => { setQuery(v); setSelectedPatient(null); }} 
                  placeholder="Tapez prénom ou nom" 
                  autoComplete="off"
                  autoCorrect={false}
                  autoCapitalize="words"
                />

                {suggestions.length > 0 && (
                  // absolutely positioned dropdown so it doesn't resize the modal
                  <View style={styles.suggestionBox}>
                    <Pressable onPress={async () => {
                      const parts = query.trim().split(' ');
                      const fn = parts[0] || '';
                      const ln = parts.slice(1).join(' ') || '';
                      try {
                        setLoading(true);
                        const created = await createPatient({ firstName: fn, lastName: ln });
                        setSelectedPatient(created);
                        setSuggestions([]);
                        setQuery('');
                      } catch (err) {
                        console.error('create patient quick action error', err);
                      } finally { setLoading(false); }
                    }} style={styles.suggestionCreate}>
                      <Text style={{ fontWeight: '700', color: '#1976d2' }}>+ Créer nouveau patient « {query} »</Text>
                    </Pressable>

                    <FlatList 
                      data={suggestions} 
                      keyExtractor={(it) => it._id} 
                      style={{ maxHeight: 240, backgroundColor: '#fff' }} 
                      renderItem={({ item }) => (
                        <Pressable 
                          onPress={() => { setSelectedPatient(item); setSuggestions([]); setQuery(''); }} 
                          style={styles.suggestionItem}
                        >
                          <Text style={{ fontWeight: '700', fontSize: 15 }}>{item.firstName} {item.lastName}</Text>
                          <Text style={{ color: '#666', fontSize: 13, marginTop: 2 }}>{item.phoneNumber || item.email || ''}</Text>
                        </Pressable>
                      )} 
                    />
                  </View>
                )}
              </View>

              {selectedPatient && (
                <View style={{ marginTop: 8, padding: 10, backgroundColor: '#e8f5e9', borderRadius: 6 }}>
                  <Text style={{ fontWeight: '700', color: '#2e7d32' }}>✓ {selectedPatient.firstName} {selectedPatient.lastName}</Text>
                  {selectedPatient.phoneNumber && <Text style={{ color: '#666', fontSize: 13 }}>{selectedPatient.phoneNumber}</Text>}
                </View>
              )}
            </View>

            {!selectedPatient && (
              <View style={{ marginBottom: 16, zIndex: 10 }}>
                <Text style={styles.label}>Prénom</Text>
                <TextInput 
                  style={styles.input} 
                  value={firstName} 
                  onChangeText={setFirstName}
                  autoComplete="off"
                  autoCorrect={false}
                  autoCapitalize="words"
                />
                <Text style={styles.label}>Nom</Text>
                <TextInput 
                  style={styles.input} 
                  value={lastName} 
                  onChangeText={setLastName}
                  autoComplete="off"
                  autoCorrect={false}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={{ marginBottom: 16, zIndex: 5 }}>
              <Text style={styles.label}>Date & heure</Text>
              {DateInput}
            </View>

            <View style={[styles.row, { zIndex: 1 }]}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.label}>Durée (minutes)</Text>
                <TextInput 
                  style={styles.input} 
                  value={duration} 
                  onChangeText={setDuration} 
                  keyboardType="numeric"
                  autoComplete="off"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.label}>Type</Text>
                <TextInput 
                  style={styles.input} 
                  value={type} 
                  onChangeText={setType}
                  autoComplete="off"
                />
              </View>
            </View>

            <View style={{ height: 12 }} />
            <Pressable style={styles.save} onPress={handleCreate} disabled={loading}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>{loading ? 'Enregistrement...' : 'Créer'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 12 },
  sheet: { backgroundColor: '#fff', borderRadius: 10, padding: 20, maxWidth: 760, width: '90%', alignSelf: 'center', maxHeight: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '800' },
  close: { fontSize: 22, padding: 6, color: '#666' },
  body: { position: 'relative' },
  label: { color: '#333', marginTop: 8, fontSize: 14, fontWeight: '600', marginBottom: 4 },
  input: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    padding: 12, 
    borderRadius: 8, 
    fontSize: 15,
    backgroundColor: '#fff'
  },
  suggestionBox: { 
    position: 'absolute', 
    left: 0, 
    right: 0, 
    top: '100%',
    marginTop: 4,
    backgroundColor: '#ffffff', 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#ccc', 
    zIndex: 1000,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      },
      default: {
        shadowColor: '#000', 
        shadowOpacity: 0.15, 
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 12
      }
    })
  },
  suggestionCreate: { 
    padding: 14, 
    backgroundColor: '#f0f7ff', 
    borderTopLeftRadius: 8, 
    borderTopRightRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  suggestionItem: { 
    padding: 14, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f5f5f5',
    backgroundColor: '#ffffff'
  },
  row: { flexDirection: 'row', marginBottom: 16 },
  save: { 
    marginTop: 20, 
    backgroundColor: '#1976d2', 
    padding: 16, 
    borderRadius: 8, 
    alignItems: 'center',
    shadowColor: '#1976d2',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4
  }
});
