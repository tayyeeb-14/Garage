import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { BellRing, CheckCircle2, Sparkles, Wrench } from 'lucide-react-native';

const notifications = [
  { title: 'Booking confirmed', text: 'Your pickup has been scheduled for tomorrow morning.', icon: <CheckCircle2 size={18} color="#2563eb" /> },
  { title: 'Mechanic assigned', text: 'A certified technician is on the way to your location.', icon: <Wrench size={18} color="#2563eb" /> },
  { title: 'Offer unlocked', text: 'Enjoy 10% off your next full bike or car service.', icon: <Sparkles size={18} color="#2563eb" /> },
];

const NotificationsScreen = () => (
  <View style={styles.container}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <View>
          <Text style={styles.eyebrow}>Notifications</Text>
          <Text style={styles.header}>Your service updates</Text>
        </View>
        <View style={styles.iconWrap}>
          <BellRing size={20} color="#2563eb" />
        </View>
      </View>
      {notifications.map((item) => (
        <View key={item.title} style={styles.card}>
          <View style={styles.iconCircle}>{item.icon}</View>
          <View style={styles.textWrap}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.text}>{item.text}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 140,
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 18,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  eyebrow: {
    color: '#2563eb',
    fontWeight: '800',
    marginBottom: 6,
  },
  header: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  text: {
    color: '#64748b',
    lineHeight: 20,
  },
});

export default NotificationsScreen;
