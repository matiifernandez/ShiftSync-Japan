import "../global.css";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { supabase } from "../lib/supabase";
import { Session } from "@supabase/supabase-js";

import { useGlobalRealtime } from "../hooks/useGlobalRealtime";

export default function Layout() {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  // Activate global listeners for notifications
  useGlobalRealtime();

  useEffect(() => {
    // 1. Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized(true);
    });

    // 2. Listen for changes (login, logout, auto-refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!initialized) return;

    // Navigation Logic
    // "app/(tabs)/..." -> segments = ["(tabs)", ...]
    // "app/chat/[id].tsx" -> segments = ["chat", "[id]"]
    // "app/index.tsx" -> segments = [] (root)
    
    const isAtLogin = !segments[0];

    if (session && isAtLogin) {
      // Logged in but viewing login screen -> Go to Tabs
      router.replace("/(tabs)");
    } else if (!session && !isAtLogin) {
      // Not logged in but viewing internal screens -> Go to Login
      router.replace("/");
    }
  }, [session, initialized, segments]);

  if (!initialized) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#D9381E" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#FFFFFF" },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="complete-profile" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
