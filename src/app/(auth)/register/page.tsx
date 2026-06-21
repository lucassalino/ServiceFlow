import { RegisterForm } from '@/modules/auth/RegisterForm';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Criar conta</h2>
        <p className="text-sm text-muted-foreground mt-1">Regista-te para começar</p>
      </div>
      <RegisterForm />
      <p className="text-center text-sm text-muted-foreground">
        Já tens conta?{' '}
        <Link href="/login" className="text-foreground underline underline-offset-4 hover:opacity-80">
          Entrar
        </Link>
      </p>
    </div>
  );
}
