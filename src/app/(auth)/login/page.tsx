import Link from 'next/link';
import { LoginForm } from '@/modules/auth/LoginForm';

export default function LoginPage() {
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
            <h1 className="auth-title">Entrar</h1>
            <p className="auth-lead">Introduz os teus dados para continuar.</p>
            <div className="auth-rule" />
          </div>

          {/* Form */}
          <LoginForm forgotPasswordHref="/forgot-password" />

          {/* Footer */}
          <p className="auth-foot">
            Ainda não tens conta?{' '}
            <Link
              href="/register"
              
            >
              Criar conta
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}
