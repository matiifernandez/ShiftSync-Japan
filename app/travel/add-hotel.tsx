import React, { useState, useMemo } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Calendar, DateData } from "react-native-calendars";
import { format, parseISO, isBefore, eachDayOfInterval } from "date-fns";
import { useTranslation } from "../../hooks/useTranslation";
import { supabase } from "../../lib/supabase";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const THEME_COLOR = "#D9381E";

export default function AddHotelScreen() {
  const router = useRouter();
  const { projectId } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [mapUrl, setMapUrl] = useState("");
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
      Alert.alert("Error", "Please enter hotel name");
      return;
    }
    if (!projectId) {
      Alert.alert("Error", "Project ID missing");
      return;
    }
    if (!startDate || !endDate) {
      Alert.alert("Error", "Please select check-in and check-out dates");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('accommodations')
        .insert({
          project_id: projectId,
          name: name,
          address: address,
          map_url: mapUrl,
          check_in: startDate,
          check_out: endDate
        });

      if (error) throw error;

      Alert.alert("Success", "Hotel added!", [
        { text: "OK", onPress: () => router.back() }
      ]);

    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Stack.Screen 
        options={{ 
          title: "Add Hotel", 
          headerBackTitle: "Travel",
          headerTintColor: THEME_COLOR,
          headerShown: true
        }} 
      />
      
      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        
        <View className="mb-6">
          <Text className="text-brand-dark font-bold mb-2">Hotel Name</Text>
          <TextInput
            className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-base"
            placeholder="e.g. Hotel Granvia Osaka"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View className="mb-6">
          <Text className="text-brand-dark font-bold mb-2">Address</Text>
          <TextInput
            className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-base"
            placeholder="3-1-1 Umeda, Kita-ku, Osaka"
            value={address}
            onChangeText={setAddress}
            multiline
          />
        </View>

        <View className="mb-6">
          <Text className="text-brand-dark font-bold mb-2">Google Maps URL</Text>
          <TextInput
            className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-base"
            placeholder="https://maps.google.com/..."
            value={mapUrl}
            onChangeText={setMapUrl}
          />
        </View>

        <View className="mb-10">
          <Text className="text-brand-dark font-bold mb-2">Check-in / Check-out</Text>
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

        <TouchableOpacity
          onPress={handleCreate}
          disabled={submitting}
          className={`w-full p-4 rounded-2xl items-center shadow-lg mb-20 ${
            submitting ? "bg-gray-400" : "bg-brand-red"
          }`}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Add Hotel</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}
