import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, RECEIPT_SIGNED_URL_EXPIRY } from '../lib/supabase';
import { Expense } from '../types';
import { useOfflineQueue, UploadTask } from './useOfflineQueue';
import { useToast } from '../context/ToastContext';
import { useTranslation } from './useTranslation';
import { useCurrentUser } from './useCurrentUser';

/**
 * useExpenses hook
 * Manages the list of expenses, creation, and status updates.
 */
export function useExpenses() {
  const queryClient = useQueryClient();
  const { queue, addToQueue } = useOfflineQueue();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const { profile: userProfile, loading: profileLoading } = useCurrentUser();

  const userRole = userProfile?.role || 'staff';
  const isAdmin = userRole === 'admin';
  const orgId = userProfile?.organization_id;

  // 1. Fetch Expenses List (Filtered by Organization)
  const { data: serverExpenses = [], isLoading: expensesLoading, refetch } = useQuery({
    queryKey: ['expenses', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      
      const { data, error } = await supabase
        .from('expenses')
        .select('*, profiles:user_id(full_name, avatar_url)')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Expense[];
    },
    enabled: !!orgId,
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
    organization_id: orgId || 'offline',
    profiles: {
      full_name: 'Me (Offline)',
      avatar_url: undefined
    }
  }));

  // Merge and sort (newest first)
  const expenses = [...offlineExpenses, ...serverExpenses].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // 2. Mutations
  const createMutation = useMutation({
    mutationFn: async ({ data, imageUri }: { data: Partial<Expense>; imageUri?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      if (!orgId) throw new Error("No organization assigned");

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
          organization_id: orgId,
          receipt_url: receiptUrl,
          status: "pending"
        });

        if (error) throw error;

      } catch (error) {
        console.log("Create failed, adding to offline queue...", error);
        
        await addToQueue({
          id: `temp-${Date.now()}`,
          expenseData: { ...data, organization_id: orgId },
          imageUri: imageUri || '',
          createdAt: Date.now()
        });

        throw new Error("OFFLINE_SAVED");
      }
    },
    onError: (err: any) => {
        if (err.message === "OFFLINE_SAVED") {
            showToast(t('offline_msg'), 'success');
        } else {
            showToast(err.message, 'error');
        }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', orgId] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Expense> }) => {
      if (!orgId) throw new Error("No organization assigned");
      
      const { error } = await supabase
        .from("expenses")
        .update({ ...data, status: 'pending' }) // Reset to pending if edited
        .eq("id", id)
        .eq("organization_id", orgId);
      if (error) throw error;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['expenses', orgId] });
      queryClient.invalidateQueries({ queryKey: ['expense', orgId, id] });
      showToast(t('expense_updated'), 'success');
    },
    onError: (err: any) => showToast(err.message, 'error')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!orgId) throw new Error("No organization assigned");

      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", id)
        .eq("organization_id", orgId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', orgId] });
      showToast(t('expense_deleted'), 'success');
    },
    onError: (err: any) => showToast(err.message, 'error')
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => {
      if (!orgId) throw new Error("No organization assigned");

      const { error } = await supabase
        .from('expenses')
        .update({ status })
        .eq('id', id)
        .eq('organization_id', orgId);
      if (error) throw error;
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['expenses', orgId] });
      const previousExpenses = queryClient.getQueryData<Expense[]>(['expenses', orgId]);

      if (previousExpenses) {
        queryClient.setQueryData<Expense[]>(['expenses', orgId], (old) => 
          old?.map(e => e.id === id ? { ...e, status } : e)
        );
      }

      return { previousExpenses };
    },
    onError: (err, variables, context) => {
      if (context?.previousExpenses) {
        queryClient.setQueryData(['expenses', orgId], context.previousExpenses);
      }
      showToast(err.message, 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', orgId] });
    }
  });

  return {
    expenses,
    loading: profileLoading || expensesLoading,
    userRole,
    isAdmin,
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

/**
 * useExpense hook
 * Fetches a single expense by ID, scoped by organization.
 * Also resolves receipt signed URL if needed.
 */
export function useExpense(id: string) {
  const { queue } = useOfflineQueue();
  const { profile: userProfile, loading: profileLoading } = useCurrentUser();
  const orgId = userProfile?.organization_id;

  const query = useQuery({
    queryKey: ['expense', orgId, id],
    queryFn: async () => {
      if (!orgId) throw new Error("No organization assigned");

      // 1. Check if it's an offline expense in the queue
      const offlineTask = queue.find(t => t.id === id);
      let expense: Expense;

      if (offlineTask) {
        expense = {
            id: offlineTask.id,
            user_id: 'me',
            created_at: new Date(offlineTask.createdAt).toISOString(),
            amount: offlineTask.expenseData.amount,
            category: offlineTask.expenseData.category,
            description: offlineTask.expenseData.description,
            status: 'pending',
            receipt_url: offlineTask.imageUri,
            organization_id: orgId,
            profiles: {
                full_name: 'Me (Offline)',
                avatar_url: undefined
            }
        } as Expense;
      } else {
        // 2. Fetch from Server, scoped by orgId
        const { data, error } = await supabase
          .from("expenses")
          .select("*, profiles:user_id(full_name, avatar_url)")
          .eq("id", id)
          .eq("organization_id", orgId)
          .single();

        if (error) throw error;
        expense = data as Expense;
      }

      // 3. Resolve Receipt URL (Internal Helper Logic)
      let resolvedReceiptUrl = expense.receipt_url;
      if (expense.receipt_url && !expense.receipt_url.startsWith('http')) {
        const { data: signed, error: signedError } = await supabase.storage
          .from('receipts')
          .createSignedUrl(expense.receipt_url, RECEIPT_SIGNED_URL_EXPIRY);
        
        if (signedError) {
            console.error("Error generating signed URL", signedError);
        } else {
            resolvedReceiptUrl = signed?.signedUrl ?? expense.receipt_url;
        }
      }

      return {
        ...expense,
        receipt_url: resolvedReceiptUrl
      };
    },
    enabled: !!id && !!orgId
  });

  return {
    ...query,
    isLoading: profileLoading || query.isLoading
  };
}
