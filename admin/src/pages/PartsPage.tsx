import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { formatCurrency } from '../utils/currency';
import { useAuth } from '../hooks/useAuth';
import { inventoryService, InventoryItem, PART_CATEGORIES } from '../services/inventoryService';
import PartForm from './PartForm';
import StatCard from '../components/StatCard';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import Badge from '../components/Badge';
import ConfirmDialog from '../components/ConfirmDialog';

const stockBadgeTone = (status: InventoryItem['status']) => {
  if (status === 'Out Of Stock') return 'danger' as const;
  if (status === 'Low Stock') return 'warning' as const;
  return 'success' as const;
};

const PartsPage = () => {
  const { token } = useAuth();
  const [parts, setParts] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState({ totalItems: 0, activeItems: 0, totalCategories: 0, totalValue: 0, lowStockCount: 0, outOfStockCount: 0 });
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [status, setStatus] = useState('all');
  const [featured, setFeatured] = useState('all');
  const [active, setActive] = useState('all');
  const [sort, setSort] = useState('date-desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingPart, setEditingPart] = useState<InventoryItem | null>(null);
  const [viewPart, setViewPart] = useState<InventoryItem | null>(null);
  const [stockModal, setStockModal] = useState<{ id: string; action: 'in' | 'out' } | null>(null);
  const [stockQuantity, setStockQuantity] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null);
  const [stockStatusTarget, setStockStatusTarget] = useState<{ id: string; status: 'In Stock' | 'Out Of Stock' } | null>(null);

  const loadFilters = useCallback(async () => {
    if (!token) return;
    try {
      const [categoryList, brandList] = await Promise.all([
        inventoryService.getCategories(token),
        inventoryService.getBrands(token),
      ]);
      setCategories(Array.from(new Set([...PART_CATEGORIES, ...categoryList])).sort());
      setBrands(brandList.filter(Boolean).sort());
    } catch {
      setCategories([...PART_CATEGORIES]);
    }
  }, [token]);

  const loadStats = useCallback(async () => {
    if (!token) return;
    try {
      const statsPayload = await inventoryService.getDashboardStats(token);
      setStats(statsPayload);
    } catch {
      // Stats are non-blocking; list view remains usable.
    }
  }, [token]);

  const loadParts = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const listPayload = await inventoryService.list(token, {
        page,
        limit: 10,
        search: search.trim() || undefined,
        category: category || undefined,
        brand: brand || undefined,
        status: status === 'all' ? undefined : status,
        featured: featured === 'all' ? undefined : featured === 'yes' ? 'true' : 'false',
        active: active === 'all' ? undefined : active === 'yes' ? 'true' : 'false',
        sort,
      });
      setParts(listPayload?.items ?? []);
      setTotalPages(listPayload?.totalPages ?? 1);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? 'Unable to load parts');
      } else {
        setError(err instanceof Error ? err.message : 'Unable to load parts');
      }
    } finally {
      setLoading(false);
    }
  }, [token, page, search, category, brand, status, featured, active, sort]);

  useEffect(() => {
    void loadFilters();
    void loadStats();
  }, [loadFilters, loadStats]);

  useEffect(() => {
    void loadParts();
  }, [loadParts]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const resetFilters = () => {
    setSearch('');
    setCategory('');
    setBrand('');
    setStatus('all');
    setFeatured('all');
    setActive('all');
    setSort('date-desc');
    setPage(1);
  };

  const handleDelete = async () => {
    if (!token || !deleteTarget) return;
    try {
      setActionLoading(true);
      await inventoryService.delete(token, deleteTarget._id);
      setToast('Part deleted successfully');
      setDeleteTarget(null);
      await Promise.all([loadParts(), loadStats()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete part');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStockAction = async () => {
    if (!token || !stockModal || stockQuantity <= 0) {
      setError('Enter a valid quantity greater than zero.');
      return;
    }
    try {
      setActionLoading(true);
      if (stockModal.action === 'in') {
        await inventoryService.stockIn(token, stockModal.id, stockQuantity);
        setToast('Stock increased successfully');
      } else {
        await inventoryService.stockOut(token, stockModal.id, stockQuantity);
        setToast('Stock decreased successfully');
      }
      setStockModal(null);
      setStockQuantity(0);
      await Promise.all([loadParts(), loadStats()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update stock');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStockStatus = async () => {
    if (!token || !stockStatusTarget) return;
    try {
      setActionLoading(true);
      await inventoryService.setStockStatus(token, stockStatusTarget.id, stockStatusTarget.status);
      setToast(stockStatusTarget.status === 'Out Of Stock' ? 'Marked out of stock' : 'Marked in stock');
      setStockStatusTarget(null);
      await Promise.all([loadParts(), loadStats()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update stock status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSave = () => {
    setShowForm(false);
    setEditingPart(null);
    setToast('Part saved successfully');
    void Promise.all([loadParts(), loadStats()]);
  };

  const hasActiveFilters = Boolean(search || category || brand || status !== 'all' || featured !== 'all' || active !== 'all');

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <header style={headerStyle}>
          <div>
            <h1 style={titleStyle}>Parts Management</h1>
            <p style={subtitleStyle}>Manage spare parts catalog, stock, pricing, and visibility.</p>
          </div>
          <button
            type="button"
            onClick={() => { setEditingPart(null); setShowForm(true); }}
            style={primaryButtonStyle}
          >
            + Add Part
          </button>
        </header>

        <section style={statsGridStyle}>
          <StatCard title="Total Parts" value={stats.totalItems} />
          <StatCard title="Active Parts" value={stats.activeItems} accent="#16a34a" />
          <StatCard title="Out of Stock" value={stats.outOfStockCount} accent="#dc2626" />
          <StatCard title="Low Stock" value={stats.lowStockCount} accent="#d97706" />
          <StatCard title="Categories" value={stats.totalCategories} />
          <StatCard title="Inventory Value" value={formatCurrency(stats.totalValue)} accent="#2563eb" />
        </section>

        {showForm ? (
          <PartForm
            initialPart={editingPart ?? undefined}
            onCancel={() => { setShowForm(false); setEditingPart(null); }}
            onSave={handleSave}
          />
        ) : null}

        <div style={filtersCardStyle}>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, SKU, brand, category, or vehicle"
            style={searchInputStyle}
          />
          <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} style={filterStyle}>
            <option value="">All categories</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={brand} onChange={(e) => { setBrand(e.target.value); setPage(1); }} style={filterStyle}>
            <option value="">All brands</option>
            {brands.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} style={filterStyle}>
            <option value="all">All stock statuses</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out Of Stock">Out Of Stock</option>
          </select>
          <select value={featured} onChange={(e) => { setFeatured(e.target.value); setPage(1); }} style={filterStyle}>
            <option value="all">All featured</option>
            <option value="yes">Featured</option>
            <option value="no">Not featured</option>
          </select>
          <select value={active} onChange={(e) => { setActive(e.target.value); setPage(1); }} style={filterStyle}>
            <option value="all">All active states</option>
            <option value="yes">Active</option>
            <option value="no">Inactive</option>
          </select>
          <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} style={filterStyle}>
            <option value="date-desc">Newest</option>
            <option value="date-asc">Oldest</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="price-asc">Price Low-High</option>
            <option value="price-desc">Price High-Low</option>
            <option value="quantity-asc">Stock Low-High</option>
            <option value="quantity-desc">Stock High-Low</option>
          </select>
          {hasActiveFilters ? (
            <button type="button" onClick={resetFilters} style={secondaryButtonStyle}>Clear filters</button>
          ) : null}
        </div>

        {toast ? <div style={toastStyle}>{toast}</div> : null}
        {error ? (
          <div style={errorStyle}>
            <span>{error}</span>
            <button type="button" onClick={() => void loadParts()} style={retryButtonStyle}>Retry</button>
          </div>
        ) : null}

        <div style={tableCardStyle}>
          {loading ? (
            <LoadingState />
          ) : parts.length === 0 ? (
            <EmptyState message={hasActiveFilters ? 'No parts match your filters.' : 'No parts found. Add your first spare part to get started.'} />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr style={tableHeadRowStyle}>
                    {['Image', 'Part Name', 'SKU', 'Category', 'Vehicle', 'Brand', 'Price', 'Stock', 'Status', 'Active', 'Featured', 'Created', 'Actions'].map((heading) => (
                      <th key={heading} style={tableHeadStyle}>{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parts.map((part) => (
                    <tr key={part._id} style={tableRowStyle}>
                      <td style={tableCellStyle}>
                        {part.image ? (
                          <img src={part.image} alt={part.itemName} style={thumbStyle} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        ) : (
                          <div style={thumbPlaceholderStyle}>P</div>
                        )}
                      </td>
                      <td style={{ ...tableCellStyle, fontWeight: 700, color: '#0f172a', minWidth: 160 }}>{part.itemName}</td>
                      <td style={tableCellStyle}>{part.sku}</td>
                      <td style={tableCellStyle}>{part.category}</td>
                      <td style={{ ...tableCellStyle, minWidth: 120 }}>{part.compatibleVehicles?.[0] ?? 'All'}</td>
                      <td style={tableCellStyle}>{part.brand || '-'}</td>
                      <td style={{ ...tableCellStyle, fontWeight: 700 }}>{formatCurrency(part.sellingPrice)}</td>
                      <td style={tableCellStyle}>{part.quantity} {part.unit}</td>
                      <td style={tableCellStyle}><Badge label={part.status} tone={stockBadgeTone(part.status)} /></td>
                      <td style={tableCellStyle}><Badge label={part.isActive ? 'Active' : 'Inactive'} tone={part.isActive ? 'success' : 'neutral'} /></td>
                      <td style={tableCellStyle}><Badge label={part.isFeatured ? 'Featured' : 'Standard'} tone={part.isFeatured ? 'info' : 'neutral'} /></td>
                      <td style={{ ...tableCellStyle, color: '#64748b', fontSize: 13 }}>{new Date(part.createdAt).toLocaleDateString()}</td>
                      <td style={tableCellStyle}>
                        <div style={actionsWrapStyle}>
                          <ActionButton label="View" onClick={() => setViewPart(part)} />
                          <ActionButton label="Edit" onClick={() => { setEditingPart(part); setShowForm(true); }} />
                          <ActionButton label="+Stock" onClick={() => setStockModal({ id: part._id, action: 'in' })} />
                          <ActionButton label="-Stock" onClick={() => setStockModal({ id: part._id, action: 'out' })} />
                          <ActionButton label="In Stock" onClick={() => setStockStatusTarget({ id: part._id, status: 'In Stock' })} />
                          <ActionButton label="Out of Stock" onClick={() => setStockStatusTarget({ id: part._id, status: 'Out Of Stock' })} />
                          <ActionButton label="Delete" danger onClick={() => setDeleteTarget(part)} />
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

        {viewPart ? (
          <div style={modalOverlayStyle}>
            <div style={modalCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <h2 style={{ margin: 0, color: '#0f172a' }}>{viewPart.itemName}</h2>
                  <p style={{ margin: '0.35rem 0 0', color: '#64748b' }}>{viewPart.sku} • {viewPart.category}</p>
                </div>
                <button type="button" onClick={() => setViewPart(null)} style={pagerButtonStyle}>Close</button>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <Badge label={viewPart.status} tone={stockBadgeTone(viewPart.status)} />
                <Badge label={viewPart.isActive ? 'Active' : 'Inactive'} tone={viewPart.isActive ? 'success' : 'neutral'} />
                <Badge label={viewPart.isFeatured ? 'Featured' : 'Standard'} tone={viewPart.isFeatured ? 'info' : 'neutral'} />
              </div>
              {viewPart.image ? <img src={viewPart.image} alt={viewPart.itemName} style={viewImageStyle} /> : null}
              <p style={{ color: '#475569', lineHeight: 1.6 }}>{viewPart.fullDescription || viewPart.shortDescription || 'No description available.'}</p>
              {viewPart.galleryImages?.length ? (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '1rem 0' }}>
                  {viewPart.galleryImages.map((image) => (
                    <img key={image} src={image} alt={viewPart.itemName} style={galleryThumbStyle} />
                  ))}
                </div>
              ) : null}
              <div style={detailGridStyle}>
                <Detail label="Brand" value={viewPart.brand || '-'} />
                <Detail label="Price" value={formatCurrency(viewPart.sellingPrice)} />
                <Detail label="Original Price" value={viewPart.originalPrice ? formatCurrency(viewPart.originalPrice) : '-'} />
                <Detail label="Discount" value={viewPart.discountPercent ? `${viewPart.discountPercent}%` : '-'} />
                <Detail label="Stock" value={`${viewPart.quantity} ${viewPart.unit}`} />
                <Detail label="Compatible" value={viewPart.compatibleVehicles.join(', ') || 'All vehicles'} />
              </div>
            </div>
          </div>
        ) : null}

        {stockModal ? (
          <div style={modalOverlayStyle}>
            <div style={{ ...modalCardStyle, width: 'min(420px, 92%)' }}>
              <h3 style={{ marginTop: 0, color: '#0f172a' }}>{stockModal.action === 'in' ? 'Increase Stock' : 'Decrease Stock'}</h3>
              <input
                type="number"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(Math.max(0, Number(e.target.value)))}
                placeholder="Quantity"
                min={1}
                style={{ ...filterStyle, width: '100%', marginBottom: '1rem' }}
              />
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => { setStockModal(null); setStockQuantity(0); }} style={{ ...pagerButtonStyle, flex: 1 }}>Cancel</button>
                <button type="button" disabled={actionLoading} onClick={() => void handleStockAction()} style={{ ...primaryButtonStyle, flex: 1 }}>{actionLoading ? 'Updating...' : 'Confirm'}</button>
              </div>
            </div>
          </div>
        ) : null}

        <ConfirmDialog
          open={Boolean(deleteTarget)}
          title="Delete part"
          message={`Are you sure you want to delete "${deleteTarget?.itemName}"? This action cannot be undone.`}
          confirmLabel="Delete"
          danger
          loading={actionLoading}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void handleDelete()}
        />

        <ConfirmDialog
          open={Boolean(stockStatusTarget)}
          title={stockStatusTarget?.status === 'Out Of Stock' ? 'Mark out of stock' : 'Mark in stock'}
          message={stockStatusTarget?.status === 'Out Of Stock'
            ? 'This will set the stock quantity to zero and hide the part from the mobile catalog.'
            : 'This will restore stock based on the current minimum threshold if quantity is zero.'}
          confirmLabel="Confirm"
          loading={actionLoading}
          onCancel={() => setStockStatusTarget(null)}
          onConfirm={() => void handleStockStatus()}
        />
      </div>
    </div>
  );
};

const Detail = ({ label, value }: { label: string; value: string }) => (
  <div style={{ background: '#f8fafc', borderRadius: 12, padding: '0.75rem' }}>
    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>{label}</div>
    <div style={{ marginTop: 4, color: '#0f172a', fontWeight: 600 }}>{value}</div>
  </div>
);

const ActionButton = ({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) => (
  <button type="button" onClick={onClick} style={{
    padding: '0.45rem 0.65rem',
    borderRadius: 10,
    border: danger ? '1px solid #fecaca' : '1px solid #cbd5e1',
    background: danger ? '#fff1f2' : '#fff',
    color: danger ? '#dc2626' : '#334155',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  }}
  >
    {label}
  </button>
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
const secondaryButtonStyle: React.CSSProperties = { padding: '0.8rem 1rem', borderRadius: 12, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600 };
const toastStyle: React.CSSProperties = { marginBottom: '1rem', background: '#dcfce7', color: '#166534', padding: '0.75rem 1rem', borderRadius: 12, fontWeight: 600 };
const errorStyle: React.CSSProperties = { marginBottom: '1rem', background: '#fee2e2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' };
const retryButtonStyle: React.CSSProperties = { padding: '0.45rem 0.75rem', borderRadius: 10, border: '1px solid #fecaca', background: '#fff', cursor: 'pointer', fontWeight: 600 };
const tableCardStyle: React.CSSProperties = { background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 8px 30px rgba(15, 23, 42, 0.06)' };
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', minWidth: 1100 };
const tableHeadRowStyle: React.CSSProperties = { background: '#f8fafc', borderBottom: '1px solid #e2e8f0' };
const tableHeadStyle: React.CSSProperties = { textAlign: 'left', padding: '0.9rem 1rem', color: '#64748b', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' };
const tableRowStyle: React.CSSProperties = { borderBottom: '1px solid #f1f5f9' };
const tableCellStyle: React.CSSProperties = { padding: '0.9rem 1rem', color: '#475569', verticalAlign: 'middle' };
const thumbStyle: React.CSSProperties = { width: 56, height: 56, borderRadius: 12, objectFit: 'cover', border: '1px solid #e2e8f0' };
const thumbPlaceholderStyle: React.CSSProperties = { width: 56, height: 56, borderRadius: 12, background: '#eff6ff', color: '#2563eb', display: 'grid', placeItems: 'center', fontWeight: 700 };
const actionsWrapStyle: React.CSSProperties = { display: 'flex', gap: '0.35rem', flexWrap: 'wrap', minWidth: 280 };
const paginationStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', marginTop: '1rem', alignItems: 'center' };
const pagerButtonStyle: React.CSSProperties = { padding: '0.7rem 1rem', borderRadius: 12, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600 };
const modalOverlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'grid', placeItems: 'center', zIndex: 50, padding: '1rem' };
const modalCardStyle: React.CSSProperties = { background: '#fff', borderRadius: 16, padding: '1.5rem', width: 'min(720px, 100%)', maxHeight: '85vh', overflow: 'auto', boxShadow: '0 20px 50px rgba(15, 23, 42, 0.18)' };
const viewImageStyle: React.CSSProperties = { width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 12, marginBottom: '1rem' };
const galleryThumbStyle: React.CSSProperties = { width: 84, height: 84, objectFit: 'cover', borderRadius: 12, border: '1px solid #e2e8f0' };
const detailGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginTop: '1rem' };

export default PartsPage;
