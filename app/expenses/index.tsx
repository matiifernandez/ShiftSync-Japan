import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SectionList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useExpenses } from "../../hooks/useExpenses";
import { useTranslation } from "../../hooks/useTranslation";
import { Expense } from "../../types";
import { format, parseISO } from "date-fns";
import { useUserRole } from "../../hooks/useUserRole";
import { Colors } from "../../constants/Colors";
import { FAB } from "../../components/FAB";

/**
 * ExpensesScreen
 * 
 * Displays a list of expenses for the current user (Staff) or all expenses (Admin).
 * Features:
 * - Admin tabs: "Pending" and "History"
 * - Pull-to-refresh
 * - Inline Approval/Rejection for Admins
 * - Floating Action Button to create new expenses
 */
export default function ExpensesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { expenses, loading, refreshExpenses, updateExpenseStatus } = useExpenses();
  const { role: userRole, isAdmin } = useUserRole();
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

  // Filter logic
  const pendingExpenses = expenses.filter(e => e.status === 'pending');
  
  const historyExpenses = useMemo(() => {
    const historical = expenses.filter(e => e.status !== 'pending');
    // Group by month
    const groups: { [key: string]: Expense[] } = {};
    historical.forEach(e => {
      const month = format(parseISO(e.created_at), 'MMMM yyyy');
      if (!groups[month]) groups[month] = [];
      groups[month].push(e);
    });
    return Object.keys(groups).map(month => ({
      title: month,
      data: groups[month]
    }));
  }, [expenses]);

  const renderExpenseItem = ({ item }: { item: Expense }) => {
    const isPending = item.status === "pending";
    const dateStr = format(parseISO(item.created_at), "MMM d, yyyy");

    return (
      <TouchableOpacity
        onPress={() => router.push(`/expenses/${item.id}`)}
        className="bg-white p-4 rounded-2xl mb-4 shadow-sm border border-gray-100"
      >
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1">
            <Text className="text-brand-dark font-bold text-lg">¥{item.amount.toLocaleString()}</Text>
            <Text className="text-gray-500 text-xs">{dateStr}</Text>
          </View>
          <View className={`px-3 py-1 rounded-full ${
            item.status === 'approved' ? 'bg-green-100' : 
            item.status === 'rejected' ? 'bg-red-100' : 'bg-yellow-100'
          }`}>
            <Text className={`text-[10px] font-bold uppercase ${
              item.status === 'approved' ? 'text-green-700' : 
              item.status === 'rejected' ? 'text-red-700' : 'text-yellow-700'
            }`}>
              {t(('status_' + item.status) as any)}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center mb-2">
          <View className="bg-gray-100 px-2 py-1 rounded-md mr-2">
            <Text className="text-gray-600 text-[10px] font-bold uppercase">{t(('cat_' + item.category) as any)}</Text>
          </View>
          <Text className="text-gray-400 text-xs" numberOfLines={1}>{item.description || t('no_description')}</Text>
        </View>

        {/* User Info (Admin Only) */}
        {isAdmin && item.profiles && (
          <View className="flex-row items-center mt-1">
            <Ionicons name="person-outline" size={12} color="#9CA3AF" />
            <Text className="text-gray-400 text-[10px] ml-1">{item.profiles.full_name}</Text>
          </View>
        )}

        {/* Admin Quick Actions */}
        {isAdmin && isPending && (
          <View className="flex-row gap-3 pt-3 border-t border-gray-100 mt-3">
            <TouchableOpacity
              onPress={() => updateExpenseStatus(item.id, "rejected")}
              className="flex-1 bg-gray-100 py-2 rounded-lg items-center"
            >
              <Text className="text-gray-600 font-bold text-xs">{t('reject')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => updateExpenseStatus(item.id, "approved")}
              className="flex-1 bg-green-600 py-2 rounded-lg items-center"
            >
              <Text className="text-white font-bold text-xs">{t('approve')}</Text>
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
          title: t('expenses_title'),
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()} 
              className="mr-4 p-2"
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
            </TouchableOpacity>
          ),
          headerTitleStyle: { fontWeight: "bold" },
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#F9FAFB" },
        }}
      />

      {/* ADMIN TABS */}
      {userRole === 'admin' && (
        <View className="flex-row px-5 mb-2">
          <TouchableOpacity 
            onPress={() => setActiveTab('pending')}
            className={`flex-1 items-center py-3 border-b-2 ${activeTab === 'pending' ? 'border-brand-red' : 'border-transparent'}`}
          >
            <Text className={`font-bold ${activeTab === 'pending' ? 'text-brand-red' : 'text-gray-400'}`}>
              {t('pending_tab')} ({pendingExpenses.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setActiveTab('history')}
            className={`flex-1 items-center py-3 border-b-2 ${activeTab === 'history' ? 'border-brand-red' : 'border-transparent'}`}
          >
            <Text className={`font-bold ${activeTab === 'history' ? 'text-brand-red' : 'text-gray-400'}`}>
              {t('history_tab')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* CONTENT */}
      {activeTab === 'pending' ? (
        <FlatList
          data={userRole === 'admin' ? pendingExpenses : expenses}
          renderItem={renderExpenseItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, paddingTop: 10 }}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refreshExpenses} tintColor={Colors.brand.red} />
          }
          ListEmptyComponent={
            !loading ? (
            <View className="items-center justify-center py-20">
              <View className="bg-green-50 w-20 h-20 rounded-full items-center justify-center">
                <Ionicons name="checkmark-done" size={40} color="#15803D" />
              </View>
              <Text className="text-gray-400 mt-4 text-lg font-medium">{t('all_caught_up')}</Text>
            </View>
            ) : null
          }
        />
      ) : (
        <SectionList
          sections={historyExpenses}
          keyExtractor={(item) => item.id}
          renderItem={renderExpenseItem}
          renderSectionHeader={({ section: { title } }) => (
            <View className="bg-gray-100 px-4 py-2 mt-2 mb-2 rounded-lg mx-5">
              <Text className="text-gray-500 font-bold text-xs uppercase">{title}</Text>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refreshExpenses} tintColor={Colors.brand.red} />
          }
          ListEmptyComponent={
            !loading ? (
              <View className="items-center justify-center mt-20">
                <Ionicons name="time-outline" size={64} color="#E5E7EB" />
                <Text className="text-gray-400 mt-4 text-lg font-medium">{t('no_history')}</Text>
              </View>
            ) : null
          }
        />
      )}

      {/* ADD BUTTON */}
      <FAB 
        onPress={() => router.push("/expenses/create")} 
        style={{ bottom: insets.bottom + 20 }}
      />
    </View>
  );
}
