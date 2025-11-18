import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Platform, SectionList, Pressable, useWindowDimensions } from 'react-native';
import { getAppointments, Appointment } from '../api/appointments';

// Only load FullCalendar on web
let FullCalendar: any = null;
let dayGridPlugin: any = null;
let timeGridPlugin: any = null;
let interactionPlugin: any = null;
let frLocale: any = null;

if (Platform.OS === 'web') {
  // dynamic require so native bundles don't include it
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  FullCalendar = require('@fullcalendar/react').default;
  dayGridPlugin = require('@fullcalendar/daygrid').default;
  timeGridPlugin = require('@fullcalendar/timegrid').default;
  interactionPlugin = require('@fullcalendar/interaction').default;
  try {
    frLocale = require('@fullcalendar/core/locales/fr').default;
  } catch (e) {
    // fallback: leave frLocale null
    frLocale = null;
  }
}

export default function CalendarScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const { width } = useWindowDimensions();
  const isSmall = width < 768 || Platform.OS !== 'web';

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      // mirror Angular logic: fetch extended range (previous month -> next month)
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59);

      // Pass ISO strings (backend expects date strings)
      const res = await getAppointments({ startDate: startDate.toISOString(), endDate: endDate.toISOString() });
      setAppointments(res || []);
    } catch (err) {
      console.error('Failed to load appointments', err);
    }
  };

  // Group appointments by local day for mobile/list view
  const sections = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    appointments.forEach(a => {
      const d = new Date(a.date);
      const local = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
      const key = local.toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    });
    const arr = Array.from(map.entries()).sort((l, r) => new Date(l[0]).getTime() - new Date(r[0]).getTime()).map(([title, data]) => ({ title, data }));
    return arr;
  }, [appointments]);

  // Renderers
  const renderItem = ({ item }: { item: Appointment }) => {
    const d = new Date(item.date);
    const local = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
    const time = local.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false });
    return (
      <Pressable style={styles.item}>
        <Text style={styles.itemTitle}>{time} — {item.patientName || `${item.patientFirstName} ${item.patientLastName}`}</Text>
        <Text style={styles.itemSub}>{item.type || 'Consultation'}</Text>
      </Pressable>
    );
  };

  const renderSectionHeader = ({ section }: any) => {
    // section.title is a Date string; format in French: 'lundi 18 novembre 2025'
    const d = new Date(section.title);
    const formatted = d.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    return (
      <View style={styles.sectionHeader}><Text style={styles.sectionHeaderText}>{formatted}</Text></View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calendrier</Text>
      {isSmall ? (
        // Mobile / small screens: grouped list
        <SectionList
          sections={sections}
          keyExtractor={(item: Appointment) => item._id || `${item.date}-${Math.random()}`}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          contentContainerStyle={{ paddingBottom: 48 }}
        />
      ) : (
        // Web: render FullCalendar
        FullCalendar ? (
          <div style={{ width: '100%' }}>
            {/* @ts-ignore */}
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              locale={frLocale || 'fr'}
              headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
              buttonText={{ today: 'Aujourd\'hui', month: 'Mois', week: 'Semaine', day: 'Jour', list: 'Liste' }}
              events={appointments.map(a => {
                const d = new Date(a.date);
                const local = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
                const end = new Date(local.getTime() + ((a.duration || 30) * 60000));
                return {
                  id: a._id,
                  title: `${a.patientName || `${a.patientFirstName} ${a.patientLastName}`}`,
                  start: local,
                  end,
                };
              })}
              eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
              height={600}
            />
          </div>
        ) : (
          <Text>Calendar (web) loading...</Text>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 20, marginBottom: 8 },
  sectionHeader: { paddingVertical: 8, backgroundColor: '#f1f1f1', paddingHorizontal: 8, borderRadius: 6, marginTop: 12 },
  sectionHeaderText: { fontWeight: '700' },
  item: { padding: 12, backgroundColor: '#fff', borderRadius: 8, marginTop: 8, marginHorizontal: 2, elevation: 1 },
  itemTitle: { fontWeight: '700' },
  itemSub: { color: '#666', marginTop: 4 }
});
