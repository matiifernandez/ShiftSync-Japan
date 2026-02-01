import React from "react";
import { View, Text, TouchableOpacity, Image, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import Logo from "../../components/Logo";
import { useTranslation } from "../../hooks/useTranslation";
import { supabase } from "../../lib/supabase";

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  return (
    <View 
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }} 
        className="flex-1 bg-white px-6 justify-between"
    >
      <View className="items-center mt-10">
        <Logo size={60} />
        <Text className="text-3xl font-bold text-brand-dark mt-6 text-center">
          {t('onboarding_welcome')}
        </Text>
        <Text className="text-gray-500 text-center mt-2 px-4">
          {t('onboarding_desc')}
        </Text>
      </View>

      <View className="gap-4 mb-10">
        {/* OPTION 1: CREATE WORKSPACE */}
        <TouchableOpacity
          onPress={() => router.push("/onboarding/create-org")}
          className="bg-brand-red p-6 rounded-3xl shadow-lg shadow-red-100 border border-red-50 flex-row items-center"
          activeOpacity={0.9}
        >
          <View className="w-14 h-14 bg-white/20 rounded-full items-center justify-center mr-4">
             <FontAwesome5 name="building" size={24} color="white" />
          </View>
          <View className="flex-1">
            <Text className="text-white font-bold text-xl">{t('create_workspace')}</Text>
            <Text className="text-white/80 text-sm mt-1">
              {t('create_workspace_desc')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="white" />
        </TouchableOpacity>

        {/* OPTION 2: JOIN TEAM */}
        <TouchableOpacity
          onPress={() => router.push("/onboarding/join-team")}
          className="bg-white p-6 rounded-3xl shadow-md shadow-gray-200 border border-gray-100 flex-row items-center"
          activeOpacity={0.6}
        >
          <View className="w-14 h-14 bg-blue-50 rounded-full items-center justify-center mr-4">
             <FontAwesome5 name="user-friends" size={24} color="#2563EB" />
          </View>
          <View className="flex-1">
            <Text className="text-brand-dark font-bold text-xl">{t('join_team')}</Text>
            <Text className="text-gray-500 text-sm mt-1">
              {t('join_team_desc')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <View className="items-center mb-6">
        <TouchableOpacity onPress={handleLogout} className="mb-4">
            <Text className="text-brand-red font-bold">{t('log_out')}</Text>
        </TouchableOpacity>
        <Text className="text-xs text-gray-400">
            ShiftSync Japan • Optimized for efficiency
        </Text>
      </View>
    </View>
  );
}
