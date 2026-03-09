import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "../hooks/useTranslation";
import { useToast } from "../context/ToastContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCurrentUser } from "../hooks/useCurrentUser";

/**
 * CompleteProfileScreen
 * 
 * Handles user profile creation and editing.
 * - For new users: acts as an onboarding step to set name, org, and photo.
 * - For existing users: allows editing profile details.
 */
export default function CompleteProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { profile, loading: profileLoading, updateProfile, isUpdating } = useCurrentUser();
  
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [fullName, setFullName] = useState("");
  const [organizationId, setOrganizationId] = useState<string>(
    (params.orgId as string) || ""
  );
  const [language, setLanguage] = useState<"en" | "ja">("en");
  const [image, setImage] = useState<string | null>(null);

  // Load profile data into form state
  useEffect(() => {
    async function initForm() {
      if (profile) {
        setIsEditing(true);
        setFullName(profile.full_name || "");
        
        if (profile.organization_id) {
          setOrganizationId(profile.organization_id);
        } else {
          // Profile exists but no orgId, check for pending invite
          const pendingOrgId = await AsyncStorage.getItem("@pending_org_id");
          if (pendingOrgId) {
            setOrganizationId(pendingOrgId);
            await AsyncStorage.removeItem("@pending_org_id");
          }
        }

        if (profile.preferred_language) {
          setLanguage(profile.preferred_language as "en" | "ja");
        }
        if (profile.avatar_url) {
          setImage(profile.avatar_url);
        }
      } else if (!profileLoading) {
        // New user, check storage for pending invite
        const pendingOrgId = await AsyncStorage.getItem("@pending_org_id");
        if (pendingOrgId) {
          setOrganizationId(pendingOrgId);
          await AsyncStorage.removeItem("@pending_org_id");
        }
      }
    }
    
    initForm();
  }, [profile, profileLoading]);

  // Effect to update orgId if params change (deep link)
  useEffect(() => {
    if (params.orgId) {
      setOrganizationId(params.orgId as string);
    }
  }, [params.orgId]);

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

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showToast(t('camera_permission_msg'), 'error');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const validateForm = () => {
    if (!fullName.trim()) {
      showToast(t('full_name_error'), 'error');
      return false;
    }
    return true;
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) return;

    try {
      await updateProfile({
        full_name: fullName,
        organization_id: organizationId.trim() || undefined,
        preferred_language: language,
        imageUri: image || undefined,
      });
      
      // Delay navigation slightly to let user see toast
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 1000);
      
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleLogout = async () => {
    Alert.alert(t('logout_confirm_title'), t('logout_confirm_msg'), [
      { text: t('cancel'), style: "cancel" },
      {
        text: t('log_out'),
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace("/");
        },
      },
    ]);
  };

  if (profileLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#ef4444" />
      </View>
    );
  }

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
                    {isEditing ? t('edit_profile_desc') : t('setup_profile_desc')}
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
              placeholder={t('name_placeholder')}
              value={fullName}
              onChangeText={setFullName}
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
          disabled={isUpdating}
          className={`mt-10 w-full p-4 rounded-xl items-center shadow-md ${
            isUpdating ? "bg-gray-400" : "bg-brand-red"
          }`}
        >
          {isUpdating ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">
              {isEditing ? t('save_changes') : t('complete_setup')}
            </Text>
          )}
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
