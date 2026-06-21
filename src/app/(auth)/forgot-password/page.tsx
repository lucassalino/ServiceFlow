import { ForgotPasswordForm } from '@/modules/auth/ForgotPasswordForm';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Recuperar password</h2>
        <p className="text-sm text-muted-foreground mt-1">Envia um email de recuperação</p>
      </div>
      <ForgotPasswordForm />
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-foreground underline underline-offset-4 hover:opacity-80">Voltar ao login</Link>
      </p>
    </div>
  );
}
