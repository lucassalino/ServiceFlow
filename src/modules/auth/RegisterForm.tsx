'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, MailCheck, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { CURRENT_TERMS_VERSION } from '@/lib/legal';

const registerSchema = z
  .object({
    full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Password deve ter pelo menos 6 caracteres'),
    confirmPassword: z.string().min(6, 'Confirma a password'),
    acceptTerms: z.boolean().refine((v) => v === true, {
      message: 'Tens de aceitar os Termos e a Política de Privacidade',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As passwords não coincidem',
    path: ['confirmPassword'],
  });

type RegisterValues = z.infer<typeof registerSchema>;

export function RegisterForm({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterValues) => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: { full_name: values.full_name, terms_version: CURRENT_TERMS_VERSION },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        toast.error(error.message || 'Não foi possível criar a conta. Verifica a configuração de email (SMTP) ou tenta mais tarde.');
        return;
      }
      // Se a confirmação de email estiver ativa, não há sessão até confirmar.
      if (!data.session) {
        setSentTo(values.email);
      } else {
        window.location.href = '/';
      }
    } catch {
      toast.error('Ocorreu um erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  if (sentTo) {
    return (
      <div className={cn('flex flex-col items-center text-center gap-3 py-4', className)}>
        <div className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: 'rgba(110,231,183,0.15)', border: '1px solid rgba(110,231,183,0.3)' }}>
          <MailCheck className="h-6 w-6" style={{ color: '#6ee7b7' }} />
        </div>
        <h3 className="text-base font-semibold text-white">Confirma o teu email</h3>
        <p className="text-[13px] text-white/50 leading-relaxed">
          Enviámos um link de confirmação para<br />
          <span className="text-white/80 font-medium">{sentTo}</span>.<br />
          Abre-o para ativares a conta e entrares.
        </p>
        <p className="text-[12px] text-white/35 mt-1">
          Não recebeste? Verifica o spam ou tenta registar novamente.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn('flex flex-col gap-4', className)}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="full_name">Nome completo</Label>
        <Input
          id="full_name"
          type="text"
          placeholder="João Silva"
          autoComplete="name"
          {...register('full_name')}
        />
        {errors.full_name && (
          <p className="text-sm text-destructive">{errors.full_name.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="email@exemplo.com"
          autoComplete="email"
          {...register('email')}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="new-password"
            className="pr-10"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Ocultar password' : 'Ver password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword">Confirmar password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirm ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="new-password"
            className="pr-10"
            {...register('confirmPassword')}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            aria-label={showConfirm ? 'Ocultar password' : 'Ver password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      <div className="flex items-start gap-2">
        <input
          id="acceptTerms"
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-transparent accent-current"
          {...register('acceptTerms')}
        />
        <Label htmlFor="acceptTerms" className="text-[13px] font-normal leading-snug text-white/60">
          Li e aceito os{' '}
          <a href="/termos" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/85">
            Termos de Uso
          </a>{' '}
          e a{' '}
          <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/85">
            Política de Privacidade
          </a>
        </Label>
      </div>
      {errors.acceptTerms && (
        <p className="text-sm text-destructive -mt-2">{errors.acceptTerms.message}</p>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Criar conta
      </Button>
    </form>
  );
}
