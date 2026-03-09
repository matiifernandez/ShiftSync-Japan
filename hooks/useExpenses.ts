import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Expense } from '../types';
import { useOfflineQueue, UploadTask } from './useOfflineQueue';
import { useToast } from '../context/ToastContext';
import { useTranslation } from './useTranslation';

export function useExpenses() {
  const queryClient = useQueryClient();
  const { queue, addToQueue } = useOfflineQueue();
  const { showToast } = useToast();
  const { t } = useTranslation();

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

  const isAdmin = userRole === 'admin';

  // 2. Fetch Expenses List
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

  // 3. Single Expense Query
  const getExpense = (id: string) => {
    return useQuery({
      queryKey: ['expense', id],
      queryFn: async () => {
        // Check if it's an offline expense
        const offline = offlineExpenses.find(e => e.id === id);
        if (offline) return offline;

        const { data, error } = await supabase
          .from("expenses")
          .select("*, profiles:user_id(full_name)")
          .eq("id", id)
          .single();

        if (error) throw error;
        return data as Expense;
      },
      enabled: !!id
    });
  };

  // 4. Mutations
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
          receiptUrl = fileName;
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
        console.log("Create failed, adding to offline queue...", error);
        
        await addToQueue({
          id: `temp-${Date.now()}`,
          expenseData: data,
          imageUri: imageUri || '',
          createdAt: Date.now()
        });

        throw new Error("OFFLINE_SAVED");
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Expense> }) => {
      const { error } = await supabase
        .from("expenses")
        .update({ ...data, status: 'pending' }) // Reset to pending if edited
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense', id] });
      showToast(t('expense_updated'), 'success');
    },
    onError: (err: any) => showToast(err.message, 'error')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      showToast(t('expense_deleted'), 'success');
    },
    onError: (err: any) => showToast(err.message, 'error')
  });

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
      showToast(err.message, 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    }
  });

  return {
    expenses,
    loading,
    userRole,
    isAdmin,
    getExpense,
    refreshExpenses: refetch,
    createExpense: async (data: Partial<Expense>, imageUri?: string) => {
      try {
        await createMutation.mutateAsync({ data, imageUri });
        return true;
      } catch (e: any) {
        if (e.message === "OFFLINE_SAVED") return true;
        return false;
      }
    },
    updateExpense: (id: string, data: Partial<Expense>) => updateMutation.mutateAsync({ id, data }),
    deleteExpense: (id: string) => deleteMutation.mutateAsync(id),
    updateExpenseStatus: (id: string, status: 'approved' | 'rejected') => updateStatusMutation.mutateAsync({ id, status })
  };
}
