import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";
import { useTranslation } from "../hooks/useTranslation";
import Logo from "../components/Logo";
import { useToast } from "../context/ToastContext";
import { FormInput } from "../components/FormInput";

/**
 * LoginScreen
 * 
 * Entry point for unauthenticated users.
 * Handles:
 * - Email/Password authentication via Supabase
 * - Auto-redirect if session exists
 * - UI styling matching the brand identity
 */
export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { showToast } = useToast();
  
  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.replace("/(tabs)");
        }
      } catch (error) {
        console.warn("Session bootstrap skipped due to a network/auth error.");
      } finally {
        setInitialized(true);
      }
    })();
  }, []);

  // Handle Sign In
  const handleLogin = async () => {
    if (!email || !password) {
      showToast(t("missing_info"), "error");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        showToast(error.message, "error");
        return;
      }

      router.replace("/(tabs)");
    } catch (error: any) {
      const message =
        error?.message === "Network request failed"
          ? t("login_network_error")
          : error?.message || t("login_failed_generic");
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  if (!initialized) return null;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* BRAND HEADER */}
        <View 
          style={{ paddingTop: insets.top + 40 }}
          className="flex-1 justify-center px-8 bg-brand-red pb-10"
        >
          <View className="items-center mb-10">
            <View className="bg-white p-2 rounded-[32px] shadow-2xl mb-4">
               <Logo size={80} />
            </View>
            <Text className="text-white text-4xl font-bold">{t('brand_name')}</Text>
            <Text className="text-white/80 mt-2 font-medium tracking-widest text-sm">{t('brand_region')}</Text>
          </View>
        </View>

        {/* LOGIN FORM */}
        <View className="flex-[1.5] bg-white rounded-t-[40px] -mt-10 px-8 pt-12">
          <Text className="text-2xl font-bold text-gray-800 mb-2">{t('login_welcome')}</Text>
          <Text className="text-gray-500 mb-8">{t('simplify_work')}</Text>

          <View className="mb-6">
            <Text className="text-gray-600 mb-2 ml-1 font-medium">{t('email_label')}</Text>
            <FormInput
              icon="mail-outline"
              placeholder={t('email_placeholder')}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              accessibilityLabel={t('email_input_label')}
            />
          </View>

          <View className="mb-8">
            <Text className="text-gray-600 mb-2 ml-1 font-medium">{t('password_label')}</Text>
            <FormInput
              icon="lock-closed-outline"
              placeholder={t('password_placeholder')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              accessibilityLabel={t('password_input_label')}
            />
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            className={`w-full bg-brand-red py-4 rounded-2xl shadow-lg shadow-red-200 items-center mb-6 ${loading ? 'opacity-70' : ''}`}
            accessibilityRole="button"
            accessibilityLabel={t('sign_in_link')}
            accessibilityState={{ disabled: loading }}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">{t('sign_in_link')}</Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center items-center mb-8">
            <Text className="text-gray-500">{t('no_account')} </Text>
            <TouchableOpacity onPress={() => router.push("/signup")}>
                <Text className="text-brand-red font-bold">{t('sign_up_link')}</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-center mt-auto mb-10">
            <Text className="text-xs text-gray-400">{t('app_version_label')}</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
