import Link from 'next/link';
import { LoginForm } from '@/modules/auth/LoginForm';

export default function LoginPage() {
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
              Sign In
            </h1>
            <p className="text-[13px] text-white/40 mt-1">
              Please enter your details to sign in.
            </p>
          </div>

          {/* Form */}
          <LoginForm forgotPasswordHref="/forgot-password" />

          {/* Footer */}
          <p className="text-center text-[13px] text-white/35 mt-5">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="text-white/70 font-semibold hover:text-white transition-colors"
            >
              Sign up
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}
