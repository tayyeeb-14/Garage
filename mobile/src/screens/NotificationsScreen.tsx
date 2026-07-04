import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const NotificationsScreen = () => (
  <View style={styles.container}>
    <Text style={styles.header}>Notifications</Text>
    <View style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>No alerts yet</Text>
      <Text style={styles.emptyText}>Service updates, reminders and offers will appear here.</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  header: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 18,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10,
  },
  emptyText: {
    color: '#64748b',
    lineHeight: 22,
  },
});

export default NotificationsScreen;
