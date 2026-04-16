import { AppState } from "react-native";
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// We use the variables defined in the .env file
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseHost = new URL(supabaseUrl).hostname;
const projectRef = supabaseHost.split(".")[0] || "";
const authStorageKey = projectRef ? `sb-${projectRef}-auth-token` : null;
let didWarnRefreshNetworkFailure = false;

// Simple validation to avoid confusion if you forget the .env
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env"
  );
}

const supabaseFetch: typeof fetch = async (input, init) => {
  const requestUrl =
    typeof input === "string" ? input : (input as Request).url;
  const method = init?.method || "GET";
  const isRefreshTokenRequest =
    requestUrl.includes("/auth/v1/token") &&
    requestUrl.includes("grant_type=refresh_token");

  try {
    return await fetch(input, init);
  } catch (error) {
    if (__DEV__ && (!isRefreshTokenRequest || !didWarnRefreshNetworkFailure)) {
      console.warn(`[Supabase fetch failed] ${method} ${requestUrl}`);
    }

    // Avoid unhandled TypeError noise when refresh token calls fail at transport level.
    // Treat refresh-network failures as a missing/invalid session to stop retry loops.
    if (isRefreshTokenRequest) {
      didWarnRefreshNetworkFailure = true;
      try {
        if (authStorageKey) {
          await AsyncStorage.removeItem(authStorageKey);
        }
        // Legacy key fallback used by older setups.
        await AsyncStorage.removeItem("supabase.auth.token");
      } catch {
        // Best-effort cleanup only.
      }

      return new Response(
        JSON.stringify({
          error: "invalid_grant",
          error_description: "Session not found",
          error_code: "session_not_found",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    throw error;
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: supabaseFetch,
  },
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: !__DEV__,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

if (!__DEV__) {
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}


/** Signed URL expiry for receipt/ticket images (7 days).
 * TODO: Once the display layer generates URLs on-the-fly from stored file paths,
 * reduce this to 1–24 hours for better security.
 */
export const RECEIPT_SIGNED_URL_EXPIRY = 60 * 60 * 24 * 7; // 7 days in seconds
