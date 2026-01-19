import React, { useState, useMemo } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Calendar, DateData } from "react-native-calendars";
import { format, eachDayOfInterval, parseISO, isBefore } from "date-fns";
import { useTranslation } from "../../hooks/useTranslation";
import { useStaff } from "../../hooks/useStaff";
import { supabase } from "../../lib/supabase";

const THEME_COLOR = "#D9381E";

export default function CreateTripScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { staff } = useStaff();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const toggleStaff = (id: string) => {
    setSelectedStaffIds(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

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
    if (selectedStaffIds.length === 0) {
      Alert.alert("Error", "Please select at least one staff member");
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();

      // 1. Create Project
      const { data: project, error: projError } = await supabase
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

      if (projError) throw projError;

      // 2. Add Members
      const memberInserts = selectedStaffIds.map(uid => ({
        project_id: project.id,
        user_id: uid
      }));

      // Also add myself (the creator/admin) if not in list
      if (!selectedStaffIds.includes(user.id)) {
        memberInserts.push({ project_id: project.id, user_id: user.id });
      }

      const { error: memError } = await supabase
        .from('project_members')
        .insert(memberInserts);

      if (memError) throw memError;

      Alert.alert("Success", "Trip created and team assigned!", [
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
        <View className="pt-6 mb-6">
          <Text className="text-brand-dark font-bold mb-2">{t('trip_name')}</Text>
          <TextInput
            className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-base"
            placeholder="e.g. Kyoto Expedition 2025"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View className="mb-6">
          <Text className="text-brand-dark font-bold mb-2">{t('select_dates')}</Text>
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

        {/* SELECT TEAM */}
        <View className="mb-6">
          <Text className="text-brand-dark font-bold mb-3">Select Team</Text>
          {staff.map((member) => (
            <TouchableOpacity
              key={member.id}
              onPress={() => toggleStaff(member.id)}
              className={`flex-row items-center p-3 rounded-xl border mb-2 ${
                selectedStaffIds.includes(member.id)
                  ? "bg-brand-red/10 border-brand-red"
                  : "bg-white border-gray-100"
              }`}
            >
              <View className="relative">
                {member.avatar_url ? (
                  <Image source={{ uri: member.avatar_url }} className="w-10 h-10 rounded-full" />
                ) : (
                  <Ionicons name="person-circle" size={40} color="#D1D5DB" />
                )}
                {selectedStaffIds.includes(member.id) && (
                  <View className="absolute -bottom-1 -right-1 bg-brand-red rounded-full">
                    <Ionicons name="checkmark-circle" size={18} color="white" />
                  </View>
                )}
              </View>
              <View className="ml-3">
                <Text className={`font-bold ${selectedStaffIds.includes(member.id) ? "text-brand-dark" : "text-gray-700"}`}>
                  {member.full_name}
                </Text>
                <Text className="text-gray-400 text-xs capitalize">{member.role}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View className="mb-10">
          <Text className="text-brand-dark font-bold mb-2">Description (Optional)</Text>
          <TextInput
            className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-base min-h-[80px]"
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
