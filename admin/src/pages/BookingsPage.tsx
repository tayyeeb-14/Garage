import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { bookingService, BookingItem } from '../services/bookingService';

const statusOptions = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];

const BookingsPage = () => {
  const { token } = useAuth();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const loadBookings = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const payload = await bookingService.list(token, { page, limit: 8, search, status: status === 'all' ? undefined : status });
      setBookings(payload?.items ?? []);
      setTotalPages(payload?.totalPages ?? 1);
      const statsPayload = await bookingService.getStats(token);
      setStats(statsPayload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBookings();
  }, [token, page, status]);

  const filteredBookings = useMemo(() => bookings.filter((booking) => `${booking.bookingId} ${booking.customer?.fullName ?? ''} ${booking.vehicle?.plateNumber ?? ''}`.toLowerCase().includes(search.toLowerCase())), [bookings, search]);

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    if (!token) return;
    try {
      await bookingService.update(token, bookingId, { status: newStatus as BookingItem['status'] });
      await loadBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update booking');
    }
  };

  const deleteBooking = async (bookingId: string) => {
    if (!token || !window.confirm('Delete this booking?')) return;
    try {
      await bookingService.delete(token, bookingId);
      await loadBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete booking');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <header style={{ marginBottom: '1rem' }}>
          <h1 style={{ margin: 0, color: '#0f172a' }}>Bookings</h1>
          <p style={{ margin: '0.35rem 0 0', color: '#64748b' }}>Manage appointments, status, and customer requests.</p>
        </header>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
          {stats ? Object.entries(stats).map(([key, value]) => (
            <div key={key} style={{ background: '#fff', borderRadius: '14px', padding: '1rem', border: '1px solid #e2e8f0' }}>
              <div style={{ color: '#64748b', textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', marginTop: '0.25rem' }}>{value as number}</div>
            </div>
          )) : null}
        </section>

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by booking ID or customer" style={{ flex: 1, minWidth: '260px', padding: '0.8rem 0.9rem', borderRadius: '12px', border: '1px solid #cbd5e1' }} />
          <select value={status} onChange={(event) => setStatus(event.target.value)} style={{ padding: '0.8rem 0.9rem', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
            <option value="all">All statuses</option>
            {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{ color: '#64748b' }}>Loading bookings...</div>
        ) : error ? (
          <div style={{ color: '#dc2626' }}>{error}</div>
        ) : filteredBookings.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>No bookings found.</div>
        ) : (
          <div style={{ display: 'grid', gap: '0.9rem' }}>
            {filteredBookings.map((booking) => (
              <div key={booking._id} style={{ background: '#fff', borderRadius: '16px', padding: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{booking.bookingId}</div>
                    <div style={{ color: '#64748b', marginTop: '0.25rem' }}>{booking.customer?.fullName ?? 'Customer'}</div>
                    <div style={{ color: '#64748b' }}>{booking.vehicle?.plateNumber ?? 'Vehicle'} • {new Date(booking.bookingDate).toLocaleDateString()}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select value={booking.status} onChange={(event) => void updateBookingStatus(booking._id, event.target.value)} style={{ padding: '0.6rem 0.8rem', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                      {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                    <button onClick={() => setSelectedBookingId(booking._id)} style={{ padding: '0.6rem 0.8rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>Details</button>
                    <button onClick={() => void deleteBooking(booking._id)} style={{ padding: '0.6rem 0.8rem', borderRadius: '10px', border: '1px solid #fecaca', background: '#fff1f2', color: '#dc2626', cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
                {selectedBookingId === booking._id ? (
                  <div style={{ marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px solid #e2e8f0' }}>
                    <div><strong>Time:</strong> {booking.preferredTime}</div>
                    <div><strong>Address:</strong> {booking.address}</div>
                    <div><strong>Services:</strong> {booking.services?.map((service) => service.name).join(', ')}</div>
                    <div><strong>Notes:</strong> {booking.notes ?? 'None'}</div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
          <button disabled={page <= 1} onClick={() => setPage((prev) => prev - 1)} style={{ padding: '0.7rem 1rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff' }}>Previous</button>
          <span style={{ color: '#64748b', alignSelf: 'center' }}>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((prev) => prev + 1)} style={{ padding: '0.7rem 1rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff' }}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default BookingsPage;
