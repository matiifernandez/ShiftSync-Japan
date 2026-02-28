import { useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

interface CurrentUser {
  user: User | null;
  userId: string | null;
  organizationId: string | null;
  loading: boolean;
}

async function fetchCurrentUser(): Promise<{ user: User | null; organizationId: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, organizationId: null };

  const { data } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  return { user, organizationId: data?.organization_id ?? null };
}

/**
 * Returns the authenticated user and their organization ID.
 * Uses TanStack Query for caching and deduplication across components.
 */
export function useCurrentUser(): CurrentUser {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);

  return {
    user: data?.user ?? null,
    userId: data?.user?.id ?? null,
    organizationId: data?.organizationId ?? null,
    loading: isLoading,
  };
}
