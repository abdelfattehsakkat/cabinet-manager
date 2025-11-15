import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Patients() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Patients</Text>
      <Text>List, search and manage patients here (placeholder)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 20, marginBottom: 8 }
});
