import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Image } from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useSchedule } from "../../hooks/useSchedule";
import { ScheduleItem } from "../../types";
import { useTranslation } from "../../hooks/useTranslation";
import { useRouter, useFocusEffect } from "expo-router";
import { supabase } from "../../lib/supabase";

const THEME_COLOR = "#D9381E";

export default function ScheduleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const [userRole, setUserRole] = useState<string | null>(null);
  // Pass dynamic role to hook
  const { schedule, loading, refreshSchedule } = useSchedule({ allUsers: userRole === 'admin' });
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );

  useEffect(() => {
    async function getRole() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
          console.log("Full Profile Data:", data);
          setUserRole(data?.role || 'staff');
        }
      }
      getRole();
    }, [refreshSchedule]);

  // Generate marked dates for the calendar
  const markedDates = useMemo(() => {
    const marks: any = {};

    // Mark dates with events
    schedule.forEach((item) => {
      if (!marks[item.date]) {
        marks[item.date] = { marked: true, dotColor: THEME_COLOR };
      }
    });

    // Highlight selected date
    marks[selectedDate] = {
      ...(marks[selectedDate] || {}),
      selected: true,
      selectedColor: THEME_COLOR,
      disableTouchEvent: true,
    };

    return marks;
  }, [selectedDate, schedule]);

  // Filter events for the selected date
  const selectedEvents = useMemo(() => {
    return schedule.filter((item) => item.date === selectedDate);
  }, [selectedDate, schedule]);

  // Helper to determine icon color
  const getIconColor = (type: string) => {
    return THEME_COLOR;
  };

  // Helper to format title based on type
  const getEventTitle = (item: ScheduleItem) => {
    switch (item.type) {
      case "work_shift":
        return t('work_shift');
      case "travel_day":
        return t('travel_day');
      case "off_day":
        return t('off_day');
      default:
        return "Event";
    }
  };

  // Helper to format time range
  const formatTimeRange = (start?: string, end?: string) => {
    if (!start) return null;
    // Assume time is stored as HH:mm:ss or HH:mm, we just want HH:mm
    const formatTime = (t: string) => t.substring(0, 5);
    if (end) return `${formatTime(start)} - ${formatTime(end)}`;
    return formatTime(start);
  };

  if (loading) {
    return (
      <View 
        style={{ paddingTop: insets.top }} 
        className="flex-1 bg-white justify-center items-center"
      >
        <ActivityIndicator size="large" color={THEME_COLOR} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View
        style={{ paddingTop: insets.top }}
        className="bg-white pb-4 rounded-b-3xl shadow-sm z-10"
      >
        <Text className="text-3xl font-bold text-left text-brand-dark px-6 mb-4 pt-2">
          {t('schedule_title')}
        </Text>
        <Calendar
          onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
          markedDates={markedDates}
          // Enable horizontal paging for better UX
          enableSwipeMonths={true}
          theme={{
            todayTextColor: THEME_COLOR,
            selectedDayBackgroundColor: THEME_COLOR,
            arrowColor: THEME_COLOR,
            textDayFontWeight: "500",
            textMonthFontWeight: "bold",
            textDayHeaderFontWeight: "500",
          }}
        />
      </View>

      <View className="flex-1 px-4 pt-6">
        <Text className="text-gray-500 font-bold mb-4 uppercase tracking-wider text-xs">
          {format(new Date(selectedDate), "EEEE, MMMM d")}
        </Text>

        <ScrollView showsVerticalScrollIndicator={false}>
          {selectedEvents.length > 0 ? (
            selectedEvents.map((event) => {
              let iconName = "calendar";
              let bgColor = "bg-gray-100";
              const color = getIconColor(event.type);
              const title = getEventTitle(event);
              const timeString = formatTimeRange(
                event.start_time,
                event.end_time
              );

              switch (event.type) {
                case "work_shift":
                  iconName = "briefcase";
                  bgColor = "bg-gray-100";
                  break;
                case "travel_day":
                  iconName = "train";
                  bgColor = "bg-gray-100 border border-gray-200";
                  break;
                case "off_day":
                  iconName = "coffee";
                  bgColor = "bg-gray-50";
                  break;
              }

              return (
                <View
                  key={event.id}
                  className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100 flex-row"
                >
                  <View
                    className={`w-12 h-12 ${bgColor} rounded-full items-center justify-center mr-4`}
                  >
                    <FontAwesome5 name={iconName} size={20} color={color} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-brand-dark">
                      {title}
                    </Text>
                    
                    {/* ADMIN VIEW: SHOW USER INFO */}
                    {userRole === 'admin' && event.profiles && (
                         <View className="flex-row items-center mt-1 mb-1">
                            {event.profiles.avatar_url ? (
                                <Image source={{ uri: event.profiles.avatar_url }} className="w-5 h-5 rounded-full mr-2" />
                            ) : (
                                <Ionicons name="person-circle" size={20} color="#9CA3AF" className="mr-2" />
                            )}
                            <Text className="text-brand-red font-bold text-sm">{event.profiles.full_name}</Text>
                         </View>
                    )}

                    {timeString && (
                      <Text className="text-gray-500 font-medium text-sm my-1">
                        {timeString}
                      </Text>
                    )}
                    {event.location_name && (
                      <Text className="text-gray-400 text-xs mb-1">
                        {event.location_name}
                      </Text>
                    )}
                    {event.notes && (
                      <Text className="text-gray-600 text-sm leading-5 mt-1">
                        {event.notes}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })
          ) : (
            <View className="items-center justify-center mt-10">
              <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
              <Text className="text-gray-400 mt-2 font-medium">
                {t('no_events')}
              </Text>
            </View>
          )}
          <View className="h-10" />
        </ScrollView>
      </View>

      {/* ADMIN ADD BUTTON */}
      {userRole === 'admin' && (
        <TouchableOpacity
          onPress={() => router.push("/schedule/create")}
          style={{
            position: "absolute",
            bottom: 20,
            right: 20,
            backgroundColor: THEME_COLOR,
            width: 56,
            height: 56,
            borderRadius: 28,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: THEME_COLOR,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <Ionicons name="add" size={32} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}
