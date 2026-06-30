import Link from 'next/link';
import { LoginForm } from '@/modules/auth/LoginForm';

function DotsLogo() {
  const count = 10;
  const r = 13;
  const cx = 20;
  const cy = 20;
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        const opacity = 0.25 + (i / count) * 0.75;
        const dotR = i < 3 ? 1.8 : i < 7 ? 2.2 : 2.6;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={dotR}
            fill="white"
            opacity={opacity}
          />
        );
      })}
    </svg>
  );
}

export default function LoginPage() {
  return (
    <div className="auth-bg">
      <div className="w-full max-w-[380px]">
        <div className="auth-glass">

          {/* Logo */}
          <div className="flex justify-center mb-1">
            <DotsLogo />
          </div>

          {/* Header */}
          <div className="text-center mb-6">
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
