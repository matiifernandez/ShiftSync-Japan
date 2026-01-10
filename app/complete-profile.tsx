import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { Ionicons } from "@expo/vector-icons";

export default function CompleteProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form State
  const [fullName, setFullName] = useState("");
  const [organizationId, setOrganizationId] = useState("00000000-0000-0000-0000-000000000000"); // TEST HACK
  const [language, setLanguage] = useState<"en" | "ja">("en");
  const [image, setImage] = useState<string | null>(null);

  // 1. Function to pick an image from gallery
  const pickImage = async () => {
    // Request permission first
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Sorry", "We need camera roll permissions to make this work!");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], // Updated to match proper type
      allowsEditing: true,
      aspect: [1, 1], // Square crop (perfect for avatars)
      quality: 0.5, // Compress a bit to save data
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // 2. Function to save profile to Supabase
  const handleSaveProfile = async () => {
    if (!fullName || !organizationId) {
      Alert.alert("Missing Info", "Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      // Get current authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("No user found");

      // TODO: Here we would upload the image to Supabase Storage and get the URL.
      // For now, we'll skip the actual file upload to keep this step simple 
      // and just assume a placeholder if no image is uploaded.

      const updates = {
        id: user.id,
        full_name: fullName,
        organization_id: organizationId, // In production, validate this ID exists!
        preferred_language: language,
        avatar_url: image ? "uploaded_image_url_placeholder" : null, // We'll fix this later
        updated_at: new Date(),
      };

      // Upsert: Update if exists, Insert if new
      const { error } = await supabase.from("profiles").upsert(updates);

      if (error) throw error;

      Alert.alert("Success", "Profile updated!", [
        { text: "OK", onPress: () => router.replace("/(tabs)") },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="px-6 py-4">
        <Text className="text-3xl font-bold text-brand-dark mb-2">
          Setup Profile
        </Text>
        <Text className="text-gray-500 mb-8">
          Let's verify your identity and get you set up.
        </Text>

        {/* PHOTO PICKER */}
        <View className="items-center mb-8">
          <TouchableOpacity onPress={pickImage}>
            <View className="w-32 h-32 bg-gray-100 rounded-full items-center justify-center overflow-hidden border-2 border-brand-red border-dashed">
              {image ? (
                <Image
                  source={{ uri: image }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="items-center">
                  <Ionicons name="camera" size={32} color="#9CA3AF" />
                  <Text className="text-gray-400 text-xs mt-1">Upload Photo</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          <Text className="text-xs text-gray-400 mt-2">
            Face clearly visible required
          </Text>
        </View>

        {/* FORM FIELDS */}
        <View className="space-y-4">
          <View>
            <Text className="text-gray-700 font-medium mb-1">Full Name</Text>
            <TextInput
              className="bg-gray-50 p-4 rounded-xl border border-gray-200"
              placeholder="e.g. Ken Watanabe"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          <View>
            <Text className="text-gray-700 font-medium mb-1">
              Organization ID
            </Text>
            <TextInput
              className="bg-gray-50 p-4 rounded-xl border border-gray-200"
              placeholder="Ask your manager for the code"
              value={organizationId}
              onChangeText={setOrganizationId}
              autoCapitalize="none"
            />
          </View>

          <View>
            <Text className="text-gray-700 font-medium mb-2">
              Preferred Language
            </Text>
            <View className="flex-row gap-4">
              <TouchableOpacity
                onPress={() => setLanguage("en")}
                className={`flex-1 p-4 rounded-xl border-2 items-center ${
                  language === "en"
                    ? "border-brand-red bg-red-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <Text
                  className={`font-bold ${
                    language === "en" ? "text-brand-red" : "text-gray-500"
                  }`}
                >
                  🇺🇸 English
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setLanguage("ja")}
                className={`flex-1 p-4 rounded-xl border-2 items-center ${
                  language === "ja"
                    ? "border-brand-red bg-red-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <Text
                  className={`font-bold ${
                    language === "ja" ? "text-brand-red" : "text-gray-500"
                  }`}
                >
                  🇯🇵 日本語
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* SUBMIT BUTTON */}
        <TouchableOpacity
          onPress={handleSaveProfile}
          disabled={loading}
          className={`mt-10 w-full p-4 rounded-xl items-center shadow-md ${
            loading ? "bg-gray-400" : "bg-brand-red"
          }`}
        >
          <Text className="text-white font-bold text-lg">
            {loading ? "Saving..." : "Complete Setup"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
