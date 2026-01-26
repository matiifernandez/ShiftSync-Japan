import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Expense } from '../types';
import { Alert } from 'react-native';
import { useOfflineQueue, UploadTask } from './useOfflineQueue';

export function useExpenses() {
  const queryClient = useQueryClient();
  const { queue, addToQueue } = useOfflineQueue();

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
  const { data: serverExpenses = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*, profiles:user_id(full_name, avatar_url)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Expense[];
    },
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  // Combine Server + Offline Queue
  // We map offline tasks to the Expense structure
  const offlineExpenses: Expense[] = queue.map((task: UploadTask) => ({
    id: task.id, // temp-ID
    user_id: 'me',
    created_at: new Date(task.createdAt).toISOString(),
    amount: task.expenseData.amount,
    category: task.expenseData.category,
    description: task.expenseData.description,
    status: 'pending',
    receipt_url: task.imageUri, // Local URI
    organization_id: 'offline', // Placeholder
    profiles: {
      full_name: 'Me (Offline)',
      avatar_url: undefined
    }
  }));

  // Merge and sort (newest first)
  const expenses = [...offlineExpenses, ...serverExpenses].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // 3. Create Expense Mutation
  const createMutation = useMutation({
    mutationFn: async ({ data, imageUri }: { data: Partial<Expense>; imageUri?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
      if (!profile?.organization_id) throw new Error("No organization assigned");

      let receiptUrl = null;

      try {
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

      } catch (error) {
        // If upload/insert fails (likely offline), add to queue
        console.log("Create failed, adding to offline queue...", error);
        
        await addToQueue({
          id: `temp-${Date.now()}`,
          expenseData: data,
          imageUri: imageUri || '',
          createdAt: Date.now()
        });

        // Throw special error to handle UI feedback
        throw new Error("OFFLINE_SAVED");
      }
    },
    onMutate: async ({ data, imageUri }) => {
      // We rely on 'queue' state for persistent offline items, 
      // but we can still use optimistic updates for immediate feedback before the queue state updates.
      await queryClient.cancelQueries({ queryKey: ['expenses'] });
      const previousExpenses = queryClient.getQueryData<Expense[]>(['expenses']);

      return { previousExpenses };
    },
    onError: (err, variables, context) => {
      if (err.message === "OFFLINE_SAVED") {
        Alert.alert("Offline", "Expense saved locally. Will sync when online.");
      } else {
        Alert.alert("Error", err.message);
      }
      
      // We don't necessarily need to rollback if it's saved offline,
      // because the 'queue' state will pick it up shortly.
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    }
  });

  // 4. Update Status Mutation (Approve/Reject)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => {
      const { error } = await supabase.from('expenses').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['expenses'] });
      const previousExpenses = queryClient.getQueryData<Expense[]>(['expenses']);

      queryClient.setQueryData<Expense[]>(['expenses'], (old) => 
        old?.map(e => e.id === id ? { ...e, status } : e)
      );

      return { previousExpenses };
    },
    onError: (err, variables, context) => {
      if (context?.previousExpenses) {
        queryClient.setQueryData(['expenses'], context.previousExpenses);
      }
      Alert.alert("Error", err.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    }
  });

  return {
    expenses,
    loading,
    userRole,
    refreshExpenses: refetch,
    createExpense: async (data: Partial<Expense>, imageUri?: string) => {
      try {
        await createMutation.mutateAsync({ data, imageUri });
        return true;
      } catch (e: any) {
        // If it was saved offline, return true as if success
        if (e.message === "OFFLINE_SAVED") return true;
        return false;
      }
    },
    updateExpenseStatus: (id: string, status: 'approved' | 'rejected') => updateStatusMutation.mutateAsync({ id, status })
  };
}