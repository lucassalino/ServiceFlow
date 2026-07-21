'use client';

import { useState } from 'react';
import { Copy, Plus, Trash2, Check, Users, Share2, Mail, X } from 'lucide-react';
import { toast } from 'sonner';
import { useOrgStore } from '@/stores/orgStore';
import { useOrgMembers, useUpdateMemberRole, useDeleteMember } from '@/hooks/useMembers';
import { usePendingInvites, useCreateInvite, useDeleteInvite } from '@/hooks/useInvites';
import type { OrganizationMember, OrgRole } from '@/types/models';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { getInitials } from '@/lib/utils';
import { MemberDetailPanel } from './MemberDetailPanel';

import { APP_URL } from '@/lib/app-url';

type MemberWithProfile = OrganizationMember & {
  profile: { full_name: string; email: string; avatar_url: string | null };
};

const ROLE_LABEL: Record<OrgRole, string> = {
  admin: 'Administrador',
  leader: 'Líder',
  member: 'Membro',
};

const ROLE_COLOR: Record<OrgRole, string> = {
  admin:  'rgba(196,181,253,0.18)',
  leader: 'rgba(147,197,253,0.15)',
  member: 'rgba(255,255,255,0.07)',
};

const ROLE_TEXT: Record<OrgRole, string> = {
  admin:  '#c4b5fd',
  leader: '#93c5fd',
  member: 'rgba(255,255,255,0.45)',
};

function RoleBadge({ role }: { role: OrgRole }) {
  return (
    <span style={{
      fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.55rem',
      borderRadius: '9999px', letterSpacing: '0.04em',
      background: ROLE_COLOR[role], color: ROLE_TEXT[role],
      border: `1px solid ${ROLE_TEXT[role]}44`,
    }}>
      {ROLE_LABEL[role]}
    </span>
  );
}

export function MembersClient() {
  const { activeOrg, activeMembership } = useOrgStore();
  const { data: members = [], isLoading } = useOrgMembers();
  const updateRole = useUpdateMemberRole();
  const deleteMember = useDeleteMember();

  const currentRole = activeMembership?.role ?? 'member';
  const currentUserId = activeMembership?.user_id;
  const isAdmin = currentRole === 'admin';

  function canManage(_targetRole: OrgRole, targetUserId: string): boolean {
    if (!isAdmin) return false;
    if (currentUserId === targetUserId) return false;
    return true;
  }

  const [inviteOpen, setInviteOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Convites por nome + email
  const { data: pendingInvites = [] } = usePendingInvites(activeOrg?.id, isAdmin || inviteOpen);
  const createInvite = useCreateInvite();
  const deleteInvite = useDeleteInvite();
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');

  const [removeTarget, setRemoveTarget] = useState<MemberWithProfile | null>(null);
  const [detailMember, setDetailMember] = useState<MemberWithProfile | null>(null);

  async function handleSendInvite() {
    if (!activeOrg?.id) return;
    const nome = inviteName.trim();
    const email = inviteEmail.trim();
    if (!nome) {
      toast.error('Escreve o nome da pessoa');
      return;
    }
    if (!email) {
      toast.error('Escreve o email da pessoa');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Email inválido');
      return;
    }
    try {
      const res = await createInvite.mutateAsync({ orgId: activeOrg.id, name: inviteName, email: inviteEmail });
      if (res.alreadyRegistered) {
        if (res.emailSent) {
          toast.success(`${inviteName.trim()} já tem conta — enviámos um email para entrar direto na organização.`);
        } else {
          toast.success(`${inviteName.trim()} já tem conta — entra automaticamente na próxima vez que abrir a app.`);
        }
      } else if (res.emailSent) {
        toast.success(`Convite enviado por email para ${inviteEmail.trim()}`);
      } else {
        toast.message('Convite criado. Partilha o código com a pessoa (o email não pôde ser enviado).');
      }
      setInviteName('');
      setInviteEmail('');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao criar convite');
    }
  }

  async function handleCancelInvite(inviteId: string) {
    if (!activeOrg?.id) return;
    try {
      await deleteInvite.mutateAsync({ orgId: activeOrg.id, inviteId });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao cancelar');
    }
  }

  // Copiar — Clipboard API.
  function copiarCodigo() {
    const codigo = activeOrg?.invite_code;
    if (!codigo) return;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(codigo)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          toast.success('Código copiado: ' + codigo);
        })
        .catch(() => toast.message('Código: ' + codigo));
    } else {
      toast.message('Código: ' + codigo);
    }
  }

  // Partilhar — Web Share API nativa (móvel abre o menu do sistema); desktop/sem suporte → copia.
  function partilharCodigo() {
    const codigo = activeOrg?.invite_code;
    const nome = activeOrg?.name ?? 'a nossa organização';
    if (!codigo) return;
    if (navigator.share) {
      navigator.share({
        title: 'WIS - Services — ' + nome,
        text: `Entra na organização "${nome}" no WIS - Services!\n\nUsa o código: ${codigo}\n\nAbre a app em: ${APP_URL}`,
      }).catch(() => {});
    } else {
      copiarCodigo();
    }
  }

  async function handleRoleChange(member: MemberWithProfile, role: OrgRole) {
    try {
      await updateRole.mutateAsync({ memberId: member.id, role });
      toast.success('Papel actualizado');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro');
    }
  }

  async function confirmRemove() {
    if (!removeTarget) return;
    try {
      await deleteMember.mutateAsync(removeTarget.id);
      toast.success(`${removeTarget.profile.full_name} removido da organização`);
      setRemoveTarget(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro');
    }
  }

  const typedMembers = members as unknown as MemberWithProfile[];
  const active = typedMembers.filter((m) => m.is_active);
  const inactive = typedMembers.filter((m) => !m.is_active);

  /* ── Detail panel ──────────────────────────────────────────────────────── */
  if (detailMember) {
    return (
      <MemberDetailPanel
        member={detailMember}
        isAdmin={isAdmin}
        onBack={() => setDetailMember(null)}
      />
    );
  }

  return (
    <div className="dash-purple-bg">
      <div className="p-5 md:p-8 space-y-6">

        {/* ── Header ──────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 pt-2">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] uppercase"
              style={{ color: 'rgba(255,255,255,0.4)' }}>
              Organização
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mt-1">
              Pessoas
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {typedMembers.length > 0
                ? `${active.length} activo${active.length !== 1 ? 's' : ''} · ${inactive.length} inactivo${inactive.length !== 1 ? 's' : ''}`
                : 'Membros da organização'}
            </p>
          </div>
          {isAdmin && (
            <button onClick={() => setInviteOpen(true)} className="dark-primary-btn">
              <Plus className="h-4 w-4" />
              Convidar
            </button>
          )}
        </div>

        {/* ── List ────────────────────────────────────── */}
        {isLoading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-[4.5rem] animate-pulse rounded-xl"
                style={{ background: 'rgba(255,255,255,0.05)' }} />
            ))}
          </div>
        ) : typedMembers.length === 0 ? (
          <div className="events-dark-empty">
            <Users className="h-10 w-10 mb-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Nenhum membro encontrado.
            </p>
            <button onClick={() => setInviteOpen(true)} className="dark-primary-btn mt-4">
              <Plus className="h-4 w-4" /> Convidar primeiro membro
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {typedMembers.map((member) => {
              const profile = member.profile;
              const name = profile?.full_name ?? (isAdmin ? profile?.email : undefined) ?? '?';
              const role = member.role as OrgRole;

              return (
                <div
                  key={member.id}
                  className="events-dark-card"
                  onClick={() => setDetailMember(member)}
                  style={{
                    opacity: member.is_active ? 1 : 0.5,
                    cursor: 'pointer',
                  }}
                >
                  {/* Avatar */}
                  <Avatar className="h-10 w-10 shrink-0">
                    {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={name} />}
                    <AvatarFallback className="text-sm font-semibold"
                      style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}>
                      {getInitials(name)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-white truncate">{name}</span>
                      <RoleBadge role={role} />
                      {!member.is_active && (
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.55rem',
                          borderRadius: '9999px',
                          background: 'rgba(239,68,68,0.12)', color: '#f87171',
                          border: '1px solid rgba(248,113,113,0.25)',
                        }}>
                          Inactivo
                        </span>
                      )}
                    </div>
                    {isAdmin && (
                      <p className="text-xs mt-0.5 truncate"
                        style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {profile?.email}
                      </p>
                    )}
                  </div>

                  {/* Role selector + deactivate */}
                  <div className="flex items-center gap-2 flex-shrink-0 dark-inputs" onClick={(e) => e.stopPropagation()}>
                    {canManage(role, member.user_id) ? (
                      <Select value={role} onValueChange={(v) => handleRoleChange(member, v as OrgRole)}>
                        <SelectTrigger className="h-8 w-36 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="leader">Líder</SelectItem>
                          <SelectItem value="member">Membro</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-xs w-32 text-center"
                        style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {ROLE_LABEL[role]}
                      </span>
                    )}

                    {canManage(role, member.user_id) && (
                      <button
                        className="dark-icon-btn danger"
                        onClick={() => setRemoveTarget(member)}
                        title="Remover membro"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Convites pendentes ─────────────────────── */}
        {isAdmin && pendingInvites.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 pt-2">
              <Mail className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
              <p className="text-xs font-semibold tracking-[0.16em] uppercase"
                style={{ color: 'rgba(255,255,255,0.4)' }}>
                Convites pendentes ({pendingInvites.length})
              </p>
            </div>
            {pendingInvites.map((inv) => (
              <div key={inv.id} className="events-dark-card" style={{ cursor: 'default' }}>
                <div className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(252,211,77,0.12)', border: '1px solid rgba(252,211,77,0.25)' }}>
                  <Mail className="h-4 w-4" style={{ color: '#fcd34d' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-white truncate">{inv.name}</span>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.55rem',
                      borderRadius: '9999px',
                      background: 'rgba(252,211,77,0.12)', color: '#fcd34d',
                      border: '1px solid rgba(252,211,77,0.25)',
                    }}>
                      Aguarda entrada
                    </span>
                  </div>
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {inv.email}
                  </p>
                </div>
                <button
                  className="dark-icon-btn danger shrink-0"
                  onClick={() => handleCancelInvite(inv.id)}
                  disabled={deleteInvite.isPending}
                  title="Cancelar convite"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ── Invite dialog ──────────────────────────── */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Convidar Membro</DialogTitle>
          </DialogHeader>

          {/* Convidar por nome + email */}
          <div className="dark-inputs space-y-3">
            <p className="text-[11px] font-semibold tracking-[0.16em] uppercase"
              style={{ color: 'rgba(255,255,255,0.4)' }}>
              Convidar por email
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="inv-name">Nome</Label>
              <Input id="inv-name" placeholder="Nome da pessoa"
                value={inviteName} onChange={(e) => setInviteName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-email">Email</Label>
              <Input id="inv-email" type="email" placeholder="email@exemplo.com"
                value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSendInvite(); } }} />
            </div>
            <Button onClick={handleSendInvite}
              disabled={createInvite.isPending || !inviteName.trim() || !inviteEmail.trim()}
              className="w-full gap-2 h-11">
              <Mail className="h-4 w-4" />
              {createInvite.isPending ? 'A convidar…' : 'Convidar'}
            </Button>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
              É enviado um email de convite. Ao aceitar e definir a password, a pessoa entra
              automaticamente na organização e o nome fica guardado.
            </p>

            {pendingInvites.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-[11px] font-semibold tracking-[0.16em] uppercase"
                  style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Convites pendentes ({pendingInvites.length})
                </p>
                {pendingInvites.map((inv) => (
                  <div key={inv.id} className="flex items-center gap-2 rounded-lg px-3 py-2"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{inv.name}</p>
                      <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{inv.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCancelInvite(inv.id)}
                      aria-label="Cancelar convite"
                      className="dark-icon-btn danger"
                      disabled={deleteInvite.isPending}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '0.25rem 0' }} />

          <div>
            <p className="text-[11px] font-semibold tracking-[0.16em] uppercase mb-1.5"
              style={{ color: 'rgba(255,255,255,0.4)' }}>
              Ou partilha o código
            </p>
            <p className="text-2xl font-bold font-mono tracking-[0.12em] text-white mb-4">
              {activeOrg?.invite_code ?? '—'}
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <Button variant="outline" onClick={copiarCodigo} className="gap-2 h-11">
                {copied
                  ? <Check className="h-4 w-4 text-green-500" />
                  : <Copy className="h-4 w-4" />}
                {copied ? 'Copiado' : 'Copiar'}
              </Button>
              <Button variant="outline" onClick={partilharCodigo} className="gap-2 h-11">
                <Share2 className="h-4 w-4" />
                Partilhar
              </Button>
            </div>

            <p className="text-xs mt-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Partilha o código ou o link de convite para adicionar pessoas.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Remove dialog ──────────────────────────── */}
      <AlertDialog open={!!removeTarget} onOpenChange={(v) => { if (!v) setRemoveTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover membro?</AlertDialogTitle>
            <AlertDialogDescription>
              Tens a certeza que queres remover{' '}
              <strong>{removeTarget?.profile?.full_name}</strong> da organização?
              Esta acção é permanente e remove também as suas participações em
              ministérios e escalas. A conta pessoal não é afectada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmRemove}
              disabled={deleteMember.isPending}
            >
              {deleteMember.isPending ? 'A remover…' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
