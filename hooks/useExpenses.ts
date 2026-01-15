import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { Expense } from "../types";
import { Alert } from "react-native";

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<"admin" | "staff" | null>(null);

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Get my role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      
      setUserRole(profile?.role || "staff");

      // 2. Fetch expenses (Policy handles filtering)
      const { data, error } = await supabase
        .from("expenses")
        .select("*, profiles:user_id(full_name, avatar_url)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createExpense = async (expenseData: Partial<Expense>, imageUri?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get profile for organization_id
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (!profile?.organization_id) throw new Error("No organization assigned");

      let receiptUrl = null;

      // 1. Upload receipt if exists
      if (imageUri) {
        const response = await fetch(imageUri);
        const blob = await response.arrayBuffer();
        const fileName = `${user.id}/${Date.now()}.jpg`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("receipts")
          .upload(fileName, blob, { contentType: "image/jpeg" });

        if (uploadError) throw uploadError;
        
        const { data: publicUrl } = supabase.storage
          .from("receipts")
          .getPublicUrl(fileName);
        
        receiptUrl = publicUrl.publicUrl;
      }

      // 2. Insert expense
      const { error } = await supabase.from("expenses").insert({
        ...expenseData,
        user_id: user.id,
        organization_id: profile.organization_id,
        receipt_url: receiptUrl,
        status: "pending"
      });

      if (error) throw error;
      await fetchExpenses();
      return true;
    } catch (error: any) {
      Alert.alert("Error", error.message);
      return false;
    }
  };

  const updateExpenseStatus = async (id: string, status: "approved" | "rejected") => {
    try {
      const { error } = await supabase
        .from("expenses")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
      await fetchExpenses();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return {
    expenses,
    loading,
    userRole,
    refreshExpenses: fetchExpenses,
    createExpense,
    updateExpenseStatus
  };
}
