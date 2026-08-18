'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { toast.error('A password deve ter pelo menos 6 caracteres'); return; }
    if (password !== confirm) { toast.error('As passwords não coincidem'); return; }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) { toast.error(error.message); return; }
      toast.success('Password definida! Bem-vindo(a) 🙌');
      window.location.href = '/';
    } catch {
      toast.error('Ocorreu um erro inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-bg">
      <div className="w-full max-w-[380px]">
        <div className="auth-glass">
          <div className="mb-1">
            <span className="auth-mark">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/wis-symbol-white.svg" alt="WIS" style={{ width: '1.5rem', height: 'auto' }} />
            </span>
            <p className="auth-eyebrow">Definir acesso</p>
            <h1 className="auth-title">A tua password</h1>
            <p className="auth-lead">Cria uma password para acederes à app.</p>
            <div className="auth-rule" />
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pw">Password</Label>
              <Input id="pw" type="password" placeholder="••••••••" autoComplete="new-password"
                value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pw2">Confirmar password</Label>
              <Input id="pw2" type="password" placeholder="••••••••" autoComplete="new-password"
                value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            <Button type="submit" disabled={loading} className="w-full mt-1">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Definir password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
