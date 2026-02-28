import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface CurrentUser {
  user: User | null;
  userId: string | null;
  organizationId: string | null;
  loading: boolean;
}

/**
 * Returns the authenticated user and their organization ID.
 * Replaces the repeated `supabase.auth.getUser()` + profile fetch pattern.
 */
export function useCurrentUser(): CurrentUser {
  const [user, setUser] = useState<User | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!isMounted) return;

        setUser(user);
        if (user) {
          const { data } = await supabase
            .from("profiles")
            .select("organization_id")
            .eq("id", user.id)
            .single();

          if (!isMounted) return;

          setOrganizationId(data?.organization_id ?? null);
        } else {
          setOrganizationId(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      if (!session) {
        setUser(null);
        setOrganizationId(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      load();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, userId: user?.id ?? null, organizationId, loading };
}
