import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { supabase } from "../lib/supabase";
import { LogisticsTicket, Accommodation } from "../types";

export interface TripDetails {
  id: string;
  name: string;
  dates: string;
  description?: string;
  tickets: LogisticsTicket[];
  accommodations: Accommodation[];
}

export function useTravel() {
  const [trip, setTrip] = useState<TripDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTravel = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Get my org
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) {
        setLoading(false);
        return;
      }

      // 2. Get projects where I am a member
      const { data: membership } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id);
      
      const myProjectIds = membership?.map(m => m.project_id) || [];

      let projectsQuery = supabase
        .from('projects')
        .select('*')
        .eq('organization_id', profile.organization_id);

      // If not Admin, ONLY show projects where I am a member
      if (!isAdmin) {
        if (myProjectIds.length === 0) {
          setTrip(null);
          return;
        }
        projectsQuery = projectsQuery.in('id', myProjectIds);
      }

      const { data: projects, error: projError } = await projectsQuery.order('start_date', { ascending: true });

      if (projError) throw projError;

      if (!projects || projects.length === 0) {
        setTrip(null);
        return;
      }

      // Select the most relevant project
      const activeProject = projects[0];

      // 3. Get Logistics (Tickets & Hotels)
      const { data: roleData } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      const isAdmin = roleData?.role === 'admin';

      let ticketsQuery = supabase
        .from('logistics_tickets')
        .select('*, profiles:user_id(full_name)')
        .eq('project_id', activeProject.id);

      if (!isAdmin) {
        // Staff only see their own or group tickets
        ticketsQuery = ticketsQuery.or(`user_id.eq.${user.id},user_id.is.null`);
      }

      const { data: tickets } = await ticketsQuery.order('departure_time', { ascending: true });

      const { data: accommodations } = await supabase
        .from('accommodations')
        .select('*')
        .eq('project_id', activeProject.id);

      // 4. Format for UI
      setTrip({
        id: activeProject.id,
        name: activeProject.name,
        description: activeProject.description,
        dates: `${activeProject.start_date || '?'} - ${activeProject.end_date || '?'}`,
        tickets: (tickets as LogisticsTicket[]) || [],
        accommodations: (accommodations as Accommodation[]) || [],
      });

    } catch (error) {
      console.error("Error fetching travel:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTravel();
    }, [fetchTravel])
  );

  return { trip, loading, refreshTravel: fetchTravel };
}