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
          <div className="text-center mb-6">
            <div className="inline-flex h-10 w-10 rounded-xl items-center justify-center mb-3"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <span className="text-white font-bold text-sm">SF</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Define a tua password</h1>
            <p className="text-[13px] text-white/40 mt-1">
              Cria uma password para acederes à app.
            </p>
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
