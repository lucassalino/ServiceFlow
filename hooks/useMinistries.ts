import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useOrgStore } from '@/stores/orgStore';
import type { Ministry } from '@/types';

export function useMinistries() {
  const { activeOrg } = useOrgStore();

  return useQuery({
    queryKey: ['ministries', activeOrg?.id],
    enabled: !!activeOrg?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ministries')
        .select('*')
        .eq('org_id', activeOrg!.id)
        .order('name');

      if (error) throw new Error(error.message);
      return data as Ministry[];
    },
  });
}

interface MinistryPayload {
  name: string;
  icon: string;
  color: string;
}

export function useCreateMinistry() {
  const qc = useQueryClient();
  const { activeOrg } = useOrgStore();

  return useMutation({
    mutationFn: async (payload: MinistryPayload) => {
      const { error } = await supabase
        .from('ministries')
        .insert({ ...payload, org_id: activeOrg!.id });

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['ministries', activeOrg?.id] });
    },
  });
}

export function useUpdateMinistry() {
  const qc = useQueryClient();
  const { activeOrg } = useOrgStore();

  return useMutation({
    mutationFn: async ({ id, ...payload }: MinistryPayload & { id: string }) => {
      const { error } = await supabase
        .from('ministries')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['ministries', activeOrg?.id] });
    },
  });
}

export function useDeleteMinistry() {
  const qc = useQueryClient();
  const { activeOrg } = useOrgStore();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ministries').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['ministries', activeOrg?.id] });
    },
  });
}
