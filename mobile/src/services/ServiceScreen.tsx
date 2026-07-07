import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { formatCurrency } from '../utils/currency';
import { createBookingRequest, CreatedBooking, fetchServicesForDetails, fetchVehiclesForBooking, getCurrentCustomerId } from './bookingFlowService';
import { PublicService, Vehicle } from './dashboardService';

type ScreenMode = 'list' | 'details' | 'booking' | 'success';

const MobileServiceScreen = () => {
  const [services, setServices] = useState<PublicService[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [screenMode, setScreenMode] = useState<ScreenMode>('list');
  const [selectedService, setSelectedService] = useState<PublicService | null>(null);
  const [latestBooking, setLatestBooking] = useState<CreatedBooking | null>(null);

  const loadServices = async () => {
    try {
      const payload = await fetchServicesForDetails();
      setServices(payload);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadServices();
  }, []);

  const filteredServices = services.filter((service) => service.name.toLowerCase().includes(search.toLowerCase()));
  const relatedServices = useMemo(
    () => services.filter((item) => item._id !== selectedService?._id).slice(0, 4),
    [selectedService?._id, services]
  );

  const onSelectService = (service: PublicService) => {
    setSelectedService(service);
    setScreenMode('details');
  };

  if (screenMode === 'details' && selectedService) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backButton} onPress={() => setScreenMode('list')}>
            <Text style={styles.backButtonText}>← Back to Services</Text>
          </TouchableOpacity>
          {selectedService.thumbnailImage ? (
            <Image source={{ uri: selectedService.thumbnailImage }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]}>
              <Text style={styles.heroPlaceholderText}>Premium Service</Text>
            </View>
          )}
          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>{selectedService.name}</Text>
            <Text style={styles.detailPrice}>Starting at {formatCurrency(selectedService.price)}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaChip}>⭐ {(selectedService.rating ?? 4.8).toFixed(1)} rating</Text>
              <Text style={styles.metaChip}>⏱️ 60-90 min</Text>
            </View>
            <Text style={styles.sectionTitle}>What's Included</Text>
            <Text style={styles.sectionText}>• Expert inspection and diagnostics{"\n"}• OEM-grade consumables and parts checks{"\n"}• Final quality and safety test run</Text>
            <Text style={styles.sectionTitle}>Benefits</Text>
            <Text style={styles.sectionText}>• Better mileage and smoother performance{"\n"}• Lower breakdown risk{"\n"}• Service history ready for resale value</Text>
            <Text style={styles.sectionTitle}>FAQ</Text>
            <Text style={styles.sectionText}>Q: How long will it take?{"\n"}A: Usually between 60 and 90 minutes.{"\n\n"}Q: Is pickup available?{"\n"}A: Yes, pickup and drop are available by slot.</Text>
            <Text style={styles.sectionTitle}>Customer Reviews</Text>
            <View style={styles.reviewCard}>
              <Text style={styles.reviewTitle}>“Fast and transparent service”</Text>
              <Text style={styles.reviewText}>Technician explained each step and delivered on time.</Text>
            </View>
            <View style={styles.reviewCard}>
              <Text style={styles.reviewTitle}>“Worth every rupee”</Text>
              <Text style={styles.reviewText}>Vehicle feels smooth after service, highly recommended.</Text>
            </View>
            <Text style={styles.sectionTitle}>Related Services</Text>
            {relatedServices.map((item) => (
              <TouchableOpacity key={item._id} style={styles.relatedCard} onPress={() => setSelectedService(item)}>
                <Text style={styles.relatedTitle}>{item.name}</Text>
                <Text style={styles.relatedPrice}>{formatCurrency(item.price)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        <View style={styles.stickyAction}>
          <TouchableOpacity style={styles.stickyButton} onPress={() => setScreenMode('booking')}>
            <Text style={styles.stickyButtonText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (screenMode === 'booking' && selectedService) {
    return (
      <BookingFlow
        service={selectedService}
        onBack={() => setScreenMode('details')}
        onSuccess={(booking) => {
          setLatestBooking(booking);
          setScreenMode('success');
        }}
      />
    );
  }

  if (screenMode === 'success' && selectedService && latestBooking) {
    return (
      <View style={styles.container}>
        <View style={styles.successCard}>
          <Text style={styles.successTitle}>Booking Confirmed</Text>
          <Text style={styles.successText}>Booking ID: {latestBooking.bookingId}</Text>
          <Text style={styles.successText}>Status: {latestBooking.status}</Text>
          <Text style={styles.successText}>Date: {new Date(latestBooking.bookingDate).toLocaleDateString()}</Text>
          <Text style={styles.successText}>Time: {latestBooking.preferredTime}</Text>
          <Text style={styles.successText}>Service: {selectedService.name}</Text>
          <Text style={styles.successText}>Vehicle: {latestBooking.vehicle ?? 'Selected vehicle'}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              setScreenMode('list');
              setSelectedService(null);
              setLatestBooking(null);
            }}
          >
            <Text style={styles.buttonText}>Go Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Services</Text>
      <TextInput value={search} onChangeText={setSearch} placeholder="Search services" style={styles.input} />
      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={filteredServices}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void loadServices(); }} />}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {item.thumbnailImage ? <Image source={{ uri: item.thumbnailImage }} style={styles.image} /> : null}
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardText} numberOfLines={2}>{item.description ?? 'Premium service for your vehicle.'}</Text>
                <View style={styles.row}>
                  <Text style={styles.price}>{formatCurrency(item.price)}</Text>
                  <TouchableOpacity style={styles.button} onPress={() => onSelectService(item)}>
                    <Text style={styles.buttonText}>View Details</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
};

const BookingFlow = ({
  service,
  onBack,
  onSuccess,
}: {
  service: PublicService;
  onBack: () => void;
  onSuccess: (booking: CreatedBooking) => void;
}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('10:00');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [pickupRequired, setPickupRequired] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const data = await fetchVehiclesForBooking();
        setVehicles(data);
      } finally {
        setLoading(false);
      }
    };
    void loadVehicles();
  }, []);

  const selectedVehicleData = vehicles.find((vehicle) => vehicle._id === selectedVehicle);

  const submitBooking = async () => {
    if (!selectedVehicle || !bookingDate || !preferredTime || address.trim().length < 3) {
      Alert.alert('Incomplete details', 'Please fill vehicle, date, time and address.');
      return;
    }
    try {
      setSubmitting(true);
      const customerId = await getCurrentCustomerId();
      const booking = await createBookingRequest({
        customer: customerId,
        vehicle: selectedVehicle,
        services: [service._id],
        bookingDate,
        preferredTime,
        pickupRequired,
        address: address.trim(),
        notes: notes.trim() || undefined,
      });
      onSuccess(booking);
    } catch (error) {
      Alert.alert('Booking failed', error instanceof Error ? error.message : 'Unable to place booking');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.flowContent}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>← Back to Details</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Booking Flow</Text>
      <Text style={styles.subtitle}>Step {step} of 4</Text>

      {step === 1 ? (
        <View>
          <Text style={styles.sectionTitle}>Step 1: Select Vehicle</Text>
          {vehicles.map((vehicle) => (
            <TouchableOpacity
              key={vehicle._id}
              style={[styles.option, selectedVehicle === vehicle._id && styles.optionSelected]}
              onPress={() => setSelectedVehicle(vehicle._id)}
            >
              <Text style={styles.optionText}>{vehicle.plateNumber} • {vehicle.make} {vehicle.modelName}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {step === 2 ? (
        <View>
          <Text style={styles.sectionTitle}>Step 2: Select Date & Time</Text>
          <TextInput value={bookingDate} onChangeText={setBookingDate} placeholder="YYYY-MM-DD" style={styles.input} />
          <TextInput value={preferredTime} onChangeText={setPreferredTime} placeholder="HH:MM (24h)" style={styles.input} />
          <TextInput value={address} onChangeText={setAddress} placeholder="Service address" style={styles.input} />
          <TextInput value={notes} onChangeText={setNotes} placeholder="Additional notes (optional)" style={styles.input} multiline />
          <TouchableOpacity style={styles.switchRow} onPress={() => setPickupRequired((prev) => !prev)}>
            <Text style={styles.switchLabel}>Pickup Required</Text>
            <Text style={styles.switchValue}>{pickupRequired ? 'Yes' : 'No'}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {step === 3 ? (
        <View>
          <Text style={styles.sectionTitle}>Step 3: Review Booking</Text>
          <View style={styles.reviewBlock}>
            <Text style={styles.reviewLine}>Service: {service.name}</Text>
            <Text style={styles.reviewLine}>Price: {formatCurrency(service.price)}</Text>
            <Text style={styles.reviewLine}>Vehicle: {selectedVehicleData ? `${selectedVehicleData.plateNumber} • ${selectedVehicleData.make}` : 'Not selected'}</Text>
            <Text style={styles.reviewLine}>Date & Time: {bookingDate || '-'} {preferredTime || '-'}</Text>
            <Text style={styles.reviewLine}>Address: {address || '-'}</Text>
            <Text style={styles.reviewLine}>Pickup: {pickupRequired ? 'Yes' : 'No'}</Text>
          </View>
        </View>
      ) : null}

      {step === 4 ? (
        <View>
          <Text style={styles.sectionTitle}>Step 4: Booking Confirmation</Text>
          <Text style={styles.sectionText}>Tap confirm to place your booking request.</Text>
        </View>
      ) : null}

      <View style={styles.flowButtons}>
        {step > 1 ? (
          <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep((prev) => prev - 1)}>
            <Text style={styles.secondaryButtonText}>Previous</Text>
          </TouchableOpacity>
        ) : null}
        {step < 4 ? (
          <TouchableOpacity style={styles.button} onPress={() => setStep((prev) => prev + 1)}>
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.button} onPress={() => void submitBooking()} disabled={submitting}>
            <Text style={styles.buttonText}>{submitting ? 'Confirming...' : 'Confirm Booking'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  flowContent: { paddingBottom: 48 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  title: { fontSize: 24, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  input: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderColor: '#cbd5e1', borderWidth: 1, marginBottom: 12 },
  list: { paddingBottom: 24 },
  card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  image: { width: '100%', height: 140, backgroundColor: '#e2e8f0' },
  cardContent: { padding: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  cardText: { color: '#64748b', marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  price: { fontSize: 15, fontWeight: '700', color: '#2563eb' },
  button: { backgroundColor: '#2563eb', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  buttonText: { color: '#fff', fontWeight: '600' },
  backButton: { alignSelf: 'flex-start', marginBottom: 10, backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  backButtonText: { color: '#2563eb', fontWeight: '700' },
  heroImage: { width: '100%', height: 220, borderRadius: 18, backgroundColor: '#e2e8f0' },
  heroPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  heroPlaceholderText: { color: '#475569', fontWeight: '700' },
  detailCard: { marginTop: 14, backgroundColor: '#fff', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  detailTitle: { fontSize: 24, fontWeight: '900', color: '#0f172a' },
  detailPrice: { marginTop: 6, color: '#2563eb', fontWeight: '800', fontSize: 16 },
  metaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 10, marginBottom: 8 },
  metaChip: { backgroundColor: '#eff6ff', color: '#1d4ed8', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, fontWeight: '700', overflow: 'hidden' },
  sectionTitle: { marginTop: 12, marginBottom: 6, fontWeight: '800', color: '#0f172a', fontSize: 16 },
  sectionText: { color: '#475569', lineHeight: 21 },
  reviewCard: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e2e8f0', marginTop: 8 },
  reviewTitle: { color: '#0f172a', fontWeight: '700' },
  reviewText: { color: '#64748b', marginTop: 4 },
  relatedCard: { marginTop: 8, backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', justifyContent: 'space-between' },
  relatedTitle: { color: '#0f172a', fontWeight: '700' },
  relatedPrice: { color: '#2563eb', fontWeight: '700' },
  stickyAction: { position: 'absolute', left: 16, right: 16, bottom: 108, backgroundColor: '#f8fafc' },
  stickyButton: { backgroundColor: '#2563eb', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  stickyButtonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  option: { backgroundColor: '#fff', padding: 12, borderRadius: 12, borderColor: '#e2e8f0', borderWidth: 1, marginBottom: 8 },
  optionSelected: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  optionText: { color: '#0f172a', fontWeight: '600' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, marginBottom: 8, backgroundColor: '#fff', borderRadius: 12, borderColor: '#e2e8f0', borderWidth: 1, padding: 12 },
  switchLabel: { color: '#0f172a', fontWeight: '700' },
  switchValue: { color: '#2563eb', fontWeight: '700' },
  flowButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, gap: 10 },
  secondaryButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  secondaryButtonText: { color: '#334155', fontWeight: '600' },
  subtitle: { color: '#64748b', marginTop: -4, marginBottom: 12 },
  reviewBlock: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', padding: 12 },
  reviewLine: { color: '#334155', marginBottom: 6 },
  successCard: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#e2e8f0', padding: 18, marginTop: 24 },
  successTitle: { color: '#0f172a', fontWeight: '900', fontSize: 24, marginBottom: 10 },
  successText: { color: '#334155', marginBottom: 6 },
});

export default MobileServiceScreen;
