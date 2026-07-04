import { useEffect, useMemo, useState } from 'react';
import { formatCurrency } from '../utils/currency';
import { useAuth } from '../hooks/useAuth';
import { orderService, OrderItem } from '../services/orderService';

const statusOptions = ['pending', 'confirmed', 'in_service', 'ready_for_pickup', 'completed', 'cancelled'];
const paymentOptions = ['pending', 'paid'];
const paymentMethodOptions = ['cash', 'upi', 'card'];

const OrdersPage = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [paymentMethod, setPaymentMethod] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const loadOrders = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const payload = await orderService.list(token, { page, limit: 8, search, status: status === 'all' ? undefined : status, paymentStatus: paymentStatus === 'all' ? undefined : paymentStatus, paymentMethod: paymentMethod === 'all' ? undefined : paymentMethod, sort: 'date-desc' });
      setOrders(payload?.items ?? []);
      setTotalPages(payload?.totalPages ?? 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, [token, page, status, paymentStatus, paymentMethod]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredOrders = useMemo(() => orders.filter((order) => `${order.orderId} ${order.customer?.fullName ?? ''} ${order.vehicle?.plateNumber ?? ''}`.toLowerCase().includes(search.toLowerCase())), [orders, search]);

  const updateOrderStatus = async (orderId: string, nextStatus: string) => {
    if (!token) return;
    try {
      await orderService.updateStatus(token, orderId, { orderStatus: nextStatus });
      setToast('Order status updated');
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update status');
    }
  };

  const updatePaymentStatus = async (orderId: string, nextStatus: string) => {
    if (!token) return;
    try {
      await orderService.updateStatus(token, orderId, { orderStatus: 'pending', paymentStatus: nextStatus });
      setToast('Payment status updated');
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update payment status');
    }
  };

  const openWhatsApp = (order: OrderItem) => {
    const message = `Order ID: ${order.orderId}\nBooking ID: ${order.booking?.bookingId ?? 'N/A'}\nCustomer: ${order.customer?.fullName ?? 'N/A'}\nPhone: ${order.customer?.phone ?? 'N/A'}\nVehicle: ${order.vehicle ? `${order.vehicle.make} ${order.vehicle.modelName} (${order.vehicle.plateNumber})` : 'N/A'}\nServices: ${order.services?.map((service) => service.name).join(', ') ?? 'N/A'}\nDate: ${order.booking?.bookingDate ?? 'N/A'}\nTime: ${order.booking?.preferredTime ?? 'N/A'}\nAddress: ${order.booking?.address ?? 'N/A'}\nTotal: ${formatCurrency(order.totalAmount ?? 0)}\nPayment: ${order.paymentMethod}\nStatus: ${order.orderStatus}`;
    const url = `https://wa.me/15551234567?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const deleteOrder = async (orderId: string) => {
    if (!token || !window.confirm('Delete this order?')) return;
    try {
      await orderService.delete(token, orderId);
      setToast('Order deleted');
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete order');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <header style={{ marginBottom: '1rem' }}>
          <h1 style={{ margin: 0, color: '#0f172a' }}>Orders</h1>
          <p style={{ margin: '0.35rem 0 0', color: '#64748b' }}>Track fulfilment, payments, and customer communication.</p>
        </header>

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search orders" style={{ flex: 1, minWidth: '260px', padding: '0.8rem 0.9rem', borderRadius: '12px', border: '1px solid #cbd5e1' }} />
          <select value={status} onChange={(event) => setStatus(event.target.value)} style={{ padding: '0.8rem 0.9rem', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
            <option value="all">All statuses</option>
            {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)} style={{ padding: '0.8rem 0.9rem', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
            <option value="all">All payments</option>
            {paymentOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} style={{ padding: '0.8rem 0.9rem', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
            <option value="all">All methods</option>
            {paymentMethodOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>

        {toast ? <div style={{ marginBottom: '1rem', background: '#dcfce7', color: '#166534', padding: '0.75rem 1rem', borderRadius: '12px' }}>{toast}</div> : null}

        {loading ? (
          <div style={{ color: '#64748b' }}>Loading orders...</div>
        ) : error ? (
          <div style={{ color: '#dc2626' }}>{error}</div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>No orders found.</div>
        ) : (
          <div style={{ display: 'grid', gap: '0.9rem' }}>
            {filteredOrders.map((order) => (
              <div key={order._id} style={{ background: '#fff', borderRadius: '16px', padding: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{order.orderId}</div>
                    <div style={{ color: '#64748b', marginTop: '0.25rem' }}>{order.customer?.fullName ?? 'Customer'}</div>
                       <div style={{ color: '#64748b' }}>{order.vehicle?.plateNumber ?? 'Vehicle'} • {formatCurrency(order.totalAmount ?? 0)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select value={order.orderStatus} onChange={(event) => void updateOrderStatus(order._id, event.target.value)} style={{ padding: '0.6rem 0.8rem', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                      {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                    <select value={order.paymentStatus} onChange={(event) => void updatePaymentStatus(order._id, event.target.value)} style={{ padding: '0.6rem 0.8rem', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                      {paymentOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                    <button onClick={() => openWhatsApp(order)} style={{ padding: '0.6rem 0.8rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>WhatsApp</button>
                    <button onClick={() => setSelectedOrderId(selectedOrderId === order._id ? null : order._id)} style={{ padding: '0.6rem 0.8rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>Details</button>
                    <button onClick={() => void deleteOrder(order._id)} style={{ padding: '0.6rem 0.8rem', borderRadius: '10px', border: '1px solid #fecaca', background: '#fff1f2', color: '#dc2626', cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
                {selectedOrderId === order._id ? (
                  <div style={{ marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px solid #e2e8f0' }}>
                    <div><strong>Booking:</strong> {order.booking?.bookingId ?? 'N/A'}</div>
                    <div><strong>Payment Method:</strong> {order.paymentMethod}</div>
                    <div><strong>Services:</strong> {order.services?.map((service) => service.name).join(', ') ?? 'N/A'}</div>
                    <div><strong>Notes:</strong> {order.notes ?? 'None'}</div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
          <button disabled={page <= 1} onClick={() => setPage((prev) => prev - 1)} style={{ padding: '0.7rem 1rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff' }}>Previous</button>
          <span style={{ color: '#64748b', alignSelf: 'center' }}>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((prev) => prev + 1)} style={{ padding: '0.7rem 1rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff' }}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
