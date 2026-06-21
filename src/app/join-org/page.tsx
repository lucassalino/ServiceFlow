'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';

const schema = z.object({
  invite_code: z.string().min(1, 'Código de convite obrigatório'),
});
type FormData = z.infer<typeof schema>;

export default function JoinOrgPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const supabase = createClient();

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast.error('Utilizador não autenticado');
        return;
      }

      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('invite_code', data.invite_code.toUpperCase())
        .single();

      if (orgError || !org) {
        toast.error('Código de convite inválido');
        return;
      }

      // Check if already a member
      const { data: existing } = await supabase
        .from('organization_members')
        .select('id')
        .eq('org_id', org.id)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        toast.error('Já és membro desta organização');
        router.push(`/${org.id}/dashboard`);
        return;
      }

      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({ org_id: org.id, user_id: user.id, role: 'member' });

      if (memberError) {
        toast.error(memberError.message);
        return;
      }

      toast.success('Entraste na organização!');
      router.push(`/${org.id}/dashboard`);
    } catch {
      toast.error('Ocorreu um erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <h1 className="text-xl font-bold">Entrar com código</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Insere o código de convite da organização
          </p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="invite_code">Código de convite *</Label>
            <Input
              id="invite_code"
              placeholder="XXXXXX"
              autoCapitalize="characters"
              autoFocus
              {...register('invite_code')}
            />
            {errors.invite_code && (
              <p className="text-xs text-destructive">{errors.invite_code.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Entrar
          </Button>
        </form>
      </div>
    </div>
  );
}
