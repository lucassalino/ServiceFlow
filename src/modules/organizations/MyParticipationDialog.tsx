'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
import { useMyParticipation, useSaveMyParticipation } from '@/hooks/useParticipation';
import { FunctionChips } from '@/components/FunctionChips';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  orgId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Modo onboarding muda os textos (ao entrar numa organização). */
  onboarding?: boolean;
}

export function MyParticipationDialog({ orgId, open, onOpenChange, onboarding }: Props) {
  const { data, isLoading } = useMyParticipation(orgId, open);
  const save = useSaveMyParticipation();

  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  const [functions, setFunctions] = useState<string[]>([]);
  const [ministryIds, setMinistryIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open || !data) return;
    setPhone(data.profile.phone ?? '');
    setBirthday(data.profile.birthday ?? '');
    // Funções: preferências globais, ou união das que já tem nesta org.
    const fromMine = Array.from(new Set(data.mine.flatMap((m) => m.functions)));
    setFunctions(data.profile.default_functions.length > 0 ? data.profile.default_functions : fromMine);
    setMinistryIds(data.mine.map((m) => m.ministry_id));
  }, [open, data]);

  function toggleFn(key: string) {
    setFunctions((prev) => prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]);
  }
  function toggleMinistry(id: string) {
    setMinistryIds((prev) => prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]);
  }

  async function handleSave() {
    try {
      await save.mutateAsync({ orgId, phone: phone.trim() || null, birthday: birthday || null, functions, ministryIds });
      toast.success('Os teus dados foram guardados');
      onOpenChange(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao guardar');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{onboarding ? 'Bem-vindo! Completa o teu perfil' : 'As minhas participações'}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {onboarding
              ? 'Diz-nos os teus dados, funções e ministérios. Fica gravado para as próximas vezes.'
              : 'Escolhe as tuas funções e os ministérios onde serves.'}
          </p>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4">A carregar…</p>
        ) : (
          <div className="space-y-5">
            {/* Dados pessoais */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="phone">Telemóvel</Label>
                <Input id="phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+351 …" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="birthday">Data de nascimento</Label>
                <Input id="birthday" type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} style={{ colorScheme: 'dark' }} />
              </div>
            </div>

            {/* Funções (chips) */}
            <div className="space-y-2">
              <Label>As minhas funções</Label>
              <FunctionChips selected={functions} onToggle={toggleFn} />
            </div>

            {/* Ministérios (chips) */}
            <div className="space-y-2">
              <Label>Os meus ministérios</Label>
              {(data?.ministries.length ?? 0) === 0 ? (
                <p className="text-xs text-muted-foreground">Esta organização ainda não tem ministérios.</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {data!.ministries.map((m) => {
                    const sel = ministryIds.includes(m.id);
                    return (
                      <button key={m.id} type="button" onClick={() => toggleMinistry(m.id)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                          padding: '0.375rem 0.7rem', borderRadius: '9999px',
                          fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer',
                          background: sel ? 'rgba(165,180,252,0.14)' : 'rgba(255,255,255,0.05)',
                          color: sel ? '#a5b4fc' : 'rgba(255,255,255,0.6)',
                          border: `1px solid ${sel ? 'rgba(165,180,252,0.4)' : 'rgba(255,255,255,0.1)'}`,
                        }}>
                        <span>{m.icon}</span>
                        <span>{m.name}</span>
                        {sel && <Check style={{ width: '0.7rem', height: '0.7rem' }} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {onboarding ? 'Agora não' : 'Cancelar'}
          </Button>
          <Button onClick={handleSave} disabled={save.isPending || isLoading}>
            {save.isPending ? 'A guardar…' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
