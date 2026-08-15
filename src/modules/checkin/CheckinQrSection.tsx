'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

interface Props {
  orgId: string;
}

export function CheckinQrSection({ orgId }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Usa sempre o domínio atual (não um domínio fixo) — assim o QR aponta
  // sempre para o mesmo ambiente onde foi gerado (dev, prd, etc.), evitando
  // 404 por o link apontar para um domínio sem esta funcionalidade publicada.
  const [origin, setOrigin] = useState('');
  useEffect(() => { setOrigin(window.location.origin); }, []);
  const checkinUrl = origin ? `${origin}/${orgId}/checkin` : '';

  useEffect(() => {
    if (!checkinUrl) return;
    QRCode.toDataURL(checkinUrl, { width: 240, margin: 1, color: { dark: '#0a0a0e', light: '#ffffff' } })
      .then(setQrDataUrl).catch(() => setQrDataUrl(null));
  }, [checkinUrl]);

  async function handleCopy() {
    await navigator.clipboard.writeText(checkinUrl);
    setCopied(true);
    toast.success('Link copiado');
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="dark-inputs space-y-4">
      <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
        Imprime o QR code abaixo e cola-o à entrada. Cada pessoa escalada lê o código pela câmara
        (dentro da app, no botão de check-in/check-out) para confirmar presença.
      </p>

      {qrDataUrl && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="QR code de check-in" style={{ width: '9rem', height: '9rem', borderRadius: '0.5rem' }} />
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Input value={checkinUrl} readOnly className="font-mono text-xs" />
        <button
          type="button"
          onClick={handleCopy}
          style={{
            flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            padding: '0 0.9rem', fontSize: '0.8rem', fontWeight: 600,
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: '0.5rem', color: copied ? '#6ee7b7' : 'rgba(255,255,255,0.85)', cursor: 'pointer',
          }}
        >
          {copied ? <Check style={{ width: '0.8rem', height: '0.8rem' }} /> : <Copy style={{ width: '0.8rem', height: '0.8rem' }} />}
        </button>
      </div>
    </div>
  );
}
