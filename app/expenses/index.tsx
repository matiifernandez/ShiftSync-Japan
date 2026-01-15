import React, { useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { useRouter, Stack, useFocusEffect } from "expo-router";
import { useExpenses } from "../../hooks/useExpenses";
import { Expense } from "../../types";

export default function ExpensesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { expenses, loading, refreshExpenses, userRole, updateExpenseStatus } = useExpenses();

  useFocusEffect(
    useCallback(() => {
      refreshExpenses();
    }, [])
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "transport":
        return "train";
      case "accommodation":
        return "hotel";
      case "fuel":
        return "gas-pump";
      case "parking":
        return "parking";
      case "meals":
        return "utensils";
      default:
        return "receipt";
    }
  };

  const renderExpenseItem = ({ item }: { item: Expense }) => {
    const isPending = item.status === "pending";
    const isAdmin = userRole === "admin";

    return (
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={() => router.push({ pathname: "/expenses/[id]", params: { id: item.id } })}
        className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100"
      >
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-row items-center">
            <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3">
              <FontAwesome5
                name={getCategoryIcon(item.category)}
                size={18}
                color="#4B5563"
              />
            </View>
            <View>
              <Text className="text-brand-dark font-bold text-lg">
                ¥{item.amount.toLocaleString()}
              </Text>
              <Text className="text-gray-500 text-xs capitalize">
                {item.category} • {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
          <View
            className={`px-3 py-1 rounded-full border ${getStatusColor(
              item.status
            )}`}
          >
            <Text className="text-[10px] font-bold uppercase">
              {item.status}
            </Text>
          </View>
        </View>

        <Text className="text-gray-600 text-sm mb-4" numberOfLines={2}>
          {item.description || "No description provided"}
        </Text>

        {item.profiles && isAdmin && (
          <View className="flex-row items-center mb-4 pt-3 border-t border-gray-50">
            <View className="w-6 h-6 bg-gray-200 rounded-full items-center justify-center overflow-hidden mr-2">
              {item.profiles.avatar_url ? (
                <Image source={{ uri: item.profiles.avatar_url }} className="w-full h-full" />
              ) : (
                <Ionicons name="person" size={12} color="#9CA3AF" />
              )}
            </View>
            <Text className="text-gray-500 text-xs">Submitted by: {item.profiles.full_name}</Text>
          </View>
        )}

        {/* ADMIN ACTIONS */}
        {isAdmin && isPending && (
          <View className="flex-row gap-3 pt-3 border-t border-gray-50">
            <TouchableOpacity
              onPress={() => updateExpenseStatus(item.id, "rejected")}
              className="flex-1 bg-gray-100 py-3 rounded-xl items-center"
            >
              <Text className="text-gray-600 font-bold">Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => updateExpenseStatus(item.id, "approved")}
              className="flex-1 bg-green-600 py-3 rounded-xl items-center"
            >
              <Text className="text-white font-bold">Approve</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Expenses / 経費",
          headerBackTitle: "Home",
          headerTitleStyle: { fontWeight: "bold" },
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#F9FAFB" },
        }}
      />

      <FlatList
        data={expenses}
        renderItem={renderExpenseItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingTop: 10 }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refreshExpenses} tintColor="#D9381E" />
        }
        ListEmptyComponent={
          !loading ? (
            <View className="items-center justify-center mt-20">
              <Ionicons name="receipt-outline" size={64} color="#E5E7EB" />
              <Text className="text-gray-400 mt-4 text-lg font-medium">No expenses found</Text>
            </View>
          ) : null
        }
      />

      {/* ADD BUTTON */}
      <TouchableOpacity
        onPress={() => router.push("/expenses/create")}
        style={{
          position: "absolute",
          bottom: insets.bottom + 20,
          right: 20,
          backgroundColor: "#D9381E",
          width: 56,
          height: 56,
          borderRadius: 28,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#D9381E",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 5,
        }}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
    </View>
  );
}
