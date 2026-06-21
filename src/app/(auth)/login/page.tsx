import { LoginForm } from '@/modules/auth/LoginForm';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Entrar</h2>
        <p className="text-sm text-muted-foreground mt-1">Acede à tua organização</p>
      </div>
      <LoginForm />
      <p className="text-center text-sm text-muted-foreground">
        Não tens conta?{' '}
        <Link href="/register" className="text-foreground underline underline-offset-4 hover:opacity-80">
          Registar
        </Link>
      </p>
    </div>
  );
}
