import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Project, LogisticsTicket, Accommodation } from '../types';

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

interface TravelContextType {
  trip: TripDetails | null;
  projects: SimpleProject[];
  selectedProjectId: string | null;
  loading: boolean;
  isMemberOfActiveTrip: boolean;
  refreshTravel: () => Promise<void>;
  selectProject: (id: string) => void;
}

const TravelContext = createContext<TravelContextType | undefined>(undefined);

export const TravelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trip, setTrip] = useState<TripDetails | null>(null);
  const [projects, setProjects] = useState<SimpleProject[]>([]);
  const [myProjectIds, setMyProjectIds] = useState<string[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTravel = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // 1. Get profile & membership
      const { data: profile } = await supabase.from('profiles').select('organization_id, role').eq('id', user.id).single();
      if (!profile) {
        setLoading(false);
        return;
      }

      const { data: membership } = await supabase.from('project_members').select('project_id').eq('user_id', user.id);
      const myIds = membership?.map(m => m.project_id) || [];
      setMyProjectIds(myIds);

      // 2. Fetch Projects
      let projectsQuery = supabase.from('projects').select('id, name, start_date').eq('organization_id', profile.organization_id);
      if (profile.role !== 'admin') {
        if (myIds.length === 0) {
          setTrip(null);
          setProjects([]);
          setLoading(false);
          return;
        }
        projectsQuery = projectsQuery.in('id', myIds);
      }

      const { data: projectsData } = await projectsQuery.order('start_date', { ascending: true });
      setProjects(projectsData || []);

      if (!projectsData || projectsData.length === 0) {
        setTrip(null);
        setLoading(false);
        return;
      }

      // 3. Determine target project and fetch details
      const targetId = selectedProjectId && projectsData.find(p => p.id === selectedProjectId) 
        ? selectedProjectId 
        : projectsData[0].id;

      if (!selectedProjectId) setSelectedProjectId(targetId);

      const [projRes, ticketsRes, accRes] = await Promise.all([
        supabase.from('projects').select('*').eq('id', targetId).single(),
        supabase.from('logistics_tickets').select('*, profiles:user_id(full_name)').eq('project_id', targetId).order('departure_time', { ascending: true }),
        supabase.from('accommodations').select('*').eq('id', targetId) // Note: schema says project_id but check if this is correct
      ]);

      // Actually accommodations query should be by project_id
      const { data: accommodations } = await supabase.from('accommodations').select('*').eq('project_id', targetId);

      if (projRes.data) {
        let finalTickets = (ticketsRes.data || []) as LogisticsTicket[];
        if (profile.role !== 'admin') {
          // Client-side filtering for extra safety if RLS isn't enough
          finalTickets = finalTickets.filter(t => !t.user_id || t.user_id === user.id);
        }

        setTrip({
          id: projRes.data.id,
          name: projRes.data.name,
          description: projRes.data.description,
          dates: `${projRes.data.start_date || '?'} - ${projRes.data.end_date || '?'}`,
          tickets: finalTickets,
          accommodations: (accommodations as Accommodation[]) || [],
        });
      }

    } catch (error) {
      console.error("TravelContext: Error fetching travel:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    fetchTravel();
  }, [fetchTravel]);

  const value = {
    trip,
    projects,
    selectedProjectId,
    loading,
    isMemberOfActiveTrip: selectedProjectId ? myProjectIds.includes(selectedProjectId) : false,
    refreshTravel: fetchTravel,
    selectProject: setSelectedProjectId
  };

  return <TravelContext.Provider value={value}>{children}</TravelContext.Provider>;
};

export const useTravelContext = () => {
  const context = useContext(TravelContext);
  if (context === undefined) {
    throw new Error('useTravelContext must be used within a TravelProvider');
  }
  return context;
};
