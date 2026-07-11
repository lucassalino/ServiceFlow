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
    // Guardar como última organização visitada — no próximo login entra direto aqui.
    document.cookie = `sf_last_org=${membership.org_id}; path=/; max-age=31536000; samesite=lax`;
  }, [membership, setActiveOrg]);

  return <>{children}</>;
}
