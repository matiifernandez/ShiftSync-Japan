import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useToast } from "../../context/ToastContext";
import { useTranslation } from "../../hooks/useTranslation";
import { useOrganization } from "../../hooks/useOrganization";

export default function JoinTeamScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showToast } = useToast();
  const { t } = useTranslation();
  
  // Logic Separation (Issue #5)
  const { joinOrganization, loading } = useOrganization();
  const [code, setCode] = useState("");

  const handleJoin = async () => {
    if (code.length < 6) {
        showToast(t('invalid_code_format'), "error");
        return;
    }

    try {
        await joinOrganization(code);
        showToast(t('join_success'), "success");
        router.replace("/(tabs)");
    } catch (error: any) {
        showToast(t('join_error') + ". " + error.message, "error");
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

      <Text className="text-3xl font-bold text-brand-dark mb-2" accessibilityRole="header">{t('join_team_title')}</Text>
      <Text className="text-gray-500 mb-8">
        {t('join_team_instruction')}
      </Text>

      <View className="mb-4">
        <Text className="text-gray-600 mb-2 font-medium">{t('invite_code_label')}</Text>
        <TextInput
            className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center text-3xl font-bold tracking-widest text-brand-dark uppercase"
            placeholder="XYZ123"
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            maxLength={6}
            autoFocus
            accessibilityLabel="Invitation code input"
        />
      </View>

      <TouchableOpacity
        onPress={handleJoin}
        disabled={loading || code.length < 6}
        className={`w-full bg-blue-600 py-4 rounded-xl items-center mt-4 ${loading || code.length < 6 ? 'opacity-50' : ''}`}
        accessibilityRole="button"
        accessibilityLabel="Join Team"
        accessibilityState={{ disabled: loading || code.length < 6 }}
      >
        {loading ? (
            <ActivityIndicator color="white" />
        ) : (
            <Text className="text-white font-bold text-lg">{t('join_action')}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
