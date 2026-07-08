type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const toneStyles: Record<BadgeTone, { bg: string; color: string }> = {
  success: { bg: '#dcfce7', color: '#166534' },
  warning: { bg: '#fef3c7', color: '#92400e' },
  danger: { bg: '#fee2e2', color: '#991b1b' },
  info: { bg: '#dbeafe', color: '#1d4ed8' },
  neutral: { bg: '#f1f5f9', color: '#475569' },
};

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
}

const Badge = ({ label, tone = 'neutral' }: BadgeProps) => {
  const style = toneStyles[tone];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: style.bg,
        color: style.color,
        padding: '0.25rem 0.6rem',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
};

export default Badge;
