import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter, Stack, useLocalSearchParams } from "expo-router";
import { supabase } from "../../lib/supabase";
import { Expense } from "../../types";
import { useTranslation } from "../../hooks/useTranslation";

const CATEGORIES = [
  { id: "transport", icon: "train" },
  { id: "accommodation", icon: "hotel" },
  { id: "fuel", icon: "gas-pump" },
  { id: "parking", icon: "parking" },
  { id: "meals", icon: "utensils" },
  { id: "other", icon: "receipt" },
];

/**
 * ExpenseDetailScreen
 * 
 * Displays detailed information about a specific expense.
 * Allows editing or deleting the expense if its status is 'pending'.
 */
export default function ExpenseDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { t } = useTranslation();
  
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form State for Editing
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    fetchExpense();
  }, [id]);

  async function fetchExpense() {
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select("*, profiles:user_id(full_name)")
        .eq("id", id)
        .single();

      if (error) throw error;
      
      setExpense(data);
      // Init form state
      setAmount(String(data.amount));
      setCategory(data.category);
      setDescription(data.description || "");
      setImage(data.receipt_url);

    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not load expense details");
    } finally {
      setLoading(false);
    }
  }

  // Handlers
  const handleEditStart = useCallback(() => setIsEditing(true), []);
  const handleEditCancel = useCallback(() => setIsEditing(false), []);

  const handleDelete = () => {
    Alert.alert("Delete Expense", "Are you sure? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: async () => {
          setSaving(true);
          const { error } = await supabase.from("expenses").delete().eq("id", id);
          if (error) Alert.alert("Error", error.message);
          else router.back();
        } 
      }
    ]);
  };

  const validateExpenseForm = () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
       Alert.alert("Invalid Amount", "Please enter a valid positive amount.");
       return false;
    }
    if (!category) {
       Alert.alert("Missing Category", "Please select a category.");
       return false;
    }
    return true;
  }

  const handleUpdate = async () => {
    if (!validateExpenseForm()) return;

    setSaving(true);
    try {
      const updates = {
        amount: Number(amount),
        category,
        description,
        status: 'pending' // Re-submit for approval if edited
      };

      const { error } = await supabase
        .from("expenses")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      
      Alert.alert("Success", "Expense updated!");
      setIsEditing(false);
      fetchExpense(); // Refresh
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#D9381E" />
      </View>
    );
  }

  if (!expense) return null;

  const isPending = expense.status === "pending";

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: isEditing ? t('edit_expense') : t('expense_details'),
          headerRight: () => (
            isPending && !isEditing ? (
              <TouchableOpacity onPress={handleEditStart}>
                <Text className="text-brand-red font-bold text-base">Edit</Text>
              </TouchableOpacity>
            ) : null
          ),
        }}
      />

      <ScrollView className="flex-1 px-6 pt-6">
        {/* STATUS BANNER */}
        {!isEditing && (
            <View className={`mb-6 p-3 rounded-xl flex-row items-center justify-center ${
                expense.status === 'approved' ? 'bg-green-100' : 
                expense.status === 'rejected' ? 'bg-red-100' : 'bg-yellow-100'
            }`}>
                <FontAwesome5 
                    name={expense.status === 'approved' ? "check-circle" : expense.status === 'rejected' ? "times-circle" : "clock"} 
                    size={16} 
                    color={expense.status === 'approved' ? "#15803D" : expense.status === 'rejected' ? "#B91C1C" : "#A16207"} 
                />
                <Text className={`ml-2 font-bold uppercase ${
                    expense.status === 'approved' ? "text-green-800" : 
                    expense.status === 'rejected' ? "text-red-800" : "text-yellow-800"
                }`}>
                    Status: {expense.status}
                </Text>
            </View>
        )}

        {/* AMOUNT */}
        <View className="mb-6 items-center">
          <Text className="text-gray-500 mb-1">{t('total_amount')}</Text>
          {isEditing ? (
             <View className="flex-row items-center border-b border-gray-300 pb-1">
                <Text className="text-3xl font-bold text-gray-400 mr-2">¥</Text>
                <TextInput 
                    className="text-4xl font-bold text-brand-dark min-w-[100px] text-center"
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                />
             </View>
          ) : (
             <Text className="text-4xl font-bold text-brand-dark">¥{expense.amount.toLocaleString()}</Text>
          )}
        </View>

        {/* DETAILS GRID */}
        <View className="space-y-6">
            <View>
                <Text className="text-gray-500 font-bold mb-2 uppercase text-xs">{t('category')}</Text>
                {isEditing ? (
                    <View className="flex-row flex-wrap gap-2">
                        {CATEGORIES.map(cat => (
                            <TouchableOpacity
                                key={cat.id}
                                onPress={() => setCategory(cat.id)}
                                className={`px-3 py-2 rounded-lg border ${category === cat.id ? 'bg-red-50 border-brand-red' : 'bg-white border-gray-200'}`}
                            >
                                <Text className={category === cat.id ? 'text-brand-red font-bold' : 'text-gray-600'}>{t(('cat_' + cat.id) as any)}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : (
                    <View className="flex-row items-center bg-gray-50 p-3 rounded-xl self-start">
                        <FontAwesome5 name={CATEGORIES.find(c => c.id === expense.category)?.icon || 'receipt'} size={16} color="#4B5563" />
                        <Text className="ml-2 text-brand-dark font-medium capitalize">{t(('cat_' + expense.category) as any)}</Text>
                    </View>
                )}
            </View>

            <View>
                <Text className="text-gray-500 font-bold mb-2 uppercase text-xs">{t('description')}</Text>
                {isEditing ? (
                    <TextInput 
                        className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-brand-dark"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                    />
                ) : (
                    <Text className="text-lg text-brand-dark">{expense.description || "No description"}</Text>
                )}
            </View>

            <View>
                <Text className="text-gray-500 font-bold mb-2 uppercase text-xs">{t('receipt')}</Text>
                {image ? (
                    <TouchableOpacity activeOpacity={0.9}>
                        <Image 
                            source={{ uri: image }} 
                            className="w-full h-64 bg-gray-100 rounded-xl border border-gray-200" 
                            resizeMode="contain" 
                        />
                    </TouchableOpacity>
                ) : (
                    <View className="w-full h-32 bg-gray-50 rounded-xl items-center justify-center border-2 border-dashed border-gray-200">
                        <Text className="text-gray-400">No receipt attached</Text>
                    </View>
                )}
            </View>
        </View>

        {/* ACTION BUTTONS (EDIT MODE) */}
        {isEditing && (
            <View className="mt-10 gap-3 mb-10">
                <TouchableOpacity 
                    onPress={handleUpdate}
                    disabled={saving}
                    className="bg-brand-red p-4 rounded-xl items-center"
                >
                    {saving ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">{t('save_changes')}</Text>}
                </TouchableOpacity>

                <TouchableOpacity 
                    onPress={handleEditCancel}
                    disabled={saving}
                    className="bg-gray-200 p-4 rounded-xl items-center"
                >
                    <Text className="text-gray-700 font-bold text-lg">Cancel</Text>
                </TouchableOpacity>
            </View>
        )}

        {/* DELETE BUTTON (Only if pending and not editing) */}
        {isPending && !isEditing && (
            <TouchableOpacity 
                onPress={handleDelete}
                className="mt-10 mb-10 bg-white border border-red-200 p-4 rounded-xl items-center"
            >
                <Text className="text-red-600 font-bold">{t('delete_expense')}</Text>
            </TouchableOpacity>
        )}

      </ScrollView>
    </View>
  );
}