'use client';

import { useAuthStore } from '@/stores/authStore';
import { MemberHistoryPanel } from '@/modules/members/MemberHistoryPanel';
import { FeatureGate } from '@/components/FeatureGate';

/**
 * "As minhas escalas" — o próprio utilizador a ver o seu histórico.
 * Reutiliza o painel do perfil da pessoa, sem cabeçalho (fica embebido
 * numa Section das Definições).
 */
export function MyHistorySection() {
  const { user, profile } = useAuthStore();
  if (!user) return null;

  return (
    <div className="space-y-3">
      <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
        As tuas participações em eventos que já aconteceram.
      </p>
      <FeatureGate feature="member_history">
        <MemberHistoryPanel
          userId={user.id}
          memberName={profile?.full_name ?? user.email ?? '?'}
        />
      </FeatureGate>
    </div>
  );
}
