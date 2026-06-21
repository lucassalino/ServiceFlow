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
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
});
type FormData = z.infer<typeof schema>;

export default function NewOrgPage() {
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

      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({ name: data.name, invite_code: inviteCode })
        .select()
        .single();

      if (orgError || !newOrg) {
        toast.error(orgError?.message ?? 'Erro ao criar organização');
        return;
      }

      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({ org_id: newOrg.id, user_id: user.id, role: 'admin' });

      if (memberError) {
        toast.error(memberError.message);
        return;
      }

      toast.success('Organização criada!');
      router.push(`/${newOrg.id}/dashboard`);
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
          <h1 className="text-xl font-bold">Nova organização</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cria uma organização para a tua equipa
          </p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome da organização *</Label>
            <Input
              id="name"
              placeholder="Ex: Igreja Central"
              autoFocus
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Criar
          </Button>
        </form>
      </div>
    </div>
  );
}
