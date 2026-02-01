import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "../hooks/useTranslation";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * CompleteProfileScreen
 * 
 * Handles user profile creation and editing.
 * - For new users: acts as an onboarding step to set name, org, and photo.
 * - For existing users: allows editing profile details.
 * 
 * Key Features:
 * - Image Upload to Supabase Storage
 * - Organization ID handling (deep link params vs stored pending ID)
 * - Localization preference setting
 */
export default function CompleteProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { changeLanguage, t } = useTranslation();
  
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // To distinguish between Onboarding vs Editing

  // Form State
  const [fullName, setFullName] = useState("");
  const [organizationId, setOrganizationId] = useState(
    (params.orgId as string) || "00000000-0000-0000-0000-000000000000"
  ); 
  const [language, setLanguage] = useState<"en" | "ja">("en");
  const [image, setImage] = useState<string | null>(null);

  // Effect to update orgId if params change (e.g. late deep link)
  useEffect(() => {
    if (params.orgId) {
      setOrganizationId(params.orgId as string);
    }
  }, [params.orgId]);

  // Load existing profile on mount
  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profile) {
          setIsEditing(true); // If profile exists, we are in Edit Mode
          setFullName(profile.full_name || "");
          // Only overwrite org ID if it exists in DB, otherwise keep the current state (params or default)
          if (profile.organization_id) {
             setOrganizationId(profile.organization_id);
          } else {
             // If profile has no orgId, check for pending invite in storage
             const pendingOrgId = await AsyncStorage.getItem("@pending_org_id");
             if (pendingOrgId) {
                setOrganizationId(pendingOrgId);
                await AsyncStorage.removeItem("@pending_org_id");
             }
          }
          
          if (profile.preferred_language) setLanguage(profile.preferred_language as "en" | "ja");
          if (profile.avatar_url) setImage(profile.avatar_url);
        } else {
            // New user, no profile yet. Check storage for pending invite
            const pendingOrgId = await AsyncStorage.getItem("@pending_org_id");
            if (pendingOrgId) {
                setOrganizationId(pendingOrgId);
                await AsyncStorage.removeItem("@pending_org_id");
            }
        }
      } catch (error) {
        console.log("Error loading profile:", error);
      }
    }

    loadProfile();
  }, []);

  // Handler for closing/going back
  const handleClose = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  }, [router]);

  // Language handlers
  const handleSetEnglish = useCallback(() => setLanguage("en"), []);
  const handleSetJapanese = useCallback(() => setLanguage("ja"), []);

  // 1. Function to pick an image from gallery
  const pickImage = async () => {
    // Request permission first
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Sorry", "We need camera roll permissions to make this work!");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1], // Square crop (perfect for avatars)
      quality: 0.5, // Compress a bit to save data
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // 2. Function to upload image to Supabase Storage
  const uploadImage = async (uri: string, userId: string) => {
    try {
      // 1. Convert local file URI to ArrayBuffer (Binary)
      const response = await fetch(uri);
      const blob = await response.arrayBuffer();

      // 2. Define file path: avatars/USER_ID.jpg
      // Using time to avoid cache issues on updates
      const fileName = `${userId}_${new Date().getTime()}.jpg`;
      const filePath = `${fileName}`;

      // 3. Upload to Supabase
      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(filePath, blob, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (error) throw error;

      // 4. Get Public URL
      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  // Validation Logic
  const validateForm = () => {
    if (!fullName.trim()) {
      Alert.alert(t('missing_info'), "Please enter your full name.");
      return false;
    }
    if (!organizationId.trim()) {
      Alert.alert(t('missing_info'), "Organization ID is missing.");
      return false;
    }
    return true;
  };

  // 3. Function to save profile to Supabase
  const handleSaveProfile = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Get current authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("No user found");

      let avatarUrl = image;

      // If user selected an image (local URI), upload it first
      // If it's already a remote URL, we keep it as is
      if (image && !image.startsWith("http")) {
        avatarUrl = await uploadImage(image, user.id);
      }

      const updates = {
        id: user.id,
        full_name: fullName,
        organization_id: organizationId,
        preferred_language: language,
        avatar_url: avatarUrl, // Now saving the real URL!
        updated_at: new Date(),
      };

      // Upsert: Update if exists, Insert if new
      const { error } = await supabase.from("profiles").upsert(updates);

      if (error) throw error;

      // Update app language globally
      changeLanguage(language);

      Alert.alert("Success", "Profile updated!", [
        { text: "OK", onPress: () => router.replace("/(tabs)") },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Log Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace("/");
        },
      },
    ]);
  };

  return (
    <View 
      style={{ 
        flex: 1, 
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right
      }} 
      className="bg-white"
    >
      <ScrollView className="px-6 py-4">
        {/* HEADER */}
        <View className="flex-row justify-between items-center mb-6">
            <View>
                <Text className="text-3xl font-bold text-brand-dark">
                    {isEditing ? t('edit_profile') : t('setup_profile')}
                </Text>
                <Text className="text-gray-500">
                    {isEditing ? "Update your personal details" : "Let's verify your identity and get you set up."}
                </Text>
            </View>
            {isEditing && (
                <TouchableOpacity 
                    onPress={handleClose}
                    className="bg-gray-100 p-2 rounded-full"
                >
                    <Ionicons name="close" size={24} color="#4B5563" />
                </TouchableOpacity>
            )}
        </View>


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
                  <Text className="text-gray-400 text-xs mt-1">{t('upload_photo')}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          <Text className="text-xs text-gray-400 mt-2">
            {t('photo_required')}
          </Text>
        </View>

        {/* FORM FIELDS */}
        <View className="space-y-4">
          <View>
            <Text className="text-gray-700 font-medium mb-1">{t('full_name')}</Text>
            <TextInput
              className="bg-gray-50 p-4 rounded-xl border border-gray-200"
              placeholder="e.g. Ken Watanabe"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          <View>
            <Text className="text-gray-700 font-medium mb-1">
              {t('org_id')}
            </Text>
            <TextInput
              className="bg-gray-50 p-4 rounded-xl border border-gray-200"
              placeholder="Ask your manager for the code"
              value={organizationId}
              onChangeText={setOrganizationId}
              autoCapitalize="none"
              // If editing, maybe we should disable organization change? Usually staff can't change orgs freely.
              // For MVP flexibility we keep it enabled, but you might want to consider `editable={!isEditing}` later.
            />
          </View>

          <View>
            <Text className="text-gray-700 font-medium mb-2">
              {t('pref_language')}
            </Text>
            <View className="flex-row gap-4">
              <TouchableOpacity
                onPress={handleSetEnglish}
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
                onPress={handleSetJapanese}
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

        {/* ACTIONS */}
        <TouchableOpacity
          onPress={handleSaveProfile}
          disabled={loading}
          className={`mt-10 w-full p-4 rounded-xl items-center shadow-md ${
            loading ? "bg-gray-400" : "bg-brand-red"
          }`}
        >
          <Text className="text-white font-bold text-lg">
            {loading ? "Saving..." : isEditing ? t('save_changes') : t('complete_setup')}
          </Text>
        </TouchableOpacity>
        
        {isEditing && (
            <TouchableOpacity
              onPress={handleLogout}
              className="mt-4 w-full p-4 rounded-xl items-center border border-red-200 bg-white"
            >
              <Text className="text-red-600 font-bold text-lg">{t('log_out')}</Text>
            </TouchableOpacity>
        )}

        <View className="h-10"/>

      </ScrollView>
    </View>
  );
}