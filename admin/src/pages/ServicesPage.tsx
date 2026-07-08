import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { formatCurrency } from '../utils/currency';
import { useAuth } from '../hooks/useAuth';
import { SERVICE_CATEGORIES, serviceService, ServiceItem } from '../services/serviceService';
import ServiceForm from './ServiceForm';
import StatCard from '../components/StatCard';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import Badge from '../components/Badge';
import ConfirmDialog from '../components/ConfirmDialog';

const ServicesPage = () => {
  const { token } = useAuth();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [stats, setStats] = useState({ totalServices: 0, activeServices: 0, featuredServices: 0, totalCategories: 0, averageRating: 0, catalogValue: 0 });
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('all');
  const [featured, setFeatured] = useState('all');
  const [sort, setSort] = useState('date-desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [viewService, setViewService] = useState<ServiceItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ServiceItem | null>(null);

  const loadFilters = useCallback(async () => {
    if (!token) return;
    try {
      const categoryList = await serviceService.getCategories(token);
      setCategories(Array.from(new Set([...SERVICE_CATEGORIES, ...categoryList])).sort());
    } catch {
      setCategories([...SERVICE_CATEGORIES]);
    }
  }, [token]);

  const loadStats = useCallback(async () => {
    if (!token) return;
    try {
      setStats(await serviceService.getDashboardStats(token));
    } catch {
      // non-blocking
    }
  }, [token]);

  const loadServices = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const listPayload = await serviceService.list(token, {
        page,
        limit: 10,
        search: search.trim() || undefined,
        category: category || undefined,
        status: status === 'all' ? undefined : status,
        featured: featured === 'all' ? undefined : featured === 'yes' ? 'true' : 'false',
        sort,
      });
      setServices(listPayload?.items ?? []);
      setTotalPages(listPayload?.totalPages ?? 1);
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.message ?? 'Unable to load services' : 'Unable to load services');
    } finally {
      setLoading(false);
    }
  }, [token, page, search, category, status, featured, sort]);

  useEffect(() => { void loadFilters(); void loadStats(); }, [loadFilters, loadStats]);
  useEffect(() => { void loadServices(); }, [loadServices]);
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleDelete = async () => {
    if (!token || !deleteTarget) return;
    try {
      setActionLoading(true);
      await serviceService.delete(token, deleteTarget._id);
      setToast('Service deleted successfully');
      setDeleteTarget(null);
      await Promise.all([loadServices(), loadStats()]);
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.message ?? 'Unable to delete service' : 'Unable to delete service');
    } finally {
      setActionLoading(false);
    }
  };

  const hasActiveFilters = Boolean(search || category || status !== 'all' || featured !== 'all');

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <header style={headerStyle}>
          <div>
            <h1 style={titleStyle}>Services Management</h1>
            <p style={subtitleStyle}>Manage service catalog, pricing, content, and visibility.</p>
          </div>
          <button type="button" onClick={() => { setEditingService(null); setShowForm(true); }} style={primaryButtonStyle}>+ Add Service</button>
        </header>

        <section style={statsGridStyle}>
          <StatCard title="Total Services" value={stats.totalServices} />
          <StatCard title="Active Services" value={stats.activeServices} accent="#16a34a" />
          <StatCard title="Featured" value={stats.featuredServices} accent="#2563eb" />
          <StatCard title="Categories" value={stats.totalCategories} />
          <StatCard title="Avg Rating" value={stats.averageRating || '—'} accent="#d97706" />
          <StatCard title="Catalog Value" value={formatCurrency(stats.catalogValue)} accent="#2563eb" />
        </section>

        {showForm ? (
          <ServiceForm
            initialService={editingService ?? undefined}
            onCancel={() => { setShowForm(false); setEditingService(null); }}
            onSave={() => { setShowForm(false); setEditingService(null); setToast('Service saved successfully'); void Promise.all([loadServices(), loadStats()]); }}
          />
        ) : null}

        <div style={filtersCardStyle}>
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name, category, or description" style={searchInputStyle} />
          <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} style={filterStyle}>
            <option value="">All categories</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} style={filterStyle}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select value={featured} onChange={(e) => { setFeatured(e.target.value); setPage(1); }} style={filterStyle}>
            <option value="all">All featured</option>
            <option value="yes">Featured</option>
            <option value="no">Not featured</option>
          </select>
          <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} style={filterStyle}>
            <option value="date-desc">Newest</option>
            <option value="date-asc">Oldest</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="price-asc">Price Low-High</option>
            <option value="price-desc">Price High-Low</option>
            <option value="duration-asc">Duration Low-High</option>
            <option value="duration-desc">Duration High-Low</option>
          </select>
        </div>

        {toast ? <div style={toastStyle}>{toast}</div> : null}
        {error ? <div style={errorStyle}><span>{error}</span><button type="button" onClick={() => void loadServices()} style={retryButtonStyle}>Retry</button></div> : null}

        <div style={tableCardStyle}>
          {loading ? <LoadingState /> : services.length === 0 ? (
            <EmptyState message={hasActiveFilters ? 'No services match your filters.' : 'No services found. Add your first service to get started.'} />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr style={tableHeadRowStyle}>
                    {['Image', 'Service', 'Category', 'Price', 'Duration', 'Rating', 'Active', 'Featured', 'Created', 'Actions'].map((heading) => (
                      <th key={heading} style={tableHeadStyle}>{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => (
                    <tr key={service._id} style={tableRowStyle}>
                      <td style={tableCellStyle}>
                        {service.thumbnailImage ? <img src={service.thumbnailImage} alt={service.name} style={thumbStyle} /> : <div style={thumbPlaceholderStyle}>S</div>}
                      </td>
                      <td style={{ ...tableCellStyle, fontWeight: 700, color: '#0f172a', minWidth: 180 }}>{service.name}</td>
                      <td style={tableCellStyle}>{service.category}</td>
                      <td style={{ ...tableCellStyle, fontWeight: 700 }}>{formatCurrency(service.price)}</td>
                      <td style={tableCellStyle}>{service.estimatedDuration ?? 30} min</td>
                      <td style={tableCellStyle}>{service.rating ? `${service.rating.toFixed(1)} ★` : '—'}</td>
                      <td style={tableCellStyle}><Badge label={service.isActive ? 'Active' : 'Inactive'} tone={service.isActive ? 'success' : 'neutral'} /></td>
                      <td style={tableCellStyle}><Badge label={service.isFeatured ? 'Featured' : 'Standard'} tone={service.isFeatured ? 'info' : 'neutral'} /></td>
                      <td style={{ ...tableCellStyle, color: '#64748b', fontSize: 13 }}>{new Date(service.createdAt).toLocaleDateString()}</td>
                      <td style={tableCellStyle}>
                        <div style={actionsWrapStyle}>
                          <ActionButton label="View" onClick={() => setViewService(service)} />
                          <ActionButton label="Edit" onClick={() => { setEditingService(service); setShowForm(true); }} />
                          <ActionButton label="Delete" danger onClick={() => setDeleteTarget(service)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={paginationStyle}>
          <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} style={pagerButtonStyle}>Previous</button>
          <span style={{ color: '#64748b' }}>Page {page} of {totalPages}</span>
          <button type="button" disabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)} style={pagerButtonStyle}>Next</button>
        </div>

        {viewService ? (
          <div style={modalOverlayStyle}>
            <div style={modalCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <h2 style={{ margin: 0 }}>{viewService.name}</h2>
                  <p style={{ margin: '0.35rem 0 0', color: '#64748b' }}>{viewService.category}</p>
                </div>
                <button type="button" onClick={() => setViewService(null)} style={pagerButtonStyle}>Close</button>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <Badge label={viewService.isActive ? 'Active' : 'Inactive'} tone={viewService.isActive ? 'success' : 'neutral'} />
                <Badge label={viewService.isFeatured ? 'Featured' : 'Standard'} tone={viewService.isFeatured ? 'info' : 'neutral'} />
              </div>
              {viewService.thumbnailImage ? <img src={viewService.thumbnailImage} alt={viewService.name} style={viewImageStyle} /> : null}
              <p style={{ color: '#475569', lineHeight: 1.6 }}>{viewService.fullDescription || viewService.shortDescription || 'No description available.'}</p>
              {viewService.includes?.length ? (
                <div style={{ marginTop: '1rem' }}>
                  <strong>Includes:</strong>
                  <ul>{viewService.includes.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
              ) : null}
              {viewService.faq?.length ? (
                <div style={{ marginTop: '1rem' }}>
                  <strong>FAQ:</strong>
                  {viewService.faq.map((item) => <p key={item.question}><strong>{item.question}</strong><br />{item.answer}</p>)}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <ConfirmDialog
          open={Boolean(deleteTarget)}
          title="Delete service"
          message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          danger
          loading={actionLoading}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void handleDelete()}
        />
      </div>
    </div>
  );
};

const ActionButton = ({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) => (
  <button type="button" onClick={onClick} style={{ padding: '0.45rem 0.65rem', borderRadius: 10, border: danger ? '1px solid #fecaca' : '1px solid #cbd5e1', background: danger ? '#fff1f2' : '#fff', color: danger ? '#dc2626' : '#334155', cursor: 'pointer', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>{label}</button>
);

const pageStyle: React.CSSProperties = { minHeight: '100vh', background: '#f8fafc', padding: '1.5rem', fontFamily: 'Inter, sans-serif' };
const containerStyle: React.CSSProperties = { maxWidth: 1280, margin: '0 auto' };
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' };
const titleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: '2rem' };
const subtitleStyle: React.CSSProperties = { margin: '0.35rem 0 0', color: '#64748b' };
const statsGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' };
const filtersCardStyle: React.CSSProperties = { display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', background: '#fff', borderRadius: 16, padding: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 8px 30px rgba(15, 23, 42, 0.06)' };
const searchInputStyle: React.CSSProperties = { flex: 1, minWidth: 240, padding: '0.8rem 0.9rem', borderRadius: 12, border: '1px solid #cbd5e1', background: '#fff' };
const filterStyle: React.CSSProperties = { padding: '0.8rem 0.9rem', borderRadius: 12, border: '1px solid #cbd5e1', background: '#fff', minWidth: 150 };
const primaryButtonStyle: React.CSSProperties = { padding: '0.8rem 1rem', borderRadius: 12, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer' };
const toastStyle: React.CSSProperties = { marginBottom: '1rem', background: '#dcfce7', color: '#166534', padding: '0.75rem 1rem', borderRadius: 12, fontWeight: 600 };
const errorStyle: React.CSSProperties = { marginBottom: '1rem', background: '#fee2e2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' };
const retryButtonStyle: React.CSSProperties = { padding: '0.45rem 0.75rem', borderRadius: 10, border: '1px solid #fecaca', background: '#fff', cursor: 'pointer', fontWeight: 600 };
const tableCardStyle: React.CSSProperties = { background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 8px 30px rgba(15, 23, 42, 0.06)' };
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', minWidth: 980 };
const tableHeadRowStyle: React.CSSProperties = { background: '#f8fafc', borderBottom: '1px solid #e2e8f0' };
const tableHeadStyle: React.CSSProperties = { textAlign: 'left', padding: '0.9rem 1rem', color: '#64748b', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' };
const tableRowStyle: React.CSSProperties = { borderBottom: '1px solid #f1f5f9' };
const tableCellStyle: React.CSSProperties = { padding: '0.9rem 1rem', color: '#475569', verticalAlign: 'middle' };
const thumbStyle: React.CSSProperties = { width: 56, height: 56, borderRadius: 12, objectFit: 'cover', border: '1px solid #e2e8f0' };
const thumbPlaceholderStyle: React.CSSProperties = { width: 56, height: 56, borderRadius: 12, background: '#eff6ff', color: '#2563eb', display: 'grid', placeItems: 'center', fontWeight: 700 };
const actionsWrapStyle: React.CSSProperties = { display: 'flex', gap: '0.35rem', flexWrap: 'wrap' };
const paginationStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', marginTop: '1rem', alignItems: 'center' };
const pagerButtonStyle: React.CSSProperties = { padding: '0.7rem 1rem', borderRadius: 12, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600 };
const modalOverlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'grid', placeItems: 'center', zIndex: 50, padding: '1rem' };
const modalCardStyle: React.CSSProperties = { background: '#fff', borderRadius: 16, padding: '1.5rem', width: 'min(720px, 100%)', maxHeight: '85vh', overflow: 'auto', boxShadow: '0 20px 50px rgba(15, 23, 42, 0.18)' };
const viewImageStyle: React.CSSProperties = { width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 12, marginBottom: '1rem' };

export default ServicesPage;
