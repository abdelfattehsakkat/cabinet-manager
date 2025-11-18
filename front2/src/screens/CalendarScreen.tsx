import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, Platform, Pressable } from 'react-native';
import { getAppointments } from '../api/appointments';
import CalendarWeb from './CalendarWeb';
import CalendarMobile from './CalendarMobile';
import AppointmentModal from '../ui/AppointmentModal';

export default function CalendarScreen() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const { width } = useWindowDimensions();
  const isSmall = width < 768 || Platform.OS !== 'web';
  const [modalVisible, setModalVisible] = useState(false);
  const [modalInitial, setModalInitial] = useState<string | null>(null);
  const [modalDuration, setModalDuration] = useState<number>(30);

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calendrier</Text>
      {isSmall ? (
        <CalendarMobile appointments={appointments} onSelect={(a) => { /* TODO: open detail */ }} />
      ) : (
        <CalendarWeb appointments={appointments} onSelect={(a) => { /* TODO: open detail */ }} onCreate={(initial) => openCreate(initial)} />
      )}

      {/* floating create button for small screens (mobile) */}
      {isSmall && (
        <Pressable onPress={() => openCreate(null)} style={styles.fab}>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700' }}>＋</Text>
        </Pressable>
      )}

      <AppointmentModal visible={modalVisible} initial={modalInitial} initialDuration={modalDuration} onClose={closeCreate} onCreated={() => { loadAppointments(); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 20, marginBottom: 8 }
  ,
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#1976d2', alignItems: 'center', justifyContent: 'center', elevation: 4 }
});
