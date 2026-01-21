import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useTranslation } from "../../hooks/useTranslation";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  
  const [userName, setUserName] = useState("User");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", user.id)
          .single();

        if (profile) {
          const firstName = profile.full_name ? profile.full_name.split(" ")[0] : "User";
          setUserName(firstName);
          setAvatarUrl(profile.avatar_url);
        }
      }
    }
    loadProfile();
  }, []);

  return (
    <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: 'white' }}>
      <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-gray-500 text-lg">Good morning,</Text>
            <Text className="text-3xl font-bold text-brand-red">
              {userName}-san
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/complete-profile")} className="bg-gray-100 p-1 rounded-full border border-gray-200">
            <View className="w-12 h-12 bg-gray-300 rounded-full items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <Ionicons name="person" size={24} color="#6B7280" />
              )}
            </View>
          </TouchableOpacity>
        </View>
        
        {/* STATIC PLACEHOLDER CARD */}
        <View className="bg-gray-50 border border-dotted border-gray-200 rounded-3xl p-8 mb-6 items-center">
          <Ionicons name="calendar-outline" size={32} color="#D1D5DB" />
          <Text className="text-gray-400 font-medium mt-2">No activities planned</Text>
        </View>

        {/* ACTION GRID */}
        <Text className="text-brand-dark text-xl font-bold mb-4">{t('quick_actions')}</Text>
        <View className="flex-row flex-wrap justify-between gap-y-3 mb-10">
          <TouchableOpacity className="w-[48%] h-36 bg-gray-50 rounded-2xl p-4 justify-between border border-gray-100 shadow-sm" onPress={() => router.push("/(tabs)/chat")}>
            <View className="bg-blue-100 w-12 h-12 rounded-full items-center justify-center">
              <Ionicons name="chatbubble-ellipses" size={24} color="#2563EB" />
            </View>
            <Text className="text-brand-dark font-bold text-lg">{t('tab_chat')}</Text>
          </TouchableOpacity>

          <TouchableOpacity className="w-[48%] h-36 bg-gray-50 rounded-2xl p-4 justify-between border border-gray-100 shadow-sm" onPress={() => router.push("/(tabs)/travel")}>
            <View className="bg-green-100 w-12 h-12 rounded-full items-center justify-center">
              <FontAwesome5 name="plane" size={24} color="#059669" />
            </View>
            <Text className="text-brand-dark font-bold text-lg">{t('tab_travel')}</Text>
          </TouchableOpacity>

          <TouchableOpacity className="w-[48%] h-36 bg-gray-50 rounded-2xl p-4 justify-between border border-gray-100 shadow-sm" onPress={() => router.push("/(tabs)/schedule")}>
            <View className="bg-purple-100 w-12 h-12 rounded-full items-center justify-center">
              <FontAwesome5 name="calendar-alt" size={24} color="#7C3AED" />
            </View>
            <Text className="text-brand-dark font-bold text-lg">{t('tab_schedule')}</Text>
          </TouchableOpacity>

          <TouchableOpacity className="w-[48%] h-36 bg-gray-50 rounded-2xl p-4 justify-between border border-gray-100 shadow-sm" onPress={() => router.push("/expenses")}>
            <View className="bg-orange-100 w-12 h-12 rounded-full items-center justify-center">
              <FontAwesome5 name="yen-sign" size={24} color="#EA580C" />
            </View>
            <Text className="text-brand-dark font-bold text-lg">{t('expenses')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
