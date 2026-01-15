import React, { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome5, MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { supabase } from "../../lib/supabase";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [userName, setUserName] = useState("User");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      async function loadProfile() {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", user.id)
            .single();

          if (profile) {
            // Get first name only for the greeting
            const firstName = profile.full_name
              ? profile.full_name.split(" ")[0]
              : "User";
            setUserName(firstName);
            setAvatarUrl(profile.avatar_url);
          }
        }
      }
      loadProfile();
    }, [])
  );

  return (
    <View 
      style={{ 
        flex: 1, 
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right
      }} 
      className="bg-white"
    >
      <ScrollView className="flex-1 px-6 pt-4">
        {/* HEADER */}
        <View className="flex-row justify-between items-center mb-8">
          <View>
            <Text className="text-gray-500 text-lg">Konbanwa,</Text>
            <Text className="text-3xl font-bold text-brand-dark">
              {userName}-san
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/complete-profile")}
            className="bg-gray-100 p-1 rounded-full border border-gray-200"
          >
            {/* Real Avatar or Placeholder */}
            <View className="w-12 h-12 bg-gray-300 rounded-full items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="person" size={24} color="#6B7280" />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* HERO CARD - NEXT ACTIVITY */}
        <View className="bg-brand-dark rounded-3xl p-6 mb-8 shadow-lg">
          <View className="flex-row justify-between items-start mb-4">
            <View className="bg-white/20 px-3 py-1 rounded-full">
              <Text className="text-white text-xs font-bold">
                NEXT ACTIVITY
              </Text>
            </View>
            <Text className="text-brand-red font-bold text-lg">2h 15m</Text>
          </View>

          <Text className="text-white text-2xl font-bold mb-1">
            Shinkansen to Kyoto
          </Text>
          <Text className="text-gray-400 text-base mb-6">
            Tokyo Station • Platform 14
          </Text>

          <View className="flex-row items-center space-x-4">
            <View className="flex-row items-center bg-white/10 px-4 py-2 rounded-xl">
              <FontAwesome5 name="clock" size={14} color="white" />
              <Text className="text-white ml-2 font-medium">14:00</Text>
            </View>
            <View className="flex-row items-center ml-2 bg-white/10 px-4 py-2 rounded-xl">
              <FontAwesome5 name="users" size={14} color="white" />
              <Text className="text-white ml-2 font-medium">Team A</Text>
            </View>
          </View>
        </View>

        {/* ACTION GRID */}
        <Text className="text-brand-dark text-xl font-bold mb-4">
          Quick Actions
        </Text>
        <View className="flex-row flex-wrap justify-between gap-y-4">
          {/* CHAT */}
          <TouchableOpacity
            className="w-[48%] aspect-square bg-gray-50 rounded-2xl p-4 justify-between border border-gray-100 shadow-sm active:bg-gray-100"
            onPress={() => router.push("/(tabs)/chat")}
          >
            <View className="bg-blue-100 w-12 h-12 rounded-full items-center justify-center">
              <Ionicons name="chatbubble-ellipses" size={24} color="#2563EB" />
            </View>
            <Text className="text-brand-dark font-bold text-lg">Chat</Text>
          </TouchableOpacity>

          {/* TRAVEL */}
          <TouchableOpacity
            className="w-[48%] aspect-square bg-gray-50 rounded-2xl p-4 justify-between border border-gray-100 shadow-sm active:bg-gray-100"
            onPress={() => router.push("/(tabs)/travel")}
          >
            <View className="bg-green-100 w-12 h-12 rounded-full items-center justify-center">
              <FontAwesome5 name="plane" size={24} color="#059669" />
            </View>
            <Text className="text-brand-dark font-bold text-lg">Travel</Text>
          </TouchableOpacity>

          {/* SCHEDULE */}
          <TouchableOpacity
            className="w-[48%] aspect-square bg-gray-50 rounded-2xl p-4 justify-between border border-gray-100 shadow-sm active:bg-gray-100"
            onPress={() => router.push("/(tabs)/schedule")}
          >
            <View className="bg-purple-100 w-12 h-12 rounded-full items-center justify-center">
              <FontAwesome5 name="calendar-alt" size={24} color="#7C3AED" />
            </View>
            <Text className="text-brand-dark font-bold text-lg">Schedule</Text>
          </TouchableOpacity>

          {/* EXPENSES */}
          <TouchableOpacity
            className="w-[48%] aspect-square bg-gray-50 rounded-2xl p-4 justify-between border border-gray-100 shadow-sm active:bg-gray-100"
            onPress={() => router.push("/expenses")}
          >
            <View className="bg-orange-100 w-12 h-12 rounded-full items-center justify-center">
              <FontAwesome5 name="yen-sign" size={24} color="#EA580C" />
            </View>
            <Text className="text-brand-dark font-bold text-lg">Expenses</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
