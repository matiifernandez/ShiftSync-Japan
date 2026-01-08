import { AppState } from "react-native";
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://hxeaoobxqijospzpflgn.supabase.co";
const supabaseAnonKey = "sb_publishable_1efSr0URr7aWE3qy44wtTA_4MpQM2AW";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage, // Persistent session for React Native
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// This block helps Supabase better manage connections when the app goes to the background
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
