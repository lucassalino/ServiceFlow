'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Plus, X, Check } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useOrgMembers } from '@/hooks/useMembers';
import {
  useMyFamilyRelationships, useProposeFamilyRelationship, useRespondToFamilyRelationship,
  useUpdateFamilyRelationship, useRemoveFamilyRelationship,
} from '@/hooks/useFamily';
import type { FamilyPreference } from '@/actions/families';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getInitials } from '@/lib/utils';

type OrgMemberish = { user_id: string; is_active: boolean; profile?: { full_name: string; avatar_url?: string | null } };

const PREFERENCE_LABEL: Record<FamilyPreference, string> = {
  junto: 'Servir junto',
  separado: 'Servir separado',
  indiferente: 'Indiferente',
};
const PREFERENCE_HINT: Record<FamilyPreference, string> = {
  junto: 'Ao escalar um dos dois, sugerimos escalar o outro também.',
  separado: 'Avisamos quem escala se os dois acabarem no mesmo evento.',
  indiferente: 'Não fazemos nenhum aviso especial.',
};

function PreferencePicker({ value, onChange, disabled }: { value: FamilyPreference; onChange: (v: FamilyPreference) => void; disabled?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      {(['junto', 'separado', 'indiferente'] as FamilyPreference[]).map((p) => (
        <button
          key={p}
          type="button"
          disabled={disabled}
          onClick={() => onChange(p)}
          style={{
            padding: '0.4rem 0.8rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 600,
            cursor: disabled ? 'default' : 'pointer',
            background: value === p ? 'var(--wis-blue-soft)' : 'var(--wis-surface-3)',
            color: value === p ? 'var(--wis-blue)' : 'var(--wis-text-2)',
            border: `1px solid ${value === p ? 'var(--wis-blue-border)' : 'var(--wis-border-strong)'}`,
          }}
        >
          {PREFERENCE_LABEL[p]}
        </button>
      ))}
    </div>
  );
}

export function FamilySection({ orgId }: { orgId: string }) {
  const { user } = useAuthStore();
  const { data: relationships = [], isLoading } = useMyFamilyRelationships(orgId);
  const { data: rawMembers = [] } = useOrgMembers();
  const members = rawMembers as unknown as OrgMemberish[];

  const propose = useProposeFamilyRelationship(orgId);
  const respond = useRespondToFamilyRelationship(orgId);
  const update = useUpdateFamilyRelationship(orgId);
  const remove = useRemoveFamilyRelationship(orgId);

  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [pickedUserId, setPickedUserId] = useState<string | null>(null);
  const [newPreference, setNewPreference] = useState<FamilyPreference>('junto');

  const existingIds = new Set(relationships.map((r) => r.otherUserId));
  const pickableMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members
      .filter((m) => m.is_active && m.user_id !== user?.id && !existingIds.has(m.user_id))
      .filter((m) => !q || (m.profile?.full_name ?? '').toLowerCase().includes(q))
      .slice(0, 30);
  }, [members, search, user?.id, existingIds]);

  async function handlePropose() {
    if (!pickedUserId) return;
    try {
      await propose.mutateAsync({ otherUserId: pickedUserId, preference: newPreference });
      toast.success('Preferência enviada — a aguardar confirmação.');
      setAddOpen(false);
      setPickedUserId(null);
      setSearch('');
      setNewPreference('junto');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao enviar');
    }
  }

  const pending = relationships.filter((r) => r.status === 'pending');
  const accepted = relationships.filter((r) => r.status === 'accepted');

  return (
    <div className="space-y-4">
      <p style={{ fontSize: '0.82rem', color: 'var(--wis-text-2)', lineHeight: 1.6 }}>
        Diz, pessoa a pessoa, se preferem ser escalados juntos, separados, ou se é
        indiferente — dá para ter preferências diferentes com pessoas diferentes
        (ex.: junto com a tua filha, separado da tua esposa).
      </p>

      {isLoading ? (
        <p style={{ fontSize: '0.82rem', color: 'var(--wis-text-3)' }}>A carregar…</p>
      ) : (
        <>
          {pending.filter((r) => !r.isRequester).length > 0 && (
            <div className="space-y-2">
              <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--wis-text-3)' }}>
                À tua espera
              </p>
              {pending.filter((r) => !r.isRequester).map((r) => (
                <div key={r.rowId} style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap',
                  background: 'var(--wis-blue-soft)', border: '1px solid var(--wis-blue-border)',
                  borderRadius: '0.75rem', padding: '0.6rem 0.85rem',
                }}>
                  <Avatar className="h-8 w-8 shrink-0">
                    {r.otherAvatarUrl && <AvatarImage src={r.otherAvatarUrl} alt={r.otherName} />}
                    <AvatarFallback className="text-xs" style={{ background: 'var(--wis-surface-4)', color: 'var(--wis-text)' }}>{getInitials(r.otherName)}</AvatarFallback>
                  </Avatar>
                  <p style={{ flex: 1, fontSize: '0.85rem', color: 'var(--wis-text)', minWidth: '10rem' }}>
                    <strong>{r.otherName}</strong> propôs: <strong>{PREFERENCE_LABEL[r.preference]}</strong>
                  </p>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <Button size="sm" disabled={respond.isPending} onClick={async () => {
                      try { await respond.mutateAsync({ rowId: r.rowId, accept: true }); toast.success('Confirmado'); }
                      catch (e) { toast.error(e instanceof Error ? e.message : 'Erro'); }
                    }}>
                      <Check className="h-3.5 w-3.5" /> Aceitar
                    </Button>
                    <Button size="sm" variant="outline" disabled={respond.isPending} onClick={async () => {
                      try { await respond.mutateAsync({ rowId: r.rowId, accept: false }); toast.success('Recusado'); }
                      catch (e) { toast.error(e instanceof Error ? e.message : 'Erro'); }
                    }}>
                      <X className="h-3.5 w-3.5" /> Recusar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(accepted.length > 0 || pending.some((r) => r.isRequester)) && (
            <div className="space-y-2">
              <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--wis-text-3)' }}>
                Minhas preferências
              </p>
              {[...accepted, ...pending.filter((r) => r.isRequester)].map((r) => (
                <div key={r.rowId} style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap',
                  padding: '0.6rem 0.1rem', borderBottom: '1px solid var(--wis-border)',
                }}>
                  <Avatar className="h-8 w-8 shrink-0">
                    {r.otherAvatarUrl && <AvatarImage src={r.otherAvatarUrl} alt={r.otherName} />}
                    <AvatarFallback className="text-xs" style={{ background: 'var(--wis-surface-4)', color: 'var(--wis-text)' }}>{getInitials(r.otherName)}</AvatarFallback>
                  </Avatar>
                  <p style={{ fontSize: '0.85rem', color: 'var(--wis-text)', minWidth: '8rem' }}>{r.otherName}</p>
                  <div style={{ flex: 1, minWidth: '12rem' }}>
                    <PreferencePicker
                      value={r.preference}
                      disabled={update.isPending}
                      onChange={async (p) => {
                        try { await update.mutateAsync({ rowId: r.rowId, preference: p }); toast.success('Enviado para reconfirmação'); }
                        catch (e) { toast.error(e instanceof Error ? e.message : 'Erro'); }
                      }}
                    />
                  </div>
                  {r.status === 'pending' && (
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--wis-warning)', background: 'var(--wis-warning-bg)', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>
                      Por confirmar
                    </span>
                  )}
                  <button
                    type="button"
                    title="Remover"
                    disabled={remove.isPending}
                    onClick={async () => {
                      try { await remove.mutateAsync(r.rowId); toast.success('Removido'); }
                      catch (e) { toast.error(e instanceof Error ? e.message : 'Erro'); }
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--wis-text-4)', padding: '0.2rem' }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <button type="button" className="dark-primary-btn" onClick={() => setAddOpen(true)}>
        <Plus className="h-4 w-4" /> Adicionar familiar
      </button>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar familiar</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--wis-text-2)', marginBottom: '0.5rem' }}>Quem?</p>
              <Input placeholder="Procurar pessoa…" value={search} onChange={(e) => setSearch(e.target.value)} className="dark-inputs" style={{ marginBottom: '0.5rem' }} />
              <div style={{ maxHeight: '12rem', overflowY: 'auto', border: '1px solid var(--wis-border)', borderRadius: '0.625rem' }}>
                {pickableMembers.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--wis-text-3)', padding: '0.75rem' }}>Ninguém encontrado.</p>
                ) : pickableMembers.map((m) => (
                  <label key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.75rem', cursor: 'pointer', borderBottom: '1px solid var(--wis-border)', background: pickedUserId === m.user_id ? 'var(--wis-blue-soft)' : 'transparent' }}>
                    <input type="radio" name="family-pick" checked={pickedUserId === m.user_id} onChange={() => setPickedUserId(m.user_id)} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--wis-text)' }}>{m.profile?.full_name ?? 'Sem nome'}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--wis-text-2)', marginBottom: '0.5rem' }}>Preferência</p>
              <PreferencePicker value={newPreference} onChange={setNewPreference} />
              <p style={{ fontSize: '0.72rem', color: 'var(--wis-text-3)', marginTop: '0.4rem' }}>{PREFERENCE_HINT[newPreference]}</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancelar</Button>
            <button type="button" className="dark-primary-btn" disabled={!pickedUserId || propose.isPending} onClick={handlePropose}>
              {propose.isPending ? 'A enviar…' : 'Enviar'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
