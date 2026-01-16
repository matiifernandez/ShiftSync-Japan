import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { useRouter, Stack } from "expo-router";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { format, eachDayOfInterval, parseISO, isAfter, isBefore, isEqual } from "date-fns";
import { useStaff } from "../../hooks/useStaff";
import { useTranslation } from "../../hooks/useTranslation";
import { supabase } from "../../lib/supabase";

const THEME_COLOR = "#D9381E";

const SHIFT_TYPES = [
  { id: "work_shift", labelKey: "work_shift", icon: "briefcase" },
  { id: "travel_day", labelKey: "travel_day", icon: "train" },
  { id: "off_day", labelKey: "off_day", icon: "coffee" },
];

export default function CreateBulkShiftScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { staff, loading: loadingStaff } = useStaff();

  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [locationName, setLocationName] = useState("");
  const [shiftType, setShiftType] = useState("work_shift");
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleDayPress = (day: DateData) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(day.dateString);
      setEndDate(null);
    } else {
      const start = parseISO(startDate);
      const current = parseISO(day.dateString);
      
      if (isBefore(current, start)) {
        setStartDate(day.dateString);
        setEndDate(null);
      } else {
        setEndDate(day.dateString);
      }
    }
  };

  const markedDates = useMemo(() => {
    const marks: any = {};
    if (startDate) {
      marks[startDate] = { startingDay: true, color: THEME_COLOR, textColor: "white", selected: true };
    }
    if (endDate) {
      marks[endDate] = { endingDay: true, color: THEME_COLOR, textColor: "white", selected: true };
      
      // Mark days in between
      try {
        const interval = eachDayOfInterval({
          start: parseISO(startDate!),
          end: parseISO(endDate),
        });
        interval.forEach((date) => {
          const ds = format(date, "yyyy-MM-dd");
          if (ds !== startDate && ds !== endDate) {
            marks[ds] = { color: THEME_COLOR + "40", textColor: THEME_COLOR, selected: true };
          }
        });
      } catch (e) {}
    }
    return marks;
  }, [startDate, endDate]);

  const toggleStaff = (id: string) => {
    setSelectedStaff((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const selectAllStaff = () => {
    if (selectedStaff.length === staff.length) {
      setSelectedStaff([]);
    } else {
      setSelectedStaff(staff.map((s) => s.id));
    }
  };

  const handleCreate = async () => {
    if (!startDate || !endDate) {
      Alert.alert("Error", "Please select a date range.");
      return;
    }
    if (selectedStaff.length === 0) {
      Alert.alert("Error", "Please select at least one staff member.");
      return;
    }

    setSubmitting(true);
    try {
      const dates = eachDayOfInterval({
        start: parseISO(startDate),
        end: parseISO(endDate),
      });

      const shiftItems: any[] = [];
      
      // Get my profile for organization_id
      const { data: { user } } = await supabase.auth.getUser();
      const { data: myProfile } = await supabase.from('profiles').select('organization_id').eq('id', user?.id).single();

      dates.forEach((date) => {
        const dateString = format(date, "yyyy-MM-dd");
        selectedStaff.forEach((userId) => {
          shiftItems.push({
            user_id: userId,
            date: dateString,
            type: shiftType,
            start_time: startTime,
            end_time: endTime,
            location_name: locationName,
            // Assuming organization_id logic is handled by RLS or we need to add it if schedule_items has it
            // Based on schema, it doesn't have it, but it has project_id (optional).
          });
        });
      });

      const { error } = await supabase.from("schedule_items").insert(shiftItems);
      if (error) throw error;

      Alert.alert("Success", `${shiftItems.length} shift entries created!`, [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('create_shifts'),
          headerBackTitle: t('tab_schedule'),
        }}
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* DATE SELECTION */}
        <View className="px-6 pt-4">
          <Text className="text-brand-dark font-bold mb-2">{t('start_date')} - {t('end_date')}</Text>
          <View className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 mb-6">
            <Calendar
              onDayPress={handleDayPress}
              markedDates={markedDates}
              markingType={"period"}
              theme={{
                todayTextColor: THEME_COLOR,
                selectedDayBackgroundColor: THEME_COLOR,
                arrowColor: THEME_COLOR,
              }}
            />
          </View>
        </View>

        <View className="px-6 space-y-6">
          {/* TYPE SELECTOR */}
          <View>
            <Text className="text-brand-dark font-bold mb-3">{t('category')}</Text>
            <View className="flex-row gap-2">
              {SHIFT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  onPress={() => setShiftType(type.id)}
                  className={`flex-1 flex-row items-center justify-center p-3 rounded-xl border ${
                    shiftType === type.id
                      ? "bg-red-50 border-brand-red"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <FontAwesome5
                    name={type.icon}
                    size={14}
                    color={shiftType === type.id ? THEME_COLOR : "#9CA3AF"}
                  />
                  <Text
                    className={`ml-2 text-xs font-bold ${
                      shiftType === type.id ? "text-brand-red" : "text-gray-500"
                    }`}
                  >
                    {t(type.labelKey as any)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* TIME & LOCATION */}
          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text className="text-brand-dark font-bold mb-2">{t('start_time')}</Text>
              <TextInput
                className="bg-gray-50 p-4 rounded-xl border border-gray-100"
                value={startTime}
                onChangeText={setStartTime}
                placeholder="09:00"
              />
            </View>
            <View className="flex-1">
              <Text className="text-brand-dark font-bold mb-2">{t('end_time')}</Text>
              <TextInput
                className="bg-gray-50 p-4 rounded-xl border border-gray-100"
                value={endTime}
                onChangeText={setEndTime}
                placeholder="18:00"
              />
            </View>
          </View>

          <View>
            <Text className="text-brand-dark font-bold mb-2">{t('location')}</Text>
            <TextInput
              className="bg-gray-50 p-4 rounded-xl border border-gray-100"
              value={locationName}
              onChangeText={setLocationName}
              placeholder="e.g. Kobe Office"
            />
          </View>

          {/* STAFF SELECTION */}
          <View className="mb-10">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-brand-dark font-bold">{t('select_staff')}</Text>
              <TouchableOpacity onPress={selectAllStaff}>
                <Text className="text-brand-red font-bold text-xs">{t('select_all')}</Text>
              </TouchableOpacity>
            </View>

            {loadingStaff ? (
              <ActivityIndicator color={THEME_COLOR} />
            ) : (
              <View className="flex-row flex-wrap gap-2">
                {staff.map((member) => {
                  const isSelected = selectedStaff.includes(member.id);
                  return (
                    <TouchableOpacity
                      key={member.id}
                      onPress={() => toggleStaff(member.id)}
                      className={`flex-row items-center px-4 py-2 rounded-full border ${
                        isSelected
                          ? "bg-brand-red border-brand-red"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      {member.avatar_url ? (
                        <Image source={{ uri: member.avatar_url }} className="w-5 h-5 rounded-full mr-2" />
                      ) : (
                        <Ionicons 
                            name="person-circle" 
                            size={20} 
                            color={isSelected ? "white" : "#9CA3AF"} 
                            className="mr-2"
                        />
                      )}
                      <Text
                        className={`font-medium text-xs ${
                          isSelected ? "text-white" : "text-gray-600"
                        }`}
                      >
                        {member.full_name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* SUBMIT */}
        <View className="px-6 mb-10">
          <TouchableOpacity
            onPress={handleCreate}
            disabled={submitting}
            className={`w-full p-4 rounded-2xl items-center shadow-lg ${
              submitting ? "bg-gray-400" : "bg-brand-red"
            }`}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">{t('create_shifts')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
