import { ForgotPasswordForm } from '@/modules/auth/ForgotPasswordForm';
import Link from 'next/link';

export default function ForgotPasswordPage() {
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
            <p className="auth-eyebrow">Recuperar acesso</p>
            <h1 className="auth-title">Nova password</h1>
            <p className="auth-lead">Enviamos-te um email com um link para definires uma nova password.</p>
            <div className="auth-rule" />
          </div>

          {/* Form */}
          <ForgotPasswordForm />

          {/* Footer */}
          <p className="auth-foot">
            <Link
              href="/login"
              
            >
              Voltar ao login
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}
