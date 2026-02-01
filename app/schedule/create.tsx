import React, { useState, useMemo, useEffect } from "react";
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
import { useRouter, Stack, useNavigation } from "expo-router";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { format, eachDayOfInterval, parseISO, isAfter, isBefore, isEqual, startOfDay } from "date-fns";
import * as Haptics from 'expo-haptics';
import { useStaff } from "../../hooks/useStaff";
import { useTranslation } from "../../hooks/useTranslation";
import { supabase } from "../../lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

const THEME_COLOR = "#D9381E";

const SHIFT_TYPES = [
  { id: "work_shift", labelKey: "work_shift", icon: "briefcase" },
  { id: "travel_day", labelKey: "travel_day", icon: "train" },
  { id: "off_day", labelKey: "off_day", icon: "coffee" },
];

export default function CreateBulkShiftScreen() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const navigation = useNavigation();
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

  const isDirty = !!startDate || selectedStaff.length > 0;

  const handleBack = () => {
    if (!isDirty || submitting) {
      router.back();
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      t('discard_title'),
      t('discard_msg'),
      [
        { text: t('keep_editing'), style: 'cancel' },
        { text: t('discard_confirm'), style: 'destructive', onPress: () => router.back() },
      ]
    );
  };

  const handleDayPress = (day: DateData) => {
    Haptics.selectionAsync();
    const selectedDate = parseISO(day.dateString);
    const today = startOfDay(new Date());

    if (isBefore(selectedDate, today)) {
      Alert.alert(t('invalid_date'), t('past_date_error'));
      return;
    }

    if (!startDate || (startDate && endDate)) {
      setStartDate(day.dateString);
      setEndDate(null);
    } else {
      const start = parseISO(startDate);
      
      if (isBefore(selectedDate, start)) {
        setStartDate(day.dateString);
        setEndDate(null);
      } else {
        setEndDate(day.dateString);
      }
    }
  };

  const markedDates = useMemo(() => {
    const marks: any = {};
    if (startDate && !endDate) {
      marks[startDate] = { startingDay: true, endingDay: true, color: THEME_COLOR, textColor: "white", selected: true };
    } else if (startDate && endDate) {
      marks[startDate] = { startingDay: true, color: THEME_COLOR, textColor: "white", selected: true };
      marks[endDate] = { endingDay: true, color: THEME_COLOR, textColor: "white", selected: true };
      
      // Mark days in between
      try {
        const interval = eachDayOfInterval({
          start: parseISO(startDate),
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
    Haptics.selectionAsync();
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

  const validateTime = (val: string, setter: (v: string) => void) => {
    const clean = val.replace(/[^0-9]/g, '');
    if (clean.length === 4) {
      setter(`${clean.slice(0, 2)}:${clean.slice(2)}`);
    } else if (clean.length < 4 && clean.length > 0) {
        // Pad with leading zero if needed logic could go here, or just leave as is
    }
  };

  const handleCreate = async () => {
    if (!startDate) {
      Alert.alert(t('error_title'), t('select_date_error'));
      return;
    }
    if (selectedStaff.length === 0) {
      Alert.alert(t('error_title'), t('select_staff_error'));
      return;
    }

    setSubmitting(true);
    try {
      const dates = eachDayOfInterval({
        start: parseISO(startDate),
        end: parseISO(endDate || startDate),
      });

      const shiftItems: any[] = [];
      
      // Get my profile for organization_id
      const { data: { user } } = await supabase.auth.getUser();
      
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
          });
        });
      });

      const { error } = await supabase.from("schedule_items").insert(shiftItems);
      if (error) throw error;

      // Force refresh of schedule list
      queryClient.invalidateQueries({ queryKey: ['schedule'] });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(t('success_title'), `${shiftItems.length} ${t('shifts_created')}`, [
        { text: t('ok'), onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('error_title'), error.message);
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
          headerBackVisible: false,
          gestureEnabled: false,
          headerLeft: () => (
            <TouchableOpacity 
              onPress={handleBack} 
              className="flex-row items-center -ml-2"
            >
              <Ionicons name="chevron-back" size={28} color="#D9381E" />
              <Text className="text-brand-red text-base -ml-1">{t('tab_schedule')}</Text>
            </TouchableOpacity>
          ),
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

        <View className="px-6">
          {/* TYPE SELECTOR */}
          <View className="mb-8">
            <Text className="text-brand-dark font-bold mb-3">{t('category')}</Text>
            <View className="flex-row gap-3">
              {SHIFT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  onPress={() => setShiftType(type.id)}
                  className={`flex-1 flex-row items-center justify-center p-4 rounded-xl border ${
                    shiftType === type.id
                      ? "bg-red-50 border-brand-red"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <FontAwesome5
                    name={type.icon}
                    size={16}
                    color={shiftType === type.id ? THEME_COLOR : "#9CA3AF"}
                  />
                  <Text
                    className={`ml-2 text-sm font-bold ${
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
          <View className="mb-8">
            <View className="flex-row gap-4 mb-4">
                <View className="flex-1">
                <Text className="text-brand-dark font-bold mb-2">{t('start_time')}</Text>
                <TextInput
                    className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-base"
                    value={startTime}
                    onChangeText={setStartTime}
                    onBlur={() => validateTime(startTime, setStartTime)}
                    keyboardType="numbers-and-punctuation"
                    placeholder="09:00"
                />
                </View>
                <View className="flex-1">
                <Text className="text-brand-dark font-bold mb-2">{t('end_time')}</Text>
                <TextInput
                    className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-base"
                    value={endTime}
                    onChangeText={setEndTime}
                    onBlur={() => validateTime(endTime, setEndTime)}
                    keyboardType="numbers-and-punctuation"
                    placeholder="18:00"
                />
                </View>
            </View>

            <View>
                <Text className="text-brand-dark font-bold mb-2">{t('location')}</Text>
                <TextInput
                className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-base"
                value={locationName}
                onChangeText={setLocationName}
                placeholder={t('location_placeholder')}
                />
            </View>
          </View>

          {/* STAFF SELECTION */}
          <View className="mb-10">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-brand-dark font-bold text-lg">{t('select_staff')}</Text>
              <TouchableOpacity onPress={selectAllStaff} className="bg-gray-100 px-3 py-1 rounded-full">
                <Text className="text-brand-dark font-bold text-xs">{t('select_all')}</Text>
              </TouchableOpacity>
            </View>

            {loadingStaff ? (
              <ActivityIndicator color={THEME_COLOR} />
            ) : (
              <View className="gap-3">
                {staff.map((member) => {
                  const isSelected = selectedStaff.includes(member.id);
                  return (
                    <TouchableOpacity
                      key={member.id}
                      onPress={() => toggleStaff(member.id)}
                      className={`flex-row items-center justify-between px-4 py-4 rounded-xl border w-full ${
                        isSelected
                          ? "bg-brand-red border-brand-red"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <View className="flex-row items-center">
                        {member.avatar_url ? (
                            <Image source={{ uri: member.avatar_url }} className="w-8 h-8 rounded-full mr-3" />
                        ) : (
                            <Ionicons 
                                name="person-circle" 
                                size={32} 
                                color={isSelected ? "white" : "#9CA3AF"} 
                                className="mr-3"
                            />
                        )}
                        <Text
                            className={`font-medium text-base ${
                            isSelected ? "text-white" : "text-gray-700"
                            }`}
                        >
                            {member.full_name}
                        </Text>
                      </View>
                      
                      {isSelected && <Ionicons name="checkmark-circle" size={24} color="white" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* SUBMIT & CANCEL */}
        <View className="px-6 mb-10 gap-3">
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

          <TouchableOpacity
            onPress={handleBack}
            disabled={submitting}
            className="w-full p-4 rounded-2xl items-center border border-gray-200 bg-white"
          >
            <Text className="text-gray-500 font-bold text-lg">{t('cancel')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
