import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Expense } from '../types';
import { Alert } from 'react-native';

export function useExpenses() {
  const queryClient = useQueryClient();

  // 1. Fetch User Role (Needed for logic)
  const { data: userRole } = useQuery({
    queryKey: ['user-role'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      return data?.role || 'staff';
    }
  });

  // 2. Fetch Expenses
  const { data: expenses = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*, profiles:user_id(full_name, avatar_url)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Expense[];
    }
  });

  // 3. Create Expense Mutation
  const createMutation = useMutation({
    mutationFn: async ({ data, imageUri }: { data: Partial<Expense>; imageUri?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
      if (!profile?.organization_id) throw new Error("No organization assigned");

      let receiptUrl = null;

      if (imageUri) {
        const response = await fetch(imageUri);
        const blob = await response.arrayBuffer();
        const fileName = `${user.id}/${Date.now()}.jpg`;
        
        const { error: uploadError } = await supabase.storage
          .from("receipts")
          .upload(fileName, blob, { contentType: "image/jpeg" });

        if (uploadError) throw uploadError;
        
        const { data: publicUrl } = supabase.storage.from("receipts").getPublicUrl(fileName);
        receiptUrl = publicUrl.publicUrl;
      }

      const { error } = await supabase.from("expenses").insert({
        ...data,
        user_id: user.id,
        organization_id: profile.organization_id,
        receipt_url: receiptUrl,
        status: "pending"
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message);
    }
  });

  // 4. Update Status Mutation (Approve/Reject)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => {
      const { error } = await supabase.from('expenses').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message);
    }
  });

  return {
    expenses,
    loading,
    userRole,
    refreshExpenses: refetch,
    createExpense: (data: Partial<Expense>, imageUri?: string) => createMutation.mutateAsync({ data, imageUri }),
    updateExpenseStatus: (id: string, status: 'approved' | 'rejected') => updateStatusMutation.mutateAsync({ id, status })
  };
}