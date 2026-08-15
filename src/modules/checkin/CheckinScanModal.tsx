'use client';

import { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { CameraOff } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

QrScanner.WORKER_PATH = '/qr-scanner-worker.min.js';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Chamado com o texto descodificado do QR. */
  onScan: (decodedText: string) => void;
}

function describeCameraError(err: unknown): string {
  const name = err instanceof Error ? err.name : '';
  const message = err instanceof Error ? err.message : String(err);
  if (name === 'NotAllowedError' || /permission/i.test(message)) {
    return 'Permissão da câmara negada. Vai às definições do navegador/telemóvel e permite o acesso à câmara para este site.';
  }
  if (name === 'NotFoundError' || /no camera/i.test(message)) {
    return 'Não encontrámos nenhuma câmara neste dispositivo.';
  }
  if (name === 'NotReadableError') {
    return 'A câmara está a ser usada por outra aplicação.';
  }
  return `Não conseguimos aceder à câmara (${message || name || 'erro desconhecido'}).`;
}

/** Modal com a câmara ativa para ler o QR code de check-in sem sair da app. */
export function CheckinScanModal({ open, onOpenChange, onScan }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !videoRef.current) return;
    setError(null);

    let cancelled = false;
    const scanner = new QrScanner(
      videoRef.current,
      (result) => { onScan(result.data); onOpenChange(false); },
      { highlightScanRegion: true, highlightCodeOutline: true, preferredCamera: 'environment' },
    );
    scannerRef.current = scanner;

    QrScanner.hasCamera()
      .then((has) => {
        if (cancelled) return;
        if (!has) { setError('Não encontrámos nenhuma câmara neste dispositivo.'); return; }
        return scanner.start();
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('QrScanner start failed:', err);
        setError(describeCameraError(err));
      });

    return () => {
      cancelled = true;
      scanner.stop();
      scanner.destroy();
      scannerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" style={{ padding: 0, overflow: 'hidden' }}>
        <DialogHeader style={{ padding: '1.25rem 1.25rem 0' }}>
          <DialogTitle>Ler QR code</DialogTitle>
        </DialogHeader>
        <div style={{ position: 'relative', width: '100%', aspectRatio: '1', background: '#000', marginTop: '1rem' }}>
          {error && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1.5rem', textAlign: 'center',
            }}>
              <CameraOff style={{ width: '2rem', height: '2rem', color: 'rgba(255,255,255,0.3)' }} />
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{error}</p>
            </div>
          )}
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            ref={videoRef}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: error ? 'none' : 'block' }}
            muted autoPlay playsInline
          />
        </div>
        <p style={{ padding: '0.9rem 1.25rem 1.25rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
          Aponta para o QR code à entrada da igreja
        </p>
      </DialogContent>
    </Dialog>
  );
}
