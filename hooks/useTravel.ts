import { useState, useCallback, useEffect } from "react";
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

export interface SimpleProject {
  id: string;
  name: string;
  start_date: string;
}

export function useTravel() {
  const [trip, setTrip] = useState<TripDetails | null>(null);
  const [projects, setProjects] = useState<SimpleProject[]>([]);
  const [myProjectIds, setMyProjectIds] = useState<string[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTravel = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Get my org & role
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, role')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) {
        setLoading(false);
        return;
      }
      
      const isAdmin = profile.role === 'admin';

      // 2. Get projects where I am a member
      const { data: membership } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id);
      
      const myIds = membership?.map(m => m.project_id) || [];
      setMyProjectIds(myIds);

      let projectsQuery = supabase
        .from('projects')
        .select('id, name, start_date') // Fetch minimal info
        .eq('organization_id', profile.organization_id);

      // If not Admin, ONLY show projects where I am a member
      if (!isAdmin) {
        if (myIds.length === 0) {
          setTrip(null);
          setProjects([]);
          setLoading(false);
          return;
        }
        projectsQuery = projectsQuery.in('id', myIds);
      }

      const { data: projectsData, error: projError } = await projectsQuery.order('start_date', { ascending: true });

      if (projError) throw projError;

      setProjects(projectsData || []);

      if (!projectsData || projectsData.length === 0) {
        setTrip(null);
        setLoading(false);
        return;
      }

      // Determine active ID
      const targetId = selectedProjectId && projectsData.find(p => p.id === selectedProjectId) 
        ? selectedProjectId 
        : projectsData[0].id;

      if (!selectedProjectId) setSelectedProjectId(targetId);

      // 3. Get Details for Target Project
      const { data: activeProject } = await supabase
        .from('projects')
        .select('*')
        .eq('id', targetId)
        .single();

      // Tickets
      let ticketsQuery = supabase
        .from('logistics_tickets')
        .select('*, profiles:user_id(full_name)')
        .eq('project_id', targetId);

      if (!isAdmin) {
        ticketsQuery = ticketsQuery.or(`user_id.eq.${user.id},user_id.is.null`);
      }
      
      const { data: tickets } = await ticketsQuery.order('departure_time', { ascending: true });

      // Hotels
      const { data: accommodations } = await supabase
        .from('accommodations')
        .select('*')
        .eq('project_id', targetId);

      // Format for UI
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
  }, [selectedProjectId]);

  useEffect(() => {
    fetchTravel();
  }, [selectedProjectId]);

  useFocusEffect(
    useCallback(() => {
      fetchTravel();
    }, [])
  );

  return { 
      trip, 
      loading, 
      projects, 
      selectedProjectId, 
      isMemberOfActiveTrip: selectedProjectId ? myProjectIds.includes(selectedProjectId) : false,
      selectProject: setSelectedProjectId,
      refreshTravel: fetchTravel 
  };
}