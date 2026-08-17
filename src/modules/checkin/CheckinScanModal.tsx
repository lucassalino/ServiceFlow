'use client';

import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { CameraOff } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Chamado com o texto descodificado do QR. */
  onScan: (decodedText: string) => void;
}

interface BarcodeDetectorResult {
  rawValue: string;
}
interface BarcodeDetectorLike {
  detect: (source: CanvasImageSource) => Promise<BarcodeDetectorResult[]>;
}
type BarcodeDetectorCtor = new (opts: { formats: string[] }) => BarcodeDetectorLike;

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
  if (name === 'SecurityError' || /insecure|secure context/i.test(message)) {
    return 'O acesso à câmara requer uma ligação segura (https).';
  }
  return `Não conseguimos aceder à câmara (${message || name || 'erro desconhecido'}).`;
}

/** Modal com a câmara ativa para ler o QR code de check-in sem sair da app. */
export function CheckinScanModal({ open, onOpenChange, onScan }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);

    let cancelled = false;
    const video = videoRef.current;
    if (!video) return;

    if (!canvasRef.current) canvasRef.current = document.createElement('canvas');
    const canvas = canvasRef.current;

    const BarcodeDetectorGlobal = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
    if (BarcodeDetectorGlobal) {
      try {
        detectorRef.current = new BarcodeDetectorGlobal({ formats: ['qr_code'] });
      } catch {
        detectorRef.current = null;
      }
    }

    const tick = async () => {
      if (cancelled || !video.videoWidth || !video.videoHeight) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) { rafRef.current = requestAnimationFrame(tick); return; }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      try {
        if (detectorRef.current) {
          const results = await detectorRef.current.detect(canvas);
          if (cancelled) return;
          if (results.length > 0 && results[0].rawValue) {
            onScan(results[0].rawValue);
            onOpenChange(false);
            return;
          }
        } else {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (cancelled) return;
          if (code && code.data) {
            onScan(code.data);
            onOpenChange(false);
            return;
          }
        }
      } catch (err) {
        console.error('QR detect failed:', err);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        video.srcObject = stream;
        video.play().catch(() => {});
        rafRef.current = requestAnimationFrame(tick);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('getUserMedia failed:', err);
        setError(describeCameraError(err));
      });

    return () => {
      cancelled = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      video.srcObject = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" style={{ padding: 0, overflow: 'hidden' }}>
        <DialogHeader style={{ padding: '1.25rem 1.25rem 0' }}>
          <DialogTitle>Ler QR code</DialogTitle>
        </DialogHeader>
        <div style={{ position: 'relative', width: '100%', aspectRatio: '1', background: 'var(--wis-surface)', marginTop: '1rem' }}>
          {error && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1.5rem', textAlign: 'center',
            }}>
              <CameraOff style={{ width: '2rem', height: '2rem', color: 'var(--wis-text-3)' }} />
              <p style={{ fontSize: '0.8rem', color: 'var(--wis-text-2)' }}>{error}</p>
            </div>
          )}
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            ref={videoRef}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: error ? 'none' : 'block' }}
            muted autoPlay playsInline
          />
        </div>
        <p style={{ padding: '0.9rem 1.25rem 1.25rem', fontSize: '0.78rem', color: 'var(--wis-text-3)', textAlign: 'center' }}>
          Aponta para o QR code à entrada da igreja
        </p>
      </DialogContent>
    </Dialog>
  );
}
