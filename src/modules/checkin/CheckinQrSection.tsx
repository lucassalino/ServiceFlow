'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { MapPin, Loader2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { APP_URL } from '@/lib/app-url';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateOrgCheckinLocation } from '@/hooks/useCheckin';

interface Props {
  orgId: string;
  initialLatitude: number | null;
  initialLongitude: number | null;
  initialRadiusMeters: number;
}

export function CheckinQrSection({ orgId, initialLatitude, initialLongitude, initialRadiusMeters }: Props) {
  const updateLocation = useUpdateOrgCheckinLocation();
  const [latitude, setLatitude] = useState(initialLatitude);
  const [longitude, setLongitude] = useState(initialLongitude);
  const [radiusMeters, setRadiusMeters] = useState(initialRadiusMeters);
  const [capturing, setCapturing] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const checkinUrl = `${APP_URL}/${orgId}/checkin`;

  useEffect(() => {
    QRCode.toDataURL(checkinUrl, { width: 240, margin: 1, color: { dark: '#0a0a0e', light: '#ffffff' } })
      .then(setQrDataUrl).catch(() => setQrDataUrl(null));
  }, [checkinUrl]);

  function handleCapture() {
    if (!('geolocation' in navigator)) {
      toast.error('O teu navegador não suporta geolocalização');
      return;
    }
    setCapturing(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setCapturing(false);
        toast.success('Localização capturada — guarda para aplicar');
      },
      () => { setCapturing(false); toast.error('Não foi possível obter a localização'); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function handleSave() {
    if (latitude === null || longitude === null) {
      toast.error('Captura a localização primeiro');
      return;
    }
    try {
      await updateLocation.mutateAsync({ orgId, latitude, longitude, radiusMeters });
      toast.success('Localização de check-in guardada');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao guardar');
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(checkinUrl);
    setCopied(true);
    toast.success('Link copiado');
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="dark-inputs space-y-4">
      <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
        Imprime o QR code abaixo e cola-o à entrada. Ao abrir o link, a pessoa escalada confirma presença —
        se definires uma localização, só é aceite dentro do raio configurado.
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

      <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)' }} />

      <div className="space-y-1.5">
        <Label>Localização da igreja</Label>
        <button
          type="button"
          onClick={handleCapture}
          disabled={capturing}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.5rem 0.9rem', fontSize: '0.82rem', fontWeight: 600,
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: '0.5rem', color: 'rgba(255,255,255,0.85)',
            cursor: capturing ? 'wait' : 'pointer', opacity: capturing ? 0.6 : 1,
          }}
        >
          {capturing ? <Loader2 className="animate-spin" style={{ width: '0.9rem', height: '0.9rem' }} /> : <MapPin style={{ width: '0.9rem', height: '0.9rem' }} />}
          {capturing ? 'A obter localização…' : 'Usar a minha localização atual'}
        </button>
        <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>
          Fica junto da entrada da igreja e clica no botão para capturar a coordenada.
          {latitude !== null && longitude !== null && (
            <> Atual: {latitude.toFixed(5)}, {longitude.toFixed(5)}.</>
          )}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="checkin-radius">Raio de tolerância (metros)</Label>
        <Input
          id="checkin-radius" type="number" min={20} max={2000}
          value={radiusMeters}
          onChange={(e) => setRadiusMeters(Number(e.target.value) || 150)}
        />
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={updateLocation.isPending || latitude === null}
        className="dark-primary-btn"
      >
        {updateLocation.isPending ? 'A guardar…' : 'Guardar localização de check-in'}
      </button>
    </div>
  );
}
