import { useDashboard } from './hooks/useDashboard';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';
import EmptyState from './components/EmptyState';
import StatCard from './components/StatCard';
import DashboardChart from './components/DashboardChart';

const App = () => {
  const { stats, recentOrders, lowStock, topServices, isLoading, error } = useDashboard();

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <header style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ margin: 0, color: '#0f172a', fontSize: '2rem' }}>SpeedX Garage Admin Dashboard</h1>
          <p style={{ margin: '0.4rem 0 0', color: '#64748b' }}>Operations overview and recent activity</p>
        </header>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <StatCard title="Total Customers" value={stats?.customers ?? 0} subtitle="Active client base" />
          <StatCard title="Total Services" value={stats?.services ?? 0} subtitle="Service catalog" />
          <StatCard title="Total Products" value={stats?.products ?? 0} subtitle="Inventory items" />
          <StatCard title="Total Bookings" value={stats?.bookings ?? 0} subtitle="Scheduled jobs" />
          <StatCard title="Total Orders" value={stats?.orders ?? 0} subtitle="Sales activity" />
          <StatCard title="Revenue" value={`$${(stats?.revenue ?? 0).toLocaleString()}`} subtitle="Gross revenue" />
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <DashboardChart />
          <div style={{ background: '#fff', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)', border: '1px solid #e2e8f0' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a' }}>Quick Actions</h3>
            <ul style={{ paddingLeft: '1rem', color: '#475569', lineHeight: 1.7 }}>
              <li>Review new bookings</li>
              <li>Restock low inventory</li>
              <li>Publish gallery updates</li>
              <li>Check customer inquiries</li>
            </ul>
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 0.8fr', gap: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)', border: '1px solid #e2e8f0' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a' }}>Recent Orders</h3>
            {recentOrders.length ? (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {recentOrders.map((order) => (
                  <div key={order._id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <strong>{order.customer?.fullName ?? 'Customer'}</strong>
                      <span style={{ color: '#2563eb' }}>${order.total}</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.25rem' }}>{order.status}</div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No recent orders found." />
            )}
          </div>

          <div style={{ background: '#fff', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)', border: '1px solid #e2e8f0' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a' }}>Low Stock Products</h3>
            {lowStock.length ? (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {lowStock.map((item) => (
                  <div key={item._id} style={{ border: '1px solid #fee2e2', borderRadius: '12px', padding: '0.75rem', background: '#fff7ed' }}>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: '0.9rem', color: '#b45309' }}>Stock {item.stockQuantity} / threshold {item.lowStockThreshold}</div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No low stock products." />
            )}
          </div>

          <div style={{ background: '#fff', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)', border: '1px solid #e2e8f0' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a' }}>Top Services</h3>
            {topServices.length ? (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {topServices.map((item) => (
                  <div key={item._id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.75rem' }}>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: '0.9rem', color: '#64748b' }}>{item.bookings} bookings</div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No service insights yet." />
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default App;
