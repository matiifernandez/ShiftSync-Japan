import React, { useState, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, DateData } from "react-native-calendars";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";

// Mock Data matching the ScheduleItem concept
// In a real app, this would come from Supabase
const SCHEDULE_DATA = [
  {
    id: "1",
    date: "2025-11-02",
    type: "work_shift",
    title: "Morning Shift - Tokyo Station",
    time: "08:00 - 16:00",
    location: "Tokyo Station, Platform 10",
    description: "Coordinate luggage transfer for Group A.",
  },
  {
    id: "3",
    date: "2025-11-05",
    type: "travel_day",
    title: "Transit to Kyoto",
    time: "10:00 - 13:00",
    location: "Shinkansen Hikari 505",
    description: "Travel with the equipment team.",
  },
  {
    id: "4",
    date: "2025-11-10",
    type: "off_day",
    title: "Day Off",
    description: "Rest day.",
  },
];

const THEME_COLOR = "#D9381E";

export default function ScheduleScreen() {
  const [selectedDate, setSelectedDate] = useState(
    format(new Date("2025-11-02"), "yyyy-MM-dd") // Default to mock date for demo
  );

  // Generate marked dates for the calendar
  const markedDates = useMemo(() => {
    const marks: any = {};
    
    // Mark dates with events
    SCHEDULE_DATA.forEach((item) => {
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
  }, [selectedDate]);

  // Filter events for the selected date
  const selectedEvents = useMemo(() => {
    return SCHEDULE_DATA.filter((item) => item.date === selectedDate);
  }, [selectedDate]);

  // Helper to determine icon color for the prop
  const getIconColor = (type: string) => {
     switch (type) {
      case "work_shift": return "#1A1A1A";
      case "travel_day": return "#2563EB";
      case "off_day": return "#059669";
      default: return "#6B7280";
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white pb-4 rounded-b-3xl shadow-sm z-10">
        <Text className="text-2xl font-bold text-center text-brand-dark my-4">
          Schedule
        </Text>
        <Calendar
          onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
          markedDates={markedDates}
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
               // Fix the icon rendering
               let iconName = "calendar";
               let bgColor = "bg-gray-100";
               const color = getIconColor(event.type);

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
                      <Text className="text-lg font-bold text-brand-dark">{event.title}</Text>
                      {event.time && <Text className="text-gray-500 font-medium text-sm my-1">{event.time}</Text>}
                      {event.location && <Text className="text-gray-400 text-xs mb-1">{event.location}</Text>}
                      <Text className="text-gray-600 text-sm leading-5">{event.description}</Text>
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
