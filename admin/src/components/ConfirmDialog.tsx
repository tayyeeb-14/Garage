interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 60,
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: '1.5rem',
          width: 'min(440px, 100%)',
          boxShadow: '0 20px 50px rgba(15, 23, 42, 0.18)',
        }}
      >
        <h3 style={{ margin: '0 0 0.5rem', color: '#0f172a', fontSize: '1.1rem' }}>{title}</h3>
        <p style={{ margin: '0 0 1.25rem', color: '#64748b', lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={secondaryBtnStyle}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              ...secondaryBtnStyle,
              flex: 1,
              background: danger ? '#dc2626' : '#2563eb',
              color: '#fff',
              border: 'none',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const secondaryBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '0.75rem 1rem',
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  background: '#fff',
  cursor: 'pointer',
  fontWeight: 600,
};

export default ConfirmDialog;
