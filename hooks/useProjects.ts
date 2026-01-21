import { useState, useCallback, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Project } from "../types";

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myProjectIds, setMyProjectIds] = useState<string[]>([]);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("useProjects: No user found, skipping fetch.");
        setProjects([]);
        setLoading(false);
        return;
      }

      // 1. Get my org & role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id, role')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.organization_id) {
        throw new Error("Profile or Organization not found");
      }
      
      const isAdmin = profile.role === 'admin';

      // 2. Get projects where I am a member (Always useful to know membership)
      const { data: membership, error: memError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id);
      
      if (memError) throw memError;

      const myIds = membership?.map((m: { project_id: string }) => m.project_id) || [];
      setMyProjectIds(myIds);

      // 3. Build Query
      let projectsQuery = supabase
        .from('projects')
        .select('*')
        .eq('organization_id', profile.organization_id);

      // If not Admin, ONLY show projects where I am a member
      if (!isAdmin) {
        if (myIds.length === 0) {
          setProjects([]);
          setLoading(false);
          return;
        }
        projectsQuery = projectsQuery.in('id', myIds);
      }

      const { data: projectsData, error: projError } = await projectsQuery.order('start_date', { ascending: true });

      if (projError) throw projError;

      setProjects(projectsData || []);

    } catch (err: any) {
      console.error("Error fetching projects:", err);
      setError(err.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return { 
    projects, 
    myProjectIds, 
    loading, 
    error, 
    refreshProjects: fetchProjects 
  };
}
