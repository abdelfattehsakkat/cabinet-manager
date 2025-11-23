import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Platform, Dimensions } from 'react-native';
import patientsApi, { Patient } from '../api/patients';
import DatePickerCalendar from './DatePickerCalendar';

type Props = {
  visible: boolean;
  patient?: Patient | null;
  creating?: boolean;
  onClose: () => void;
  onSaved?: (updated: Patient) => void;
};

export default function PatientEditModal({ visible, patient, onClose, onSaved, creating = false }: Props) {
  const [form, setForm] = useState<Partial<Patient>>({});
  const [saving, setSaving] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);

  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);
  const isWeb = windowWidth >= 768;

  useEffect(() => {
    const onChange = ({ window }: { window: { width: number } }) => setWindowWidth(window.width);
    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    if (patient) {
      const normalize = (d?: string | null) => {
        if (!d) return undefined;
        const asDate = new Date(d);
        if (!isNaN(asDate.getTime())) {
          const y = asDate.getFullYear();
          const m = String(asDate.getMonth() + 1).padStart(2, '0');
          const day = String(asDate.getDate()).padStart(2, '0');
          return `${y}/${m}/${day}`;
        }
        return d.replace(/-/g, '/');
      };
      setForm({ ...(patient as any), dateOfBirth: normalize(patient.dateOfBirth) });
      return;
    }
    if (creating) {
      setForm({});
      return;
    }
  }, [patient, creating]);

  useEffect(() => {
    if (visible && creating) setForm({});
  }, [visible, creating]);

  const getAvatarColor = (name?: string) => {
    if (!name) return '#2e7d32';
    const colors = ['#1976d2', '#2e7d32', '#9c27b0', '#d32f2f', '#f57c00', '#0288d1', '#c2185b'];
    return colors[name.charCodeAt(0) % colors.length];
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const f = firstName?.charAt(0) || '';
    const l = lastName?.charAt(0) || '';
    return (f + l).toUpperCase() || 'N';
  };

  const submit = async () => {
    setSaving(true);
    try {
      const payload: Partial<Patient> = {
        firstName: form.firstName,
        lastName: form.lastName,
        dateOfBirth: form.dateOfBirth,
        email: form.email,
        phoneNumber: form.phoneNumber,
        address: form.address,
      };

      if (patient) {
        const updated = await patientsApi.updatePatient(patient._id, payload);
        onSaved?.(updated);
      } else {
        const created = await patientsApi.createPatient(payload);
        onSaved?.(created);
      }
      onClose();
    } catch (err) {
      console.error('Save failed', err);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent={isWeb} onRequestClose={onClose}>
        <View style={[styles.backdrop, !isWeb && styles.backdropMobile]}>
          <View style={[styles.modal, isWeb ? styles.modalWeb : styles.modalMobile]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.avatar, { backgroundColor: getAvatarColor(patient?.lastName || 'N') }]}>
                <Text style={styles.avatarText}>
                  {patient ? getInitials(patient.firstName, patient.lastName) : '➕'}
                </Text>
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.patientName}>
                  {patient ? `${patient.firstName} ${patient.lastName}` : 'Nouveau patient'}
                </Text>
                <Text style={styles.patientNumber}>
                  {patient?.patientNumber ? `Fiche N° ${patient.patientNumber}` : 'Nouvelle fiche'}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.headerCloseBtn}
                onPress={onClose}
              >
                <Text style={styles.headerCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📋 Informations personnelles</Text>

                {/* Nom et Prénom */}
                <View style={styles.row}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Nom *</Text>
                    <TextInput 
                      value={String(form.lastName ?? '')} 
                      onChangeText={t => setForm(s => ({ ...s, lastName: t }))} 
                      style={styles.input}
                      placeholder="Nom de famille"
                      placeholderTextColor="#999"
                    />
                  </View>
                  <View style={{ width: 12 }} />
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Prénom *</Text>
                    <TextInput 
                      value={String(form.firstName ?? '')} 
                      onChangeText={t => setForm(s => ({ ...s, firstName: t }))} 
                      style={styles.input}
                      placeholder="Prénom"
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>

                {/* Date de naissance */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>🎂 Date de naissance</Text>
                  <TouchableOpacity 
                    onPress={() => setCalendarVisible(true)} 
                    style={[styles.input, styles.inputDate]}
                  >
                    <Text style={form.dateOfBirth ? styles.inputDateText : styles.inputDatePlaceholder}>
                      {form.dateOfBirth ?? 'Sélectionner une date'}
                    </Text>
                    <Text style={styles.inputDateIcon}>📅</Text>
                  </TouchableOpacity>
                </View>

                {/* Email */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>📧 Email</Text>
                  <TextInput 
                    value={String(form.email ?? '')} 
                    onChangeText={t => setForm(s => ({ ...s, email: t }))} 
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="exemple@email.com"
                    placeholderTextColor="#999"
                  />
                </View>

                {/* Téléphone */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>📞 Téléphone</Text>
                  <TextInput 
                    value={String(form.phoneNumber ?? '')} 
                    onChangeText={t => setForm(s => ({ ...s, phoneNumber: t }))} 
                    style={styles.input}
                    keyboardType="phone-pad"
                    placeholder="Numéro de téléphone"
                    placeholderTextColor="#999"
                  />
                </View>

                {/* Adresse */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>📍 Adresse</Text>
                  <TextInput 
                    value={String(form.address ?? '')} 
                    onChangeText={t => setForm(s => ({ ...s, address: t }))} 
                    style={[styles.input, styles.inputTextarea]}
                    multiline
                    numberOfLines={3}
                    placeholder="Adresse complète"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
            </ScrollView>

            {/* Footer Actions */}
            <View style={styles.footer}>
              <TouchableOpacity 
                style={styles.btnCancel}
                onPress={onClose}
                disabled={saving}
              >
                <Text style={styles.btnCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.btnSave, saving && styles.btnSaveDisabled]}
                onPress={submit}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.btnSaveIcon}>💾</Text>
                    <Text style={styles.btnSaveText}>
                      {patient ? 'Mettre à jour' : 'Créer le patient'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <DatePickerCalendar 
        visible={calendarVisible} 
        initial={form.dateOfBirth ?? null} 
        onClose={() => setCalendarVisible(false)} 
        onSelect={(d) => { 
          setForm(s => ({ ...s, dateOfBirth: d })); 
          setCalendarVisible(false); 
        }} 
      />
    </>
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
  // === Content ===
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
  },
  inputContainer: {
    flex: 1,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#212121',
    ...(Platform.OS === 'web' && {
      outlineStyle: 'none' as any,
    }),
  },
  inputDate: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputDateText: {
    fontSize: 15,
    color: '#212121',
  },
  inputDatePlaceholder: {
    fontSize: 15,
    color: '#999',
  },
  inputDateIcon: {
    fontSize: 20,
  },
  inputTextarea: {
    minHeight: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  // === Footer ===
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  btnSave: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#4caf50',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#4caf50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  btnSaveDisabled: {
    opacity: 0.6,
  },
  btnSaveIcon: {
    fontSize: 18,
  },
  btnSaveText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});

type Props = {
  visible: boolean;
  patient?: Patient | null;
  creating?: boolean;
  onClose: () => void;
  onSaved?: (updated: Patient) => void;
};

export default function PatientEditModal({ visible, patient, onClose, onSaved, creating = false }: Props) {
  const [form, setForm] = useState<Partial<Patient>>({});
  const [saving, setSaving] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);

  useEffect(() => {
    // If editing an existing patient, populate form.
    if (patient) {
      // normalize dateOfBirth to YYYY/MM/DD for display
      const normalize = (d?: string | null) => {
        if (!d) return undefined;
        const asDate = new Date(d);
        if (!isNaN(asDate.getTime())) {
          const y = asDate.getFullYear();
          const m = String(asDate.getMonth() + 1).padStart(2, '0');
          const day = String(asDate.getDate()).padStart(2, '0');
          return `${y}/${m}/${day}`;
        }
        return d.replace(/-/g, '/');
      };

      setForm({ ...(patient as any), dateOfBirth: normalize(patient.dateOfBirth) });
      return;
    }

    // If creating a new patient, ensure the form is empty
    if (creating) {
      setForm({});
      return;
    }
  }, [patient, creating]);

  // When the modal opens in creating mode, reset the form
  useEffect(() => {
    if (visible && creating) setForm({});
  }, [visible, creating]);

  const win = Dimensions.get('window');
  const sheetWidth = Platform.OS === 'web' ? Math.min(Math.round(win.width * 0.9), 640) : Math.min(win.width - 24, 640);

  const submit = async () => {
    setSaving(true);
    try {
      const payload: Partial<Patient> = {
        firstName: form.firstName,
        lastName: form.lastName,
        dateOfBirth: form.dateOfBirth,
        email: form.email,
        phoneNumber: form.phoneNumber,
        address: form.address,
      };

      if (patient) {
        // update existing
        const updated = await patientsApi.updatePatient(patient._id, payload);
        onSaved?.(updated);
      } else {
        // create new
        const created = await patientsApi.createPatient(payload);
        onSaved?.(created);
      }
      onClose();
    } catch (err) {
      console.error('Save failed', err);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.backdrop}>
          <View style={[styles.sheet, { width: sheetWidth }]}>
            <View style={styles.headerTop}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{(patient?.lastName ?? (creating ? 'N' : 'P')).charAt(0)}</Text></View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.nameSmall}>{patient ? `${patient.firstName} ${patient.lastName}` : creating ? 'Nouveau patient' : ''}</Text>
                <Text style={styles.subSmall}>{patient?.patientNumber ? `Fiche N° ${patient.patientNumber}` : creating ? 'Nouvelle fiche' : ''}</Text>
              </View>
              <Pressable onPress={onClose}><Text style={styles.close}>✕</Text></Pressable>
            </View>

            <ScrollView style={styles.body}>
              {!patient && !creating && <Text>Aucun patient sélectionné</Text>}
              {(patient || creating) && (
                <View>
                  <View style={styles.rowCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Nom</Text>
                      <TextInput value={String(form.lastName ?? '')} onChangeText={t => setForm(s => ({ ...s, lastName: t }))} style={styles.inputSoft} />
                    </View>
                    <View style={{ width: 12 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Prénom</Text>
                      <TextInput value={String(form.firstName ?? '')} onChangeText={t => setForm(s => ({ ...s, firstName: t }))} style={styles.inputSoft} />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Date de naissance</Text>
                    <Pressable onPress={() => setCalendarVisible(true)} style={[styles.inputSoft, { justifyContent: 'center' }]}>
                      <Text>{form.dateOfBirth ?? 'Sélectionner une date'}</Text>
                    </Pressable>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>E-mail</Text>
                    <TextInput value={String(form.email ?? '')} onChangeText={t => setForm(s => ({ ...s, email: t }))} style={styles.inputSoft} keyboardType="email-address" />
                  </View>

                  <View style={styles.rowCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Téléphone</Text>
                      <TextInput value={String(form.phoneNumber ?? '')} onChangeText={t => setForm(s => ({ ...s, phoneNumber: t }))} style={styles.inputSoft} keyboardType="phone-pad" />
                    </View>
                    <View style={{ width: 12 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Fiche</Text>
                      <View style={[styles.inputSoft, { justifyContent: 'center' }]}><Text>{patient?.patientNumber ?? '-'}</Text></View>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Adresse</Text>
                    <TextInput value={String(form.address ?? '')} onChangeText={t => setForm(s => ({ ...s, address: t }))} style={styles.inputSoft} />
                  </View>

                  <View style={{ height: 16 }} />
                  <View style={styles.actionsBar}>
                    <Pressable style={[styles.btnGhost]} onPress={onClose}><Text>Annuler</Text></Pressable>
                    <Pressable style={[styles.btnPrimary]} onPress={submit} disabled={saving}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Sauver</Text>}</Pressable>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <DatePickerCalendar visible={calendarVisible} initial={form.dateOfBirth ?? null} onClose={() => setCalendarVisible(false)} onSelect={(d) => { setForm(s => ({ ...s, dateOfBirth: d })); setCalendarVisible(false); }} />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 12 },
  sheet: { backgroundColor: '#fff', borderRadius: 10, maxHeight: '84%', alignSelf: 'center', overflow: 'hidden' },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f2f2f2' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#2e7d32', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  nameSmall: { fontWeight: '800' },
  subSmall: { color: '#666', fontSize: 12, marginTop: 2 },
  title: { fontWeight: '700' },
  close: { fontSize: 16 },
  body: { padding: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  label: { color: '#666', width: '30%' },
  value: { fontWeight: '600', width: '70%', textAlign: 'right' },
  inputGroup: { marginTop: 8 },
  inputLabel: { color: '#444', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, paddingHorizontal: 8, height: 40 },
  inputSoft: { backgroundColor: '#fbfbfb', borderRadius: 8, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: '#eee', justifyContent: 'center' },
  rowCard: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  actionsBar: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 6 },
  btn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  btnGhost: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f2f2f2', marginRight: 8 },
  btnPrimary: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#2e7d32' }
});
