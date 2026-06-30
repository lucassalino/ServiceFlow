'use client';

import { Camera } from 'lucide-react';
import { Dialog, DialogContent } from './dialog';
import { getInitials } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  name: string;
  email?: string;
  avatarUrl?: string | null;
  onChangePhoto?: () => void;
}

export function ProfileCardDialog({ open, onOpenChange, name, email, avatarUrl, onChangePhoto }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 border-0 bg-transparent shadow-none max-w-[300px] [&>button]:hidden"
      >
        {/* Card */}
        <div
          className="rounded-[2.5rem] overflow-hidden shadow-2xl w-full"
          style={{ background: '#1c1c1e' }}
        >
          {/* Photo with gradient overlay */}
          <div className="relative w-full" style={{ height: 340 }}>
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={name}
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
              />
            ) : (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: '#2c2c2e' }}
              >
                <span className="text-7xl font-bold select-none" style={{ color: 'rgba(255,255,255,0.15)' }}>
                  {getInitials(name)}
                </span>
              </div>
            )}

            {/* Bottom gradient */}
            <div
              className="absolute inset-x-0 bottom-0"
              style={{
                height: '55%',
                background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)',
              }}
            />

            {/* Name & subtitle over gradient */}
            <div className="absolute inset-x-0 bottom-0 px-5 pb-5 text-center">
              <h2 className="text-[22px] font-semibold leading-snug text-white">{name}</h2>
              {email && (
                <p className="mt-0.5 text-sm text-white/70 truncate">{email}</p>
              )}
            </div>
          </div>

          {/* Bottom action */}
          <div className="px-5 py-5">
            <button
              onClick={() => { onOpenChange(false); onChangePhoto?.(); }}
              className="flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-85 active:scale-95"
              style={{ background: '#0a84ff' }}
            >
              <Camera className="h-4 w-4" />
              Alterar foto
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
