import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from "react-native";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { useTranslation } from "../../hooks/useTranslation";
import { useSchedule } from "../../hooks/useSchedule";
import { Colors } from "../../constants/Colors";
import { useToast } from "../../context/ToastContext";

const THEME_COLOR = Colors.brand.red;

const SHIFT_TYPES = [
  { id: "work_shift", labelKey: "work_shift", icon: "briefcase" },
  { id: "travel_day", labelKey: "travel_day", icon: "train" },
  { id: "off_day", labelKey: "off_day", icon: "coffee" },
];

export default function EditShiftScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { deleteScheduleItem, updateScheduleItem, getScheduleItem } = useSchedule({ enabled: false });

  const { data: shift, isLoading: loading } = getScheduleItem(id as string);
  const [submitting, setSubmitting] = useState(false);
  
  // Form State
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [locationName, setLocationName] = useState("");
  const [shiftType, setShiftType] = useState("work_shift");
  const [notes, setNotes] = useState("");
  const [staffName, setStaffName] = useState("");

  useEffect(() => {
    if (shift) {
      setDate(shift.date);
      setStartTime(shift.start_time || "");
      setEndTime(shift.end_time || "");
      setLocationName(shift.location_name || "");
      setShiftType(shift.type);
      setNotes(shift.notes || "");
      setStaffName(shift.profiles?.full_name || t('unknown_staff'));
    }
  }, [shift]);

  const validateTime = (val: string, setter: (v: string) => void) => {
    const clean = val.replace(/[^0-9]/g, '');
    if (clean.length === 4) {
      setter(`${clean.slice(0, 2)}:${clean.slice(2)}`);
    }
  };

  const handleUpdate = async () => {
    setSubmitting(true);
    try {
      await updateScheduleItem({
        id: id as string,
        updates: {
          date,
          start_time: startTime,
          end_time: endTime,
          location_name: locationName,
          type: shiftType,
          notes: notes
        }
      });

      showToast(t('shift_updated'), 'success');
      router.back();
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      t('delete_shift_title'),
      t('delete_shift_msg'),
      [
        { text: t('cancel'), style: "cancel" },
        { 
          text: t('delete_confirm'), 
          style: "destructive", 
          onPress: async () => {
            setSubmitting(true);
            try {
              await deleteScheduleItem(id as string);
              router.back();
            } catch (err: any) {
              showToast(err.message, 'error');
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return <View className="flex-1 justify-center items-center"><ActivityIndicator color={THEME_COLOR} /></View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('edit_shift'),
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="flex-row items-center -ml-2">
              <Ionicons name="chevron-back" size={28} color={Colors.brand.red} />
              <Text className="text-brand-red text-base">{t('tab_schedule')}</Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
             <TouchableOpacity onPress={handleDelete}>
                <Ionicons name="trash-outline" size={24} color={Colors.brand.red} />
             </TouchableOpacity>
          )
        }}
      />

      <ScrollView className="flex-1 px-6 pt-6">
        <Text className="text-gray-500 mb-6 text-center font-medium">{t('editing_for')}: <Text className="font-bold text-brand-dark">{staffName}</Text></Text>

        {/* TYPE SELECTOR */}
        <View className="mb-6">
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
                </TouchableOpacity>
              ))}
            </View>
        </View>

        {/* DATE */}
        <View className="mb-4">
             <Text className="text-brand-dark font-bold mb-2">{t('start_date')}</Text>
             <TextInput
                className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-base"
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
            />
        </View>

        {/* TIME */}
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

        {/* LOCATION */}
        <View className="mb-4">
            <Text className="text-brand-dark font-bold mb-2">{t('location')}</Text>
            <TextInput
            className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-base"
            value={locationName}
            onChangeText={setLocationName}
            placeholder="Location"
            />
        </View>

        {/* NOTES */}
        <View className="mb-8">
            <Text className="text-brand-dark font-bold mb-2">{t('description')}</Text>
            <TextInput
            className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-base min-h-[100px]"
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="Optional notes..."
            style={{ textAlignVertical: 'top' }}
            />
        </View>

        {/* SUBMIT */}
        <TouchableOpacity
            onPress={handleUpdate}
            disabled={submitting}
            className={`w-full p-4 rounded-2xl items-center shadow-lg mb-10 ${
              submitting ? "bg-gray-400" : "bg-brand-red"
            }`}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">{t('save_changes')}</Text>
            )}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}
