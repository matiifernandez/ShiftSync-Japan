import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from "../../hooks/useTranslation";
import { useStaff } from "../../hooks/useStaff";
import { supabase } from "../../lib/supabase";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { decode } from "../../lib/utils";

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
  
  // Image State
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.5, // Compression
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
        setImageBase64(result.assets[0].base64 || null);
      }
    } catch (error) {
      Alert.alert("Error picking image", "Could not select image.");
    }
  };

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
      let publicUrl = null;

      // 1. Upload Image if present
      if (imageBase64) {
        const fileName = `ticket_${Date.now()}.jpg`;
        const { data, error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, decode(imageBase64), {
            contentType: 'image/jpeg',
          });

        if (uploadError) throw uploadError;

        // Get Public URL
        const { data: urlData } = supabase.storage
          .from('receipts')
          .getPublicUrl(fileName);
        
        publicUrl = urlData.publicUrl;
      }

      // 2. Create ISO Date (Mocking logic for MVP)
      const today = new Date();
      today.setDate(today.getDate() + 1);
      const [hours, mins] = deptTime.split(':');
      today.setHours(parseInt(hours || '09'), parseInt(mins || '00'), 0, 0);
      
      const { error } = await supabase
        .from('logistics_tickets')
        .insert({
          project_id: projectId,
          user_id: selectedUserId,
          transport_name: transportName,
          departure_station: deptStation,
          arrival_station: arrStation,
          seat_number: seat,
          departure_time: today.toISOString(),
          ticket_file_url: publicUrl,
        });

      if (error) throw error;

      Alert.alert("Success", "Ticket added successfully!", [
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

        {/* TICKET IMAGE UPLOAD */}
        <View className="mb-8">
            <Text className="text-brand-dark font-bold mb-3">Ticket Photo (Optional)</Text>
            <TouchableOpacity 
                onPress={pickImage}
                className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-6 items-center justify-center"
            >
                {imageUri ? (
                    <Image source={{ uri: imageUri }} className="w-full h-48 rounded-lg" resizeMode="contain" />
                ) : (
                    <>
                        <Ionicons name="camera-outline" size={32} color="#9CA3AF" />
                        <Text className="text-gray-400 mt-2 font-medium">Tap to upload ticket image</Text>
                    </>
                )}
            </TouchableOpacity>
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
