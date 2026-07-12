'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Camera, LogOut, Trash2, Copy, Check, Share2, ImagePlus } from 'lucide-react';

import { APP_URL } from '@/lib/app-url';
import { ImageCropDialog } from '@/components/ui/image-crop-dialog';
import { ProfileCardDialog } from '@/components/ui/profile-card-dialog';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useOrgStore } from '@/stores/orgStore';
import { useProfile, useUpdateProfile, useUploadAvatar, useDeleteAccount } from '@/hooks/useProfile';
import { useLeaveOrganization } from '@/hooks/useOrganizations';
import { uploadOrgLogoAction } from '@/actions/organizations';
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
  birthday: z.string().nullable().default(null),
});

const orgSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
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
  const { activeOrg, activeMembership, setActiveOrg } = useOrgStore();
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

  // Logótipo da organização
  const orgLogoInputRef = useRef<HTMLInputElement>(null);
  const [orgLogoCropSrc, setOrgLogoCropSrc] = useState<string | null>(null);
  const [orgLogoUploading, setOrgLogoUploading] = useState(false);

  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema) as never,
    defaultValues: { full_name: '', phone: null, birthday: null },
  });

  const orgForm = useForm<OrgData>({
    resolver: zodResolver(orgSchema) as never,
    defaultValues: { name: '' },
  });

  useEffect(() => {
    if (profile) profileForm.reset({ full_name: profile.full_name, phone: profile.phone, birthday: profile.birthday });
  }, [profile, profileForm]);

  useEffect(() => {
    if (activeOrg) orgForm.reset({ name: activeOrg.name });
  }, [activeOrg, orgForm]);

  function handleOrgLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
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
    setOrgLogoCropSrc(URL.createObjectURL(file));
    if (orgLogoInputRef.current) orgLogoInputRef.current.value = '';
  }

  async function handleOrgLogoCropConfirm(blob: Blob) {
    if (orgLogoCropSrc) URL.revokeObjectURL(orgLogoCropSrc);
    setOrgLogoCropSrc(null);
    if (!activeOrg) return;
    setOrgLogoUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', new File([blob], 'logo.webp', { type: 'image/webp' }));
      fd.append('orgId', activeOrg.id);
      const logoUrl = await uploadOrgLogoAction(fd);
      if (activeMembership) setActiveOrg({ ...activeOrg, logo_url: logoUrl }, activeMembership);
      toast.success('Logótipo atualizado');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar logótipo');
    } finally {
      setOrgLogoUploading(false);
    }
  }

  function handleOrgLogoCropCancel() {
    if (orgLogoCropSrc) URL.revokeObjectURL(orgLogoCropSrc);
    setOrgLogoCropSrc(null);
  }

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
        birthday: profileForm.getValues('birthday') ?? profile?.birthday ?? null,
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
        birthday: data.birthday || null,
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
      updated_at: new Date().toISOString(),
    }).eq('id', orgId);
    if (error) { toast.error(error.message); return; }
    if (activeOrg && activeMembership) setActiveOrg({ ...activeOrg, name: data.name }, activeMembership);
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

  // Copiar — Clipboard API.
  function copiarCodigo() {
    const codigo = activeOrg?.invite_code;
    if (!codigo) return;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(codigo)
        .then(() => {
          setCodeCopied(true);
          setTimeout(() => setCodeCopied(false), 2000);
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

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
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
            <div className="space-y-1.5">
              <Label htmlFor="birthday">Data de aniversário</Label>
              <Input id="birthday" type="date" {...profileForm.register('birthday')} />
              <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>
                Aparece nos aniversariantes do mês no painel da organização.
              </p>
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
                <Label>Logótipo</Label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '3.5rem', height: '3.5rem', borderRadius: '0.75rem', flexShrink: 0, overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                  }}>
                    {activeOrg.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={activeOrg.logo_url} alt="Logótipo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)' }}>
                        {activeOrg.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => orgLogoInputRef.current?.click()}
                    disabled={orgLogoUploading}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                      padding: '0.5rem 0.9rem', fontSize: '0.82rem', fontWeight: 600,
                      background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)',
                      borderRadius: '0.5rem', color: 'rgba(255,255,255,0.85)',
                      cursor: orgLogoUploading ? 'wait' : 'pointer', opacity: orgLogoUploading ? 0.6 : 1,
                    }}
                  >
                    <ImagePlus style={{ width: '0.9rem', height: '0.9rem' }} />
                    {orgLogoUploading ? 'A enviar…' : 'Carregar imagem'}
                  </button>
                  <input
                    ref={orgLogoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleOrgLogoChange}
                  />
                </div>
                <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>
                  JPEG, PNG ou WebP, até {MAX_AVATAR_SIZE_MB}MB.
                </p>
              </div>

              <Divider />

              <div className="space-y-1.5">
                <Label>Código de convite</Label>
                <Input value={activeOrg.invite_code} readOnly className="font-mono tracking-widest" />

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {[
                    { key: 'copy', label: codeCopied ? 'Copiado' : 'Copiar', icon: codeCopied ? Check : Copy, onClick: copiarCodigo, accent: codeCopied },
                    { key: 'share', label: 'Partilhar', icon: Share2, onClick: partilharCodigo, accent: false },
                  ].map(({ key, label, icon: Icon, onClick, accent }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={onClick}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                        padding: '0.6rem',
                        background: 'rgba(255,255,255,0.07)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '0.5rem',
                        color: accent ? '#6ee7b7' : 'rgba(255,255,255,0.85)',
                        fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'; }}
                    >
                      <Icon style={{ width: '0.9rem', height: '0.9rem' }} />
                      {label}
                    </button>
                  ))}
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

        {/* ── Sessão ──────────────────────────────────── */}
        <Section title="Sessão">
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1rem', lineHeight: 1.6 }}>
            Termina a sessão neste dispositivo. Podes voltar a entrar com o teu email e password.
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600,
              background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.85)',
              border: '1px solid rgba(255,255,255,0.14)', borderRadius: '0.5rem', cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'; }}
          >
            <LogOut style={{ width: '0.9rem', height: '0.9rem' }} />
            Terminar sessão
          </button>
        </Section>

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

      {orgLogoCropSrc && (
        <ImageCropDialog
          open={!!orgLogoCropSrc}
          imageSrc={orgLogoCropSrc}
          shape="rect"
          aspect={1}
          title="Recortar logótipo"
          onConfirm={handleOrgLogoCropConfirm}
          onCancel={handleOrgLogoCropCancel}
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
