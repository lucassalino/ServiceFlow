'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  redeemCouponAction, listCouponsAction, createCouponAction, deleteCouponAction,
} from '@/actions/coupons';
import type { PlanKey } from '@/lib/plans';

export function useRedeemCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, code }: { orgId: string; code: string }) => redeemCouponAction(orgId, code),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['org-subscription', vars.orgId] }),
  });
}

export function useCoupons(enabled: boolean) {
  return useQuery({
    queryKey: ['coupons'],
    enabled,
    queryFn: () => listCouponsAction(),
  });
}

export function useCreateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { code: string; plan: PlanKey; durationDays: number | null; maxUses: number | null; note?: string }) =>
      createCouponAction(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  });
}

export function useDeleteCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCouponAction(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  });
}
