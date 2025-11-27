import React, { useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import Menu from '../ui/Menu';
import HomeMobile from './HomeMobile';
import Dashboard from './Dashboard';
import Patients from './Patients';
import Treatments from './Treatments';
import CalendarScreen from './CalendarScreen';
import Manager from './Manager';
import { UserInfo } from '../../App';

type Props = { 
  onLogout?: () => void;
  user?: UserInfo | null;
};

export default function Home({ onLogout, user }: Props) {
  const [route, setRoute] = useState<'home'|'patients'|'treatments'|'calendar'|'manager'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const { width } = useWindowDimensions();
  
  // Permissions basées sur le rôle utilisateur
  const userPermissions = user?.role ? [user.role] : [];
  
  // Détection mobile : width < 768px ou platform native
  const isMobile = width < 768 || Platform.OS !== 'web';

  // Si mobile, utiliser HomeMobile avec TabBar
  if (isMobile) {
    return <HomeMobile onLogout={onLogout} user={user} />;
  }

  // Sinon, utiliser la version web avec Menu horizontal
  let Content = null;
  switch(route) {
    case 'home': Content = <Dashboard />; break;
    case 'patients': Content = <Patients />; break;
    case 'treatments': Content = <Treatments />; break;
    case 'calendar': Content = <CalendarScreen />; break;
    case 'manager': Content = <Manager />; break;
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // TODO: Implement global search logic
    console.log('Searching for:', query);
  };

  return (
    <View style={styles.container}>
      <Menu active={route} onChange={setRoute} onLogout={onLogout} onSearch={handleSearch} userPermissions={userPermissions} />
      <View style={styles.content}>{Content}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 16 }
});
