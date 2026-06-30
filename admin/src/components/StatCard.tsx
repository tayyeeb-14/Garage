interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  accent?: string;
}

const StatCard = ({ title, value, subtitle, accent = '#2563eb' }: StatCardProps) => (
  <div
    style={{
      background: '#fff',
      borderRadius: '16px',
      padding: '1.25rem',
      boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)',
      border: '1px solid #e2e8f0',
      minHeight: '130px',
    }}
  >
    <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem' }}>{title}</div>
    <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0f172a' }}>{value}</div>
    {subtitle ? <div style={{ marginTop: '0.5rem', color: accent, fontSize: '0.9rem' }}>{subtitle}</div> : null}
  </div>
);

export default StatCard;
