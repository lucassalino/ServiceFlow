'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Plus, X, Check, Users } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useOrgMembers } from '@/hooks/useMembers';
import {
  useMyFamily, useCreateFamily, useAddFamilyMember, useRespondToFamilyInvite,
  useRemoveFamilyMember, useUpdateFamilyPreference, useDisbandFamily,
} from '@/hooks/useFamily';
import type { FamilyPreference } from '@/actions/families';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
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
  junto: 'Ao escalar um de vocês, sugerimos escalar os outros também.',
  separado: 'Avisamos quem escala se vocês acabarem no mesmo evento.',
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

function MemberRow({ name, avatarUrl, right }: { name: string; avatarUrl?: string | null; right?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0' }}>
      <Avatar className="h-8 w-8 shrink-0">
        {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
        <AvatarFallback className="text-xs" style={{ background: 'var(--wis-surface-4)', color: 'var(--wis-text)' }}>
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      <p style={{ flex: 1, fontSize: '0.85rem', color: 'var(--wis-text)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {name}
      </p>
      {right}
    </div>
  );
}

export function FamilySection({ orgId }: { orgId: string }) {
  const { user } = useAuthStore();
  const { data: family, isLoading } = useMyFamily(orgId);
  const { data: rawMembers = [] } = useOrgMembers();
  const members = rawMembers as unknown as OrgMemberish[];

  const createFamily = useCreateFamily(orgId);
  const addMember = useAddFamilyMember(orgId);
  const respond = useRespondToFamilyInvite(orgId);
  const removeMember = useRemoveFamilyMember(orgId);
  const updatePreference = useUpdateFamilyPreference(orgId);
  const disband = useDisbandFamily(orgId);

  const [createOpen, setCreateOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [newPreference, setNewPreference] = useState<FamilyPreference>('junto');

  const existingIds = new Set(family?.members.map((m) => m.userId) ?? []);
  const pickableMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members
      .filter((m) => m.is_active && m.user_id !== user?.id && !existingIds.has(m.user_id))
      .filter((m) => !q || (m.profile?.full_name ?? '').toLowerCase().includes(q))
      .slice(0, 30);
  }, [members, search, user?.id, existingIds]);

  function toggleSelected(userId: string) {
    setSelectedIds((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
  }

  async function handleCreate() {
    try {
      await createFamily.mutateAsync({ preference: newPreference, memberUserIds: selectedIds });
      toast.success('Família criada — a aguardar confirmação de quem convidaste.');
      setCreateOpen(false);
      setSelectedIds([]);
      setSearch('');
      setNewPreference('junto');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao criar família');
    }
  }

  async function handleAddSelected() {
    if (!family) return;
    try {
      for (const userId of selectedIds) {
        // eslint-disable-next-line no-await-in-loop
        await addMember.mutateAsync({ familyId: family.id, userId });
      }
      toast.success('Convite enviado.');
      setAddOpen(false);
      setSelectedIds([]);
      setSearch('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao convidar');
    }
  }

  if (isLoading) {
    return <p style={{ fontSize: '0.82rem', color: 'var(--wis-text-3)' }}>A carregar…</p>;
  }

  const me = family?.members.find((m) => m.isMe);

  // ── Sem família ainda ──────────────────────────────────────────────────
  if (!family) {
    return (
      <div className="space-y-3">
        <p style={{ fontSize: '0.82rem', color: 'var(--wis-text-2)', lineHeight: 1.6 }}>
          Adiciona quem da tua família também serve nesta organização e diz se
          preferem ser escalados juntos, separados, ou se é indiferente.
        </p>
        <button type="button" className="dark-primary-btn" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Criar família
        </button>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar família</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--wis-text-2)', marginBottom: '0.5rem' }}>Preferência</p>
                <PreferencePicker value={newPreference} onChange={setNewPreference} />
                <p style={{ fontSize: '0.72rem', color: 'var(--wis-text-3)', marginTop: '0.4rem' }}>{PREFERENCE_HINT[newPreference]}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--wis-text-2)', marginBottom: '0.5rem' }}>Quem é da família?</p>
                <Input placeholder="Procurar pessoa…" value={search} onChange={(e) => setSearch(e.target.value)} className="dark-inputs" style={{ marginBottom: '0.5rem' }} />
                <div style={{ maxHeight: '14rem', overflowY: 'auto', border: '1px solid var(--wis-border)', borderRadius: '0.625rem' }}>
                  {pickableMembers.length === 0 ? (
                    <p style={{ fontSize: '0.8rem', color: 'var(--wis-text-3)', padding: '0.75rem' }}>Ninguém encontrado.</p>
                  ) : pickableMembers.map((m) => (
                    <label key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.75rem', cursor: 'pointer', borderBottom: '1px solid var(--wis-border)' }}>
                      <Checkbox checked={selectedIds.includes(m.user_id)} onCheckedChange={() => toggleSelected(m.user_id)} />
                      <span style={{ fontSize: '0.85rem', color: 'var(--wis-text)' }}>{m.profile?.full_name ?? 'Sem nome'}</span>
                    </label>
                  ))}
                </div>
                {selectedIds.length > 0 && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--wis-text-3)', marginTop: '0.4rem' }}>{selectedIds.length} pessoa(s) selecionada(s) — vão receber um convite para confirmar.</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <button type="button" className="dark-primary-btn" disabled={selectedIds.length === 0 || createFamily.isPending} onClick={handleCreate}>
                {createFamily.isPending ? 'A criar…' : 'Criar e convidar'}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ── Convite pendente para mim ────────────────────────────────────────
  if (me?.status === 'pending') {
    const others = family.members.filter((m) => !m.isMe);
    return (
      <div style={{
        background: 'var(--wis-blue-soft)', border: '1px solid var(--wis-blue-border)',
        borderRadius: '0.875rem', padding: '1rem 1.1rem',
      }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--wis-text)', marginBottom: '0.5rem' }}>
          <strong>{family.myInvitedByName}</strong> convidou-te para uma família
          {others.length > 0 && <> com {others.map((o) => o.name).join(', ')}</>} —
          preferência: <strong>{PREFERENCE_LABEL[family.preference]}</strong>.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button" className="dark-primary-btn"
            disabled={respond.isPending}
            onClick={async () => {
              try { await respond.mutateAsync({ rowId: me.rowId, accept: true }); toast.success('Convite aceite'); }
              catch (e) { toast.error(e instanceof Error ? e.message : 'Erro'); }
            }}
          >
            <Check className="h-4 w-4" /> Aceitar
          </button>
          <Button
            type="button" variant="outline"
            disabled={respond.isPending}
            onClick={async () => {
              try { await respond.mutateAsync({ rowId: me.rowId, accept: false }); toast.success('Convite recusado'); }
              catch (e) { toast.error(e instanceof Error ? e.message : 'Erro'); }
            }}
          >
            <X className="h-4 w-4" /> Recusar
          </Button>
        </div>
      </div>
    );
  }

  // ── Já sou membro aceite ────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div>
        <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--wis-text-2)', marginBottom: '0.5rem' }}>Preferência</p>
        <PreferencePicker
          value={family.preference}
          disabled={!family.isCreator || updatePreference.isPending}
          onChange={async (p) => {
            try { await updatePreference.mutateAsync({ familyId: family.id, preference: p }); }
            catch (e) { toast.error(e instanceof Error ? e.message : 'Erro'); }
          }}
        />
        {!family.isCreator && (
          <p style={{ fontSize: '0.72rem', color: 'var(--wis-text-3)', marginTop: '0.4rem' }}>Só quem criou a família pode mudar a preferência.</p>
        )}
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--wis-text-2)' }}>
            <Users className="h-3.5 w-3.5" style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: '-2px' }} />
            Membros
          </p>
          {family.isCreator && (
            <button type="button" onClick={() => setAddOpen(true)} style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--wis-blue)', background: 'none', border: 'none', cursor: 'pointer' }}>
              + Adicionar
            </button>
          )}
        </div>
        <div>
          {family.members.map((m) => (
            <MemberRow
              key={m.rowId}
              name={m.isMe ? `${m.name} (tu)` : m.name}
              avatarUrl={m.avatarUrl}
              right={(
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {m.status === 'pending' && (
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--wis-warning)', background: 'var(--wis-warning-bg)', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>
                      Por confirmar
                    </span>
                  )}
                  {(m.isMe || family.isCreator) && (
                    <button
                      type="button"
                      title={m.isMe ? 'Sair da família' : 'Remover'}
                      disabled={removeMember.isPending}
                      onClick={async () => {
                        try {
                          await removeMember.mutateAsync(m.rowId);
                          toast.success(m.isMe ? 'Saíste da família' : 'Removido da família');
                        } catch (e) { toast.error(e instanceof Error ? e.message : 'Erro'); }
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--wis-text-4)', padding: '0.2rem' }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}
            />
          ))}
        </div>
      </div>

      {family.isCreator && (
        <button
          type="button"
          disabled={disband.isPending}
          onClick={async () => {
            try { await disband.mutateAsync(family.id); toast.success('Família desfeita'); }
            catch (e) { toast.error(e instanceof Error ? e.message : 'Erro'); }
          }}
          style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--wis-danger)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          Desfazer família
        </button>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar à família</DialogTitle></DialogHeader>
          <Input placeholder="Procurar pessoa…" value={search} onChange={(e) => setSearch(e.target.value)} className="dark-inputs" style={{ marginBottom: '0.5rem' }} />
          <div style={{ maxHeight: '14rem', overflowY: 'auto', border: '1px solid var(--wis-border)', borderRadius: '0.625rem' }}>
            {pickableMembers.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--wis-text-3)', padding: '0.75rem' }}>Ninguém encontrado.</p>
            ) : pickableMembers.map((m) => (
              <label key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.75rem', cursor: 'pointer', borderBottom: '1px solid var(--wis-border)' }}>
                <Checkbox checked={selectedIds.includes(m.user_id)} onCheckedChange={() => toggleSelected(m.user_id)} />
                <span style={{ fontSize: '0.85rem', color: 'var(--wis-text)' }}>{m.profile?.full_name ?? 'Sem nome'}</span>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancelar</Button>
            <button type="button" className="dark-primary-btn" disabled={selectedIds.length === 0 || addMember.isPending} onClick={handleAddSelected}>
              {addMember.isPending ? 'A convidar…' : 'Convidar'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
