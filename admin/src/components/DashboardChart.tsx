const DashboardChart = () => {
  const bars = [48, 72, 56, 84, 91, 68, 76];

  return (
    <div style={{ background: '#fff', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)', border: '1px solid #e2e8f0' }}>
      <h3 style={{ margin: '0 0 1rem', color: '#0f172a' }}>Weekly Performance</h3>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', height: '180px' }}>
        {bars.map((height, index) => (
          <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', height: `${height}%`, background: index % 2 === 0 ? '#2563eb' : '#14b8a6', borderRadius: '8px 8px 0 0' }} />
            <span style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardChart;
