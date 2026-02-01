import "../global.css";
import { Stack, useRouter, useSegments, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { supabase } from "../lib/supabase";
import { Session } from "@supabase/supabase-js";

import { useGlobalRealtime } from "../hooks/useGlobalRealtime";
import { useNotifications } from "../hooks/useNotifications";
import { TravelProvider } from "../context/TravelContext";
import { ChatProvider } from "../context/ChatContext";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ToastProvider } from "../context/ToastContext";
import Toast from "../components/Toast";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

export default function Layout() {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const segments = useSegments();
  const router = useRouter();
  const params = useLocalSearchParams();

  // Activate global listeners for notifications
  useNotifications();
  // useGlobalRealtime();

  // Capture pending orgId from deep links
  useEffect(() => {
    if (params.orgId) {
      AsyncStorage.setItem("@pending_org_id", params.orgId as string);
      console.log("Captured pending Org ID:", params.orgId);
    }
  }, [params.orgId]);

  useEffect(() => {
    // 1. Check initial session with robust error handling
    const initSession = async () => {
        try {
            const { data, error } = await supabase.auth.getSession();
            if (error) {
                if (error.message.includes("Refresh Token")) {
                    console.warn("Session expired or invalid, signing out...");
                    await supabase.auth.signOut();
                    setSession(null);
                } else {
                    console.error("Session check error:", error);
                }
            } else {
                setSession(data.session);
            }
        } catch (e) {
            console.error("Unexpected session error:", e);
        } finally {
            setInitialized(true);
        }
    };

    initSession();

    // 2. Listen for changes (login, logout, auto-refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Handle TOKEN_REFRESHED explicitly if needed, but session update covers it
      if (event === 'SIGNED_OUT') {
         setSession(null);
         // Clear any local storage if needed here
      } else {
         setSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!initialized) return;

    // Navigation Logic
    const inTabs = segments[0] === "(tabs)";
    const inAuth = segments[0] === "index" || segments[0] === "signup";
    const inOnboarding = segments[0] === "onboarding";

    if (session) {
      // User is logged in
      const checkOrg = async () => {
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('organization_id')
                .eq('id', session.user.id)
                .maybeSingle();
            
            if (error) return;

            const hasOrg = !!profile?.organization_id;

            if (!hasOrg && !inOnboarding) {
                router.replace("/onboarding");
            } else if (hasOrg && (inAuth || inOnboarding)) {
                router.replace("/(tabs)");
            }
        } catch (e) {
            // Silently fail or handle error
        }
      };

      checkOrg();
    } else {
      // Not logged in
      if (!inAuth) {
        // Trying to access protected route -> Login
        router.replace("/");
      }
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
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      <ToastProvider>
        <TravelProvider>
          <ChatProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "#FFFFFF" },
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="complete-profile" options={{ presentation: 'modal' }} />
              <Stack.Screen name="chat-create" options={{ presentation: 'modal', headerShown: false }} />
            </Stack>
            <Toast />
          </ChatProvider>
        </TravelProvider>
      </ToastProvider>
    </PersistQueryClientProvider>
  );
}