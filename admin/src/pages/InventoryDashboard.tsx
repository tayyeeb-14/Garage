import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { inventoryService } from '../services/inventoryService';
import { formatCurrency } from '../utils/currency';

const InventoryDashboard = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState({ totalItems: 0, totalValue: 0, lowStockCount: 0, outOfStockCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const loadStats = async () => {
      try {
        const data = await inventoryService.getDashboardStats(token);
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load stats');
      } finally {
        setLoading(false);
      }
    };

    void loadStats();
  }, [token]);

  if (loading) return <div style={{ color: '#64748b' }}>Loading inventory dashboard...</div>;
  if (error) return <div style={{ color: '#dc2626' }}>{error}</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)' }}>
        <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>Total Items</div>
        <div style={{ fontSize: '32px', fontWeight: 700, color: '#0f172a', marginTop: '0.5rem' }}>{stats.totalItems}</div>
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)' }}>
        <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>Total Inventory Value</div>
        <div style={{ fontSize: '32px', fontWeight: 700, color: '#0f172a', marginTop: '0.5rem' }}>{formatCurrency(stats.totalValue)}</div>
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)' }}>
        <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>Low Stock Items</div>
        <div style={{ fontSize: '32px', fontWeight: 700, color: '#f59e0b', marginTop: '0.5rem' }}>{stats.lowStockCount}</div>
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)' }}>
        <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>Out of Stock Items</div>
        <div style={{ fontSize: '32px', fontWeight: 700, color: '#ef4444', marginTop: '0.5rem' }}>{stats.outOfStockCount}</div>
      </div>
    </div>
  );
};

export default InventoryDashboard;
