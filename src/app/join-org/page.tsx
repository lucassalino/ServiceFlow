'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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
  return (
    <Suspense fallback={null}>
      <JoinOrgForm />
    </Suspense>
  );
}

function JoinOrgForm() {
  const searchParams = useSearchParams();
  const initialCode = (searchParams.get('code') ?? '').toUpperCase();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { invite_code: initialCode },
  });

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
    <div className="auth-bg">
      {/* Voltar */}
      <Link href="/" aria-label="Voltar" className="auth-back-arrow">
        <ArrowLeft style={{ width: '1.1rem', height: '1.1rem' }} />
      </Link>

      <div className="w-full max-w-[380px]">
        <div className="auth-glass">

          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex h-10 w-10 rounded-xl items-center justify-center mb-3"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <span className="text-white font-bold text-sm">SF</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Entrar com código
            </h1>
            <p className="text-[13px] text-white/40 mt-1">
              Insere o código de convite da organização
            </p>
          </div>

          {/* Form */}
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
    </div>
  );
}
