import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "../hooks/useTranslation";
import Logo from "../components/Logo";
import { useToast } from "../context/ToastContext";

/**
 * SignUpScreen
 * 
 * Registration screen for new users.
 * Matches the visual identity of LoginScreen.
 * Handles:
 * - User registration via Supabase
 * - Password confirmation validation
 */
export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { showToast } = useToast();
  
  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      showToast("Please fill in all fields", "error");
      return;
    }

    if (password !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }

    if (password.length < 6) {
        showToast("Password must be at least 6 characters", "error");
        return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        showToast("Account created! Please check your email.", "success");
        // Optional: Redirect to login or let Supabase auto-login if email confirmation is off
        // For now, we assume email confirmation might be required or auto-login works.
        // If auto-login works, the _layout listener will handle the redirect.
      }
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* BRAND HEADER */}
        <View 
          style={{ paddingTop: insets.top + 20 }}
          className="flex-1 justify-center px-8 bg-brand-red pb-10"
        >
          <TouchableOpacity 
            onPress={() => router.back()} 
            className="absolute left-6 top-14 z-10 bg-black/20 p-2 rounded-full"
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <View className="items-center mb-6">
            <View className="bg-white p-2 rounded-[32px] shadow-2xl mb-4">
               <Logo size={60} />
            </View>
            <Text className="text-white text-3xl font-bold">Join ShiftSync</Text>
            <Text className="text-white/80 mt-1 font-medium text-sm">Create your account</Text>
          </View>
        </View>

        {/* SIGN UP FORM */}
        <View className="flex-[2] bg-white rounded-t-[40px] -mt-10 px-8 pt-10">
          
          <View className="mb-4">
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

          <View className="mb-4">
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

          <View className="mb-8">
            <Text className="text-gray-600 mb-2 ml-1 font-medium">Confirm Password</Text>
            <View className="flex-row items-center bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5">
              <Ionicons name="shield-checkmark-outline" size={20} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-3 text-gray-800 text-base"
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                accessibilityLabel="Confirm password input"
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSignUp}
            disabled={loading}
            className={`w-full bg-brand-red py-4 rounded-2xl shadow-lg shadow-red-200 items-center mb-6 ${loading ? 'opacity-70' : ''}`}
            accessibilityRole="button"
            accessibilityLabel="Create Account"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">Create Account</Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center items-center mb-10">
            <Text className="text-gray-500">Already have an account? </Text>
            <TouchableOpacity onPress={() => router.back()}>
                <Text className="text-brand-red font-bold">Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}