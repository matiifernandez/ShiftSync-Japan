import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useToast } from "../../context/ToastContext";
import { useTranslation } from "../../hooks/useTranslation";
import { useOrganization } from "../../hooks/useOrganization";

export default function CreateOrgScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showToast } = useToast();
  const { t } = useTranslation();
  
  // Logic Separation (Issue #5)
  const { createOrganization, loading } = useOrganization();
  const [name, setName] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) {
        showToast(t('missing_info'), "error");
        return;
    }

    try {
        await createOrganization(name);
        showToast(t('workspace_created'), "success");
        router.replace("/(tabs)");
    } catch (error: any) {
        // Fallback message handles DB constraint errors too
        showToast(t('create_workspace_error') + ". " + error.message, "error");
    }
  };

  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-white px-6">
      <TouchableOpacity 
        onPress={() => router.back()} 
        className="mt-2 mb-6 w-10"
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
      </TouchableOpacity>

      <Text className="text-3xl font-bold text-brand-dark mb-2" accessibilityRole="header">{t('name_workspace')}</Text>
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
            accessibilityLabel="Workspace name input"
        />
      </View>

      <TouchableOpacity
        onPress={handleCreate}
        disabled={loading}
        className={`w-full bg-brand-red py-4 rounded-xl items-center mt-4 ${loading ? 'opacity-70' : ''}`}
        accessibilityRole="button"
        accessibilityLabel="Create Workspace"
        accessibilityState={{ disabled: loading }}
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