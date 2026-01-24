import React, { useState, useCallback, useMemo, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useTranslation } from "../../hooks/useTranslation";
import { useTravelContext } from "../../context/TravelContext";
import { TranslationKey } from "../../lib/translations";
import { useConversations } from "../../hooks/useConversations";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { totalUnreadCount } = useConversations();
  const { trip } = useTravelContext();
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

  const getGreeting = (): TranslationKey => {
    const hour = new Date().getHours();
    if (hour < 12) return "greeting_morning";
    if (hour < 18) return "greeting_afternoon";
    return "greeting_evening";
  };

  const nextActivity = useMemo(() => {
    if (!trip) return null;
    
    const now = new Date();
    const tickets = trip.tickets || [];
    const futureTickets = tickets.filter(t => new Date(t.departure_time) > now);
    
    if (futureTickets.length > 0) {
      const next = futureTickets[0];
      return {
        title: next.transport_name || "Next Trip",
        location: `${next.departure_station || '?'} → ${next.arrival_station || '?'}`,
        time: next.departure_time ? new Date(next.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
        detail: next.seat_number ? `Seat ${next.seat_number}` : 'Team Activity'
      };
    }

    return {
      title: trip.name,
      location: trip.dates,
      time: null,
      detail: 'Ongoing Project'
    };
  }, [trip]);

  return (
    <View 
      style={{ 
        flex: 1, 
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }} 
      className="bg-white"
    >
      <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-gray-500 text-lg">{t(getGreeting())},</Text>
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
        
        {/* HERO CARD - NEXT ACTIVITY */}
        {nextActivity ? (
          <TouchableOpacity 
            onPress={() => router.push("/(tabs)/travel")}
            className="bg-brand-dark rounded-3xl p-5 mb-6 shadow-lg"
          >
            <View className="flex-row justify-between items-start mb-4">
              <View className="bg-white/20 px-3 py-1 rounded-full">
                <Text className="text-white text-xs font-bold">
                  {t('next_activity')}
                </Text>
              </View>
              <Text className="text-brand-red font-bold text-lg">Active</Text>
            </View>

            <Text className="text-white text-2xl font-bold mb-1">
              {nextActivity.title}
            </Text>
            <Text className="text-gray-400 text-base mb-6">
              {nextActivity.location}
            </Text>

            <View className="flex-row items-center">
              {nextActivity.time && (
                <View className="flex-row items-center bg-white/10 px-4 py-2 rounded-xl mr-3">
                  <FontAwesome5 name="clock" size={14} color="white" />
                  <Text className="text-white ml-2 font-medium">{nextActivity.time}</Text>
                </View>
              )}
              <View className="flex-row items-center bg-white/10 px-4 py-2 rounded-xl">
                <FontAwesome5 name="info-circle" size={14} color="white" />
                <Text className="text-white ml-2 font-medium">{nextActivity.detail}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <View className="bg-gray-50 border border-dotted border-gray-200 rounded-3xl p-8 mb-6 items-center">
            <Ionicons name="calendar-outline" size={32} color="#D1D5DB" />
            <Text className="text-gray-400 font-medium mt-2">No activities planned</Text>
          </View>
        )}

        {/* ACTION GRID */}
        <Text className="text-brand-dark text-xl font-bold mb-4">{t('quick_actions')}</Text>
        <View className="flex-row flex-wrap justify-between gap-y-3 mb-10">
          <TouchableOpacity 
            className="w-[48%] h-36 bg-gray-50 rounded-2xl p-4 justify-between border border-gray-100 shadow-sm relative" 
            onPress={() => router.push("/(tabs)/chat")}
          >
            {totalUnreadCount > 0 && (
              <View className="absolute top-2 right-2 bg-brand-red rounded-full min-w-[20px] h-[20px] px-1 items-center justify-center z-10">
                <Text className="text-white text-xs font-bold">{totalUnreadCount}</Text>
              </View>
            )}
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
