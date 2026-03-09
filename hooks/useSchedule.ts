import { useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { ScheduleItem } from "../types";

export type ScheduleItemInsert = Omit<ScheduleItem, "id">;

export function useSchedule({ allUsers = false, enabled = true } = {}) {
  const queryClient = useQueryClient();
  const queryKey = ['schedule', { allUsers }];

  const { data: schedule = [], isLoading: loading, refetch } = useQuery({
    queryKey,
    enabled,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let result;

      if (allUsers) {
        // 1. Get my org ID
        const { data: profile } = await supabase
          .from("profiles")
          .select("organization_id")
          .eq("id", user.id)
          .single();

        if (profile?.organization_id) {
          // 2. Fetch all items for this org
          result = await supabase
            .from("schedule_items")
            .select("*, profiles!inner(organization_id, full_name, avatar_url)")
            .eq("profiles.organization_id", profile.organization_id)
            .order("date", { ascending: true });
        }
      } else {
        result = await supabase
          .from("schedule_items")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: true });
      }

      if (result?.error) throw result.error;
      return (result?.data || []) as ScheduleItem[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (items: ScheduleItemInsert[]) => {
      const { error } = await supabase.from("schedule_items").insert(items);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ScheduleItem> }) => {
      const { error } = await supabase.from("schedule_items").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('schedule_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
    }
  });

  // Realtime Subscription — only active when data fetching is enabled
  useEffect(() => {
    if (!enabled) return;

    const subscription = supabase
      .channel("schedule_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "schedule_items",
        },
        () => {
          // Invalidate to auto-refetch
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [enabled, allUsers, queryClient]);

  const getScheduleItem = (id: string) => {
    return useQuery({
      queryKey: ["schedule-item", id],
      queryFn: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .single();
        
        if (!profile?.organization_id) throw new Error("No organization assigned");

        const { data, error } = await supabase
          .from("schedule_items")
          .select("*, profiles!inner(full_name, organization_id)")
          .eq("id", id)
          .eq("profiles.organization_id", profile.organization_id)
          .single();

        if (error) throw error;
        return data;
      },
      enabled: !!id,
    });
  };

  return { 
    schedule, 
    loading, 
    getScheduleItem,
    refreshSchedule: refetch,
    createScheduleItems: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateScheduleItem: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteScheduleItem: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending
  };
}