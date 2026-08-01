import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { customerService, CustomerItem } from '../services/customerService';

const CustomersPage = () => {
  const { token } = useAuth();
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadCustomers = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const payload = await customerService.list(token, { page, limit: 10, search });
      setCustomers(payload?.items ?? []);
      setTotalPages(payload?.totalPages ?? 1);
      const statsPayload = await customerService.getStats(token);
      setStats(statsPayload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCustomers();
  }, [token, page]);

  const filteredCustomers = useMemo(() => customers.filter((customer) => `${customer.customerId} ${customer.fullName} ${customer.email} ${customer.phone ?? ''}`.toLowerCase().includes(search.toLowerCase())), [customers, search]);

  const deleteCustomer = async (customerId: string) => {
    if (!token || !window.confirm('Delete this customer?')) return;
    try {
      await customerService.delete(token, customerId);
      await loadCustomers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete customer');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <header style={{ marginBottom: '1rem' }}>
          <h1 style={{ margin: 0, color: '#0f172a' }}>Customers</h1>
          <p style={{ margin: '0.35rem 0 0', color: '#64748b' }}>Manage customer relationships and engagement history.</p>
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
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, email, or phone" style={{ flex: 1, minWidth: '260px', padding: '0.8rem 0.9rem', borderRadius: '12px', border: '1px solid #cbd5e1' }} />
        </div>

        {loading ? (
          <div style={{ color: '#64748b' }}>Loading customers...</div>
        ) : error ? (
          <div style={{ color: '#dc2626' }}>{error}</div>
        ) : filteredCustomers.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>No customers found.</div>
        ) : (
          <div style={{ display: 'grid', gap: '0.9rem' }}>
            {filteredCustomers.map((customer) => (
              <div key={customer._id} style={{ background: '#fff', borderRadius: '16px', padding: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{customer.fullName}</div>
                    <div style={{ color: '#64748b', marginTop: '0.25rem' }}>{customer.email}</div>
                    <div style={{ color: '#64748b' }}>{customer.phone ?? 'No phone'} • {customer.source ?? 'Unknown source'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => void deleteCustomer(customer._id)} style={{ padding: '0.5rem 1rem', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Bookings: <strong>{customer.totalBookings ?? 0}</strong></div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Orders: <strong>{customer.totalOrders ?? 0}</strong></div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Total Spent: <strong>₹{customer.totalSpent ?? 0}</strong></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ padding: '0.5rem 1rem', background: page === 1 ? '#e2e8f0' : '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>Previous</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            </div>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '0.5rem 1rem', background: page === totalPages ? '#e2e8f0' : '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomersPage;
