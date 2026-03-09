import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import { useToast } from '../context/ToastContext';
import { useTranslation } from './useTranslation';

export function useCurrentUser() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t, changeLanguage } = useTranslation();

  // 1. Fetch Current Profile
  const { data: profile, isLoading: loading, refetch } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
      return data as Profile;
    }
  });

  // 2. Update Profile Mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<Profile> & { imageUri?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let avatarUrl = updates.avatar_url;

      // Handle image upload if a new local URI is provided
      if (updates.imageUri && !updates.imageUri.startsWith('http')) {
        const response = await fetch(updates.imageUri);
        const blob = await response.arrayBuffer();
        const fileName = `${user.id}_${Date.now()}.jpg`;
        
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, blob, {
            contentType: "image/jpeg",
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);
        
        avatarUrl = publicUrlData.publicUrl;
      }

      const { imageUri, ...profileUpdates } = updates;
      const finalUpdates = {
        ...profileUpdates,
        id: user.id,
        avatar_url: avatarUrl,
        updated_at: new Date(),
      };

      const { error } = await supabase.from("profiles").upsert(finalUpdates);
      if (error) throw error;

      return finalUpdates;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['current-user'], data);
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      queryClient.invalidateQueries({ queryKey: ['user-role'] }); // Invalidate role too just in case
      
      if (data.preferred_language) {
        changeLanguage(data.preferred_language as 'en' | 'ja');
      }
      
      showToast(t('profile_updated'), "success");
    },
    onError: (err: any) => {
      showToast(err.message, "error");
    }
  });

  return {
    profile,
    loading,
    refreshProfile: refetch,
    updateProfile: (updates: Partial<Profile> & { imageUri?: string }) => 
      updateProfileMutation.mutateAsync(updates),
    isUpdating: updateProfileMutation.isPending
  };
}
