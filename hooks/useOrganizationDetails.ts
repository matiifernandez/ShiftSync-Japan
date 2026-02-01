import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

export interface OrganizationDetails {
  id: string;
  name: string;
  invite_code: string;
  plan_type: string;
  max_seats: number;
}

export function useOrganizationDetails() {
  const [organization, setOrganization] = useState<OrganizationDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDetails = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Get user's org ID
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (!profile?.organization_id) return;

      // 2. Fetch Org Details
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", profile.organization_id)
        .single();

      if (error) throw error;
      setOrganization(data);
    } catch (error) {
      console.error("Error fetching organization details:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return { organization, loading, refreshDetails: fetchDetails };
}
