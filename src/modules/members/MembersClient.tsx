'use client';

import { useState } from 'react';
import { Copy, Plus, UserX, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useOrgStore } from '@/stores/orgStore';
import { useOrgMembers, useUpdateMemberRole, useToggleMemberActive } from '@/hooks/useMembers';
import type { OrganizationMember, OrgRole } from '@/types/models';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getInitials } from '@/lib/utils';


type MemberWithProfile = OrganizationMember & { profile: { full_name: string; email: string; avatar_url: string | null } };

export function MembersClient() {
  const { activeOrg } = useOrgStore();
  const { data: members = [], isLoading } = useOrgMembers();
  const updateRole = useUpdateMemberRole();
  const toggleActive = useToggleMemberActive();

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pessoas</h1>
        <Button onClick={() => setInviteOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Convidar
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg border bg-muted" />
          ))}
        </div>
      ) : typedMembers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">Nenhum membro encontrado.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {typedMembers.map((member) => {
            const profile = member.profile;
            const name = profile?.full_name ?? profile?.email ?? '?';
            const role = member.role as OrgRole;
            return (
              <div key={member.id} className={`flex items-center gap-4 rounded-lg border bg-card p-4 ${!member.is_active ? 'opacity-60' : ''}`}>
                <Avatar className="h-10 w-10 shrink-0">
                  {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={name} />}
                  <AvatarFallback>{getInitials(name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{name}</p>
                  <p className="text-sm text-muted-foreground truncate">{profile?.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!member.is_active && <Badge variant="outline" className="text-xs">Inativo</Badge>}
                  <Select value={role} onValueChange={(v) => handleRoleChange(member, v as OrgRole)}>
                    <SelectTrigger className="h-8 w-32 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="leader">Líder</SelectItem>
                      <SelectItem value="member">Membro</SelectItem>
                    </SelectContent>
                  </Select>
                  {member.is_active && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeactivateTarget(member)}>
                      <UserX className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Convidar Membro</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Código de convite</Label>
            <div className="flex items-center gap-2">
              <Input readOnly value={activeOrg?.invite_code ?? ''} className="font-mono tracking-widest" />
              <Button variant="outline" size="icon" onClick={handleCopyCode}>
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Partilha este código para convidar pessoas</p>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deactivateTarget} onOpenChange={(v) => { if (!v) setDeactivateTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desactivar membro?</AlertDialogTitle>
            <AlertDialogDescription>
              Tens a certeza que queres desactivar <strong>{deactivateTarget?.profile?.full_name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirmDeactivate} disabled={toggleActive.isPending}>
              {toggleActive.isPending ? 'A desactivar…' : 'Desactivar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
