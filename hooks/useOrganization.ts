import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

export function useOrganization() {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createOrganization = async (name: string) => {
    if (!name.trim()) throw new Error("Name is required");
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      // 1. Create Organization
      const inviteCode = generateInviteCode();
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({ 
            name: name.trim(),
            invite_code: inviteCode
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // 2. Update User Profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
            organization_id: org.id,
            role: 'admin'
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 3. Refresh Session
      await supabase.auth.refreshSession();

      return org;
    } catch (error: any) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const joinOrganization = async (code: string) => {
    if (!code || code.length < 6) throw new Error("Invalid code");

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      // 1. Find Org
      const { data: org, error: findError } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('invite_code', code.toUpperCase())
        .single();

      if (findError || !org) throw new Error("Invalid invite code");

      // 2. Update Profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
            organization_id: org.id,
            role: 'staff'
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 3. Refresh Session
      await supabase.auth.refreshSession();

      return org;
    } catch (error: any) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    createOrganization,
    joinOrganization,
    loading
  };
}
