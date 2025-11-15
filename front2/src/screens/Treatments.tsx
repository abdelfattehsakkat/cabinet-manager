import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Treatments() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Soins</Text>
      <Text>Patient treatments history, add new treatment, payments... (placeholder)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 20, marginBottom: 8 }
});
