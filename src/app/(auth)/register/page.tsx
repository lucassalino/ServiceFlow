import Link from 'next/link';
import { RegisterForm } from '@/modules/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="auth-bg">
      <div className="w-full max-w-[380px]">
        <div className="auth-glass">

          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex h-10 w-10 rounded-xl items-center justify-center mb-3"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <span className="text-white font-bold text-sm">SF</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Create account
            </h1>
            <p className="text-[13px] text-white/40 mt-1">
              Fill in your details to get started.
            </p>
          </div>

          {/* Form */}
          <RegisterForm />

          {/* Footer */}
          <p className="text-center text-[13px] text-white/35 mt-5">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-white/70 font-semibold hover:text-white transition-colors"
            >
              Sign in
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}
