import { ForgotPasswordForm } from '@/modules/auth/ForgotPasswordForm';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <div className="auth-bg">
      <div className="w-full max-w-[380px]">
        <div className="auth-glass">

          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex h-10 w-10 rounded-xl items-center justify-center mb-3"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <span className="text-white font-bold text-sm">WIS</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Recuperar password
            </h1>
            <p className="text-[13px] text-white/40 mt-1">
              Enviamos-te um email com um link para definir uma nova password.
            </p>
          </div>

          {/* Form */}
          <ForgotPasswordForm />

          {/* Footer */}
          <p className="text-center text-[13px] text-white/35 mt-5">
            <Link
              href="/login"
              className="text-white/70 font-semibold hover:text-white transition-colors"
            >
              Voltar ao login
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}
