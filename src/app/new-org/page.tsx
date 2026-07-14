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
import { createOrganization } from './actions';

const schema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
});
type FormData = z.infer<typeof schema>;

export default function NewOrgPage() {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const result = await createOrganization(data.name);
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
            <div className="inline-flex h-12 w-12 rounded-xl items-center justify-center mb-3"
              style={{ background: 'linear-gradient(135deg, #0D3B66 0%, #0F5C6E 100%)', border: '1px solid rgba(255,255,255,0.12)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/wis-symbol-white.svg" alt="WIS" style={{ width: '1.9rem', height: 'auto' }} />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Nova organização
            </h1>
            <p className="text-[13px] text-white/40 mt-1">
              Cria uma organização para a tua equipa
            </p>
          </div>

          {/* Form */}
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
    </div>
  );
}
