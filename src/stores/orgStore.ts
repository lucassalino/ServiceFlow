'use client';
import { create } from 'zustand';
import type { Organization, OrganizationMember } from '@/types/models';

interface OrgState {
  activeOrg: Organization | null;
  activeMembership: OrganizationMember | null;
  setActiveOrg: (org: Organization, membership: OrganizationMember) => void;
  clearActiveOrg: () => void;
}

export const useOrgStore = create<OrgState>((set) => ({
  activeOrg: null, activeMembership: null,
  setActiveOrg: (org, membership) => set({ activeOrg: org, activeMembership: membership }),
  clearActiveOrg: () => set({ activeOrg: null, activeMembership: null }),
}));
