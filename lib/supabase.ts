import { AppState } from "react-native";
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// We use the variables defined in the .env file
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
let didWarnRefreshNetworkFailure = false;

// Simple validation to avoid confusion if you forget the .env
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env"
  );
}

try {
  // Validate URL format early to provide a clear setup error.
  new URL(supabaseUrl);
} catch {
  throw new Error("Invalid EXPO_PUBLIC_SUPABASE_URL in .env");
}

const getRequestUrl = (input: RequestInfo | URL): string => {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  if (typeof Request !== "undefined" && input instanceof Request) return input.url;

  const maybeInput = input as { url?: string; href?: string } | null;
  if (maybeInput?.url) return maybeInput.url;
  if (maybeInput?.href) return maybeInput.href;
  return "";
};

const supabaseFetch: typeof fetch = async (input, init) => {
  const requestUrl = getRequestUrl(input);
  const method = init?.method || "GET";
  const isRefreshTokenRequest =
    requestUrl.length > 0 &&
    requestUrl.includes("/auth/v1/token") &&
    requestUrl.includes("grant_type=refresh_token");

  try {
    return await fetch(input, init);
  } catch (error) {
    if (__DEV__ && (!isRefreshTokenRequest || !didWarnRefreshNetworkFailure)) {
      console.warn(`[Supabase fetch failed] ${method} ${requestUrl}`);
    }

    // Avoid unhandled TypeError noise when refresh token calls fail at transport level.
    // Keep local auth state and return a retryable response for transient network issues.
    if (isRefreshTokenRequest) {
      didWarnRefreshNetworkFailure = true;
      return new Response(
        JSON.stringify({
          error: "network_request_failed",
          message: "Network request failed while refreshing session token.",
        }),
        {
          status: 503,
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
