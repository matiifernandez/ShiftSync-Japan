import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { useToast } from "../../context/ToastContext";
import { useTranslation } from "../../hooks/useTranslation";

export default function JoinTeamScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showToast } = useToast();
  const { t } = useTranslation();
  
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (code.length < 6) {
        showToast("Invalid code format", "error");
        return;
    }

    setLoading(true);
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No authenticated user");

        // 1. Find Organization by Invite Code
        // Assuming 'organizations' table has 'invite_code' column.
        const { data: org, error: findError } = await supabase
            .from('organizations')
            .select('id, name')
            .eq('invite_code', code.toUpperCase())
            .single();

        if (findError || !org) {
            showToast("Invalid invite code. Please check and try again.", "error");
            setLoading(false);
            return;
        }

        // 2. Update User Profile (Role Staff + Org ID)
        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                organization_id: org.id,
                role: 'staff'
            })
            .eq('id', user.id);

        if (profileError) throw profileError;

        showToast(`Joined ${org.name} successfully!`, "success");
        router.replace("/(tabs)");

    } catch (error: any) {
        console.error(error);
        showToast("Error joining team. " + error.message, "error");
    } finally {
        setLoading(false);
    }
  };

  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-white px-6">
      <TouchableOpacity onPress={() => router.back()} className="mt-2 mb-6 w-10">
        <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
      </TouchableOpacity>

      <Text className="text-3xl font-bold text-brand-dark mb-2">{t('join_team_title')}</Text>
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
        />
      </View>

      <TouchableOpacity
        onPress={handleJoin}
        disabled={loading || code.length < 6}
        className={`w-full bg-blue-600 py-4 rounded-xl items-center mt-4 ${loading || code.length < 6 ? 'opacity-50' : ''}`}
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
