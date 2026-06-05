import { create } from 'zustand';
import type { Organization, OrganizationMember } from '@/types';

interface OrgState {
  // The org the user is currently browsing
  activeOrg: Organization | null;
  // The user's membership record for the active org (contains their role)
  activeMembership: OrganizationMember | null;
  setActiveOrg: (org: Organization, membership: OrganizationMember) => void;
  clearActiveOrg: () => void;
}

export const useOrgStore = create<OrgState>((set) => ({
  activeOrg: null,
  activeMembership: null,
  setActiveOrg: (org, membership) =>
    set({ activeOrg: org, activeMembership: membership }),
  clearActiveOrg: () => set({ activeOrg: null, activeMembership: null }),
}));
