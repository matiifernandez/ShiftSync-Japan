import React, { useState, useCallback, useMemo, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Image, Share, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { supabase } from "../../lib/supabase";
import { useTranslation } from "../../hooks/useTranslation";
import { useTravelContext } from "../../context/TravelContext";
import { TranslationKey } from "../../lib/translations";
import { useConversations } from "../../hooks/useConversations";
import { useSchedule } from "../../hooks/useSchedule";
import { useBadgeTracker } from "../../hooks/useBadgeTracker";

/**
 * HomeScreen (Dashboard)
 * 
 * The main landing page for the application.
 * Displays:
 * - User Greeting and Profile Avatar
 * - "Next Activity" Hero Card (closest upcoming travel or shift)
 * - Quick Actions Grid (Chat, Travel, Schedule, Expenses) with Notification Badges
 * - Admin-only "Invite Member" button
 */
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  
  // Context Data
  const { totalUnreadCount } = useConversations();
  const { trip } = useTravelContext();
  const { schedule } = useSchedule();
  const { hasNewTravel, hasNewSchedule, markTravelVisited, markScheduleVisited } = useBadgeTracker();
  
  // Local State
  const [userName, setUserName] = useState("User");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"admin" | "staff" | null>(null);

  // 1. Load User Profile on Mount
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

  // 2. Handle Admin Invite Action
  const handleInvite = async () => {
    if (!orgId) return;

    // Dynamically create URL (works in Expo Go and Production)
    const url = Linking.createURL("complete-profile", {
      queryParams: { orgId },
    });
    
    const message = `${t('invite_member')}! ${t('setup_profile')}: ${url}`;

    try {
      await Share.share({
        message,
        url, 
        title: t('invite_member')
      });
    } catch (error) {
      Alert.alert(t('error_title'), "Could not share invite.");
    }
  };

  // 3. Determine Greeting based on time
  const getGreeting = (): TranslationKey => {
    const hour = new Date().getHours();
    if (hour < 12) return "greeting_morning";
    if (hour < 18) return "greeting_afternoon";
    return "greeting_evening";
  };

  // 4. Calculate Next Activity (Hero Card Content)
  // Combines Tickets and Schedule Items to find the nearest future event
  const nextActivity = useMemo(() => {
    const now = new Date();
    const candidates: any[] = [];

    // Add Travel Tickets
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

    // Add Schedule Items
    if (schedule) {
      schedule.forEach(s => {
        let itemDate = new Date(s.date);
        // Include items from today onwards
        if (itemDate >= new Date(now.setHours(0,0,0,0))) {
             candidates.push({
                type: 'shift',
                date: itemDate,
                title: t(s.type as any),
                location: s.type === 'off_day' ? t('enjoy_day_off') : (s.location_name || s.notes || (
                  s.type === 'travel_day' ? "Transit to destination" : "On Site"
                )),
                detail: s.type === 'work_shift' ? 'Scheduled Duty' : (s.type === 'off_day' ? 'Rest & Recharge' : 'Logistics'),
                raw: s
             });
        }
      });
    }

    // Fallback if no future specific events but inside a trip
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

    // Sort by date ascending to find the soonest
    candidates.sort((a, b) => a.date.getTime() - b.date.getTime());

    const next = candidates[0];
    return {
        title: next.title,
        location: next.location,
        time: (next.type === 'shift' && next.raw?.type !== 'work_shift') ? null : next.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        detail: next.detail,
        isShift: next.type === 'shift'
    };

  }, [trip, schedule]);

  // Badge Logic (Memoized)
  const showTravelBadge = useMemo(() => hasNewTravel(trip?.tickets || []), [trip, hasNewTravel]);
  const showScheduleBadge = useMemo(() => hasNewSchedule(schedule), [schedule, hasNewSchedule]);

  // Navigation Handlers (clearing badges on press)
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
        {/* HEADER: Greeting & Avatar */}
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
        
        {/* HERO CARD: Next Activity */}
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
            <Text className="text-gray-400 font-medium mt-2">{t('no_activities')}</Text>
          </View>
        )}

        {/* QUICK ACTIONS GRID */}
        <Text className="text-brand-dark text-xl font-bold mb-4">{t('quick_actions')}</Text>
        <View className="flex-row flex-wrap justify-between gap-y-3 mb-10">
          
          {/* 1. CHAT */}
          <TouchableOpacity 
            className="w-[48%] md:w-[23%] h-36 bg-gray-50 rounded-2xl p-4 justify-between border border-gray-100 shadow-sm relative" 
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

          {/* 2. TRAVEL */}
          <TouchableOpacity 
            className="w-[48%] md:w-[23%] h-36 bg-gray-50 rounded-2xl p-4 justify-between border border-gray-100 shadow-sm relative" 
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

          {/* 3. SCHEDULE */}
          <TouchableOpacity 
            className="w-[48%] md:w-[23%] h-36 bg-gray-50 rounded-2xl p-4 justify-between border border-gray-100 shadow-sm relative" 
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

          {/* 4. EXPENSES */}
          <TouchableOpacity className="w-[48%] md:w-[23%] h-36 bg-gray-50 rounded-2xl p-4 justify-between border border-gray-100 shadow-sm" onPress={() => router.push("/expenses")}>
            <View className="bg-orange-100 w-12 h-12 rounded-full items-center justify-center">
              <FontAwesome5 name="yen-sign" size={24} color="#EA580C" />
            </View>
            <Text className="text-brand-dark font-bold text-lg">{t('expenses')}</Text>
          </TouchableOpacity>
        </View>

        {/* INVITE BUTTON (Admin Only) */}
        {orgId && userRole === 'admin' && (
          <TouchableOpacity 
            onPress={() => router.push("/team")}
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