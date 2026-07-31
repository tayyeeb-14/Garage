import { useMemo, useState } from 'react';
import { LogOut } from 'lucide-react';
import { formatCurrency } from './utils/currency';
import { useDashboard } from './hooks/useDashboard';
import { useAuth } from './context/AuthContext';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';
import EmptyState from './components/EmptyState';
import StatCard from './components/StatCard';
import DashboardChart from './components/DashboardChart';
import ServicesPage from './pages/ServicesPage';
import BookingsPage from './pages/BookingsPage';
import OrdersPage from './pages/OrdersPage';
import PartsPage from './pages/PartsPage';
import BannerManagementPage from './pages/BannerManagementPage';
import ConfirmDialog from './components/ConfirmDialog';

const DashboardApp = () => {
  const { stats, recentOrders, lowStock, topServices, isLoading, error } = useDashboard();
  const { user, logout } = useAuth();
  const [activeView, setActiveView] = useState<'dashboard' | 'services' | 'bookings' | 'orders' | 'parts' | 'banners'>('dashboard');
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const adminName = user?.name || user?.email || 'Admin';
  const adminInitials = useMemo(() => {
    const source = user?.name || user?.email || 'A';
    return source
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('')
      .slice(0, 2) || 'A';
  }, [user?.email, user?.name]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  const handleLogoutConfirm = async () => {
    setLogoutLoading(true);
    try {
      logout();
      window.history.replaceState(null, '', window.location.pathname);
    } finally {
      setLogoutLoading(false);
      setShowLogoutDialog(false);
    }
  };

  const backButton = (
    <button
      onClick={() => setActiveView('dashboard')}
      className="button button-secondary"
      style={{ margin: '1rem 1rem 0' }}
    >
      Back to Dashboard
    </button>
  );

  if (activeView === 'services') {
    return (
      <>
        {backButton}
        <ServicesPage />
      </>
    );
  }

  if (activeView === 'bookings') {
    return (
      <>
        {backButton}
        <BookingsPage />
      </>
    );
  }

  if (activeView === 'orders') {
    return (
      <>
        {backButton}
        <OrdersPage />
      </>
    );
  }

  if (activeView === 'parts') {
    return (
      <>
        {backButton}
        <PartsPage />
      </>
    );
  }

  if (activeView === 'banners') {
    return (
      <>
        {backButton}
        <BannerManagementPage />
      </>
    );
  }

  return (
    <div className="page-shell">
      <div className="page-container">
        <header className="dashboard-hero">
          <div className="dashboard-header-copy">
            <div>
              <h1 className="page-title">M Enterprises Admin Dashboard</h1>
              <p className="page-subtitle">Operations overview and recent activity</p>
            </div>

            <div className="admin-profile-group">
              <div className="admin-profile-chip" aria-label={`Signed in as ${adminName}`}>
                <div className="admin-avatar" aria-hidden="true">
                  <span>{adminInitials}</span>
                </div>
                <div className="admin-meta">
                  <span className="admin-label">Signed in as</span>
                  <strong className="admin-name">{adminName}</strong>
                </div>
              </div>

              <button
                type="button"
                className="button button-secondary admin-logout-button"
                onClick={() => setShowLogoutDialog(true)}
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>

          <div className="dashboard-actions">
            <button onClick={() => setActiveView('bookings')} className="button button-secondary">
              Manage Bookings
            </button>
            <button onClick={() => setActiveView('orders')} className="button button-secondary">
              Manage Orders
            </button>
            <button onClick={() => setActiveView('parts')} className="button button-secondary">
              Manage Parts
            </button>
            <button onClick={() => setActiveView('services')} className="button button-secondary">
              Manage Services
            </button>
            <button onClick={() => setActiveView('banners')} className="button button-secondary">
              Manage Banners
            </button>
          </div>
        </header>

        <section className="section-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '1.5rem' }}>
          <StatCard title="Total Customers" value={stats?.customers ?? 0} subtitle="Active client base" />
          <StatCard title="Total Services" value={stats?.services ?? 0} subtitle="Service catalog" />
          <StatCard title="Total Products" value={stats?.products ?? 0} subtitle="Inventory items" />
          <StatCard title="Total Bookings" value={stats?.bookings ?? 0} subtitle="Scheduled jobs" />
          <StatCard title="Total Orders" value={stats?.orders ?? 0} subtitle="Sales activity" />
          <StatCard title="Revenue" value={formatCurrency(stats?.revenue ?? 0)} subtitle="Gross revenue" />
        </section>

        <section className="dashboard-grid" style={{ gridTemplateColumns: '2fr 1fr', marginBottom: '1.5rem' }}>
          <div className="dashboard-panel">
            <DashboardChart />
          </div>
          <div className="dashboard-panel">
            <h3 className="card-title">Quick Actions</h3>
            <ul className="compact-list text-small">
              <li>Review new bookings</li>
              <li>Restock low inventory</li>
              <li>Publish gallery updates</li>
              <li>Check customer inquiries</li>
            </ul>
          </div>
        </section>

        <section className="dashboard-grid" style={{ gridTemplateColumns: '1.2fr 0.8fr 0.8fr' }}>
          <div className="dashboard-panel">
            <h3 className="card-title">Recent Orders</h3>
            {recentOrders.length ? (
              <div className="compact-list">
                {recentOrders.map((order) => (
                  <div key={order._id} className="compact-list-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <strong>{order.customer?.fullName ?? 'Customer'}</strong>
                      <span style={{ color: '#2563eb' }}>{formatCurrency(order.total)}</span>
                    </div>
                    <div className="text-small" style={{ marginTop: '0.25rem' }}>{order.status}</div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No recent orders found." />
            )}
          </div>

          <div className="dashboard-panel">
            <h3 className="card-title">Low Stock Products</h3>
            {lowStock.length ? (
              <div className="compact-list">
                {lowStock.map((item) => (
                  <div key={item._id} style={{ border: '1px solid #fee2e2', borderRadius: '12px', padding: '0.75rem', background: '#fff7ed' }}>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <div className="text-small" style={{ color: '#b45309' }}>Stock {item.stockQuantity} / threshold {item.lowStockThreshold}</div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No low stock products." />
            )}
          </div>

          <div className="dashboard-panel">
            <h3 className="card-title">Top Services</h3>
            {topServices.length ? (
              <div className="compact-list">
                {topServices.map((item) => (
                  <div key={item._id} className="compact-list-item">
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <div className="text-small">{item.bookings} bookings</div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No service insights yet." />
            )}
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={showLogoutDialog}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmLabel={logoutLoading ? 'Logging out...' : 'Logout'}
        cancelLabel="Cancel"
        danger
        loading={logoutLoading}
        onCancel={() => setShowLogoutDialog(false)}
        onConfirm={() => void handleLogoutConfirm()}
      />
    </div>
  );
};

export default DashboardApp;
