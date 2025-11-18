import React from 'react';
import { SectionList, View, Text, Pressable, StyleSheet } from 'react-native';

type Appointment = {
  _id?: string;
  patientFirstName?: string;
  patientLastName?: string;
  patientName?: string;
  date: string;
  duration?: number;
  type?: string;
};

type Props = { appointments: Appointment[]; onSelect?: (a: Appointment) => void };

export default function CalendarMobile({ appointments, onSelect }: Props) {
  // group by local date
  const map = new Map<string, Appointment[]>();
  appointments.forEach(a => {
    const d = new Date(a.date);
    const local = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
    const key = new Date(local.getFullYear(), local.getMonth(), local.getDate()).toDateString();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(a);
  });
  const sections = Array.from(map.entries()).sort((l, r) => new Date(l[0]).getTime() - new Date(r[0]).getTime()).map(([title, data]) => ({ title, data }));

  const renderItem = ({ item }: { item: Appointment }) => {
    const d = new Date(item.date);
    const local = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
    const time = local.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false });
    return (
      <Pressable style={styles.item} onPress={() => onSelect && onSelect(item)}>
        <Text style={styles.itemTitle}>{time} — {item.patientName || `${item.patientFirstName} ${item.patientLastName}`}</Text>
        <Text style={styles.itemSub}>{item.type || 'Consultation'}</Text>
      </Pressable>
    );
  };

  const renderSectionHeader = ({ section }: any) => {
    const d = new Date(section.title);
    const formatted = d.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    return <View style={styles.sectionHeader}><Text style={styles.sectionHeaderText}>{formatted}</Text></View>;
  };

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item: Appointment) => item._id || `${item.date}-${Math.random()}`}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      contentContainerStyle={{ paddingBottom: 48 }}
    />
  );
}

const styles = StyleSheet.create({
  sectionHeader: { paddingVertical: 8, backgroundColor: '#f1f1f1', paddingHorizontal: 8, borderRadius: 6, marginTop: 12 },
  sectionHeaderText: { fontWeight: '700' },
  item: { padding: 12, backgroundColor: '#fff', borderRadius: 8, marginTop: 8, marginHorizontal: 2, elevation: 1 },
  itemTitle: { fontWeight: '700' },
  itemSub: { color: '#666', marginTop: 4 }
});
