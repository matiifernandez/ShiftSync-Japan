import { useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { ScheduleItem } from "../types";

export function useSchedule({ allUsers = false } = {}) {
  const queryClient = useQueryClient();
  const queryKey = ['schedule', { allUsers }];

  const { data: schedule = [], isLoading: loading, refetch } = useQuery({
    queryKey,
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('schedule_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  // Realtime Subscription
  useEffect(() => {
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
  }, [allUsers, queryClient]);

  return { 
    schedule, 
    loading, 
    refreshSchedule: refetch,
    deleteScheduleItem: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending
  };
}