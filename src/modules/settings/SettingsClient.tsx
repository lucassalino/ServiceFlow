'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Camera, LogOut, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useOrgStore } from '@/stores/orgStore';
import { useProfile, useUpdateProfile, useUploadAvatar, useDeleteAccount } from '@/hooks/useProfile';
import { useLeaveOrganization } from '@/hooks/useOrganizations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getInitials } from '@/lib/utils';

const profileSchema = z.object({
  full_name: z.string().min(1, 'Nome obrigatório'),
  phone: z.string().nullable().default(null),
});

const orgSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  logo_url: z.string().url('URL inválida').nullable().or(z.literal('')).default(null),
});

type ProfileData = z.infer<typeof profileSchema>;
type OrgData = z.infer<typeof orgSchema>;

interface Props { orgId: string }

const MAX_AVATAR_SIZE_MB = 2;

export function SettingsClient({ orgId }: Props) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { activeOrg, activeMembership } = useOrgStore();
  const isAdmin = activeMembership?.role === 'admin';

  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const leaveOrg = useLeaveOrganization();
  const deleteAccount = useDeleteAccount();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [leaveOrgOpen, setLeaveOrgOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);

  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema) as never,
    defaultValues: { full_name: '', phone: null },
  });

  const orgForm = useForm<OrgData>({
    resolver: zodResolver(orgSchema) as never,
    defaultValues: { name: '', logo_url: null },
  });

  useEffect(() => {
    if (profile) {
      profileForm.reset({ full_name: profile.full_name, phone: profile.phone });
    }
  }, [profile, profileForm]);

  useEffect(() => {
    if (activeOrg) {
      orgForm.reset({ name: activeOrg.name, logo_url: activeOrg.logo_url });
    }
  }, [activeOrg, orgForm]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Usa uma imagem JPEG, PNG ou WebP');
      return;
    }
    if (file.size > MAX_AVATAR_SIZE_MB * 1024 * 1024) {
      toast.error(`A imagem não pode exceder ${MAX_AVATAR_SIZE_MB}MB`);
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setAvatarPreview(localPreview);

    try {
      const avatarUrl = await uploadAvatar.mutateAsync(file);
      await updateProfile.mutateAsync({
        full_name: profileForm.getValues('full_name') || profile?.full_name || '',
        phone: profileForm.getValues('phone'),
        avatar_url: avatarUrl,
      });
      toast.success('Foto de perfil atualizada');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar foto');
    } finally {
      URL.revokeObjectURL(localPreview);
      setAvatarPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function onProfileSubmit(data: ProfileData) {
    try {
      await updateProfile.mutateAsync({
        full_name: data.full_name,
        phone: data.phone || null,
        avatar_url: profile?.avatar_url ?? null,
      });
      toast.success('Perfil atualizado');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar perfil');
    }
  }

  async function onOrgSubmit(data: OrgData) {
    const supabase = createClient();
    const { error } = await supabase.from('organizations').update({
      name: data.name,
      logo_url: data.logo_url || null,
      updated_at: new Date().toISOString(),
    }).eq('id', orgId);
    if (error) { toast.error(error.message); return; }
    toast.success('Organização atualizada');
  }

  async function handleLeaveOrg() {
    try {
      await leaveOrg.mutateAsync(orgId);
      toast.success('Saíste da organização');
      setLeaveOrgOpen(false);
      router.push('/');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao saír da organização');
      setLeaveOrgOpen(false);
    }
  }

  async function handleDeleteAccount() {
    try {
      await deleteAccount.mutateAsync();
      toast.success('Conta eliminada');
      router.push('/login');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao eliminar conta');
      setDeleteAccountOpen(false);
    }
  }

  const displayAvatar = avatarPreview ?? profile?.avatar_url ?? undefined;

  return (
    <div className="p-6 space-y-6 max-w-xl">
      <h1 className="text-2xl font-bold">Definições</h1>

      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-16 w-16">
                <AvatarImage src={displayAvatar} />
                <AvatarFallback className="text-base">
                  {getInitials(profile?.full_name || 'U')}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadAvatar.isPending}
                className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm hover:bg-accent transition-colors disabled:opacity-50"
                aria-label="Alterar foto de perfil"
              >
                <Camera className="h-3 w-3" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {uploadAvatar.isPending ? (
                <p>A enviar foto…</p>
              ) : (
                <>
                  <p>Toca no ícone para alterar a foto.</p>
                  <p>JPEG, PNG ou WebP, até {MAX_AVATAR_SIZE_MB}MB.</p>
                </>
              )}
            </div>
          </div>

          <Separator />

          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label>Email</Label>
              <Input value={user?.email ?? ''} disabled className="opacity-60" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="full_name">Nome completo</Label>
              <Input id="full_name" {...profileForm.register('full_name')} />
              {profileForm.formState.errors.full_name && (
                <p className="text-xs text-destructive">{profileForm.formState.errors.full_name.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">Telemóvel</Label>
              <Input id="phone" type="tel" {...profileForm.register('phone')} />
            </div>
            <Button type="submit" disabled={profileForm.formState.isSubmitting || updateProfile.isPending}>
              {updateProfile.isPending ? 'A guardar…' : 'Guardar perfil'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isAdmin && activeOrg && (
        <Card>
          <CardHeader>
            <CardTitle>Organização</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={orgForm.handleSubmit(onOrgSubmit)} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="org_name">Nome</Label>
                <Input id="org_name" {...orgForm.register('name')} />
                {orgForm.formState.errors.name && (
                  <p className="text-xs text-destructive">{orgForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="logo_url">URL do logótipo</Label>
                <Input id="logo_url" placeholder="https://…" {...orgForm.register('logo_url')} />
              </div>
              <Separator />
              <div className="space-y-1">
                <Label>Código de convite</Label>
                <div className="flex gap-2">
                  <Input value={activeOrg.invite_code} readOnly className="font-mono" />
                  <Button type="button" variant="outline" onClick={() => {
                    navigator.clipboard.writeText(activeOrg.invite_code);
                    toast.success('Código copiado');
                  }}>Copiar</Button>
                </div>
                <p className="text-xs text-muted-foreground">Partilha este código para convidar pessoas</p>
              </div>
              <Button type="submit" disabled={orgForm.formState.isSubmitting}>
                {orgForm.formState.isSubmitting ? 'A guardar…' : 'Guardar organização'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Esta organização</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Deixa de pertencer a {activeOrg?.name ?? 'esta organização'}. Podes voltar a entrar
            mais tarde com o código de convite.
          </p>
          <Button
            type="button"
            variant="outline"
            className="gap-2 text-destructive hover:text-destructive"
            onClick={() => setLeaveOrgOpen(true)}
          >
            <LogOut className="h-4 w-4" />
            Saír da organização
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Zona de perigo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Elimina permanentemente a tua conta e todos os dados associados (perfil,
            participação em organizações, escalas, notificações). Esta ação não pode ser desfeita.
          </p>
          <Button
            type="button"
            variant="destructive"
            className="gap-2"
            onClick={() => setDeleteAccountOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Eliminar conta
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={leaveOrgOpen} onOpenChange={setLeaveOrgOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Saír de {activeOrg?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Vais deixar de ter acesso aos eventos, escalas e músicas desta organização.
              Podes voltar a entrar com o código de convite.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleLeaveOrg}
              disabled={leaveOrg.isPending}
            >
              {leaveOrg.isPending ? 'A saír…' : 'Saír'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar a tua conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é permanente. O teu perfil, participação em todas as organizações,
              escalas e notificações serão eliminados e não podem ser recuperados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteAccount}
              disabled={deleteAccount.isPending}
            >
              {deleteAccount.isPending ? 'A eliminar…' : 'Eliminar definitivamente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
