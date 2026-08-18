import Link from 'next/link';
import { RegisterForm } from '@/modules/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="auth-bg">
      <div className="w-full max-w-[380px]">
        <div className="auth-glass">

          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex h-12 w-12 rounded-xl items-center justify-center mb-3"
              style={{ background: 'linear-gradient(135deg, #0D3B66 0%, #0F5C6E 100%)', border: '1px solid rgba(255,255,255,0.12)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/wis-symbol-white.svg" alt="WIS" style={{ width: '1.9rem', height: 'auto' }} />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Criar conta
            </h1>
            <p className="text-[13px] text-white/40 mt-1">
              Preenche os teus dados para começar.
            </p>
          </div>

          {/* Form */}
          <RegisterForm />

          {/* Footer */}
          <p className="text-center text-[13px] text-white/35 mt-5">
            Já tens conta?{' '}
            <Link
              href="/login"
              className="text-white/70 font-semibold hover:text-white transition-colors"
            >
              Entrar
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}
