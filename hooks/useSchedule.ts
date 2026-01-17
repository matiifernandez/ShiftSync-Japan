import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { ScheduleItem } from "../types";
import { Alert } from "react-native";

export function useSchedule({ allUsers = false } = {}) {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedule = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      let data, error;

      if (allUsers) {
        // 1. Get my org ID first
        const { data: profile } = await supabase
          .from("profiles")
          .select("organization_id")
          .eq("id", user.id)
          .single();

        if (profile?.organization_id) {
          // 2. Fetch all items for users in this org
          // We join with profiles to filter by org AND get display info
          // NOTE: We assume schedule_items.user_id references profiles.id (or auth.users which is same)
          const result = await supabase
            .from("schedule_items")
            .select("*, profiles!inner(organization_id, full_name, avatar_url)")
            .eq("profiles.organization_id", profile.organization_id)
            .order("date", { ascending: true });
            
          data = result.data;
          error = result.error;
        }
      } else {
        const result = await supabase
          .from("schedule_items")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: true });
          
        data = result.data;
        error = result.error;
      }

      if (error) {
        throw error;
      }

      if (data) {
        setSchedule(data as ScheduleItem[]);
      }
    } catch (error) {
      console.error("Error fetching schedule:", error);
      // Optional: Alert.alert("Error", "Could not load schedule");
    } finally {
      setLoading(false);
    }
  }, [allUsers]);

  useEffect(() => {
    // 1. Initial Fetch
    fetchSchedule();

    // 2. Setup Realtime Subscription
    const subscription = supabase
      .channel("schedule_updates")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to INSERT, UPDATE, DELETE
          schema: "public",
          table: "schedule_items",
        },
        (payload) => {
          console.log("Realtime update received:", payload);
          // Simple strategy: Refetch to ensure consistency and order.
          // For very large datasets, we would update the local state array manually.
          fetchSchedule();
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchSchedule]);

  return { schedule, loading, refreshSchedule: fetchSchedule };
}
