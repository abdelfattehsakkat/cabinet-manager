import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Menu from '../ui/Menu';
import Patients from './Patients';
import Treatments from './Treatments';
import CalendarScreen from './CalendarScreen';
import Manager from './Manager';

type Props = { onLogout?: () => void };

export default function Home({ onLogout }: Props) {
  const [route, setRoute] = useState<'patients'|'treatments'|'calendar'|'manager'>('patients');

  let Content = null;
  switch(route) {
    case 'patients': Content = <Patients />; break;
    case 'treatments': Content = <Treatments />; break;
    case 'calendar': Content = <CalendarScreen />; break;
    case 'manager': Content = <Manager />; break;
  }

  return (
    <View style={styles.container}>
  <Menu active={route} onChange={setRoute} onLogout={onLogout} />
      <View style={styles.content}>{Content}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 16 }
});
