import React from "react";
import { View, Text, TouchableOpacity, Share, FlatList, Image, ActivityIndicator } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "../../hooks/useTranslation";
import { useOrganizationDetails } from "../../hooks/useOrganizationDetails";
import { useStaff } from "../../hooks/useStaff";
import { useToast } from "../../context/ToastContext";

export default function TeamManagementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { showToast } = useToast();
  
  // Data Hooks
  const { organization, loading: loadingOrg } = useOrganizationDetails();
  const { staff, loading: loadingStaff } = useStaff();

  const handleCopyCode = async () => {
    if (organization?.invite_code) {
      await Clipboard.setStringAsync(organization.invite_code);
      showToast(t('code_copied'), "success");
    }
  };

  const handleShare = async () => {
    if (!organization) return;
    try {
      const message = `${t('join_team_instruction')} Code: ${organization.invite_code}`;
      await Share.share({
        message,
        title: t('invite_member'),
      });
    } catch (error) {
      // Share cancelled or failed silently
    }
  };

  if (loadingOrg || loadingStaff) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#D9381E" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: t('team_management'),
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()} 
              className="mr-4 p-2 -ml-2"
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={24} color="#D9381E" />
            </TouchableOpacity>
          ),
          headerTintColor: "#D9381E",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#F9FAFB" },
        }} 
      />

      <View className="flex-1 px-6 pt-4">
        
        {/* INVITE CODE CARD */}
        <View className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8 items-center">
          <View className="bg-brand-red/10 w-16 h-16 rounded-full items-center justify-center mb-4">
            <FontAwesome5 name="users" size={24} color="#D9381E" />
          </View>
          
          <Text className="text-gray-500 font-medium mb-1">{t('invite_code_label')}</Text>
          <Text className="text-4xl font-bold text-brand-dark tracking-widest mb-6">
            {organization?.invite_code || "----"}
          </Text>

          <View className="flex-row gap-3 w-full">
            <TouchableOpacity 
              onPress={handleCopyCode}
              className="flex-1 bg-gray-100 py-3 rounded-xl flex-row justify-center items-center"
              accessibilityRole="button"
              accessibilityLabel="Copy invite code"
            >
              <Ionicons name="copy-outline" size={20} color="#4B5563" />
              <Text className="ml-2 font-bold text-gray-700">{t('copy_code')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleShare}
              className="flex-1 bg-brand-red py-3 rounded-xl flex-row justify-center items-center shadow-md shadow-red-200"
              accessibilityRole="button"
              accessibilityLabel="Share invite link"
            >
              <Ionicons name="share-outline" size={20} color="white" />
              <Text className="ml-2 font-bold text-white">{t('share_link')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* TEAM MEMBERS LIST */}
        <Text className="text-lg font-bold text-brand-dark mb-4 px-1">
          {t('team_members')} ({staff.length})
        </Text>

        <FlatList
          data={staff}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          renderItem={({ item }) => (
            <View className="flex-row items-center bg-white p-4 rounded-2xl mb-3 border border-gray-100 shadow-sm">
              <View className="relative">
                {item.avatar_url ? (
                  <Image source={{ uri: item.avatar_url }} className="w-12 h-12 rounded-full bg-gray-200" />
                ) : (
                  <Ionicons name="person-circle" size={48} color="#D1D5DB" />
                )}
                {item.role === 'admin' && (
                  <View className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full p-1 border-2 border-white">
                    <Ionicons name="star" size={10} color="white" />
                  </View>
                )}
              </View>
              
              <View className="ml-4 flex-1">
                <Text className="font-bold text-brand-dark text-base">{item.full_name}</Text>
                <Text className="text-gray-400 text-xs capitalize">
                  {item.role === 'admin' ? 'Administrator' : 'Staff Member'}
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-10">
              <Text className="text-gray-400">{t('no_members')}</Text>
            </View>
          }
        />
        
        {/* STATS FOOTER */}
        <View className="items-center py-4 border-t border-gray-200 mt-2">
            <Text className="text-xs text-gray-400">
                {organization?.plan_type === 'free' ? 'Free Plan' : 'Pro Plan'} • {staff.length} / {organization?.max_seats || '∞'} {t('seats_used')}
            </Text>
        </View>

      </View>
    </View>
  );
}
