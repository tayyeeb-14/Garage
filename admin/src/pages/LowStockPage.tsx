import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { inventoryService, InventoryItem } from '../services/inventoryService';

const LowStockPage = () => {
  const { token } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [outOfStockItems, setOutOfStockItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const loadItems = async () => {
      try {
        setLoading(true);
        const [lowStock, outOfStock] = await Promise.all([inventoryService.getLowStock(token), inventoryService.getOutOfStock(token)]);
        setItems(lowStock ?? []);
        setOutOfStockItems(outOfStock ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load items');
      } finally {
        setLoading(false);
      }
    };

    void loadItems();
  }, [token]);

  if (loading) return <div style={{ color: '#64748b' }}>Loading stock information...</div>;
  if (error) return <div style={{ color: '#dc2626' }}>{error}</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <header style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ margin: 0, color: '#0f172a' }}>Stock Alerts</h1>
          <p style={{ margin: '0.35rem 0 0', color: '#64748b' }}>Monitor low and out-of-stock items for timely restocking.</p>
        </header>

        <div style={{ display: 'grid', gap: '2rem' }}>
          <section>
            <h2 style={{ color: '#0f172a', marginBottom: '1rem', fontSize: '20px', fontWeight: 600 }}>Out of Stock ({outOfStockItems.length})</h2>
            {outOfStockItems.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: '16px', padding: '1.25rem', border: '1px solid #e2e8f0', color: '#64748b' }}>All items are in stock. Great job!</div>
            ) : (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {outOfStockItems.map((item) => (
                  <div key={item._id} style={{ background: '#fff1f2', borderRadius: '12px', padding: '1rem', border: '1px solid #fecaca', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#7f1d1d' }}>{item.itemName}</div>
                      <div style={{ fontSize: '14px', color: '#991b1b', marginTop: '0.25rem' }}>SKU: {item.sku} • {item.category}</div>
                      <div style={{ fontSize: '14px', color: '#991b1b' }}>Supplier: {item.supplierName} • {item.supplierPhone}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#dc2626' }}>0 / {item.maximumStock}</div>
                      <div style={{ fontSize: '12px', color: '#991b1b', marginTop: '0.25rem' }}>Min: {item.minimumStock}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 style={{ color: '#0f172a', marginBottom: '1rem', fontSize: '20px', fontWeight: 600 }}>Low Stock ({items.length})</h2>
            {items.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: '16px', padding: '1.25rem', border: '1px solid #e2e8f0', color: '#64748b' }}>No low stock items. Inventory is well stocked.</div>
            ) : (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {items.map((item) => (
                  <div key={item._id} style={{ background: '#fffbeb', borderRadius: '12px', padding: '1rem', border: '1px solid #fcd34d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#78350f' }}>{item.itemName}</div>
                      <div style={{ fontSize: '14px', color: '#92400e', marginTop: '0.25rem' }}>SKU: {item.sku} • {item.category}</div>
                      <div style={{ fontSize: '14px', color: '#92400e' }}>Supplier: {item.supplierName} • {item.supplierPhone}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#f59e0b' }}>{item.quantity} / {item.maximumStock}</div>
                      <div style={{ fontSize: '12px', color: '#92400e', marginTop: '0.25rem' }}>Min: {item.minimumStock}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default LowStockPage;
