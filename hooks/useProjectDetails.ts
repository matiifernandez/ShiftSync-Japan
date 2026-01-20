import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { LogisticsTicket, Accommodation } from "../types";

export interface ProjectDetails {
  tickets: LogisticsTicket[];
  accommodations: Accommodation[];
}

export function useProjectDetails(projectId: string | null) {
  const [details, setDetails] = useState<ProjectDetails>({ tickets: [], accommodations: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!projectId) {
      setDetails({ tickets: [], accommodations: [] });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
        
      const isAdmin = profile?.role === 'admin';

      // Tickets Query
      let ticketsQuery = supabase
        .from('logistics_tickets')
        .select('*, profiles:user_id(full_name)')
        .eq('project_id', projectId);

      if (!isAdmin) {
        // Staff only see their own tickets or unassigned tickets (if allowed, but schema implies assignment)
        // Adjusting based on previous logic: "Staff only see their own or group tickets"
        ticketsQuery = ticketsQuery.or(`user_id.eq.${user.id},user_id.is.null`);
      }
      
      const { data: tickets, error: ticketError } = await ticketsQuery.order('departure_time', { ascending: true });
      if (ticketError) throw ticketError;

      // Accommodations Query
      // Everyone in the project sees the accommodations (as established)
      const { data: accommodations, error: accError } = await supabase
        .from('accommodations')
        .select('*')
        .eq('project_id', projectId);
      
      if (accError) throw accError;

      setDetails({
        tickets: (tickets as LogisticsTicket[]) || [],
        accommodations: (accommodations as Accommodation[]) || [],
      });

    } catch (err: any) {
      console.error("Error fetching project details:", err);
      setError(err.message || "Failed to load details");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return { 
    ...details, 
    loading, 
    error, 
    refreshDetails: fetchDetails 
  };
}
