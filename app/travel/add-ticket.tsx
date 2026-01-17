import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { useTranslation } from "../../hooks/useTranslation";
import { useStaff } from "../../hooks/useStaff";
import { supabase } from "../../lib/supabase";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const THEME_COLOR = "#D9381E";

export default function AddTicketScreen() {
  const router = useRouter();
  const { projectId } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { staff } = useStaff();
  
  const [transportName, setTransportName] = useState("");
  const [deptStation, setDeptStation] = useState("");
  const [arrStation, setArrStation] = useState("");
  const [seat, setSeat] = useState("");
  const [deptTime, setDeptTime] = useState("09:00");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null); // Null = Everyone
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!transportName.trim()) {
      Alert.alert("Error", "Please enter transport name");
      return;
    }
    if (!projectId) {
      Alert.alert("Error", "Project ID missing");
      return;
    }

    setSubmitting(true);
    try {
      // Create simplistic ISO string for today + time (Mocking date selection for MVP speed)
      // Ideally we pass the trip dates and select a day within range.
      // For now, let's assume "Tomorrow" at the given time.
      const today = new Date();
      today.setDate(today.getDate() + 1);
      const [hours, mins] = deptTime.split(':');
      today.setHours(parseInt(hours || '09'), parseInt(mins || '00'), 0, 0);
      
      const { error } = await supabase
        .from('logistics_tickets')
        .insert({
          project_id: projectId,
          user_id: selectedUserId, // Null for group
          transport_name: transportName,
          departure_station: deptStation,
          arrival_station: arrStation,
          seat_number: seat,
          departure_time: today.toISOString(),
          // ticket_file_url: ... (Upload implementation later)
        });

      if (error) throw error;

      Alert.alert("Success", "Ticket added!", [
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
          title: "Add Ticket", 
          headerBackTitle: "Travel",
          headerTintColor: THEME_COLOR,
          headerShown: true
        }} 
      />
      
      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        
        {/* TRANSPORT INFO */}
        <View className="mb-6">
          <Text className="text-brand-dark font-bold mb-2">Transport Name</Text>
          <TextInput
            className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-base mb-4"
            placeholder="e.g. Shinkansen Nozomi 123"
            value={transportName}
            onChangeText={setTransportName}
          />
          
          <View className="flex-row gap-4 mb-4">
            <View className="flex-1">
                <Text className="text-brand-dark font-bold mb-2">From</Text>
                <TextInput
                    className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-base"
                    placeholder="Tokyo"
                    value={deptStation}
                    onChangeText={setDeptStation}
                />
            </View>
            <View className="flex-1">
                <Text className="text-brand-dark font-bold mb-2">To</Text>
                <TextInput
                    className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-base"
                    placeholder="Osaka"
                    value={arrStation}
                    onChangeText={setArrStation}
                />
            </View>
          </View>

          <View className="flex-row gap-4">
            <View className="flex-1">
                <Text className="text-brand-dark font-bold mb-2">Time (HH:MM)</Text>
                <TextInput
                    className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-base"
                    placeholder="09:00"
                    value={deptTime}
                    onChangeText={setDeptTime}
                    keyboardType="numbers-and-punctuation"
                />
            </View>
            <View className="flex-1">
                <Text className="text-brand-dark font-bold mb-2">Seat</Text>
                <TextInput
                    className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-base"
                    placeholder="12A"
                    value={seat}
                    onChangeText={setSeat}
                />
            </View>
          </View>
        </View>

        {/* ASSIGNMENT */}
        <View className="mb-10">
          <Text className="text-brand-dark font-bold mb-3">Assign To</Text>
          
          {/* GROUP OPTION */}
          <TouchableOpacity
            onPress={() => setSelectedUserId(null)}
            className={`flex-row items-center px-4 py-3 rounded-xl border mb-3 ${
              selectedUserId === null
                ? "bg-brand-red border-brand-red"
                : "bg-white border-gray-200"
            }`}
          >
            <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${selectedUserId === null ? 'bg-white/20' : 'bg-gray-100'}`}>
                <FontAwesome5 name="users" size={14} color={selectedUserId === null ? "white" : "#9CA3AF"} />
            </View>
            <Text className={`font-bold ${selectedUserId === null ? "text-white" : "text-gray-700"}`}>
              Everyone (Group Ticket)
            </Text>
            {selectedUserId === null && <Ionicons name="checkmark-circle" size={20} color="white" style={{marginLeft: 'auto'}} />}
          </TouchableOpacity>

          {/* STAFF LIST */}
          {staff.map((user) => (
            <TouchableOpacity
              key={user.id}
              onPress={() => setSelectedUserId(user.id)}
              className={`flex-row items-center px-4 py-3 rounded-xl border mb-2 ${
                selectedUserId === user.id
                  ? "bg-brand-red border-brand-red"
                  : "bg-white border-gray-200"
              }`}
            >
               {user.avatar_url ? (
                  <Image source={{ uri: user.avatar_url }} className="w-8 h-8 rounded-full mr-3" />
                ) : (
                  <Ionicons name="person-circle" size={32} color={selectedUserId === user.id ? "white" : "#D1D5DB"} className="mr-3" />
                )}
              <Text className={`font-medium ${selectedUserId === user.id ? "text-white" : "text-gray-700"}`}>
                {user.full_name}
              </Text>
              {selectedUserId === user.id && <Ionicons name="checkmark-circle" size={20} color="white" style={{marginLeft: 'auto'}} />}
            </TouchableOpacity>
          ))}
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
            <Text className="text-white font-bold text-lg">Add Ticket</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}
