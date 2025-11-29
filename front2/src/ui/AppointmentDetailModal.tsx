import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet, Platform, ScrollView, KeyboardAvoidingView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/client';

type Appointment = {
  _id: string;
  patientFirstName?: string;
  patientLastName?: string;
  patientName?: string;
  patientNumber?: string;
  date: string;
  duration?: number;
  type?: string;
  status?: string;
  notes?: string;
};

type Props = {
  visible: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onUpdated?: () => void;
  onDeleted?: () => void;
};

export default function AppointmentDetailModal({ visible, appointment, onClose, onUpdated, onDeleted }: Props) {
  const [editMode, setEditMode] = useState(false);
  const [dateStr, setDateStr] = useState('');
  const [duration, setDuration] = useState('30');
  const [type, setType] = useState('Consultation');
  const [status, setStatus] = useState('scheduled');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (appointment && visible) {
      // Convert date to local datetime-local format
      const d = new Date(appointment.date);
      const local = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
      const isoLocal = new Date(local.getTime() - local.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setDateStr(isoLocal);
      setDuration(String(appointment.duration || 30));
      setType(appointment.type || 'Consultation');
      setStatus(appointment.status || 'scheduled');
      setNotes(appointment.notes || '');
      setEditMode(false);
    }
  }, [appointment, visible]);

  const handleUpdate = async () => {
    if (!appointment) return;
    setLoading(true);
    try {
      const userRaw = await AsyncStorage.getItem('user');
      if (!userRaw) {
        alert('Erreur: utilisateur non connecté');
        return;
      }
      const user = JSON.parse(userRaw);
      const doctorId = user._id || user.id;

      const payload = {
        doctor: doctorId,
        date: new Date(dateStr).toISOString(),
        duration: Number(duration) || 30,
        type,
        status,
        notes
      };

      await api.put(`/appointments/${appointment._id}`, payload);
      onUpdated && onUpdated();
      setEditMode(false);
      onClose();
    } catch (err) {
      console.error('update appointment error', err);
      alert('Erreur lors de la modification');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!appointment) return;
    
    const doDelete = async () => {
      setLoading(true);
      try {
        await api.del(`/appointments/${appointment._id}`);
        onDeleted && onDeleted();
        onClose();
      } catch (err) {
        console.error('delete appointment error', err);
        Alert.alert('Erreur', 'Erreur lors de la suppression');
      } finally {
        setLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      if (confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) {
        await doDelete();
      }
    } else {
      Alert.alert(
        'Confirmer la suppression',
        'Êtes-vous sûr de vouloir supprimer ce rendez-vous ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Supprimer', style: 'destructive', onPress: doDelete }
        ]
      );
    }
  };

  if (!appointment) return null;

  const patientFullName = appointment.patientName || `${appointment.patientFirstName} ${appointment.patientLastName}`;
  const appointmentDate = new Date(appointment.date);
  const localDate = new Date(appointmentDate.getTime() + appointmentDate.getTimezoneOffset() * 60000);
  const formattedDate = localDate.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const formattedTime = localDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const statusLabels: Record<string, string> = {
    scheduled: 'Planifié',
    completed: 'Terminé',
    cancelled: 'Annulé',
    noShow: 'Absent'
  };

  const statusColors: Record<string, string> = {
    scheduled: '#1976d2',
    completed: '#616161',
    cancelled: '#d32f2f',
    noShow: '#f57c00'
  };

  // Format datetime for display (French, 24h)
  const formatDateTime = (isoString: string) => {
    const d = new Date(isoString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

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
    <TextInput 
      style={styles.input} 
      value={formatDateTime(dateStr)} 
      onChangeText={setDateStr} 
      placeholder="JJ/MM/AAAA HH:MM"
      editable={editMode}
    />
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView 
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Détails du rendez-vous</Text>
            <Pressable onPress={onClose}><Text style={styles.close}>✕</Text></Pressable>
          </View>

          <ScrollView 
            style={styles.scrollContainer} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
            {/* Patient Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Patient</Text>
              <View style={styles.patientCard}>
                <Text style={styles.patientName}>{patientFullName}</Text>
                {appointment.patientNumber && (
                  <Text style={styles.patientNumber}>N° {appointment.patientNumber}</Text>
                )}
              </View>
            </View>

            {/* Appointment Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Informations</Text>
              
              {!editMode ? (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Date</Text>
                    <Text style={styles.detailValue}>{formattedDate}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Heure</Text>
                    <Text style={styles.detailValue}>{formattedTime}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Durée</Text>
                    <Text style={styles.detailValue}>{appointment.duration} minutes</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Type</Text>
                    <Text style={styles.detailValue}>{appointment.type}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Statut</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColors[status] || '#666' }]}>
                      <Text style={styles.statusText}>{statusLabels[status] || status}</Text>
                    </View>
                  </View>
                  {appointment.notes && (
                    <View style={[styles.detailRow, { flexDirection: 'column', alignItems: 'flex-start' }]}>
                      <Text style={styles.detailLabel}>Notes</Text>
                      <Text style={[styles.detailValue, { marginTop: 4 }]}>{appointment.notes}</Text>
                    </View>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.label}>Date & heure *</Text>
                  {Platform.OS === 'web' ? (
                    <View style={{ width: '100%', marginBottom: 12 }}>
                      {DateInput}
                    </View>
                  ) : (
                    <View style={{ width: '100%', marginBottom: 12 }}>
                      <TextInput 
                        style={styles.input} 
                        value={dateStr} 
                        onChangeText={setDateStr} 
                        placeholder="JJ/MM/AAAA HH:MM"
                      />
                    </View>
                  )}

                  <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: Platform.OS === 'web' ? 8 : 0 }}>
                      <Text style={styles.label}>Durée (min)</Text>
                      <TextInput 
                        style={styles.input} 
                        value={duration} 
                        onChangeText={setDuration} 
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: Platform.OS === 'web' ? 8 : 0, marginTop: Platform.OS === 'web' ? 0 : 0 }}>
                      <Text style={styles.label}>Type</Text>
                      <TextInput 
                        style={styles.input} 
                        value={type} 
                        onChangeText={setType}
                      />
                    </View>
                  </View>

                  <Text style={styles.label}>Statut</Text>
                  <View style={styles.statusPicker}>
                    {Object.entries(statusLabels).map(([key, label]) => (
                      <Pressable 
                        key={key}
                        onPress={() => setStatus(key)}
                        style={[styles.statusOption, status === key && styles.statusOptionActive]}
                      >
                        <Text style={[styles.statusOptionText, status === key && styles.statusOptionTextActive]}>
                          {label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <Text style={styles.label}>Notes</Text>
                  <TextInput 
                    style={[styles.input, styles.textArea]} 
                    value={notes} 
                    onChangeText={setNotes}
                    placeholder="Ajouter des notes..."
                    multiline
                    numberOfLines={3}
                  />
                </>
              )}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              {!editMode ? (
                <>
                  {/* Quick status actions (if not completed or cancelled) */}
                  {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                    <View style={styles.quickActions}>
                      <Pressable 
                        style={[styles.button, styles.buttonSuccess, { flex: 1, marginRight: 8 }]} 
                        onPress={async () => {
                          try {
                            await api.put(`/appointments/${appointment._id}`, { status: 'completed' });
                            onUpdated && onUpdated();
                            onClose();
                          } catch (err) {
                            console.error('Failed to mark as completed', err);
                            alert('Erreur lors de la mise à jour');
                          }
                        }}
                      >
                        <Text style={styles.buttonText}>✓ Terminé</Text>
                      </Pressable>
                      <Pressable 
                        style={[styles.button, styles.buttonWarning, { flex: 1 }]} 
                        onPress={async () => {
                          try {
                            await api.put(`/appointments/${appointment._id}`, { status: 'noShow' });
                            onUpdated && onUpdated();
                            onClose();
                          } catch (err) {
                            console.error('Failed to mark as no-show', err);
                            alert('Erreur lors de la mise à jour');
                          }
                        }}
                      >
                        <Text style={styles.buttonText}>✗ Absent</Text>
                      </Pressable>
                    </View>
                  )}
                  <View style={{ flexDirection: Platform.OS === 'web' ? 'row' : 'column', gap: 8, marginTop: 8 }}>
                    <Pressable 
                      style={[styles.button, styles.buttonPrimary, Platform.OS !== 'web' && { marginBottom: 8 }]} 
                      onPress={() => setEditMode(true)}
                    >
                      <Text style={styles.buttonText}>Modifier</Text>
                    </Pressable>
                    <Pressable 
                      style={[styles.button, styles.buttonDanger]} 
                      onPress={handleDelete}
                      disabled={loading}
                    >
                      <Text style={styles.buttonText}>Supprimer</Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <View style={{ flexDirection: Platform.OS === 'web' ? 'row' : 'column', gap: 8 }}>
                  <Pressable 
                    style={[styles.button, styles.buttonSuccess, Platform.OS !== 'web' && { marginBottom: 8 }]} 
                    onPress={handleUpdate}
                    disabled={loading}
                  >
                    <Text style={styles.buttonText}>
                      {loading ? 'Enregistrement...' : 'Enregistrer'}
                    </Text>
                  </Pressable>
                  <Pressable 
                    style={[styles.button, styles.buttonSecondary]} 
                    onPress={() => setEditMode(false)}
                  >
                    <Text style={styles.buttonText}>Annuler</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'flex-end',
    ...Platform.select({
      web: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12
      },
      default: {}
    })
  },
  sheet: { 
    backgroundColor: '#fff', 
    borderRadius: Platform.OS === 'web' ? 10 : 20,
    borderBottomLeftRadius: Platform.OS === 'web' ? 10 : 0,
    borderBottomRightRadius: Platform.OS === 'web' ? 10 : 0,
    padding: Platform.OS === 'web' ? 20 : 16,
    paddingBottom: Platform.OS === 'web' ? 20 : 32,
    maxWidth: Platform.OS === 'web' ? 600 : '100%', 
    width: Platform.OS === 'web' ? '90%' : '100%',
    maxHeight: Platform.OS === 'web' ? '90%' : '85%',
    ...Platform.select({
      web: {},
      default: {
        maxHeight: '95%'
      }
    })
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '800' },
  close: { fontSize: 22, padding: 6, color: '#666' },
  scrollContainer: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 12 },
  patientCard: { 
    backgroundColor: '#f5f5f5', 
    padding: 16, 
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#1976d2'
  },
  patientName: { fontSize: 18, fontWeight: '700', color: '#333' },
  patientNumber: { fontSize: 14, color: '#666', marginTop: 4 },
  detailRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  detailLabel: { fontSize: 14, color: '#666', fontWeight: '600' },
  detailValue: { fontSize: 15, color: '#333', fontWeight: '500', textAlign: 'right', flex: 1, marginLeft: 12 },
  statusBadge: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 16 
  },
  statusText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  label: { color: '#333', marginTop: 8, fontSize: 14, fontWeight: '600', marginBottom: 4 },
  input: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    padding: 12, 
    borderRadius: 8, 
    fontSize: 15,
    backgroundColor: '#fff'
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  row: { 
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    marginBottom: 12
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8
  },
  statusPicker: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8,
    marginBottom: 12,
    marginTop: 6
  },
  statusOption: { 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff'
  },
  statusOptionActive: { 
    backgroundColor: '#1976d2',
    borderColor: '#1976d2'
  },
  statusOptionText: { fontSize: 13, color: '#666', fontWeight: '600' },
  statusOptionTextActive: { color: '#fff' },
  actions: { 
    flexDirection: 'row', 
    gap: 12,
    marginTop: 12
  },
  button: { 
    flex: 1, 
    padding: 14, 
    borderRadius: 8, 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  buttonPrimary: { backgroundColor: '#1976d2' },
  buttonSuccess: { backgroundColor: '#2e7d32' },
  buttonWarning: { backgroundColor: '#f57c00' },
  buttonDanger: { backgroundColor: '#d32f2f' },
  buttonSecondary: { backgroundColor: '#757575' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 }
});
