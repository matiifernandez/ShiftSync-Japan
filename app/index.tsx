import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { useRouter } from "expo-router"; // For navigation between screens
import { supabase } from "../lib/supabase"; // db client

export default function LoginScreen() {
  const router = useRouter();

  // STATE: The live variables of the screen
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false); // Toggle to know if it's Login or Register
  // FUNCTION: Handle authentication
  async function handleAuth() {
    setLoading(true);

    // 1. If we are in "Register" mode
    if (isRegistering) {
      const { error } = await supabase.auth.signUp({
        email: email,
        password: password,
      });
      if (error) Alert.alert("Error", error.message);
      else
        Alert.alert("Success", "Account created! Check your email to confirm.");

      // 2. If we are in "Log In" mode
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });
      if (error) Alert.alert("Error", error.message);
      else {
        // If everything is ok, navigate to Home screen
        // router.replace('/home');
        Alert.alert(
          "Welcome",
          "You have successfully logged in (here we would go to Home)"
        );
      }
    }
    setLoading(false);
  }

  return (
    // VIEW is like <div>. 'flex-1' means "takes up the whole screen".
    // 'justify-center' centers the content vertically.
    <View className="flex-1 bg-white justify-center px-8">
      {/* HEADER / LOGO */}
      <View className="items-center mb-10">
        {/* Simulate the red circular logo of Mount Fuji */}
        <View className="w-20 h-20 bg-brand-red rounded-full items-center justify-center mb-4 shadow-lg">
          <Text className="text-white text-4xl font-bold">🗻</Text>
        </View>
        <Text className="text-2xl font-bold text-brand-dark">
          ShiftSync Japan
        </Text>
        <Text className="text-gray-500 mt-1">/ チーム — 大阪プロジェクト</Text>
      </View>

      {/* FORM */}
      <View className="space-y-4">
        <View>
          <Text className="text-gray-600 mb-1 ml-1">Email / メール</Text>
          <TextInput
            className="w-full bg-gray-100 p-4 rounded-xl text-brand-dark border border-gray-200"
            placeholder="name@example.com"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail} // Updates the 'email' state as you type
            autoCapitalize="none"
          />
        </View>

        <View>
          <Text className="text-gray-600 mb-1 ml-1">Password / パスワード</Text>
          <TextInput
            className="w-full bg-gray-100 p-4 rounded-xl text-brand-dark border border-gray-200"
            placeholder="••••••••"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry // Hides the text (dots instead of characters)
          />
        </View>

        {/* ACTION BUTTON */}
        <TouchableOpacity
          onPress={handleAuth}
          disabled={loading}
          className={`w-full p-4 rounded-xl items-center mt-4 ${
            loading ? "bg-gray-400" : "bg-brand-red"
          }`}
        >
          <Text className="text-white font-bold text-lg">
            {loading
              ? "Processing..."
              : isRegistering
              ? "Sign Up / 登録"
              : "Log In / ログイン"}
          </Text>
        </TouchableOpacity>

        {/* TOGGLE LOGIN/REGISTER */}
        <TouchableOpacity
          onPress={() => setIsRegistering(!isRegistering)}
          className="mt-4 items-center"
        >
          <Text className="text-gray-500">
            {isRegistering
              ? "Already have an account? Log In"
              : "New to the team? Create Account"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* FOOTER (Optional, to simulate the Admin/Staff from the design) */}
      <View className="mt-10 items-center">
        <Text className="text-xs text-gray-400">ShiftSync Japan v1.0</Text>
      </View>
    </View>
  );
}
