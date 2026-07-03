import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { inventoryService, InventoryItem } from '../services/inventoryService';

const InventoryListPage = ({ onEditClick }: { onEditClick?: (item: InventoryItem) => void }) => {
  const { token } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('date-desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockAction, setStockAction] = useState<'in' | 'out' | null>(null);
  const [stockQuantity, setStockQuantity] = useState(0);
  const [stockItemId, setStockItemId] = useState<string | null>(null);

  const loadItems = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const payload = await inventoryService.list(token, {
        page,
        limit: 8,
        search,
        category: category || undefined,
        brand: brand || undefined,
        status: status === 'all' ? undefined : status,
        sort,
      });
      setItems(payload?.items ?? []);
      setTotalPages(payload?.totalPages ?? 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, [token, page, status, sort]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => `${item.itemName} ${item.sku} ${item.category} ${item.brand}`.toLowerCase().includes(search.toLowerCase()) && (!category || item.category.toLowerCase().includes(category.toLowerCase())) && (!brand || item.brand.toLowerCase().includes(brand.toLowerCase())));
  }, [items, search, category, brand]);

  const handleStockAction = async () => {
    if (!token || !stockItemId || stockQuantity <= 0) return;

    try {
      if (stockAction === 'in') {
        await inventoryService.stockIn(token, stockItemId, stockQuantity);
        setToast('Stock in successful');
      } else if (stockAction === 'out') {
        await inventoryService.stockOut(token, stockItemId, stockQuantity);
        setToast('Stock out successful');
      }
      setShowStockModal(false);
      setStockQuantity(0);
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update stock');
    }
  };

  const deleteItem = async (id: string) => {
    if (!token || !window.confirm('Delete this inventory item?')) return;
    try {
      await inventoryService.delete(token, id);
      setToast('Item deleted');
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete item');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <header style={{ marginBottom: '1rem' }}>
          <h1 style={{ margin: 0, color: '#0f172a' }}>Inventory</h1>
          <p style={{ margin: '0.35rem 0 0', color: '#64748b' }}>Manage stock levels, pricing, and supplier information.</p>
        </header>

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search items..." style={{ flex: 1, minWidth: '260px', padding: '0.8rem 0.9rem', borderRadius: '12px', border: '1px solid #cbd5e1' }} />
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Filter by category..." style={{ flex: 0.5, minWidth: '180px', padding: '0.8rem 0.9rem', borderRadius: '12px', border: '1px solid #cbd5e1' }} />
          <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Filter by brand..." style={{ flex: 0.5, minWidth: '180px', padding: '0.8rem 0.9rem', borderRadius: '12px', border: '1px solid #cbd5e1' }} />
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: '0.8rem 0.9rem', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
            <option value="all">All statuses</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out Of Stock">Out Of Stock</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ padding: '0.8rem 0.9rem', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="quantity-asc">Low Quantity</option>
            <option value="quantity-desc">High Quantity</option>
          </select>
        </div>

        {toast ? <div style={{ marginBottom: '1rem', background: '#dcfce7', color: '#166534', padding: '0.75rem 1rem', borderRadius: '12px' }}>{toast}</div> : null}

        {loading ? (
          <div style={{ color: '#64748b' }}>Loading inventory...</div>
        ) : error ? (
          <div style={{ color: '#dc2626' }}>{error}</div>
        ) : filteredItems.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>No items found.</div>
        ) : (
          <div style={{ display: 'grid', gap: '0.9rem' }}>
            {filteredItems.map((item) => (
              <div key={item._id} style={{ background: '#fff', borderRadius: '16px', padding: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
                    {item.image && <img src={item.image} alt={item.itemName} style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover' }} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.itemName}</div>
                      <div style={{ color: '#64748b', marginTop: '0.25rem', fontSize: '14px' }}>SKU: {item.sku} • {item.category}</div>
                      <div style={{ color: '#64748b', fontSize: '14px' }}>Supplier: {item.supplierName} • {item.supplierPhone}</div>
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ padding: '0.25rem 0.75rem', borderRadius: '8px', background: item.status === 'Out Of Stock' ? '#fee2e2' : item.status === 'Low Stock' ? '#fef3c7' : '#dcfce7', color: item.status === 'Out Of Stock' ? '#991b1b' : item.status === 'Low Stock' ? '#92400e' : '#166534', fontSize: '12px', fontWeight: 600 }}>
                          {item.status}
                        </span>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>Qty: {item.quantity}/{item.maximumStock}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <div style={{ textAlign: 'right', marginRight: '0.5rem' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>${item.sellingPrice}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '0.25rem' }}>Cost: ${item.purchasePrice}</div>
                    </div>
                    <button onClick={() => { setStockItemId(item._id); setStockAction('in'); setShowStockModal(true); }} style={{ padding: '0.6rem 0.8rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '12px' }}>Stock In</button>
                    <button onClick={() => { setStockItemId(item._id); setStockAction('out'); setShowStockModal(true); }} style={{ padding: '0.6rem 0.8rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '12px' }}>Stock Out</button>
                    <button onClick={() => onEditClick?.(item)} style={{ padding: '0.6rem 0.8rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '12px' }}>Edit</button>
                    <button onClick={() => setSelectedItemId(selectedItemId === item._id ? null : item._id)} style={{ padding: '0.6rem 0.8rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '12px' }}>Details</button>
                    <button onClick={() => void deleteItem(item._id)} style={{ padding: '0.6rem 0.8rem', borderRadius: '10px', border: '1px solid #fecaca', background: '#fff1f2', color: '#dc2626', cursor: 'pointer', fontSize: '12px' }}>Delete</button>
                  </div>
                </div>
                {selectedItemId === item._id && (
                  <div style={{ marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px solid #e2e8f0', fontSize: '14px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                      <div><strong>Rack Location:</strong> {item.rackLocation}</div>
                      <div><strong>Unit:</strong> {item.unit}</div>
                      <div><strong>Min Stock:</strong> {item.minimumStock}</div>
                      <div><strong>Max Stock:</strong> {item.maximumStock}</div>
                      <div><strong>Compatible Vehicles:</strong> {item.compatibleVehicles.join(', ') || 'N/A'}</div>
                      <div><strong>Barcode:</strong> {item.barcode || 'N/A'}</div>
                    </div>
                    {item.description && <div style={{ marginTop: '0.5rem' }}><strong>Description:</strong> {item.description}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={{ padding: '0.7rem 1rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff' }}>
            Previous
          </button>
          <span style={{ color: '#64748b', alignSelf: 'center' }}>
            Page {page} of {totalPages}
          </span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} style={{ padding: '0.7rem 1rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff' }}>
            Next
          </button>
        </div>

        {showStockModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', maxWidth: '400px', width: '90%' }}>
              <h2 style={{ margin: 0, color: '#0f172a', marginBottom: '1rem' }}>Stock {stockAction === 'in' ? 'In' : 'Out'}</h2>
              <input type="number" value={stockQuantity} onChange={(e) => setStockQuantity(Math.max(0, Number(e.target.value)))} placeholder="Enter quantity" style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '1rem' }} />
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => { setShowStockModal(false); setStockQuantity(0); }} style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={() => void handleStockAction()} style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryListPage;
