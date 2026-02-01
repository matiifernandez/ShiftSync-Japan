import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "../hooks/useTranslation";
import Logo from "../components/Logo";
import { useToast } from "../context/ToastContext";

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
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/(tabs)");
      }
      setInitialized(true);
    });
  }, []);

  // Handle Sign In
  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      showToast(error.message, "error");
      setLoading(false);
    } else {
      router.replace("/(tabs)");
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
            <Text className="text-white text-4xl font-bold">ShiftSync</Text>
            <Text className="text-white/80 mt-2 font-medium tracking-widest text-sm">JAPAN</Text>
          </View>
        </View>

        {/* LOGIN FORM */}
        <View className="flex-[1.5] bg-white rounded-t-[40px] -mt-10 px-8 pt-12">
          <Text className="text-2xl font-bold text-gray-800 mb-2">Welcome Back</Text>
          <Text className="text-gray-500 mb-8">{t('simplify_work')}</Text>

          <View className="mb-6">
            <Text className="text-gray-600 mb-2 ml-1 font-medium">{t('email_label')}</Text>
            <View className="flex-row items-center bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5">
              <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-3 text-gray-800 text-base"
                placeholder="name@company.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                accessibilityLabel="Email address input"
              />
            </View>
          </View>

          <View className="mb-8">
            <Text className="text-gray-600 mb-2 ml-1 font-medium">{t('password_label')}</Text>
            <View className="flex-row items-center bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5">
              <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-3 text-gray-800 text-base"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                accessibilityLabel="Password input"
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            className={`w-full bg-brand-red py-4 rounded-2xl shadow-lg shadow-red-200 items-center mb-6 ${loading ? 'opacity-70' : ''}`}
            accessibilityRole="button"
            accessibilityLabel="Sign In"
            accessibilityState={{ disabled: loading }}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">Sign In</Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center mt-auto mb-10">
            <Text className="text-xs text-gray-400">ShiftSync Japan v1.0</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}