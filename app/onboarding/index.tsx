import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import Logo from "../../components/Logo";

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View 
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }} 
        className="flex-1 bg-white px-6 justify-between"
    >
      <View className="items-center mt-10">
        <Logo size={60} />
        <Text className="text-3xl font-bold text-brand-dark mt-6 text-center">
          Welcome to ShiftSync
        </Text>
        <Text className="text-gray-500 text-center mt-2 px-4">
          To get started, tell us how you plan to use the app.
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
            <Text className="text-white font-bold text-xl">Create Workspace</Text>
            <Text className="text-white/80 text-sm mt-1">
              For managers setting up a new company team.
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
            <Text className="text-brand-dark font-bold text-xl">Join Existing Team</Text>
            <Text className="text-gray-500 text-sm mt-1">
              Enter an invite code provided by your manager.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <View className="items-center mb-6">
        <Text className="text-xs text-gray-400">
            ShiftSync Japan • Optimized for efficiency
        </Text>
      </View>
    </View>
  );
}
