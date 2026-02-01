import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export type UserRole = "admin" | "staff" | null;

export function useUserRole() {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          setRole((data?.role as UserRole) || 'staff');
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      } finally {
        setLoading(false);
      }
    }
    getRole();
  }, []);

  return { role, loading, isAdmin: role === 'admin' };
}
