import React, { useState } from 'react';
import { View, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import TabBar from '../ui/TabBar';
import Dashboard from './Dashboard';
import Patients from './Patients';
import Treatments from './Treatments';
import CalendarScreen from './CalendarScreen';
import Manager from './Manager';

type Props = { 
  onLogout?: () => void;
};

/**
 * Composant Home pour mobile avec TabBar en bas
 */
export default function HomeMobile({ onLogout }: Props) {
  const [route, setRoute] = useState<string>('home');

  let Content = null;
  switch(route) {
    case 'home': Content = <Dashboard />; break;
    case 'patients': Content = <Patients />; break;
    case 'treatments': Content = <Treatments />; break;
    case 'calendar': Content = <CalendarScreen />; break;
    case 'manager': Content = <Manager />; break;
    default: Content = <Dashboard />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {Content}
      </View>
      <TabBar active={route} onChange={setRoute} onLogout={onLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
});
