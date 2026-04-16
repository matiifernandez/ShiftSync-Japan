import "../global.css";
import { Stack, useRouter, useSegments, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { supabase } from "../lib/supabase";
import { Session } from "@supabase/supabase-js";
import * as Sentry from '@sentry/react-native';

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
import { Colors } from "../constants/Colors";

// Initialize Sentry
if (!__DEV__) {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || "https://examplePublicKey@o0.ingest.sentry.io/0",
    debug: false,
  });
}

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

function Layout() {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const segments = useSegments();
  const router = useRouter();
  const params = useLocalSearchParams();

  // Activate global listeners for notifications
  const { scheduleNotification } = useNotifications(!!session);
  useGlobalRealtime(scheduleNotification, !!session);

  // Capture pending orgId from deep links
  useEffect(() => {
    if (params.orgId) {
      AsyncStorage.setItem("@pending_org_id", params.orgId as string);
      console.log("Captured pending Org ID:", params.orgId);
    }
  }, [params.orgId]);

  useEffect(() => {
    const shouldClearLocalSession = (error: unknown) => {
      const message = String((error as { message?: string } | null)?.message || "");
      const lowerMessage = message.toLowerCase();
      return (
        message.includes("Refresh Token") ||
        lowerMessage.includes("session missing") ||
        lowerMessage.includes("invalid grant")
      );
    };

    // 1. Check initial session with robust error handling
    const initSession = async () => {
        try {
            const { data, error } = await supabase.auth.getSession();
            if (error) {
                if (shouldClearLocalSession(error)) {
                    console.warn("Session refresh failed, clearing local session...");
                    await supabase.auth.signOut({ scope: "local" });
                    setSession(null);
                } else {
                    console.warn("Session check skipped due to a transient auth/network issue.");
                }
            } else {
                setSession(data.session);
            }
        } catch (e) {
            if (shouldClearLocalSession(e)) {
              console.warn("Session bootstrap detected an invalid local session. Clearing local auth state.");
              await supabase.auth.signOut({ scope: "local" });
              setSession(null);
            } else {
              console.warn("Session bootstrap skipped due to a transient auth/network issue.");
            }
        } finally {
            setInitialized(true);
        }
    };

    initSession();

    // 2. Listen for changes (login, logout, auto-refresh)
    // Also invalidates the currentUser cache so useCurrentUser stays fresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Handle TOKEN_REFRESHED explicitly if needed, but session update covers it
      if (event === 'SIGNED_OUT') {
         setSession(null);
         // Clear any local storage if needed here
      } else {
         setSession(session);
      }
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
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
        <ActivityIndicator size="large" color={Colors.brand.red} />
      </View>
    );
  }

  const appStack = (
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
  );

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      <ToastProvider>
        {session ? (
          <TravelProvider>
            <ChatProvider>
              {appStack}
              <Toast />
            </ChatProvider>
          </TravelProvider>
        ) : (
          <>
            {appStack}
            <Toast />
          </>
        )}
      </ToastProvider>
    </PersistQueryClientProvider>
  );
}

export default __DEV__ ? Layout : Sentry.wrap(Layout);
