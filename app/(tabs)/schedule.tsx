import React, { useState, useMemo } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, DateData } from "react-native-calendars";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useSchedule } from "../../hooks/useSchedule";
import { ScheduleItem } from "../../types";

const THEME_COLOR = "#D9381E";

export default function ScheduleScreen() {
  const { schedule, loading } = useSchedule();
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );

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
     switch (type) {
      case "work_shift": return "#1A1A1A";
      case "travel_day": return "#2563EB";
      case "off_day": return "#059669";
      default: return "#6B7280";
    }
  };

  // Helper to format title based on type
  const getEventTitle = (item: ScheduleItem) => {
    switch (item.type) {
        case "work_shift": return "Work Shift";
        case "travel_day": return "Travel / Transit";
        case "off_day": return "Day Off";
        default: return "Event";
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
          <SafeAreaView className="flex-1 bg-white justify-center items-center">
              <ActivityIndicator size="large" color={THEME_COLOR} />
          </SafeAreaView>
      )
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white pb-4 rounded-b-3xl shadow-sm z-10">
        <Text className="text-2xl font-bold text-center text-brand-dark my-4">
          Schedule
        </Text>
        <Calendar
          onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
          markedDates={markedDates}
          // Enable horizontal paging for better UX
          enableSwipeDb={true}
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
               const timeString = formatTimeRange(event.start_time, event.end_time);

               switch (event.type) {
                case "work_shift": iconName = "briefcase"; bgColor = "bg-gray-200"; break;
                case "travel_day": iconName = "train"; bgColor = "bg-blue-100"; break;
                case "off_day": iconName = "coffee"; bgColor = "bg-green-100"; break;
               }

               return (
                 <View
                    key={event.id}
                    className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100 flex-row"
                  >
                    <View className={`w-12 h-12 ${bgColor} rounded-full items-center justify-center mr-4`}>
                       <FontAwesome5 name={iconName} size={20} color={color} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-brand-dark">{title}</Text>
                      {timeString && <Text className="text-gray-500 font-medium text-sm my-1">{timeString}</Text>}
                      {event.location_name && <Text className="text-gray-400 text-xs mb-1">{event.location_name}</Text>}
                      {event.notes && <Text className="text-gray-600 text-sm leading-5 mt-1">{event.notes}</Text>}
                    </View>
                 </View>
               )
            })
          ) : (
            <View className="items-center justify-center mt-10">
              <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
              <Text className="text-gray-400 mt-2 font-medium">
                No events scheduled
              </Text>
            </View>
          )}
          <View className="h-10" />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
