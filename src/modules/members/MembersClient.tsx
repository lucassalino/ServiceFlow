'use client';

import { useState } from 'react';
import { Copy, Plus, UserX, Check, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useOrgStore } from '@/stores/orgStore';
import { useOrgMembers, useUpdateMemberRole, useToggleMemberActive } from '@/hooks/useMembers';
import type { OrganizationMember, OrgRole } from '@/types/models';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { getInitials } from '@/lib/utils';

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
  const toggleActive = useToggleMemberActive();

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
  const [deactivateTarget, setDeactivateTarget] = useState<MemberWithProfile | null>(null);

  function handleCopyCode() {
    const code = activeOrg?.invite_code;
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Código copiado!');
    });
  }

  async function handleRoleChange(member: MemberWithProfile, role: OrgRole) {
    try {
      await updateRole.mutateAsync({ memberId: member.id, role });
      toast.success('Papel actualizado');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro');
    }
  }

  async function confirmDeactivate() {
    if (!deactivateTarget) return;
    try {
      await toggleActive.mutateAsync({ memberId: deactivateTarget.id, isActive: false });
      toast.success(`${deactivateTarget.profile.full_name} desactivado`);
      setDeactivateTarget(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro');
    }
  }

  const typedMembers = members as unknown as MemberWithProfile[];
  const active = typedMembers.filter((m) => m.is_active);
  const inactive = typedMembers.filter((m) => !m.is_active);

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
              const name = profile?.full_name ?? profile?.email ?? '?';
              const role = member.role as OrgRole;

              return (
                <div
                  key={member.id}
                  className="events-dark-card"
                  style={{
                    opacity: member.is_active ? 1 : 0.5,
                    cursor: 'default',
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
                    <p className="text-xs mt-0.5 truncate"
                      style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {profile?.email}
                    </p>
                  </div>

                  {/* Role selector + deactivate */}
                  <div className="flex items-center gap-2 flex-shrink-0 dark-inputs">
                    {canManage(role, member.user_id) ? (
                      <Select value={role} onValueChange={(v) => handleRoleChange(member, v as OrgRole)}>
                        <SelectTrigger className="h-8 w-36 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
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

                    {member.is_active && canManage(role, member.user_id) && (
                      <button
                        className="dark-icon-btn danger"
                        onClick={() => setDeactivateTarget(member)}
                        title="Desactivar membro"
                      >
                        <UserX className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ── Invite dialog ──────────────────────────── */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Convidar Membro</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Código de convite</Label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={activeOrg?.invite_code ?? ''}
                className="font-mono tracking-widest"
              />
              <Button variant="outline" size="icon" onClick={handleCopyCode}>
                {copied
                  ? <Check className="h-4 w-4 text-green-600" />
                  : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Partilha este código para convidar pessoas
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Deactivate dialog ──────────────────────── */}
      <AlertDialog open={!!deactivateTarget} onOpenChange={(v) => { if (!v) setDeactivateTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desactivar membro?</AlertDialogTitle>
            <AlertDialogDescription>
              Tens a certeza que queres desactivar{' '}
              <strong>{deactivateTarget?.profile?.full_name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDeactivate}
              disabled={toggleActive.isPending}
            >
              {toggleActive.isPending ? 'A desactivar…' : 'Desactivar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
