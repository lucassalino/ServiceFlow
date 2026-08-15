'use client';

import { useOrgStore } from '@/stores/orgStore';
import { CheckinManageView } from './CheckinManageView';
import { CheckinSelfCard } from './CheckinSelfCard';

interface Props { orgId: string }

export function CheckinClient({ orgId }: Props) {
  const { activeMembership } = useOrgStore();
  const canManage = activeMembership?.role === 'admin' || activeMembership?.role === 'leader';

  if (canManage) return <CheckinManageView orgId={orgId} />;

  return (
    <div className="dash-purple-bg" style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: '24rem', width: '100%', padding: '2rem 1.5rem' }}>
        <CheckinSelfCard orgId={orgId} />
      </div>
    </div>
  );
}
