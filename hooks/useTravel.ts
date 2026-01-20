import { useState, useEffect } from "react";
import { useProjects } from "./useProjects";
import { useProjectDetails } from "./useProjectDetails";
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
  const { projects, myProjectIds, loading: loadingProjects, refreshProjects } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  // Auto-select first project if none selected
  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const { tickets, accommodations, loading: loadingDetails, refreshDetails } = useProjectDetails(selectedProjectId);

  const activeProject = projects.find(p => p.id === selectedProjectId);

  const trip: TripDetails | null = activeProject ? {
    id: activeProject.id,
    name: activeProject.name,
    description: activeProject.description,
    dates: `${activeProject.start_date || '?'} - ${activeProject.end_date || '?'}`,
    tickets: tickets,
    accommodations: accommodations,
  } : null;

  const refreshTravel = async () => {
    await refreshProjects();
    await refreshDetails();
  };

  return {
    trip,
    loading: loadingProjects || loadingDetails,
    projects: projects.map(p => ({ id: p.id, name: p.name, start_date: p.start_date })), // Mapping to SimpleProject if needed or just use Project
    selectedProjectId,
    isMemberOfActiveTrip: selectedProjectId ? myProjectIds.includes(selectedProjectId) : false,
    selectProject: setSelectedProjectId,
    refreshTravel
  };
}
