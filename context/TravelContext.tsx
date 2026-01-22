import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // 1. Fetch Projects List
  const { data: projectsData, isLoading: loadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: profile } = await supabase.from('profiles').select('organization_id, role').eq('id', user.id).single();
      if (!profile) return [];

      const { data: membership } = await supabase.from('project_members').select('project_id').eq('user_id', user.id);
      const myIds = membership?.map(m => m.project_id) || [];

      let query = supabase.from('projects').select('id, name, start_date').eq('organization_id', profile.organization_id);
      if (profile.role !== 'admin') {
        if (myIds.length === 0) return [];
        query = query.in('id', myIds);
      }

      const { data } = await query.order('start_date', { ascending: true });
      return (data || []) as SimpleProject[];
    }
  });

  // Auto-select first project
  useEffect(() => {
    if (!selectedProjectId && projectsData && projectsData.length > 0) {
      setSelectedProjectId(projectsData[0].id);
    }
  }, [projectsData, selectedProjectId]);

  // 2. Fetch Trip Details (only if selectedProjectId exists)
  const { data: tripDetails, isLoading: loadingDetails } = useQuery({
    queryKey: ['trip-details', selectedProjectId],
    enabled: !!selectedProjectId,
    queryFn: async () => {
      if (!selectedProjectId) return null;

      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single();

      const [projRes, ticketsRes, accRes] = await Promise.all([
        supabase.from('projects').select('*').eq('id', selectedProjectId).single(),
        supabase.from('logistics_tickets').select('*, profiles:user_id(full_name)').eq('project_id', selectedProjectId).order('departure_time', { ascending: true }),
        supabase.from('accommodations').select('*').eq('project_id', selectedProjectId)
      ]);

      if (!projRes.data) return null;

      let tickets = (ticketsRes.data || []) as LogisticsTicket[];
      if (profile?.role !== 'admin' && user) {
        tickets = tickets.filter(t => !t.user_id || t.user_id === user.id);
      }

      return {
        id: projRes.data.id,
        name: projRes.data.name,
        description: projRes.data.description,
        dates: `${projRes.data.start_date || '?'} - ${projRes.data.end_date || '?'}`,
        tickets,
        accommodations: (accRes.data || []) as Accommodation[],
      } as TripDetails;
    }
  });

  // 3. Check Membership (for the current project)
  const { data: myProjectIds = [] } = useQuery({
    queryKey: ['my-project-ids'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase.from('project_members').select('project_id').eq('user_id', user.id);
      return data?.map(m => m.project_id) || [];
    }
  });

  const refreshTravel = async () => {
    await queryClient.invalidateQueries({ queryKey: ['projects'] });
    await queryClient.invalidateQueries({ queryKey: ['trip-details'] });
  };

  const value = {
    trip: tripDetails || null,
    projects: projectsData || [],
    selectedProjectId,
    loading: loadingProjects || loadingDetails,
    isMemberOfActiveTrip: selectedProjectId ? myProjectIds.includes(selectedProjectId) : false,
    refreshTravel,
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