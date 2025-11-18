import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { getAppointments } from '../api/appointments';
import CalendarWeb from './CalendarWeb';
import CalendarMobile from './CalendarMobile';

export default function CalendarScreen() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const { width } = useWindowDimensions();
  const isSmall = width < 768 || Platform.OS !== 'web';

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calendrier</Text>
      {isSmall ? (
        <CalendarMobile appointments={appointments} />
      ) : (
        <CalendarWeb appointments={appointments} onSelect={(a) => { /* TODO: open detail */ }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 20, marginBottom: 8 }
});
