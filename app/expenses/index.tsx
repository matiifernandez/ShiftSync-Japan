import React, { useCallback, useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { useRouter, Stack, useFocusEffect } from "expo-router";
import { format, parseISO } from "date-fns";
import { enUS, ja } from "date-fns/locale";
import { useExpenses } from "../../hooks/useExpenses";
import { Expense } from "../../types";
import { useTranslation } from "../../hooks/useTranslation";

export default function ExpensesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { expenses, loading, refreshExpenses, userRole, updateExpenseStatus } = useExpenses();
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

  const dateLocale = useMemo(() => locale === 'ja' ? ja : enUS, [locale]);

  // React Query handles fetching automatically


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

  const getStatusLabel = (status: string) => {
    switch (status) {
        case "approved": return t('status_approved');
        case "rejected": return t('status_rejected');
        default: return t('status_pending');
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "transport": return "train";
      case "accommodation": return "hotel";
      case "fuel": return "gas-pump";
      case "parking": return "parking";
      case "meals": return "utensils";
      default: return "receipt";
    }
  };

  // Filter Data
  const pendingExpenses = useMemo(() => 
    expenses.filter(e => e.status === 'pending'), 
  [expenses]);

  const historyExpenses = useMemo(() => {
    const history = expenses.filter(e => e.status !== 'pending');
    
    // Group by Month
    const grouped: { title: string; data: Expense[] }[] = [];
    history.forEach(item => {
      const month = format(parseISO(item.created_at), 'MMMM yyyy', { locale: dateLocale });
      const existing = grouped.find(g => g.title === month);
      if (existing) {
        existing.data.push(item);
      } else {
        grouped.push({ title: month, data: [item] });
      }
    });
    return grouped;
  }, [expenses, dateLocale]);

  const renderExpenseItem = ({ item }: { item: Expense }) => {
    const isPending = item.status === "pending";
    const isAdmin = userRole === "admin";
    const isOptimistic = item.id.startsWith("temp-");

    return (
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={() => router.push({ pathname: "/expenses/[id]", params: { id: item.id } })}
        disabled={isOptimistic} // Disable interaction while syncing
        className={`bg-white rounded-2xl p-4 mb-3 shadow-sm border ${isOptimistic ? 'border-yellow-300 opacity-70' : 'border-gray-100'}`}
      >
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-row items-center">
            <View className={`w-10 h-10 ${isOptimistic ? 'bg-yellow-50' : 'bg-gray-100'} rounded-full items-center justify-center mr-3`}>
              {isOptimistic ? (
                <Ionicons name="cloud-upload-outline" size={18} color="#D97706" />
              ) : (
                <FontAwesome5
                  name={getCategoryIcon(item.category)}
                  size={18}
                  color="#4B5563"
                />
              )}
            </View>
            <View>
              <Text className="text-brand-dark font-bold text-lg">
                ¥{item.amount.toLocaleString()}
              </Text>
              <Text className="text-gray-500 text-xs capitalize">
                {t(('cat_' + item.category) as any)} • {format(parseISO(item.created_at), 'MMM d', { locale: dateLocale })}
              </Text>
            </View>
          </View>
          <View
            className={`px-3 py-1 rounded-full border ${isOptimistic ? 'bg-yellow-100 border-yellow-200' : getStatusColor(item.status)}`}
          >
            <Text className={`text-[10px] font-bold uppercase ${isOptimistic ? 'text-yellow-700' : ''}`}>
              {isOptimistic ? t('syncing') : getStatusLabel(item.status)}
            </Text>
          </View>
        </View>

        {item.description ? (
          <Text className="text-gray-600 text-sm mb-3" numberOfLines={1}>
            {item.description}
          </Text>
        ) : null}

        {/* Profile info for Admin */}
        {item.profiles && isAdmin && (
          <View className="flex-row items-center pt-2 border-t border-gray-50 mt-1">
            <View className="w-5 h-5 bg-gray-200 rounded-full items-center justify-center overflow-hidden mr-2">
              {item.profiles.avatar_url ? (
                <Image source={{ uri: item.profiles.avatar_url }} className="w-full h-full" />
              ) : (
                <Ionicons name="person" size={10} color="#9CA3AF" />
              )}
            </View>
            <Text className="text-gray-400 text-xs">{item.profiles.full_name}</Text>
          </View>
        )}

        {/* ADMIN ACTIONS (Only in Pending Tab) */}
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
            <RefreshControl refreshing={loading} onRefresh={refreshExpenses} tintColor="#D9381E" />
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
            <RefreshControl refreshing={loading} onRefresh={refreshExpenses} tintColor="#D9381E" />
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
