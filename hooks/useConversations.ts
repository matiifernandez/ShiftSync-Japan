import { useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useFocusEffect } from "expo-router";

export interface Conversation {
  id: string;
  name: string;
  type: "group" | "direct";
  last_message?: string;
  last_message_time?: string;
  avatar_url?: string;
  unread_count?: number;
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      
      const { data, error } = await supabase.rpc("get_my_conversations");

      if (error) throw error;

      if (data) {
        setConversations(data as Conversation[]);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Fetch in background when focusing (don't show full screen loader)
      fetchConversations(true);
    }, [fetchConversations])
  );

  return { 
      conversations, 
      loading, 
      refreshConversations: () => fetchConversations(false) // Pull to refresh shows loader
  };
}