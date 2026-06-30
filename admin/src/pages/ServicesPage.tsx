import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { serviceService, ServiceItem } from '../services/serviceService';

const ServicesPage = () => {
  const { token } = useAuth();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page] = useState(1);

  const loadServices = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const payload = await serviceService.list(token, { page, limit: 8, search, status: status === 'all' ? undefined : status });
      setServices(payload?.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadServices();
  }, [token, page, status]);

  const filteredServices = useMemo(() => services.filter((service) => service.name.toLowerCase().includes(search.toLowerCase())), [search, services]);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h1 style={{ margin: 0, color: '#0f172a' }}>Services Management</h1>
            <p style={{ margin: '0.35rem 0 0', color: '#64748b' }}>Manage service catalog, pricing, and visibility.</p>
          </div>
          <button style={{ padding: '0.8rem 1rem', borderRadius: '12px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
            + Add Service
          </button>
        </header>

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search services" style={{ flex: 1, minWidth: '240px', padding: '0.8rem 0.9rem', borderRadius: '12px', border: '1px solid #cbd5e1' }} />
          <select value={status} onChange={(event) => setStatus(event.target.value)} style={{ padding: '0.8rem 0.9rem', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#fff' }}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {loading ? (
          <div style={{ color: '#64748b' }}>Loading services...</div>
        ) : error ? (
          <div style={{ color: '#dc2626' }}>{error}</div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {filteredServices.map((service) => (
              <div key={service._id} style={{ background: '#fff', borderRadius: '16px', padding: '1rem', boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0, color: '#0f172a' }}>{service.name}</h3>
                    <p style={{ margin: '0.35rem 0 0', color: '#64748b' }}>{service.description ?? 'No description provided.'}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: '#2563eb' }}>${service.price}</div>
                    <div style={{ marginTop: '0.25rem', color: service.isActive ? '#16a34a' : '#dc2626' }}>{service.isActive ? 'Active' : 'Inactive'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServicesPage;
