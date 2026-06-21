'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useOrgStore } from '@/stores/orgStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const profileSchema = z.object({
  full_name: z.string().min(1, 'Nome obrigatório'),
  phone: z.string().nullable().default(null),
  avatar_url: z.string().url('URL inválida').nullable().or(z.literal('')).default(null),
});

const orgSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  logo_url: z.string().url('URL inválida').nullable().or(z.literal('')).default(null),
});

type ProfileData = z.infer<typeof profileSchema>;
type OrgData = z.infer<typeof orgSchema>;

interface Props { orgId: string }

export function SettingsClient({ orgId }: Props) {
  const { activeOrg, activeMembership } = useOrgStore();
  const [userEmail, setUserEmail] = useState('');
  const isAdmin = activeMembership?.role === 'admin';

  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema) as never,
    defaultValues: { full_name: '', phone: null, avatar_url: null },
  });

  const orgForm = useForm<OrgData>({
    resolver: zodResolver(orgSchema) as never,
    defaultValues: { name: '', logo_url: null },
  });

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserEmail(user.email ?? '');
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      const profile = profileData as { full_name: string; phone: string | null; avatar_url: string | null } | null;
      if (profile) {
        profileForm.reset({
          full_name: profile.full_name,
          phone: profile.phone,
          avatar_url: profile.avatar_url,
        });
      }
    };
    load();
  }, [profileForm]);

  useEffect(() => {
    if (activeOrg) {
      orgForm.reset({ name: activeOrg.name, logo_url: activeOrg.logo_url });
    }
  }, [activeOrg, orgForm]);

  async function onProfileSubmit(data: ProfileData) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('profiles').update({
      full_name: data.full_name,
      phone: data.phone || null,
      avatar_url: data.avatar_url || null,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Perfil actualizado');
  }

  async function onOrgSubmit(data: OrgData) {
    const supabase = createClient();
    const { error } = await supabase.from('organizations').update({
      name: data.name,
      logo_url: data.logo_url || null,
      updated_at: new Date().toISOString(),
    }).eq('id', orgId);
    if (error) { toast.error(error.message); return; }
    toast.success('Organização actualizada');
  }

  return (
    <div className="p-6 space-y-6 max-w-xl">
      <h1 className="text-2xl font-bold">Definições</h1>

      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label>Email</Label>
              <Input value={userEmail} disabled className="opacity-60" />
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
            <div className="space-y-1">
              <Label htmlFor="avatar_url">URL do avatar</Label>
              <Input id="avatar_url" placeholder="https://…" {...profileForm.register('avatar_url')} />
            </div>
            <Button type="submit" disabled={profileForm.formState.isSubmitting}>
              {profileForm.formState.isSubmitting ? 'A guardar…' : 'Guardar perfil'}
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
    </div>
  );
}
