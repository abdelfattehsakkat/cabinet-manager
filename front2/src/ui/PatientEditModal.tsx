import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator, Platform, Dimensions } from 'react-native';
import patientsApi, { Patient } from '../api/patients';
import DatePickerCalendar from './DatePickerCalendar';

type Props = {
  visible: boolean;
  patient?: Patient | null;
  onClose: () => void;
  onSaved?: (updated: Patient) => void;
};

export default function PatientEditModal({ visible, patient, onClose, onSaved }: Props) {
  const [form, setForm] = useState<Partial<Patient>>({});
  const [saving, setSaving] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);

  useEffect(() => {
    if (!patient) return setForm({});
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
      // already maybe in YYYY/MM/DD or other; if contains '-' try replace
      return d.replace(/-/g, '/');
    };

    setForm({ ...(patient as any), dateOfBirth: normalize(patient.dateOfBirth) });
  }, [patient]);

  const win = Dimensions.get('window');
  const sheetWidth = Platform.OS === 'web' ? Math.min(Math.round(win.width * 0.9), 640) : Math.min(win.width - 24, 640);

  const submit = async () => {
    if (!patient) return;
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
      const updated = await patientsApi.updatePatient(patient._id, payload);
      onSaved?.(updated);
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
            <View style={styles.header}>
              <Text style={styles.title}>Éditer le patient</Text>
              <Pressable onPress={onClose}><Text style={styles.close}>✕</Text></Pressable>
            </View>

            <ScrollView style={styles.body}>
              {!patient && <Text>Aucun patient sélectionné</Text>}
              {patient && (
                <View>
                  <View style={styles.row}><Text style={styles.label}>Fiche</Text><Text style={styles.value}>{patient.patientNumber ?? '-'}</Text></View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Nom</Text>
                    <TextInput value={String(form.lastName ?? '')} onChangeText={t => setForm(s => ({ ...s, lastName: t }))} style={styles.input} />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Prénom</Text>
                    <TextInput value={String(form.firstName ?? '')} onChangeText={t => setForm(s => ({ ...s, firstName: t }))} style={styles.input} />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Date de naissance</Text>
                    <Pressable onPress={() => setCalendarVisible(true)} style={[styles.input, { justifyContent: 'center' }]}>
                      <Text>{form.dateOfBirth ?? 'Sélectionner une date'}</Text>
                    </Pressable>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>E-mail</Text>
                    <TextInput value={String(form.email ?? '')} onChangeText={t => setForm(s => ({ ...s, email: t }))} style={styles.input} keyboardType="email-address" />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Téléphone</Text>
                    <TextInput value={String(form.phoneNumber ?? '')} onChangeText={t => setForm(s => ({ ...s, phoneNumber: t }))} style={styles.input} keyboardType="phone-pad" />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Adresse</Text>
                    <TextInput value={String(form.address ?? '')} onChangeText={t => setForm(s => ({ ...s, address: t }))} style={styles.input} />
                  </View>

                  <View style={{ height: 12 }} />
                  <View style={styles.actions}>
                    <Pressable style={[styles.btn, { backgroundColor: '#eee' }]} onPress={onClose}><Text>Annuler</Text></Pressable>
                    <Pressable style={[styles.btn, { backgroundColor: '#2e7d32' }]} onPress={submit} disabled={saving}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff' }}>Sauver</Text>}</Pressable>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontWeight: '700' },
  close: { fontSize: 16 },
  body: { padding: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  label: { color: '#666', width: '30%' },
  value: { fontWeight: '600', width: '70%', textAlign: 'right' },
  inputGroup: { marginTop: 8 },
  inputLabel: { color: '#444', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, paddingHorizontal: 8, height: 40 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  btn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 }
});
