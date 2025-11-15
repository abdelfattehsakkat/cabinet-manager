import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Manager() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manager</Text>
      <Text>User management placeholder</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 20, marginBottom: 8 }
});
