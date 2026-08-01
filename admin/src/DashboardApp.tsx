import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  CalendarClock,
  ChevronRight,
  CircleAlert,
  CircleDollarSign,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  RefreshCw,
  Search,
  Settings2,
  ShoppingCart,
  Sparkles,
  Users,
  Wrench,
  Megaphone,
  X,
  type LucideIcon,
  Clock3,
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import ConfirmDialog from './components/ConfirmDialog';
import EmptyState from './components/EmptyState';
import { formatCurrency } from './utils/currency';
import { useAdminDashboard } from './hooks/useAdminDashboard';
import BookingsPage from './pages/BookingsPage';
import OrdersPage from './pages/OrdersPage';
import PartsPage from './pages/PartsPage';
import ServicesPage from './pages/ServicesPage';
import BannerManagementPage from './pages/BannerManagementPage';
import CustomersPage from './pages/CustomersPage';
import CategoriesPage from './pages/CategoriesPage';

type ViewId = 'dashboard' | 'bookings' | 'orders' | 'customers' | 'parts' | 'services' | 'categories' | 'banners' | 'reports' | 'settings';

interface NavigationItem {
  id: ViewId;
  label: string;
  icon: LucideIcon;
  count?: string;
  hint?: string;
}

const NAVIGATION: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'bookings', label: 'Bookings', icon: CalendarClock },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'parts', label: 'Parts', icon: Package },
  { id: 'services', label: 'Services', icon: Wrench },
  { id: 'categories', label: 'Categories', icon: Package },
  { id: 'banners', label: 'Banners', icon: Megaphone },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings2 },
];

const WEEK_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const WEEKLY_REVENUE = [34, 56, 48, 72, 68, 82, 64];
const WEEKLY_BOOKINGS = [22, 30, 26, 38, 34, 42, 37];
const WEEKLY_ORDERS = [18, 24, 21, 29, 27, 33, 30];

const formatDateLabel = () =>
  new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
};

const getInitials = (value: string) =>
  value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2) || 'A';

const normalize = (value: string) => value.toLowerCase().trim();

const matchesQuery = (query: string, ...values: Array<string | number | undefined | null>) => {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return true;
  return values
    .map((value) => String(value ?? ''))
    .join(' ')
    .toLowerCase()
    .includes(normalizedQuery);
};

const toneForOrder = (status: string) => {
  if (status === 'completed') return 'success';
  if (status === 'cancelled') return 'danger';
  return 'info';
};

const toneForBooking = (status: string) => {
  if (status === 'completed') return 'success';
  if (status === 'cancelled') return 'danger';
  if (status === 'in_progress') return 'warning';
  return 'info';
};

const statusLabelClass = (tone: 'success' | 'warning' | 'danger' | 'info' | 'neutral') => `status-pill status-pill--${tone}`;

const DashboardApp = () => {
  const { user, logout } = useAuth();
  const {
    stats,
    bookingStats,
    inventoryStats,
    recentBookings,
    orders,
    lowStock,
    topServices,
    banners,
    customers,
    activities,
    isLoading,
    error,
    refresh,
  } = useAdminDashboard();

  const [activeView, setActiveView] = useState<ViewId>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1440));

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (viewportWidth < 768) {
      setSidebarOpen(false);
    }
  }, [viewportWidth]);

  useEffect(() => {
    document.title = `M Enterprises Admin | ${activeView[0].toUpperCase()}${activeView.slice(1)}`;
  }, [activeView]);

  const isMobile = viewportWidth < 768;
  const isTablet = viewportWidth >= 768 && viewportWidth < 1200;
  const sidebarExpanded = !isMobile;
  const sidebarCollapsed = isTablet;
  const adminName = user?.name || user?.email || 'Admin';
  const adminInitials = useMemo(() => getInitials(adminName), [adminName]);
  const dateLabel = useMemo(() => formatDateLabel(), []);
  const greeting = useMemo(() => getGreeting(), []);
  const query = searchQuery.trim();

  const notificationCount = activities.length + (lowStock.length > 0 ? 1 : 0);
  const visibleSidebar = sidebarExpanded || sidebarOpen;

  const navCounts: Record<ViewId, string | undefined> = {
    dashboard: undefined,
    bookings: stats ? String(stats.bookings) : undefined,
    orders: stats ? String(stats.orders) : undefined,
    customers: stats ? String(stats.customers) : undefined,
    parts: stats ? String(stats.products) : undefined,
    services: stats ? String(stats.services) : undefined,
    categories: undefined,
    banners: banners.length ? String(banners.length) : undefined,
    reports: stats ? 'Live' : undefined,
    settings: undefined,
  };

  const filteredBookings = useMemo(
    () => recentBookings.filter((booking) => matchesQuery(query, booking.bookingId, booking.customer?.fullName, booking.customer?.email, booking.status)),
    [query, recentBookings],
  );

  const filteredOrders = useMemo(
    () => orders.filter((order) => matchesQuery(query, order.orderId, order.customer?.fullName, order.customer?.email, order.orderStatus)),
    [orders, query],
  );

  const filteredCustomers = useMemo(
    () => customers.filter((customer) => matchesQuery(query, customer.name, customer.email, customer.phone, customer.source)),
    [customers, query],
  );

  const handleViewChange = (view: ViewId) => {
    setActiveView(view);
    setNotificationsOpen(false);
    if (isMobile) {
      setSidebarOpen(false);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogoutConfirm = async () => {
    setLogoutLoading(true);
    try {
      logout();
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    } finally {
      setLogoutLoading(false);
      setShowLogoutDialog(false);
      setNotificationsOpen(false);
    }
  };

  // Calculate revenue from completed/paid orders
  const calculatedRevenue = useMemo(() => {
    return orders.reduce((total, order) => {
      if (order.orderStatus === 'completed' || order.paymentStatus === 'paid') {
        return total + (order.totalAmount ?? 0);
      }
      return total;
    }, 0);
  }, [orders]);

  const kpiCards = [
    {
      title: 'Total Customers',
      value: stats?.customers ?? 0,
      subtitle: 'Active client base',
      tone: 'info' as const,
      trend: '+12.4%',
      icon: Users,
    },
    {
      title: 'Total Bookings',
      value: stats?.bookings ?? 0,
      subtitle: 'Live job queue',
      tone: 'success' as const,
      trend: '+8.1%',
      icon: CalendarClock,
    },
    {
      title: 'Pending Bookings',
      value: bookingStats?.pending ?? 0,
      subtitle: 'Awaiting confirmation',
      tone: 'warning' as const,
      trend: '-4.3%',
      icon: Clock3,
    },
    {
      title: 'Total Orders',
      value: stats?.orders ?? 0,
      subtitle: 'Sales generated',
      tone: 'info' as const,
      trend: '+6.9%',
      icon: ShoppingCart,
    },
    {
      title: 'Revenue',
      value: formatCurrency(calculatedRevenue),
      subtitle: 'Completed & paid orders',
      tone: 'success' as const,
      trend: '+14.7%',
      icon: CircleDollarSign,
    },
    {
      title: 'Parts Value',
      value: formatCurrency(inventoryStats?.totalValue ?? 0),
      subtitle: 'Stock valuation',
      tone: 'info' as const,
      trend: '+5.6%',
      icon: Package,
    },
    {
      title: 'Low Stock Parts',
      value: inventoryStats?.lowStockCount ?? 0,
      subtitle: 'Reorder soon',
      tone: 'danger' as const,
      trend: '+2.1%',
      icon: CircleAlert,
    },
    {
      title: 'Active Services',
      value: stats?.services ?? 0,
      subtitle: 'Available offerings',
      tone: 'success' as const,
      trend: '+3.2%',
      icon: Wrench,
    },
  ];

  const quickActions = [
    { label: 'Manage Bookings', view: 'bookings' as ViewId, icon: CalendarClock },
    { label: 'Manage Services', view: 'services' as ViewId, icon: Wrench },
    { label: 'Manage Parts', view: 'parts' as ViewId, icon: Package },
    { label: 'Manage Banners', view: 'banners' as ViewId, icon: Megaphone },
    { label: 'Create Invoice', view: 'orders' as ViewId, icon: ShoppingCart },
  ];

  const backToDashboardAction = (
    <button type="button" className="text-button" onClick={() => handleViewChange('dashboard')}>
      Back to Dashboard
    </button>
  );

  const renderSectionTitle = (title: string, subtitle: string, action?: ReactNode) => (
    <div className="section-heading">
      <div>
        <p className="eyebrow">{greeting}, Admin 👋</p>
        <h1 className="section-title">{title}</h1>
        <p className="section-subtitle">{subtitle}</p>
      </div>
      {action}
    </div>
  );

  const renderDashboard = () => (
    <>
      <section className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">{greeting}, Admin 👋</p>
          <h1 className="hero-title">Today&apos;s Overview</h1>
          <p className="hero-subtitle">
            Premium command center for bookings, orders, customers, parts, and service operations.
          </p>
        </div>
        <div className="hero-surface">
          <div className="hero-surface__label">Current Date</div>
          <div className="hero-surface__value">{dateLabel}</div>
          <div className="hero-surface__meta">
            <Activity size={16} />
            Live backend data synced
          </div>
        </div>
      </section>

      <section className="metric-grid">
        {kpiCards.map((card) => (
          <MetricCard
            key={card.title}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            tone={card.tone}
            trend={card.trend}
            icon={card.icon}
          />
        ))}
      </section>

      <section className="chart-grid">
        <ChartPanel title="Revenue" subtitle="Last 7 days" color="blue">
          <MiniBarChart labels={WEEK_LABELS} values={WEEKLY_REVENUE} />
        </ChartPanel>
        <ChartPanel title="Bookings" subtitle="Weekly momentum" color="teal">
          <MiniBarChart labels={WEEK_LABELS} values={WEEKLY_BOOKINGS} />
        </ChartPanel>
        <ChartPanel title="Orders" subtitle="Weekly momentum" color="violet">
          <MiniBarChart labels={WEEK_LABELS} values={WEEKLY_ORDERS} />
        </ChartPanel>
      </section>

      <section className="dashboard-grid">
        <Panel title="Recent Bookings" subtitle="Most recent appointments and customer requests">
          <DataTable
            columns={['Booking', 'Customer', 'Vehicle', 'Date', 'Status']}
            emptyLabel="No recent bookings found."
            rows={filteredBookings.slice(0, 6).map((booking) => (
              <tr key={booking._id}>
                <Td title>{booking.bookingId}</Td>
                <Td>
                  <div className="table-primary">{booking.customer?.fullName ?? 'Customer'}</div>
                  <div className="table-secondary">{booking.customer?.email ?? 'No email'}</div>
                </Td>
                <Td>
                  <div className="table-primary">{booking.vehicle?.plateNumber ?? 'Vehicle'}</div>
                  <div className="table-secondary">{booking.vehicle ? `${booking.vehicle.make} ${booking.vehicle.modelName}` : 'Unknown vehicle'}</div>
                </Td>
                <Td>
                  <div className="table-primary">{new Date(booking.bookingDate).toLocaleDateString()}</div>
                  <div className="table-secondary">{booking.preferredTime}</div>
                </Td>
                <Td>
                  <span className={statusLabelClass(toneForBooking(booking.status))}>{booking.status.replace(/_/g, ' ')}</span>
                </Td>
              </tr>
            ))}
          />
        </Panel>

        <Panel title="Recent Orders" subtitle="Sales and fulfilment activity">
          <DataTable
            columns={['Order', 'Customer', 'Total', 'Status', 'Created']}
            emptyLabel="No recent orders found."
            rows={filteredOrders.slice(0, 6).map((order) => (
              <tr key={order._id}>
                <Td title>{order.orderId}</Td>
                <Td>
                  <div className="table-primary">{order.customer?.fullName ?? 'Customer'}</div>
                  <div className="table-secondary">{order.customer?.email ?? 'No email'}</div>
                </Td>
                <Td>
                  <div className="table-primary">{formatCurrency(order.totalAmount ?? 0)}</div>
                  <div className="table-secondary">{order.paymentMethod}</div>
                </Td>
                <Td>
                  <span className={statusLabelClass(toneForOrder(order.orderStatus))}>{order.orderStatus.replace(/_/g, ' ')}</span>
                </Td>
                <Td>
                  <div className="table-secondary">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—'}</div>
                </Td>
              </tr>
            ))}
          />
        </Panel>

        <Panel title="Latest Customers" subtitle="Newest and most engaged customers">
          <DataTable
            columns={['Customer', 'Bookings', 'Orders', 'Source']}
            emptyLabel="No customers found."
            rows={filteredCustomers.slice(0, 6).map((customer) => (
              <tr key={customer.id}>
                <Td title>{customer.name}</Td>
                <Td>{customer.bookings}</Td>
                <Td>{customer.orders}</Td>
                <Td>
                  <span className={statusLabelClass(customer.source === 'Booking' ? 'info' : 'success')}>{customer.source}</span>
                </Td>
              </tr>
            ))}
          />
        </Panel>

        <Panel title="Low Stock Parts" subtitle="Items requiring immediate attention">
          <DataTable
            columns={['Item', 'Stock', 'Threshold', 'Status']}
            emptyLabel="No parts alerts."
            rows={lowStock.slice(0, 6).map((item) => (
              <tr key={item._id}>
                <Td title>{item.name}</Td>
                <Td>{item.stockQuantity}</Td>
                <Td>{item.lowStockThreshold}</Td>
                <Td>
                  <span className={statusLabelClass(item.stockQuantity <= 0 ? 'danger' : 'warning')}>
                    {item.stockQuantity <= 0 ? 'Out of stock' : 'Low stock'}
                  </span>
                </Td>
              </tr>
            ))}
          />
        </Panel>
      </section>

      <section className="dashboard-grid dashboard-grid--aside">
        <Panel title="Quick Actions" subtitle="Common admin workflows">
          <div className="quick-actions">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button key={action.label} type="button" className="quick-action-card" onClick={() => handleViewChange(action.view)}>
                  <span className="quick-action-card__icon">
                    <Icon size={18} />
                  </span>
                  <span className="quick-action-card__label">{action.label}</span>
                  <ChevronRight size={16} className="quick-action-card__chevron" />
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel title="Notifications" subtitle="Recent activities and alerts">
          <ActivityList items={activities} />
        </Panel>
      </section>
    </>
  );

  const renderBookings = () => <BookingsPage />;

  const renderOrders = () => <OrdersPage />;

  const renderCustomers = () => <CustomersPage />;

  const renderParts = () => <PartsPage />;

  const renderServices = () => <ServicesPage />;

  const renderBanners = () => <BannerManagementPage />;

  const renderReports = () => (
    <>
      {renderSectionTitle('Reports', 'Operational insights for revenue, fulfillment, and stock.', backToDashboardAction)}
      <section className="chart-grid">
        <ChartPanel title="Revenue" subtitle="Weekly trend" color="blue">
          <MiniBarChart labels={WEEK_LABELS} values={WEEKLY_REVENUE} />
        </ChartPanel>
        <ChartPanel title="Bookings" subtitle="Weekly trend" color="teal">
          <MiniBarChart labels={WEEK_LABELS} values={WEEKLY_BOOKINGS} />
        </ChartPanel>
        <ChartPanel title="Orders" subtitle="Weekly trend" color="violet">
          <MiniBarChart labels={WEEK_LABELS} values={WEEKLY_ORDERS} />
        </ChartPanel>
      </section>
      <section className="dashboard-grid dashboard-grid--aside">
        <Panel title="Top Services" subtitle="Most booked service categories">
          <div className="compact-list">
            {topServices.length ? topServices.map((service) => (
              <div key={service._id} className="compact-list-item">
                <div className="table-primary">{service.name}</div>
                <div className="table-secondary">{service.bookings} bookings</div>
              </div>
            )) : <EmptyState message="No service insights available." />}
          </div>
        </Panel>
        <Panel title="Activity Feed" subtitle="Recent operations and inventory events">
          <ActivityList items={activities} />
        </Panel>
      </section>
    </>
  );

  const renderSettings = () => (
    <>
      {renderSectionTitle('Settings', 'Account, security, and operational preferences.', backToDashboardAction)}
      <section className="settings-grid">
        <Panel title="Profile" subtitle="Current signed-in admin account">
          <div className="settings-profile">
            <div className="settings-avatar">{adminInitials}</div>
            <div>
              <div className="table-primary">{adminName}</div>
              <div className="table-secondary">Session secured with auth token</div>
            </div>
          </div>
        </Panel>
        <Panel title="Security" subtitle="Authentication and session controls">
          <div className="settings-list">
            <SettingRow label="Automatic invalidation" value="Enabled" />
            <SettingRow label="Protected routes" value="Enabled" />
            <SettingRow label="Back navigation guard" value="Enabled" />
          </div>
        </Panel>
        <Panel title="Support" subtitle="Helpful actions for admins">
          <div className="settings-list">
            <SettingRow label="Refresh dashboard" value="" action={<button type="button" className="text-button" onClick={() => void refresh()}><RefreshCw size={16} /> Refresh</button>} />
            <SettingRow label="Logout" value="" action={<button type="button" className="text-button text-button--danger" onClick={() => setShowLogoutDialog(true)}><LogOut size={16} /> Logout</button>} />
          </div>
        </Panel>
      </section>
    </>
  );

  const renderContent = () => {
    switch (activeView) {
      case 'bookings':
        return renderBookings();
      case 'orders':
        return renderOrders();
      case 'customers':
        return renderCustomers();
      case 'parts':
        return renderParts();
      case 'services':
        return renderServices();
      case 'categories':
        return <CategoriesPage />;
      case 'banners':
        return renderBanners();
      case 'reports':
        return renderReports();
      case 'settings':
        return renderSettings();
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="admin-shell">
      {isMobile && sidebarOpen ? <button type="button" aria-label="Close navigation drawer" className="mobile-overlay" onClick={() => setSidebarOpen(false)} /> : null}

      <aside className={`admin-sidebar ${sidebarCollapsed ? 'admin-sidebar--collapsed' : ''} ${isMobile ? 'admin-sidebar--drawer' : ''} ${visibleSidebar ? 'is-open' : ''}`}>
        <div className="admin-sidebar__brand">
          <div className="admin-brand-mark">
            <Sparkles size={18} />
          </div>
          <div className="admin-sidebar__brand-copy">
            <strong>M Enterprises</strong>
            <span>Premium Admin Suite</span>
          </div>
        </div>

        <nav className="admin-nav" aria-label="Primary">
          {NAVIGATION.map((item) => {
            const Icon = item.icon;
            const count = navCounts[item.id];
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`admin-nav-button ${active ? 'is-active' : ''}`}
                onClick={() => handleViewChange(item.id)}
                aria-current={active ? 'page' : undefined}
              >
                <span className="admin-nav-button__icon"><Icon size={18} /></span>
                <span className="admin-nav-button__label">{item.label}</span>
                {count ? <span className="admin-nav-button__count">{count}</span> : null}
              </button>
            );
          })}
        </nav>

        <div className="admin-sidebar__footer">
          <div className="sidebar-summary-card">
            <div className="sidebar-summary-card__label">Live sync</div>
            <div className="sidebar-summary-card__value">Online</div>
            <div className="sidebar-summary-card__meta">
              <span />
              Synced with backend data
            </div>
          </div>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar__left">
            {isMobile ? (
              <button
                type="button"
                className="icon-button"
                onClick={() => setSidebarOpen((current) => !current)}
                aria-label="Open navigation menu"
              >
                <Menu size={18} />
              </button>
            ) : null}
            <div className="topbar-copy">
              <div className="topbar-copy__eyebrow">Welcome back</div>
              <div className="topbar-copy__title">{greeting}, {adminName}</div>
              <div className="topbar-copy__subtitle">{dateLabel}</div>
            </div>
          </div>

          <div className="admin-topbar__actions">
            <label className="admin-search" aria-label="Search dashboard content">
              <Search size={16} />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search bookings, orders, customers, parts..."
              />
            </label>

            <div className="header-action-stack">
              <button
                type="button"
                className={`icon-button icon-button--notify ${notificationsOpen ? 'is-active' : ''}`}
                onClick={() => setNotificationsOpen((current) => !current)}
                aria-label="Open notifications"
              >
                <Bell size={18} />
                {notificationCount ? <span className="notification-badge">{notificationCount}</span> : null}
              </button>

              <div className="admin-profile-chip" aria-label={`Signed in as ${adminName}`}>
                <div className="admin-avatar" aria-hidden="true">{adminInitials}</div>
                <div className="admin-meta">
                  <span className="admin-label">Admin</span>
                  <strong className="admin-name">{adminName}</strong>
                </div>
              </div>

              <button
                type="button"
                className="logout-button"
                onClick={() => setShowLogoutDialog(true)}
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>

          {notificationsOpen ? (
            <div className="notifications-panel" role="dialog" aria-label="Recent notifications">
              <div className="notifications-panel__header">
                <div>
                  <div className="table-primary">Recent activity</div>
                  <div className="table-secondary">Live operational updates</div>
                </div>
                <button type="button" className="icon-button" onClick={() => setNotificationsOpen(false)} aria-label="Close notifications">
                  <X size={16} />
                </button>
              </div>
              <ActivityList items={activities.slice(0, 5)} />
            </div>
          ) : null}
        </header>

        <section className="admin-content">
          {error ? (
            <div className="error-banner">
              <div>
                <strong>Dashboard data is partially unavailable.</strong>
                <div>{error}</div>
              </div>
              <button type="button" className="text-button" onClick={() => void refresh()}>
                <RefreshCw size={16} /> Retry
              </button>
            </div>
          ) : null}

          <div className="admin-actions-row">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button key={action.label} type="button" className="action-chip" onClick={() => handleViewChange(action.view)}>
                  <Icon size={16} />
                  {action.label}
                </button>
              );
            })}
          </div>

          {isLoading ? <LoadingSkeleton /> : renderContent()}
        </section>
      </main>

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

const MetricCard = ({
  title,
  value,
  subtitle,
  tone,
  trend,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  tone: 'info' | 'success' | 'warning' | 'danger';
  trend: string;
  icon: LucideIcon;
}) => (
  <article className={`metric-card metric-card--${tone}`}>
    <div className="metric-card__top">
      <span className="metric-card__icon">
        <Icon size={18} />
      </span>
      <span className={`metric-card__trend metric-card__trend--${trend.startsWith('-') ? 'down' : 'up'}`}>
        {trend.startsWith('-') ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
        {trend}
      </span>
    </div>
    <div className="metric-card__title">{title}</div>
    <div className="metric-card__value">{value}</div>
    <div className="metric-card__subtitle">{subtitle}</div>
  </article>
);

const Panel = ({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) => (
  <article className="panel-card">
    <div className="panel-card__header">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </div>
    {children}
  </article>
);

const ChartPanel = ({ title, subtitle, color, children }: { title: string; subtitle: string; color: 'blue' | 'teal' | 'violet'; children: ReactNode }) => (
  <article className={`chart-card chart-card--${color}`}>
    <div className="panel-card__header panel-card__header--tight">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </div>
    {children}
  </article>
);

const MiniBarChart = ({ labels, values }: { labels: string[]; values: number[] }) => {
  const maxValue = Math.max(...values, 1);
  return (
    <div className="mini-chart">
      <div className="mini-chart__bars">
        {values.map((value, index) => (
          <div key={labels[index]} className="mini-chart__group">
            <div className="mini-chart__bar-track">
              <div className="mini-chart__bar" style={{ height: `${Math.max((value / maxValue) * 100, 14)}%` }} />
            </div>
            <span>{labels[index]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const DataTable = ({ columns, rows, emptyLabel }: { columns: string[]; rows: ReactNode[]; emptyLabel: string }) => (
  <div className="table-card">
    <div className="table-responsive">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? rows : (
            <tr>
              <td colSpan={columns.length}>
                <div className="table-empty">
                  <EmptyState message={emptyLabel} />
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const Td = ({ children, title = false }: { children: ReactNode; title?: boolean }) => (
  <td>
    <div className={title ? 'table-primary' : 'table-secondary'}>{children}</div>
  </td>
);

const ActivityList = ({ items }: { items: Array<{ id: string; title: string; description: string; timestamp: string; tone: 'info' | 'success' | 'warning' | 'danger' }> }) => (
  <div className="activity-list">
    {items.length ? items.map((item) => (
      <div key={item.id} className="activity-item">
        <div className={`activity-item__dot activity-item__dot--${item.tone}`} />
        <div className="activity-item__content">
          <div className="table-primary">{item.title}</div>
          <div className="table-secondary">{item.description}</div>
          <div className="activity-item__meta">{new Date(item.timestamp).toLocaleString()}</div>
        </div>
      </div>
    )) : <EmptyState message="No recent activity." />}
  </div>
);

const SettingRow = ({ label, value, action }: { label: string; value: string; action?: ReactNode }) => (
  <div className="setting-row">
    <div>
      <div className="table-primary">{label}</div>
      {value ? <div className="table-secondary">{value}</div> : null}
    </div>
    {action}
  </div>
);

const LoadingSkeleton = () => (
  <div className="loading-skeleton">
    <div className="loading-skeleton__hero" />
    <div className="metric-grid">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="loading-skeleton__card" />
      ))}
    </div>
    <div className="dashboard-grid">
      <div className="loading-skeleton__panel" />
      <div className="loading-skeleton__panel" />
    </div>
  </div>
);

export default DashboardApp;
