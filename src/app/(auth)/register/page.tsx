import Link from 'next/link';
import { RegisterForm } from '@/modules/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="auth-bg">
      <div className="w-full max-w-[380px]">
        <div className="auth-glass">

          {/* Cabeçalho editorial */}
          <div className="mb-1">
            <span className="auth-mark">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/wis-symbol-white.svg" alt="WIS" style={{ width: '1.5rem', height: 'auto' }} />
            </span>
            <p className="auth-eyebrow">WIS — Services</p>
            <h1 className="auth-title">Criar conta</h1>
            <p className="auth-lead">Preenche os teus dados para começar.</p>
            <div className="auth-rule" />
          </div>

          {/* Form */}
          <RegisterForm />

          {/* Footer */}
          <p className="auth-foot">
            Já tens conta?{' '}
            <Link
              href="/login"
              
            >
              Entrar
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}
