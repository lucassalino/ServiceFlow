'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { joinOrganization } from './actions';

const schema = z.object({
  invite_code: z.string().min(1, 'Código de convite obrigatório'),
});
type FormData = z.infer<typeof schema>;

export default function JoinOrgPage() {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const result = await joinOrganization(data.invite_code);
      if (result?.error) toast.error(result.error);
    } catch (err) {
      if (err && typeof err === 'object' && 'digest' in err) throw err;
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
