'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Mail } from 'lucide-react';
import { fetchEmailOptOutAction, setEmailOptOutAction } from '@/actions/email-preferences';
import { SUPPORT_EMAIL } from '@/lib/email/templates/layout';

export function EmailPreferencesSection() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['email-opt-out'],
    queryFn: fetchEmailOptOutAction,
  });

  const [enabled, setEnabled] = useState(true);
  useEffect(() => {
    if (data !== undefined) setEnabled(!data);
  }, [data]);

  const save = useMutation({
    mutationFn: (receive: boolean) => setEmailOptOutAction(!receive),
    onSuccess: (_r, receive) => {
      qc.invalidateQueries({ queryKey: ['email-opt-out'] });
      toast.success(receive ? 'Vais receber emails de escala' : 'Emails de escala desativados');
    },
    onError: (e: unknown) => {
      setEnabled((v) => !v); // reverte o otimismo
      toast.error(e instanceof Error ? e.message : 'Erro ao guardar');
    },
  });

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    save.mutate(next);
  }

  return (
    <div className="space-y-3">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        <Mail style={{ width: '1rem', height: '1rem', color: '#a5b4fc', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '0.875rem', color: '#fff', margin: 0, fontWeight: 500 }}>
            Emails quando sou escalado
          </p>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', margin: '0.1rem 0 0' }}>
            Recebes um email com os detalhes do evento e a tua função.
          </p>
        </div>

        <button
          role="switch"
          aria-checked={enabled}
          aria-label="Receber emails quando sou escalado"
          onClick={toggle}
          disabled={isLoading || save.isPending}
          style={{
            width: '2.6rem', height: '1.5rem', borderRadius: '9999px', flexShrink: 0,
            border: '1px solid rgba(255,255,255,0.14)', cursor: 'pointer', padding: 0,
            background: enabled ? '#1A6B5A' : 'rgba(255,255,255,0.1)',
            transition: 'background 0.15s',
            opacity: isLoading ? 0.5 : 1,
            position: 'relative',
          }}
        >
          <span style={{
            position: 'absolute', top: '50%', transform: 'translateY(-50%)',
            left: enabled ? 'calc(100% - 1.3rem)' : '0.18rem',
            width: '1.1rem', height: '1.1rem', borderRadius: '9999px', background: '#fff',
            transition: 'left 0.15s',
          }} />
        </button>
      </div>

      <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.6, margin: 0 }}>
        Os emails de conta (recuperar palavra-passe, confirmar email) são sempre
        enviados, mesmo com esta opção desligada. Dúvidas: {SUPPORT_EMAIL}
      </p>
    </div>
  );
}
