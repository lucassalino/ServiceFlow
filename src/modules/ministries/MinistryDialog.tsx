'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useMinistryMembers } from '@/hooks/useMembers';
import { useOrgMembers } from '@/hooks/useMembers';
import { upsertMinistryMembersAction } from '@/actions/members';
import { MEMBER_FUNCTIONS } from '@/lib/constants';
import type { Ministry } from '@/types/models';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

type MinistryMemberEntry = { userId: string; functions: string[] };
type OrgMemberWithProfile = {
  user_id: string; is_active: boolean;
  profile: { full_name: string; email: string; avatar_url: string | null };
};

interface Props {
  orgId: string;
  ministry: Ministry | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function MinistryDialog({ ministry, open, onOpenChange }: Props) {
  const { data: orgMembers = [] } = useOrgMembers();
  const { data: existingMinistryMembersData } = useMinistryMembers(ministry?.id ?? null);
  const [members, setMembers] = useState<MinistryMemberEntry[]>([]);
  const [saving, setSaving] = useState(false);

  // Load existing members when dialog opens
  useEffect(() => {
    if (!open || !existingMinistryMembersData) return;
    setMembers(existingMinistryMembersData.map((m) => ({ userId: m.user_id, functions: m.functions })));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ministry?.id, existingMinistryMembersData]);

  // Clear when closed
  useEffect(() => { if (!open) setMembers([]); }, [open]);

  function isSelected(userId: string) { return members.some((m) => m.userId === userId); }
  function getFns(userId: string) { return members.find((m) => m.userId === userId)?.functions ?? []; }

  function toggleMember(userId: string) {
    setMembers((prev) =>
      prev.some((m) => m.userId === userId)
        ? prev.filter((m) => m.userId !== userId)
        : [...prev, { userId, functions: [] }],
    );
  }

  function toggleFn(userId: string, fn: string) {
    setMembers((prev) => prev.map((m) => {
      if (m.userId !== userId) return m;
      const has = m.functions.includes(fn);
      return { ...m, functions: has ? m.functions.filter((f) => f !== fn) : [...m.functions, fn] };
    }));
  }

  // Functions available in this ministry (from ministry.functions catalog)
  const availableFunctions = ministry?.functions?.length
    ? MEMBER_FUNCTIONS.filter((f) => ministry.functions.includes(f.key))
    : MEMBER_FUNCTIONS;

  async function handleSave() {
    if (!ministry) return;
    setSaving(true);
    try {
      await upsertMinistryMembersAction(ministry.id, members);
      toast.success('Membros actualizados');
      onOpenChange(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao guardar');
    } finally {
      setSaving(false);
    }
  }

  const activeMembers = (orgMembers as unknown as OrgMemberWithProfile[]).filter((m) => m.is_active);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {ministry && <span>{ministry.icon}</span>}
            {ministry?.name ?? 'Ministério'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">Seleciona os membros e as funções de cada um.</p>
        </DialogHeader>

        <div className="space-y-3">
          <Label>Membros</Label>
          {activeMembers.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sem membros na organização.</p>
          ) : (
            <ScrollArea className="max-h-[50vh] rounded-md border">
              <div className="p-2 space-y-0.5">
                {activeMembers.map((member) => {
                  const name = member.profile?.full_name || member.profile?.email || '?';
                  const selected = isSelected(member.user_id);
                  const fns = getFns(member.user_id);

                  return (
                    <div key={member.user_id}>
                      <label className="flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer hover:bg-accent">
                        <Checkbox checked={selected} onCheckedChange={() => toggleMember(member.user_id)} />
                        <Avatar className="h-7 w-7 flex-shrink-0">
                          {member.profile?.avatar_url && <AvatarImage src={member.profile.avatar_url} />}
                          <AvatarFallback className="text-[10px]">{getInitials(name)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm flex-1 truncate">{name}</span>
                        {selected && fns.length > 0 && (
                          <span className="text-xs text-muted-foreground shrink-0">{fns.length} função{fns.length !== 1 ? 'ões' : ''}</span>
                        )}
                      </label>

                      {selected && availableFunctions.length > 0 && (
                        <div className="ml-8 pb-1 grid grid-cols-2 gap-0.5">
                          {availableFunctions.map((f) => (
                            <label key={f.key}
                              className="flex items-center gap-1.5 px-2 py-1.5 text-xs cursor-pointer rounded hover:bg-accent">
                              <Checkbox
                                checked={fns.includes(f.key)}
                                onCheckedChange={() => toggleFn(member.user_id, f.key)}
                              />
                              <span>{f.emoji} {f.label}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'A guardar…' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
