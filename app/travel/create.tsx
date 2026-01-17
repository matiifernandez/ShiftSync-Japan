import React, { useState, useMemo } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Calendar, DateData } from "react-native-calendars";
import { format, eachDayOfInterval, parseISO, isBefore } from "date-fns";
import { useTranslation } from "../../hooks/useTranslation";
import { supabase } from "../../lib/supabase";

const THEME_COLOR = "#D9381E";

export default function CreateTripScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
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
    if (startDate && !endDate) {
      marks[startDate] = { startingDay: true, endingDay: true, color: THEME_COLOR, textColor: "white", selected: true };
    } else if (startDate && endDate) {
      marks[startDate] = { startingDay: true, color: THEME_COLOR, textColor: "white", selected: true };
      marks[endDate] = { endingDay: true, color: THEME_COLOR, textColor: "white", selected: true };
      
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

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a trip name");
      return;
    }
    if (!startDate) {
      Alert.alert("Error", "Please select at least one date");
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();

      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          organization_id: profile?.organization_id,
          name: name,
          description: description,
          start_date: startDate,
          end_date: endDate || startDate,
          status: 'planning'
        })
        .select()
        .single();

      if (error) throw error;

      Alert.alert("Success", "Trip itinerary created!", [
        { text: "OK", onPress: () => router.back() }
      ]);

    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen 
        options={{ 
          title: t('create_itinerary'), 
          headerBackTitle: t('tab_travel'),
          headerTintColor: THEME_COLOR,
          headerShown: true
        }} 
      />
      
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <View className="pt-6 mb-8">
          <Text className="text-brand-dark font-bold mb-2">Trip Name</Text>
          <TextInput
            className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-base"
            placeholder="e.g. Kyoto Expedition 2025"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View className="mb-8">
          <Text className="text-brand-dark font-bold mb-2">Select Dates</Text>
          <View className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
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

        <View className="mb-10">
          <Text className="text-brand-dark font-bold mb-2">Description (Optional)</Text>
          <TextInput
            className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-base min-h-[100px]"
            placeholder="Logistics notes..."
            multiline
            value={description}
            onChangeText={setDescription}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          onPress={handleCreate}
          disabled={submitting}
          className={`w-full p-4 rounded-2xl items-center shadow-lg mb-10 ${
            submitting ? "bg-gray-400" : "bg-brand-red"
          }`}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Create Itinerary</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
