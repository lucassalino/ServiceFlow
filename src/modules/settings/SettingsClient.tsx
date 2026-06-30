'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Camera, LogOut, Trash2, Copy, Check } from 'lucide-react';
import { ImageCropDialog } from '@/components/ui/image-crop-dialog';
import { ProfileCardDialog } from '@/components/ui/profile-card-dialog';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useOrgStore } from '@/stores/orgStore';
import { useProfile, useUpdateProfile, useUploadAvatar, useDeleteAccount } from '@/hooks/useProfile';
import { useLeaveOrganization } from '@/hooks/useOrganizations';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
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

function Section({ title, danger, children }: { title: string; danger?: boolean; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'rgba(22,22,26,0.85)',
      border: `1px solid ${danger ? 'rgba(239,68,68,0.22)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: '0.875rem',
      overflow: 'hidden',
      boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    }}>
      <div style={{
        padding: '0.9rem 1.25rem',
        borderBottom: `1px solid ${danger ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.07)'}`,
      }}>
        <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: danger ? '#f87171' : '#ffffff', letterSpacing: '0.01em' }}>
          {title}
        </h2>
      </div>
      <div style={{ padding: '1.25rem' }}>{children}</div>
    </div>
  );
}

function Divider() {
  return <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '1rem 0' }} />;
}

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
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [profileCardOpen, setProfileCardOpen] = useState(false);
  const [leaveOrgOpen, setLeaveOrgOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema) as never,
    defaultValues: { full_name: '', phone: null },
  });

  const orgForm = useForm<OrgData>({
    resolver: zodResolver(orgSchema) as never,
    defaultValues: { name: '', logo_url: null },
  });

  useEffect(() => {
    if (profile) profileForm.reset({ full_name: profile.full_name, phone: profile.phone });
  }, [profile, profileForm]);

  useEffect(() => {
    if (activeOrg) orgForm.reset({ name: activeOrg.name, logo_url: activeOrg.logo_url });
  }, [activeOrg, orgForm]);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
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
    setCropSrc(URL.createObjectURL(file));
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleCropConfirm(blob: Blob) {
    if (!cropSrc) return;
    URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    const preview = URL.createObjectURL(blob);
    setAvatarPreview(preview);
    try {
      const croppedFile = new File([blob], 'avatar.webp', { type: 'image/webp' });
      const avatarUrl = await uploadAvatar.mutateAsync(croppedFile);
      await updateProfile.mutateAsync({
        full_name: profileForm.getValues('full_name') || profile?.full_name || '',
        phone: profileForm.getValues('phone'),
        avatar_url: avatarUrl,
      });
      toast.success('Foto de perfil atualizada');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar foto');
    } finally {
      URL.revokeObjectURL(preview);
      setAvatarPreview(null);
    }
  }

  function handleCropCancel() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
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

  function handleCopyCode() {
    const code = activeOrg?.invite_code;
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
      toast.success('Código copiado!');
    });
  }

  const displayAvatar = avatarPreview ?? profile?.avatar_url ?? undefined;

  return (
    <div className="dash-purple-bg">
      <div className="p-5 md:p-8 max-w-2xl mx-auto space-y-5">

        {/* ── Header ──────────────────────────────────── */}
        <div className="pt-2">
          <p className="text-xs font-semibold tracking-[0.16em] uppercase"
            style={{ color: 'rgba(255,255,255,0.4)' }}>
            Conta
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mt-1">
            Definições
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Perfil e preferências da conta
          </p>
        </div>

        {/* ── Profile ─────────────────────────────────── */}
        <Section title="Perfil">
          {/* Avatar row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setProfileCardOpen(true)}
                disabled={uploadAvatar.isPending}
                style={{ borderRadius: '50%', border: 'none', background: 'none', cursor: 'pointer', padding: 0, opacity: uploadAvatar.isPending ? 0.5 : 1 }}
                aria-label="Ver foto de perfil"
              >
                <Avatar className="h-16 w-16">
                  <AvatarImage src={displayAvatar} />
                  <AvatarFallback className="text-base font-semibold"
                    style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)' }}>
                    {getInitials(profile?.full_name || 'U')}
                  </AvatarFallback>
                </Avatar>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadAvatar.isPending}
                aria-label="Alterar foto de perfil"
                style={{
                  position: 'absolute', bottom: '-2px', right: '-2px',
                  width: '1.5rem', height: '1.5rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '50%',
                  background: 'rgba(30,30,36,0.95)',
                  border: '1.5px solid rgba(255,255,255,0.18)',
                  cursor: 'pointer',
                  color: 'rgba(255,255,255,0.7)',
                }}
              >
                <Camera style={{ width: '0.7rem', height: '0.7rem' }} />
              </button>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                className="hidden" onChange={handleAvatarChange} />
            </div>
            <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.38)', lineHeight: 1.6 }}>
              {uploadAvatar.isPending
                ? 'A enviar foto…'
                : `Clica na foto para ver o perfil.\nJPEG, PNG ou WebP, até ${MAX_AVATAR_SIZE_MB}MB.`}
            </p>
          </div>

          <Divider />

          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="dark-inputs space-y-4">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={user?.email ?? ''} disabled />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Nome completo</Label>
              <Input id="full_name" {...profileForm.register('full_name')} />
              {profileForm.formState.errors.full_name && (
                <p className="text-destructive text-xs">{profileForm.formState.errors.full_name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Telemóvel</Label>
              <Input id="phone" type="tel" placeholder="+351 900 000 000" {...profileForm.register('phone')} />
            </div>
            <button type="submit" className="dark-primary-btn"
              disabled={profileForm.formState.isSubmitting || updateProfile.isPending}>
              {updateProfile.isPending ? 'A guardar…' : 'Guardar perfil'}
            </button>
          </form>
        </Section>

        {/* ── Organisation (admin only) ────────────────── */}
        {isAdmin && activeOrg && (
          <Section title="Organização">
            <form onSubmit={orgForm.handleSubmit(onOrgSubmit)} className="dark-inputs space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="org_name">Nome da organização</Label>
                <Input id="org_name" {...orgForm.register('name')} />
                {orgForm.formState.errors.name && (
                  <p className="text-destructive text-xs">{orgForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="logo_url">URL do logótipo</Label>
                <Input id="logo_url" placeholder="https://…" {...orgForm.register('logo_url')} />
              </div>

              <Divider />

              <div className="space-y-1.5">
                <Label>Código de convite</Label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Input value={activeOrg.invite_code} readOnly className="font-mono tracking-widest" />
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    aria-label="Copiar código"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: '2.5rem', flexShrink: 0,
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '0.5rem',
                      color: codeCopied ? '#6ee7b7' : 'rgba(255,255,255,0.6)',
                      cursor: 'pointer',
                      transition: 'color 0.15s',
                    }}
                  >
                    {codeCopied
                      ? <Check style={{ width: '0.9rem', height: '0.9rem' }} />
                      : <Copy style={{ width: '0.9rem', height: '0.9rem' }} />}
                  </button>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
                  Partilha este código para convidar pessoas
                </p>
              </div>

              <button type="submit" className="dark-primary-btn" disabled={orgForm.formState.isSubmitting}>
                {orgForm.formState.isSubmitting ? 'A guardar…' : 'Guardar organização'}
              </button>
            </form>
          </Section>
        )}

        {/* ── Leave org ───────────────────────────────── */}
        <Section title="Esta organização">
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1rem', lineHeight: 1.6 }}>
            Deixa de pertencer a <span style={{ color: 'rgba(255,255,255,0.65)' }}>{activeOrg?.name ?? 'esta organização'}</span>.
            Podes voltar a entrar mais tarde com o código de convite.
          </p>
          <button
            type="button"
            onClick={() => setLeaveOrgOpen(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600,
              background: 'rgba(239,68,68,0.08)', color: '#f87171',
              border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.5rem', cursor: 'pointer',
              transition: 'background 0.15s, border-color 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.15)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.35)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.2)';
            }}
          >
            <LogOut style={{ width: '0.9rem', height: '0.9rem' }} />
            Saír da organização
          </button>
        </Section>

        {/* ── Danger zone ─────────────────────────────── */}
        <Section title="Zona de perigo" danger>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1rem', lineHeight: 1.6 }}>
            Elimina permanentemente a tua conta e todos os dados associados — perfil,
            participação em organizações, escalas e notificações. Esta ação não pode ser desfeita.
          </p>
          <button
            type="button"
            onClick={() => setDeleteAccountOpen(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 1.125rem', fontSize: '0.85rem', fontWeight: 600,
              background: 'rgba(239,68,68,0.15)', color: '#fca5a5',
              border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.5rem', cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.25)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.15)'; }}
          >
            <Trash2 style={{ width: '0.9rem', height: '0.9rem' }} />
            Eliminar conta
          </button>
        </Section>

        <div style={{ height: '1rem' }} />
      </div>

      {/* ── Modals ──────────────────────────────────────── */}
      <ProfileCardDialog
        open={profileCardOpen}
        onOpenChange={setProfileCardOpen}
        name={profile?.full_name || 'Utilizador'}
        email={user?.email}
        avatarUrl={displayAvatar}
        onChangePhoto={() => fileInputRef.current?.click()}
      />

      {cropSrc && (
        <ImageCropDialog
          open={!!cropSrc}
          imageSrc={cropSrc}
          shape="round"
          aspect={1}
          title="Recortar foto de perfil"
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}

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
