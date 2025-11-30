import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet, Platform, FlatList, ScrollView, Dimensions, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/client';
import { searchPatients, createPatient, Patient } from '../api/patients';
import DateTimePickerMobile from './DateTimePickerMobile';

type Props = {
  visible: boolean;
  initial?: string | null; // ISO date string
  initialDuration?: number;
  onClose: () => void;
  onCreated?: () => void;
};

export default function AppointmentModal({ visible, initial, initialDuration = 30, onClose, onCreated }: Props) {
  const [mode, setMode] = useState<'existing' | 'new'>('existing'); // Toggle between modes
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showDateOfBirth, setShowDateOfBirth] = useState(false);
  const [dateStr, setDateStr] = useState(initial || '');
  const [duration, setDuration] = useState(String(initialDuration));
  const [type, setType] = useState('Consultation');
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const debounceRef = useRef<number | null>(null as any);

  // Convert ISO string to datetime-local format (YYYY-MM-DDTHH:mm)
  // Since we store dates as UTC preserving local time, we use UTC methods to extract the values
  const formatForDatetimeLocal = (isoString: string | null | undefined): string => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return '';
      // Format: YYYY-MM-DDTHH:mm (required by datetime-local input)
      // Use UTC methods since the date is stored in UTC but represents local time
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      const hours = String(date.getUTCHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  useEffect(() => {
    setDateStr(formatForDatetimeLocal(initial));
    setDuration(String(initialDuration));
  }, [initial, initialDuration, visible]);

  // Reset internal state when modal closes to keep UX predictable
  useEffect(() => {
    if (!visible) {
      setMode('existing');
      setQuery('');
      setSuggestions([]);
      setSelectedPatient(null);
      setFirstName('');
      setLastName('');
      setDateOfBirth('');
      setPhoneNumber('');
      setShowDateOfBirth(false);
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
    // debounce search - only in existing patient mode
    if (mode !== 'existing' || !query || query.trim().length < 2) {
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
  }, [query, mode]);

  async function handleCreate() {
    // Validation
    if (mode === 'existing' && !selectedPatient) {
      alert('Veuillez sélectionner un patient ou basculer en mode "Nouveau patient"');
      return;
    }
    if (mode === 'new' && (!firstName.trim() || !lastName.trim())) {
      alert('Prénom et nom sont obligatoires');
      return;
    }
    if (!dateStr) {
      alert('Date et heure sont obligatoires');
      return;
    }

    setLoading(true);
    try {
      // Get logged-in user (doctor) ID
      const userRaw = await AsyncStorage.getItem('user');
      if (!userRaw) {
        console.error('No logged-in user found');
        alert('Erreur: utilisateur non connecté');
        return;
      }
      const user = JSON.parse(userRaw);
      const doctorId = user._id || user.id;
      if (!doctorId) {
        console.error('User has no ID');
        alert('Erreur: ID utilisateur manquant');
        return;
      }

      let patient = selectedPatient;
      if (mode === 'new' || !patient) {
        // create patient first - dateOfBirth is required by backend
        // Use provided date or default to a placeholder date
        const dob = dateOfBirth ? new Date(dateOfBirth).toISOString() : new Date('2000-01-01').toISOString();
        const created = await createPatient({ 
          firstName: firstName.trim(), 
          lastName: lastName.trim(), 
          dateOfBirth: dob,
          phoneNumber: phoneNumber.trim() || undefined
        });
        patient = created;
      }

      // Parse the datetime-local string and preserve the local time when converting to ISO
      const dateObj = new Date(dateStr);
      // Remove timezone offset to keep the user's intended time
      const localDate = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000);
      
      const payload: any = {
        doctor: doctorId,
        patientId: patient._id,
        patientFirstName: patient.firstName,
        patientLastName: patient.lastName,
        date: localDate.toISOString(),
        duration: Number(duration) || 30,
        type,
        status: 'scheduled'
      };
      await api.post('/appointments', payload);
      onCreated && onCreated();
      onClose();
    } catch (err) {
      console.error('create appointment error', err);
      alert('Erreur lors de la création du rendez-vous');
    } finally {
      setLoading(false);
    }
  }

  // Format date of birth with auto-hyphens (YYYY-MM-DD)
  const handleDateOfBirthChange = (text: string) => {
    // Remove non-digits
    const cleaned = text.replace(/\D/g, '');
    
    let formatted = '';
    if (cleaned.length > 0) {
      formatted = cleaned.substring(0, 4); // YYYY
      if (cleaned.length >= 5) {
        formatted += '-' + cleaned.substring(4, 6); // MM
      }
      if (cleaned.length >= 7) {
        formatted += '-' + cleaned.substring(6, 8); // DD
      }
    }
    setDateOfBirth(formatted);
  };

  // For web, use native datetime-local input; for mobile, use custom picker
  const DateInput = Platform.OS === 'web' ? (
    <input 
      type="datetime-local" 
      value={dateStr} 
      onChange={(e) => setDateStr(e.target.value)} 
      style={{ 
        borderWidth: 1, 
        borderColor: '#ddd', 
        padding: 12, 
        borderRadius: 8, 
        fontSize: 15,
        backgroundColor: '#fff',
        width: '100%',
        fontFamily: 'inherit',
        boxSizing: 'border-box'
      }}
    />
  ) : (
    <DateTimePickerMobile
      value={dateStr}
      onChange={setDateStr}
      placeholder="Sélectionner date et heure"
    />
  );

  const { width } = useWindowDimensions();
  const isWeb = width >= 768 || Platform.OS === 'web';
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent={isWeb} onRequestClose={onClose}>
      <View style={[styles.backdrop, !isWeb && styles.backdropMobile]}>
        <View style={[styles.modal, isWeb ? styles.modalWeb : styles.modalMobile, !isWeb && { paddingTop: insets.top }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Nouveau rendez-vous</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeIcon}>✕</Text>
            </Pressable>
          </View>

          {/* Mode Toggle */}
          <View style={styles.toggleContainer}>
            <Pressable 
              onPress={() => { setMode('existing'); setSuggestions([]); setSelectedPatient(null); }}
              style={[styles.toggleButton, mode === 'existing' && styles.toggleButtonActive]}
            >
              <Text style={[styles.toggleText, mode === 'existing' && styles.toggleTextActive]}>Patient existant</Text>
            </Pressable>
            <Pressable 
              onPress={() => { setMode('new'); setSuggestions([]); setQuery(''); setSelectedPatient(null); }}
              style={[styles.toggleButton, mode === 'new' && styles.toggleButtonActive]}
            >
              <Text style={[styles.toggleText, mode === 'new' && styles.toggleTextActive]}>Nouveau patient</Text>
            </Pressable>
          </View>

          {/* Scrollable body */}
          <ScrollView 
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
            {/* EXISTING PATIENT MODE */}
            {mode === 'existing' && (
              <View style={{ marginBottom: 16, zIndex: 100 }}>
                <Text style={styles.label}>Rechercher un patient</Text>
                <View style={{ position: 'relative' }}>
                  <TextInput 
                    style={styles.input} 
                    value={query} 
                    onChangeText={(v) => { setQuery(v); setSelectedPatient(null); }} 
                    placeholder="Nom, prénom ou téléphone" 
                    autoComplete="off"
                    autoCorrect={false}
                    autoCapitalize="words"
                  />

                  {suggestions.length > 0 && (
                    <View style={styles.suggestionBox}>
                      <FlatList 
                        data={suggestions} 
                        keyExtractor={(it) => it._id} 
                        style={{ maxHeight: 240, backgroundColor: '#fff' }}
                        nestedScrollEnabled={true}
                        showsVerticalScrollIndicator={true}
                        keyboardShouldPersistTaps="handled"
                        renderItem={({ item }) => (
                          <Pressable 
                            onPress={() => { 
                              setSelectedPatient(item); 
                              setSuggestions([]); 
                              setQuery(`${item.firstName} ${item.lastName}`);
                            }} 
                            style={styles.suggestionItem}
                          >
                            <Text style={{ fontWeight: '700', fontSize: 15 }}>{item.firstName} {item.lastName}</Text>
                            <Text style={{ color: '#666', fontSize: 13, marginTop: 2 }}>
                              {item.phoneNumber || item.email || `N° ${item.patientNumber || ''}`}
                            </Text>
                          </Pressable>
                        )} 
                      />
                    </View>
                  )}
                </View>

                {selectedPatient && (
                  <View style={styles.selectedPatientBadge}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '700', color: '#2e7d32', fontSize: 15 }}>✓ {selectedPatient.firstName} {selectedPatient.lastName}</Text>
                      {selectedPatient.phoneNumber && <Text style={{ color: '#666', fontSize: 13, marginTop: 2 }}>{selectedPatient.phoneNumber}</Text>}
                    </View>
                    <Pressable onPress={() => setSelectedPatient(null)}>
                      <Text style={{ color: '#666', fontSize: 18 }}>✕</Text>
                    </Pressable>
                  </View>
                )}

                {!selectedPatient && query.length > 0 && suggestions.length === 0 && (
                  <View style={{ marginTop: 8, padding: 10, backgroundColor: '#fff3e0', borderRadius: 6 }}>
                    <Text style={{ color: '#e65100', fontSize: 13 }}>Aucun patient trouvé.</Text>
                    <Pressable onPress={() => setMode('new')} style={{ marginTop: 6 }}>
                      <Text style={{ color: '#1976d2', fontWeight: '700', fontSize: 13 }}>→ Créer un nouveau patient</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            )}

            {/* NEW PATIENT MODE */}
            {mode === 'new' && (
              <View style={{ marginBottom: 16, zIndex: 10 }}>
                <Text style={styles.sectionTitle}>Informations patient</Text>
                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: Platform.OS === 'web' ? 8 : 0 }}>
                    <Text style={styles.label}>Prénom *</Text>
                    <TextInput 
                      style={styles.input} 
                      value={firstName} 
                      onChangeText={setFirstName}
                      autoComplete="off"
                      autoCorrect={false}
                      autoCapitalize="words"
                      placeholder="Prénom"
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: Platform.OS === 'web' ? 8 : 0, marginTop: Platform.OS === 'web' ? 0 : 0 }}>
                    <Text style={styles.label}>Nom *</Text>
                    <TextInput 
                      style={styles.input} 
                      value={lastName} 
                      onChangeText={setLastName}
                      autoComplete="off"
                      autoCorrect={false}
                      autoCapitalize="words"
                      placeholder="Nom"
                    />
                  </View>
                </View>

                <Text style={styles.label}>Téléphone</Text>
                <TextInput 
                  style={styles.input} 
                  value={phoneNumber} 
                  onChangeText={setPhoneNumber}
                  placeholder="06 12 34 56 78"
                  autoComplete="off"
                  autoCorrect={false}
                  keyboardType="phone-pad"
                />

                {!showDateOfBirth && (
                  <Pressable onPress={() => setShowDateOfBirth(true)} style={{ marginTop: 8 }}>
                    <Text style={{ color: '#1976d2', fontSize: 13 }}>+ Ajouter date de naissance</Text>
                  </Pressable>
                )}

                {showDateOfBirth && (
                  <>
                    <Text style={styles.label}>Date de naissance</Text>
                    <TextInput 
                      style={styles.input} 
                      value={dateOfBirth} 
                      onChangeText={handleDateOfBirthChange}
                      placeholder="AAAA-MM-JJ"
                      autoComplete="off"
                      autoCorrect={false}
                      keyboardType="numeric"
                      maxLength={10}
                    />
                  </>
                )}

                <Pressable onPress={() => setMode('existing')} style={{ marginTop: 12 }}>
                  <Text style={{ color: '#666', fontSize: 13 }}>← Rechercher un patient existant</Text>
                </Pressable>
              </View>
            )}

            {/* APPOINTMENT DETAILS (common to both modes) */}
            <View style={{ marginBottom: 16, zIndex: 5 }}>
              <Text style={styles.sectionTitle}>Détails du rendez-vous</Text>
              <Text style={styles.label}>Date & heure *</Text>
              <View style={{ width: '100%' }}>
                {DateInput}
              </View>
            </View>

            <View style={[styles.row, { zIndex: 1, marginBottom: 0 }]}>
              <View style={{ flex: 1, marginRight: Platform.OS === 'web' ? 8 : 0 }}>
                <Text style={styles.label}>Durée (min)</Text>
                <TextInput 
                  style={styles.input} 
                  value={duration} 
                  onChangeText={setDuration} 
                  keyboardType="numeric"
                  autoComplete="off"
                />
              </View>
              <View style={{ flex: 1, marginLeft: Platform.OS === 'web' ? 8 : 0, marginTop: Platform.OS === 'web' ? 0 : 0 }}>
                <Text style={styles.label}>Type</Text>
                <TextInput 
                  style={styles.input} 
                  value={type} 
                  onChangeText={setType}
                  autoComplete="off"
                  placeholder="Consultation"
                />
              </View>
            </View>

            <Pressable 
              style={[styles.save, loading && { opacity: 0.6 }]} 
              onPress={handleCreate} 
              disabled={loading}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                {loading ? 'Création en cours...' : 'Créer le rendez-vous'}
              </Text>
            </Pressable>
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
    padding: 12
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
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: { fontSize: 20, fontWeight: '800' },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: { 
    fontSize: 18, 
    color: '#666' 
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  toggleContainer: { 
    flexDirection: 'row', 
    backgroundColor: '#f5f5f5', 
    borderRadius: 8, 
    padding: 4,
    marginBottom: 16,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  toggleButton: { 
    flex: 1, 
    paddingVertical: Platform.OS === 'web' ? 10 : 12,
    paddingHorizontal: Platform.OS === 'web' ? 16 : 8,
    borderRadius: 6, 
    alignItems: 'center' 
  },
  toggleButtonActive: { 
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  toggleText: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#666' 
  },
  toggleTextActive: { 
    color: '#1976d2' 
  },
  body: { position: 'relative' },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#333', 
    marginBottom: 12,
    marginTop: 4
  },
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
  selectedPatientBadge: { 
    marginTop: 10, 
    padding: 12, 
    backgroundColor: '#e8f5e9', 
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center'
  },
  row: { 
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    marginBottom: 16,
    ...Platform.select({
      web: {},
      default: {
        gap: 0
      }
    })
  },
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
