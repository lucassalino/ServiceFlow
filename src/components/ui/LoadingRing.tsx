interface Props {
  label?: string | null;
  size?: number;
  percent?: number | null;
}

export function LoadingRing({ label = 'A carregar…', size = 64, percent = null }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.9rem' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <div className="wis-loading-ring" style={{ width: size, height: size }} />
        {percent != null && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: size * 0.22, fontWeight: 700, color: 'var(--wis-text)' }}>
              {Math.round(percent)}%
            </span>
          </div>
        )}
      </div>
      {label && (
        <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--wis-text-3)', letterSpacing: '0.01em' }}>
          {label}
        </p>
      )}
    </div>
  );
}
