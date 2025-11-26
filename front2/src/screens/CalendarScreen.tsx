import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, Platform, Pressable } from 'react-native';
import { getAppointments } from '../api/appointments';
import api from '../api/client';
import CalendarWeb from './CalendarWeb';
import CalendarMobile from './CalendarMobile';
import AppointmentModal from '../ui/AppointmentModal';
import AppointmentDetailModal from '../ui/AppointmentDetailModal';

export default function CalendarScreen() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const { width } = useWindowDimensions();
  const isSmall = width < 768 || Platform.OS !== 'web';
  const [modalVisible, setModalVisible] = useState(false);
  const [modalInitial, setModalInitial] = useState<string | null>(null);
  const [modalDuration, setModalDuration] = useState<number>(30);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  useEffect(() => { loadAppointments(); }, []);

  async function loadAppointments() {
    try {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59);
      const res = await getAppointments({ startDate: startDate.toISOString(), endDate: endDate.toISOString() });
      setAppointments(res || []);
    } catch (err) {
      console.error('Failed to load appointments', err);
    }
  }

  function openCreate(initial?: string | null, duration = 30) {
    setModalInitial(initial || null);
    setModalDuration(duration);
    setModalVisible(true);
  }

  function closeCreate() {
    setModalVisible(false);
    setModalInitial(null);
  }

  function openDetail(appointment: any) {
    setSelectedAppointment(appointment);
    setDetailModalVisible(true);
  }

  function closeDetail() {
    setDetailModalVisible(false);
    setSelectedAppointment(null);
  }

  async function updateAppointmentStatus(id: string, status: string) {
    try {
      await api.put(`/appointments/${id}`, { status });
      await loadAppointments();
    } catch (err) {
      console.error('Failed to update appointment status', err);
      alert('Erreur lors de la mise à jour du statut');
    }
  }

  return (
    <View style={styles.container}>
      {isSmall ? (
        <CalendarMobile 
          appointments={appointments} 
          onSelect={(a) => openDetail(a)} 
          onCreate={(initial) => openCreate(initial, 30)}
        />
      ) : (
        <>
          <Text style={styles.title}>Calendrier</Text>
          <CalendarWeb appointments={appointments} onSelect={(a) => openDetail(a)} onCreate={(initial) => openCreate(initial)} onUpdateStatus={updateAppointmentStatus} />
        </>
      )}

      {/* floating create button for small screens (mobile) */}
      {isSmall && (
        <Pressable onPress={() => {
          // Date du jour à 09:00 par défaut
          const today = new Date();
          today.setHours(9, 0, 0, 0);
          openCreate(today.toISOString(), 30);
        }} style={styles.fab}>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700' }}>＋</Text>
        </Pressable>
      )}

      <AppointmentModal visible={modalVisible} initial={modalInitial} initialDuration={modalDuration} onClose={closeCreate} onCreated={() => { loadAppointments(); }} />
      
      <AppointmentDetailModal 
        visible={detailModalVisible} 
        appointment={selectedAppointment} 
        onClose={closeDetail} 
        onUpdated={() => { loadAppointments(); }}
        onDeleted={() => { loadAppointments(); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 20, marginBottom: 8 }
  ,
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#1976d2', alignItems: 'center', justifyContent: 'center', elevation: 4 }
});
