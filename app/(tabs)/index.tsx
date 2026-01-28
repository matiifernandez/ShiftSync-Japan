import React, { useState, useCallback, useMemo, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Image, Share, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useTranslation } from "../../hooks/useTranslation";
import { useTravelContext } from "../../context/TravelContext";
import { TranslationKey } from "../../lib/translations";
import { useConversations } from "../../hooks/useConversations";
import { useSchedule } from "../../hooks/useSchedule";
import { useBadgeTracker } from "../../hooks/useBadgeTracker";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { totalUnreadCount } = useConversations();
  const { trip } = useTravelContext();
  const { schedule } = useSchedule();
  const { hasNewTravel, hasNewSchedule, markTravelVisited, markScheduleVisited } = useBadgeTracker();
  
  const [userName, setUserName] = useState("User");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"admin" | "staff" | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url, organization_id, role")
          .eq("id", user.id)
          .single();

        if (profile) {
          const firstName = profile.full_name ? profile.full_name.split(" ")[0] : "User";
          setUserName(firstName);
          setAvatarUrl(profile.avatar_url);
          setOrgId(profile.organization_id);
          setUserRole(profile.role as "admin" | "staff");
        }
      }
    }
    loadProfile();
  }, []);

  const handleInvite = async () => {
    if (!orgId) return;

    // Deep Link format
    const url = `shiftsync://complete-profile?orgId=${orgId}`;
    const message = `Join my team on ShiftSync Japan! Setup your profile here: ${url}`;

    try {
      await Share.share({
        message,
        url, // iOS often uses this for AirDrop/Copy Link
        title: "Join ShiftSync Team"
      });
    } catch (error) {
      Alert.alert("Error", "Could not share invite.");
    }
  };

  const getGreeting = (): TranslationKey => {
    const hour = new Date().getHours();
    if (hour < 12) return "greeting_morning";
    if (hour < 18) return "greeting_afternoon";
    return "greeting_evening";
  };

  const nextActivity = useMemo(() => {
    const now = new Date();
    const candidates: any[] = [];

    // 1. Add Tickets
    if (trip && trip.tickets) {
      trip.tickets.forEach(t => {
        if (new Date(t.departure_time) > now) {
          candidates.push({
            type: 'ticket',
            date: new Date(t.departure_time),
            title: t.transport_name || "Travel",
            location: `${t.departure_station || '?'} → ${t.arrival_station || '?'}`,
            detail: t.seat_number ? `Seat ${t.seat_number}` : 'Travel',
            raw: t
          });
        }
      });
    }

    // 2. Add Schedule Items
    if (schedule) {
      schedule.forEach(s => {
        let itemDate = new Date(s.date);
        if (itemDate >= new Date(now.setHours(0,0,0,0))) {
             candidates.push({
                type: 'shift',
                date: itemDate,
                title: s.type === 'work_shift' ? 'Work Shift' : (s.type === 'off_day' ? 'Off Day' : 'Travel Day'),
                location: s.notes || 'On Site',
                detail: s.type === 'work_shift' ? 'Scheduled Duty' : 'Rest',
                raw: s
             });
        }
      });
    }

    if (candidates.length === 0) {
        if (trip) {
            return {
                title: trip.name,
                location: trip.dates,
                time: null,
                detail: 'Ongoing Project'
            };
        }
        return null;
    }

    // Sort by date ascending
    candidates.sort((a, b) => a.date.getTime() - b.date.getTime());

    const next = candidates[0];
    return {
        title: next.title,
        location: next.location,
        time: next.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        detail: next.detail,
        isShift: next.type === 'shift'
    };

  }, [trip, schedule]);

  // Badge Logic
  const showTravelBadge = useMemo(() => hasNewTravel(trip?.tickets || []), [trip, hasNewTravel]);
  const showScheduleBadge = useMemo(() => hasNewSchedule(schedule), [schedule, hasNewSchedule]);

  const handlePressTravel = () => {
    markTravelVisited();
    router.push("/(tabs)/travel");
  };

  const handlePressSchedule = () => {
    markScheduleVisited();
    router.push("/(tabs)/schedule");
  };

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
          
          <View className="flex-row gap-3">
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
        </View>
        
        {/* HERO CARD - NEXT ACTIVITY */}
        {nextActivity ? (
          <TouchableOpacity 
            onPress={() => router.push(nextActivity.isShift ? "/(tabs)/schedule" : "/(tabs)/travel")}
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
                <FontAwesome5 name={nextActivity.isShift ? "briefcase" : "info-circle"} size={14} color="white" />
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
          
          {/* CHAT */}
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

          {/* TRAVEL */}
          <TouchableOpacity 
            className="w-[48%] h-36 bg-gray-50 rounded-2xl p-4 justify-between border border-gray-100 shadow-sm relative" 
            onPress={handlePressTravel}
          >
            {showTravelBadge && (
              <View className="absolute top-2 right-2 bg-brand-red w-3 h-3 rounded-full z-10" />
            )}
            <View className="bg-green-100 w-12 h-12 rounded-full items-center justify-center">
              <FontAwesome5 name="plane" size={24} color="#059669" />
            </View>
            <Text className="text-brand-dark font-bold text-lg">{t('tab_travel')}</Text>
          </TouchableOpacity>

          {/* SCHEDULE */}
          <TouchableOpacity 
            className="w-[48%] h-36 bg-gray-50 rounded-2xl p-4 justify-between border border-gray-100 shadow-sm relative" 
            onPress={handlePressSchedule}
          >
             {showScheduleBadge && (
              <View className="absolute top-2 right-2 bg-brand-red w-3 h-3 rounded-full z-10" />
            )}
            <View className="bg-purple-100 w-12 h-12 rounded-full items-center justify-center">
              <FontAwesome5 name="calendar-alt" size={24} color="#7C3AED" />
            </View>
            <Text className="text-brand-dark font-bold text-lg">{t('tab_schedule')}</Text>
          </TouchableOpacity>

          {/* EXPENSES */}
          <TouchableOpacity className="w-[48%] h-36 bg-gray-50 rounded-2xl p-4 justify-between border border-gray-100 shadow-sm" onPress={() => router.push("/expenses")}>
            <View className="bg-orange-100 w-12 h-12 rounded-full items-center justify-center">
              <FontAwesome5 name="yen-sign" size={24} color="#EA580C" />
            </View>
            <Text className="text-brand-dark font-bold text-lg">{t('expenses')}</Text>
          </TouchableOpacity>
        </View>

        {/* INVITE BUTTON (Admin Only) */}
        {orgId && userRole === 'admin' && (
          <TouchableOpacity 
            onPress={handleInvite}
            className="w-full bg-brand-red py-4 rounded-2xl flex-row items-center justify-center shadow-md mb-10"
          >
            <Ionicons name="person-add" size={22} color="white" />
            <Text className="text-white font-bold text-lg ml-3">{t('invite_member')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}
