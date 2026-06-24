import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <WifiOff className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="space-y-1.5">
        <h1 className="text-lg font-semibold">Sem ligação à internet</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          Não foi possível carregar esta página. Liga-te à internet e tenta novamente.
        </p>
      </div>
    </div>
  );
}
