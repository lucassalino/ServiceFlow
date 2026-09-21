'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

const emailSchema = z.object({
  email: z.string().email('Email inválido'),
});
type EmailValues = z.infer<typeof emailSchema>;

const resetSchema = z.object({
  code: z.string().min(6, 'Código demasiado curto').max(10, 'Código demasiado longo'),
  password: z.string().min(6, 'A password deve ter pelo menos 6 caracteres'),
  confirm: z.string(),
}).refine((v) => v.password === v.confirm, { message: 'As passwords não coincidem', path: ['confirm'] });
type ResetValues = z.infer<typeof resetSchema>;

export function ForgotPasswordForm({ className }: { className?: string }) {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const emailForm = useForm<EmailValues>({ resolver: zodResolver(emailSchema) });
  const resetForm = useForm<ResetValues>({ resolver: zodResolver(resetSchema) as never });

  async function sendCode(values: EmailValues) {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(values.email);
      if (error) {
        toast.error(error.message || 'Não foi possível enviar o email. Tenta mais tarde.');
        return;
      }
      setEmail(values.email);
      setStep('code');
      toast.success('Código enviado — verifica o teu email.');
    } catch {
      toast.error('Ocorreu um erro inesperado');
    } finally {
      setLoading(false);
    }
  }

  async function confirmReset(values: ResetValues) {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email, token: values.code, type: 'recovery',
      });
      if (verifyError) {
        toast.error('Código inválido ou expirado. Pede um novo.');
        return;
      }
      const { error: updateError } = await supabase.auth.updateUser({ password: values.password });
      if (updateError) {
        toast.error(updateError.message || 'Não foi possível definir a nova password.');
        return;
      }
      toast.success('Password redefinida!');
      window.location.href = '/';
    } catch {
      toast.error('Ocorreu um erro inesperado');
    } finally {
      setLoading(false);
    }
  }

  async function resendCode() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) { toast.error(error.message || 'Não foi possível reenviar.'); return; }
      toast.success('Novo código enviado.');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'code') {
    return (
      <form onSubmit={resetForm.handleSubmit(confirmReset)} className={cn('flex flex-col gap-4', className)}>
        <button
          type="button"
          onClick={() => setStep('email')}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground w-fit"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Trocar email
        </button>

        <p className="text-sm text-muted-foreground">
          Enviámos um código para <strong>{email}</strong>. Introduz o código e a tua nova password.
        </p>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="code">Código</Label>
          <Input
            id="code" inputMode="numeric" autoComplete="one-time-code" maxLength={10}
            placeholder="Código recebido por email" style={{ letterSpacing: '0.3em', textAlign: 'center', fontSize: '1.1rem' }}
            {...resetForm.register('code')}
          />
          {resetForm.formState.errors.code && (
            <p className="text-sm text-destructive">{resetForm.formState.errors.code.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-password">Nova password</Label>
          <Input id="new-password" type="password" placeholder="••••••••" autoComplete="new-password" {...resetForm.register('password')} />
          {resetForm.formState.errors.password && (
            <p className="text-sm text-destructive">{resetForm.formState.errors.password.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm-password">Confirmar password</Label>
          <Input id="confirm-password" type="password" placeholder="••••••••" autoComplete="new-password" {...resetForm.register('confirm')} />
          {resetForm.formState.errors.confirm && (
            <p className="text-sm text-destructive">{resetForm.formState.errors.confirm.message}</p>
          )}
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Redefinir password
        </Button>

        <button
          type="button"
          onClick={resendCode}
          disabled={loading}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Não recebeste? Reenviar código
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={emailForm.handleSubmit(sendCode)} className={cn('flex flex-col gap-4', className)}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="email@exemplo.com"
          autoComplete="email"
          {...emailForm.register('email')}
        />
        {emailForm.formState.errors.email && (
          <p className="text-sm text-destructive">{emailForm.formState.errors.email.message}</p>
        )}
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Enviar código
      </Button>
    </form>
  );
}
