'use client';

import { useEffect } from 'react';
import { useOrgStore } from '@/stores/orgStore';
import type { Organization, OrganizationMember } from '@/types/models';

interface OrgInitializerProps {
  children: React.ReactNode;
  membership: OrganizationMember & { organization: Organization };
}

export function OrgInitializer({ children, membership }: OrgInitializerProps) {
  const { setActiveOrg } = useOrgStore();

  useEffect(() => {
    setActiveOrg(membership.organization, membership);
  }, [membership, setActiveOrg]);

  return <>{children}</>;
}
