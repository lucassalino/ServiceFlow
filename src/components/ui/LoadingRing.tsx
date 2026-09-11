interface Props {
  label?: string | null;
  size?: number;
}

export function LoadingRing({ label = 'A carregar…', size = 64 }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.9rem' }}>
      <div className="wis-loading-ring" style={{ width: size, height: size }} />
      {label && (
        <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--wis-text-3)', letterSpacing: '0.01em' }}>
          {label}
        </p>
      )}
    </div>
  );
}
