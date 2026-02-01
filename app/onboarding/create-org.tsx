import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { useToast } from "../../context/ToastContext";
import { useTranslation } from "../../hooks/useTranslation";

export default function CreateOrgScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showToast } = useToast();
  const { t } = useTranslation();
  
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const generateInviteCode = () => {
    // Generate a simple 6-char alphanumeric code (uppercase)
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreate = async () => {
    if (!name.trim()) {
        showToast(t('missing_info'), "error");
        return;
    }

    setLoading(true);
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No authenticated user");

        // 1. Create Organization
        const inviteCode = generateInviteCode();
        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .insert({ 
                name: name.trim(),
                invite_code: inviteCode, // We need to add this column to DB later if not exists, but plan says so.
                // plan_type: 'free' // Default
            })
            .select()
            .single();

        if (orgError) throw orgError;

        // 2. Update User Profile (Role Admin + Org ID)
        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                organization_id: org.id,
                role: 'admin'
            })
            .eq('id', user.id);

        if (profileError) throw profileError;

        showToast("Workspace created successfully!", "success");
        
        // Redirect to dashboard (layout will handle it, but explicit push is safer for UX transition)
        router.replace("/(tabs)");

    } catch (error: any) {
        console.error(error);
        // Fallback: If invite_code column doesn't exist yet, we might fail.
        // For MVP without migration, we might skip invite_code if it fails.
        showToast("Error creating workspace. " + error.message, "error");
    } finally {
        setLoading(false);
    }
  };

  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-white px-6">
      <TouchableOpacity onPress={() => router.back()} className="mt-2 mb-6 w-10">
        <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
      </TouchableOpacity>

      <Text className="text-3xl font-bold text-brand-dark mb-2">{t('name_workspace')}</Text>
      <Text className="text-gray-500 mb-8">
        {t('name_workspace_desc')}
      </Text>

      <View className="mb-4">
        <Text className="text-gray-600 mb-2 font-medium">{t('company_name_label')}</Text>
        <TextInput
            className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-lg text-brand-dark"
            placeholder={t('company_placeholder')}
            value={name}
            onChangeText={setName}
            autoFocus
        />
      </View>

      <TouchableOpacity
        onPress={handleCreate}
        disabled={loading}
        className={`w-full bg-brand-red py-4 rounded-xl items-center mt-4 ${loading ? 'opacity-70' : ''}`}
      >
        {loading ? (
            <ActivityIndicator color="white" />
        ) : (
            <Text className="text-white font-bold text-lg">{t('create_action')}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}