import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { API_URL } from '../config/api';
import { formatCurrency } from '../utils/currency';

interface Vehicle { _id: string; plateNumber: string; make: string; modelName: string; year: number; }
interface Service { _id: string; name: string; price: number; }
interface BookingDraft { vehicle?: string; service?: string; bookingDate: string; preferredTime: string; address: string; notes: string; pickupRequired: boolean; }

const BookingScreen = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<BookingDraft>({ bookingDate: '', preferredTime: '09:00', address: '', notes: '', pickupRequired: false });
  const [submitted, setSubmitted] = useState(false);
  const [bookingId, setBookingId] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [vehicleRes, serviceRes] = await Promise.all([
          fetch(`${API_URL}/vehicles`),
          fetch(`${API_URL}/services/public`),
        ]);
        const [vehiclePayload, servicePayload] = await Promise.all([vehicleRes.json().catch(() => ({})), serviceRes.json().catch(() => ({}))]);
        setVehicles(vehiclePayload.data ?? []);
        setServices(servicePayload.data ?? []);
      } catch {
        Alert.alert('Error', 'Unable to load vehicles and services.');
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const selectedService = useMemo(() => services.find((service) => service._id === draft.service), [draft.service, services]);

  const submitBooking = async () => {
    if (!draft.vehicle || !draft.service || !draft.bookingDate || !draft.preferredTime || !draft.address) {
      Alert.alert('Missing fields', 'Please fill in vehicle, service, date, time and address.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: '000000000000000000000000',
          vehicle: draft.vehicle,
          services: [draft.service],
          bookingDate: draft.bookingDate,
          preferredTime: draft.preferredTime,
          pickupRequired: draft.pickupRequired,
          address: draft.address,
          notes: draft.notes,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message || 'Unable to create booking');
      }
      setBookingId(payload.data?.bookingId ?? '');
      setSubmitted(true);
    } catch (error) {
      Alert.alert('Booking failed', error instanceof Error ? error.message : 'Unable to create booking');
    }
  };

  if (submitted) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Booking Confirmed</Text>
        <Text style={styles.message}>Your booking request has been received.</Text>
        <Text style={styles.code}>Booking ID: {bookingId}</Text>
        <TouchableOpacity style={styles.button} onPress={() => setSubmitted(false)}>
          <Text style={styles.buttonText}>Make Another Booking</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 32 }} />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Book a Service</Text>
      <Text style={styles.subtitle}>Pick your vehicle, service, and preferred appointment slot.</Text>

      <Text style={styles.label}>Vehicle</Text>
      {vehicles.map((vehicle) => (
        <TouchableOpacity key={vehicle._id} style={[styles.option, draft.vehicle === vehicle._id && styles.optionSelected]} onPress={() => setDraft((prev) => ({ ...prev, vehicle: vehicle._id }))}>
          <Text style={styles.optionText}>{vehicle.plateNumber} • {vehicle.make} {vehicle.modelName}</Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.label}>Service</Text>
      {services.map((service) => (
        <TouchableOpacity key={service._id} style={[styles.option, draft.service === service._id && styles.optionSelected]} onPress={() => setDraft((prev) => ({ ...prev, service: service._id }))}>
          <Text style={styles.optionText}>{service.name} • {formatCurrency(service.price)}</Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.label}>Date</Text>
      <TextInput value={draft.bookingDate} onChangeText={(value) => setDraft((prev) => ({ ...prev, bookingDate: value }))} placeholder="YYYY-MM-DD" style={styles.input} />

      <Text style={styles.label}>Time</Text>
      <TextInput value={draft.preferredTime} onChangeText={(value) => setDraft((prev) => ({ ...prev, preferredTime: value }))} placeholder="HH:MM" style={styles.input} />

      <Text style={styles.label}>Address</Text>
      <TextInput value={draft.address} onChangeText={(value) => setDraft((prev) => ({ ...prev, address: value }))} placeholder="Enter pickup/dropoff address" style={styles.input} />

      <Text style={styles.label}>Notes</Text>
      <TextInput value={draft.notes} onChangeText={(value) => setDraft((prev) => ({ ...prev, notes: value }))} placeholder="Extra notes" style={styles.input} multiline />

      <TouchableOpacity style={styles.switchRow} onPress={() => setDraft((prev) => ({ ...prev, pickupRequired: !prev.pickupRequired }))}>
        <Text style={styles.switchLabel}>Pickup Required</Text>
        <Text>{draft.pickupRequired ? 'Yes' : 'No'}</Text>
      </TouchableOpacity>

      <Text style={styles.summary}>Selected service: {selectedService?.name ?? 'None'}</Text>
      <TouchableOpacity style={styles.button} onPress={() => void submitBooking()}>
        <Text style={styles.buttonText}>Confirm Booking</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '700', color: '#0f172a' },
  subtitle: { color: '#64748b', marginTop: 6, marginBottom: 16 },
  label: { fontWeight: '600', color: '#0f172a', marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderColor: '#cbd5e1', borderWidth: 1 },
  option: { backgroundColor: '#fff', padding: 12, borderRadius: 12, borderColor: '#e2e8f0', borderWidth: 1, marginBottom: 8 },
  optionSelected: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  optionText: { color: '#0f172a' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingVertical: 8 },
  switchLabel: { fontWeight: '600', color: '#0f172a' },
  summary: { marginTop: 16, color: '#64748b' },
  button: { marginTop: 16, backgroundColor: '#2563eb', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
  message: { color: '#64748b', marginTop: 8 },
  code: { marginTop: 12, fontWeight: '700', color: '#0f172a' },
});

export default BookingScreen;
